/**
 * Realtime — компьютер дээр (npm run dev). ws сангаар WebSocket барина.
 * Cloudflare дээр үүний оронд lib/realtime/durable.js ажиллана. Логик нь нэг (changes.js).
 *
 * Холболт: ws://localhost:3000/api/realtime — нэвтрэлтийн cookie-гоор (эсвэл ?token=) танина.
 *   Token буруу / эрх хаагдсан → 4001 кодоор хаана (frontend нэвтрэх хуудас руу шилжүүлнэ). 'ping' → 'pong'.
 *
 * attach(server) - http сервер дээр /api/realtime замыг WebSocket болгож, 1 сек тутмын шалгалтыг эхлүүлнэ
 * tick() - (дотоод) өмнөх шалгалт дуусаагүй бол алгасна — нэг өөрчлөлтийг хоёр удаа илгээхгүй
 * run() - (дотоод) change_log-ийн шинэ мөрүүдийг уншиж client бүрт өөрт нь харагдах хүснэгтүүдийг илгээнэ
 * onUpgrade(req, socket, head) - (дотоод) холболтыг таньж, хүлээн авна
 */

var { WebSocketServer } = require('ws');
var changes = require('./changes');
var { tokenFrom, identify } = require('./identify');
var log = require('../logger').child({ module: 'realtime' });

var PATH = '/api/realtime';
var POLL_MS = 1000;

var wss = new WebSocketServer({ noServer: true });
var lastId = null;
var busy = false;

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
  if (busy) return;
  busy = true;
  run()
    .catch(function (err) {
      log.error({ err: err }, 'Realtime шалгалт амжилтгүй');
    })
    .finally(function () {
      busy = false;
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
    ws.client = client;
    log.info({ role: client.role, unitId: client.unitId, online: wss.clients.size }, 'Realtime холбогдлоо');
    ws.on('message', function (data) {
      if (String(data) === 'ping') ws.send('pong');
    });
    ws.on('close', function (code) {
      log.info({ role: client.role, unitId: client.unitId, code: code, online: wss.clients.size }, 'Realtime саллаа');
    });
  });
}

function attach(server) {
  server.on('upgrade', onUpgrade);
  setInterval(tick, POLL_MS).unref();
  log.info({ path: PATH }, 'Realtime бэлэн');
}

module.exports = { attach };
