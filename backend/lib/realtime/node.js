/**
 * Realtime — компьютер дээр (npm run dev). ws сангаар WebSocket барина.
 * Cloudflare дээр үүний оронд lib/realtime/durable.js (Durable Object) ажиллана. Логик нь нэг (changes.js).
 *
 * Холболт: ws://localhost:3000/api/realtime — нэвтрэлтийн cookie-гоор (эсвэл ?token=) танина
 *   Token буруу / эрх хаагдсан → 4001 кодоор хаана (frontend нэвтрэх хуудас руу шилжүүлнэ)
 *   Client 'ping' илгээвэл 'pong' хариулна (холболт амьд эсэхийг шалгах)
 *   Бусад мессеж (чатын typing, presence) → changes.incoming. Холбогдох / гарахад бусдад presence_changed
 *
 * attach(server) - http сервер дээр /api/realtime замыг WebSocket болгоно
 * check() - change_log-ийн шинэ мөрүүдийг уншиж холбогдсон бүх client-д тараана.
 *   DB-д бичих бүрт (db/hooks.js) шууд, мөн гаднаас орсон өөрчлөлтөд 5 сек тутам ажиллана
 * send(plan) - (дотоод) changes.plan-ий жагсаалтыг client бүрт тохируулж илгээнэ
 * deliver(list) - (дотоод) [{ conn, msg }]-ийг тухайн холболтуудад илгээнэ
 * presenceChanged(except) - (дотоод) бусад бүх холболтод онлайн жагсаалт өөрчлөгдсөнийг мэдэгдэнэ
 * onUpgrade(req, socket, head) - (дотоод) холболтыг таньж, хүлээн авна
 */

var crypto = require('crypto');
var { WebSocketServer } = require('ws');
var hooks = require('../../db/hooks');
var changes = require('./changes');
var { tokenFrom, identify } = require('./identify');
var log = require('../logger').child({ module: 'realtime' });

var PATH = '/api/realtime';
var FALLBACK_MS = 5000;

var wss = new WebSocketServer({ noServer: true });
var lastId = null;
var running = Promise.resolve();

function send(plan) {
  wss.clients.forEach(function (ws) {
    if (!ws.client || ws.readyState !== ws.OPEN) return;
    plan.forEach(function (item) {
      var msg = changes.messageFor(ws.client, item);
      if (msg) ws.send(JSON.stringify(msg));
    });
  });
}

function open() {
  return Array.from(wss.clients).filter(function (ws) { return ws.client && ws.readyState === ws.OPEN; });
}

function deliver(list) {
  var sockets = open();
  list.forEach(function (item) {
    var ws = sockets.find(function (s) { return s.client.conn === item.conn; });
    if (ws) ws.send(JSON.stringify(item.msg));
  });
}

function presenceChanged(except) {
  open().forEach(function (ws) {
    if (ws.client.conn !== except) ws.send(JSON.stringify({ type: 'presence_changed' }));
  });
}

async function run() {
  if (lastId === null || !wss.clients.size) {
    lastId = await changes.latestId();
    return;
  }
  var list = await changes.read(lastId);
  if (!list.length) return;
  lastId = list[list.length - 1].id;
  send(await changes.plan(list));
}

function check() {
  running = running.then(run).catch(function (err) {
    log.error({ err: err }, 'Realtime шалгалт амжилтгүй');
  });
  return running;
}

async function onUpgrade(req, socket, head) {
  if (new URL(req.url, 'http://local').pathname !== PATH) return socket.destroy();

  var client = await identify(tokenFrom(req.headers.cookie, req.url)).catch(function () { return null; });

  wss.handleUpgrade(req, socket, head, function (ws) {
    if (!client) return ws.close(4001, 'unauthorized');

    client.conn = crypto.randomUUID();
    ws.client = client;
    ws.on('message', function (data) {
      var text = String(data);
      if (text === 'ping') return ws.send('pong');
      deliver(changes.incoming(client, text, open().map(function (s) { return s.client; })));
    });
    ws.on('close', function () {
      presenceChanged(client.conn);
    });
    presenceChanged(client.conn);
    log.debug({ role: client.role, id: client.id, online: wss.clients.size }, 'Realtime холбогдлоо');
  });
}

function attach(server) {
  server.on('upgrade', onUpgrade);
  hooks.onWrite(function () {
    check();
  });
  setInterval(check, FALLBACK_MS).unref();
  check();
  log.info({ path: PATH }, 'Realtime бэлэн');
}

module.exports = { attach, check };
