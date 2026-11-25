/**
 * Realtime — компьютер дээр (npm run dev). ws сангаар WebSocket барина.
 * Cloudflare дээр үүний оронд lib/realtime/durable.js ажиллана. Логик нь нэг (changes.js).
 *
 * Холболт: ws://localhost:3000/api/realtime — нэвтрэлтийн cookie-гоор (эсвэл ?token=) танина.
 *   Token буруу / эрх хаагдсан → 4001 кодоор хаана (frontend нэвтрэх хуудас руу шилжүүлнэ). 'ping' → 'pong'.
 *   JSON мессеж → онлайн хурлын signaling (meeting.js). Холболт бүр санамсаргүй id авна.
 *
 * Шалгалт: GET биш хүсэлт дууссаны дараа шууд (push), API-аар ороогүй өөрчлөлтөд 30 сек тутам нөөц.
 *
 * attach(server) - http сервер дээр /api/realtime замыг WebSocket болгож, push болон 30 сек тутмын шалгалтыг эхлүүлнэ
 * tick() - (дотоод) өмнөх шалгалт дуусаагүй бол дууссаны дараа дахин нэг удаа ажиллана —
 *   нэг өөрчлөлт хоёр удаа илгээгдэхгүй, алгасагдахгүй
 * run() - (дотоод) change_log-ийн шинэ мөрүүдийг уншиж client бүрт өөрт нь харагдах хүснэгтүүдийг илгээнэ
 * onUpgrade(req, socket, head) - (дотоод) холболтыг таньж, хүлээн авна
 */

var { WebSocketServer } = require('ws');
var { randomUUID } = require('crypto');
var changes = require('./changes');
var meeting = require('./meeting');
var { tokenFrom, identify } = require('./identify');
var log = require('../logger').child({ module: 'realtime' });

var PATH = '/api/realtime';
var POLL_MS = 30000;

var wss = new WebSocketServer({ noServer: true });
var hub = {
  sockets: function () { return Array.from(wss.clients).filter(function (ws) { return ws.client && ws.readyState === ws.OPEN; }); },
  info: function (ws) { return ws.client; },
  set: function (ws, patch) { Object.assign(ws.client, patch); },
};
var lastId = null;
var busy = false;
var again = false;

async function run() {
  if (lastId === null || !wss.clients.size) {
    lastId = await changes.latestId();
    return;
  }
  var list = await changes.read(lastId);
  if (!list.length) return;
  lastId = list[list.length - 1].id;

  var sent = 0;
  wss.clients.forEach(function (ws) {
    if (!ws.client || ws.readyState !== ws.OPEN) return;
    var tables = changes.tablesFor(ws.client, list);
    if (!tables.length) return;
    ws.send(JSON.stringify({ type: 'change', tables: tables }));
    sent++;
  });
  log.info({ changes: list.length, lastId: lastId, sent: sent, online: wss.clients.size }, 'Realtime илгээлээ');
}

function tick() {
  if (busy) {
    again = true;
    return;
  }
  busy = true;
  run()
    .catch(function (err) {
      log.error({ err: err }, 'Realtime шалгалт амжилтгүй');
    })
    .finally(function () {
      busy = false;
      if (again) {
        again = false;
        tick();
      }
    });
}

async function onUpgrade(req, socket, head) {
  if (new URL(req.url, 'http://local').pathname !== PATH) return socket.destroy();

  var client = await identify(tokenFrom(req.headers.cookie, req.url)).catch(function () { return null; });

  wss.handleUpgrade(req, socket, head, function (ws) {
    if (!client) {
      log.warn({ ip: req.socket.remoteAddress }, 'Realtime: token буруу, 4001-ээр хаалаа');
      return ws.close(4001, 'unauthorized');
    }
    ws.client = Object.assign({ id: randomUUID() }, client);
    tick();
    log.info({ role: client.role, unitId: client.unitId, online: wss.clients.size }, 'Realtime холбогдлоо');
    ws.on('message', function (data) {
      if (String(data) === 'ping') return ws.send('pong');
      try {
        meeting.handle(ws, JSON.parse(data), hub);
      } catch (err) {
        log.warn({ err: err }, 'Realtime: буруу мессеж');
      }
    });
    ws.on('close', function (code) {
      meeting.leave(ws, hub);
      log.info({ role: client.role, unitId: client.unitId, code: code, online: wss.clients.size }, 'Realtime саллаа');
    });
  });
}

function attach(server) {
  server.on('upgrade', onUpgrade);
  server.on('request', function (req, res) {
    if (req.method !== 'GET' && req.method !== 'HEAD') res.on('finish', tick);
  });
  setInterval(tick, POLL_MS).unref();
  log.info({ path: PATH }, 'Realtime бэлэн');
}

module.exports = { attach };
