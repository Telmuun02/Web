/**
 * Онлайн хурлын signaling — WebRTC холболтыг тохируулах жижиг мессежүүдийг дамжуулна. Видео, аудио энд ирэхгүй (browser хооронд P2P).
 * node.js ба durable.js хоёулаа ашиглана. hub: { sockets(), info(ws), set(ws, patch) } — холболтууд ба тэдгээрийн { id, role, entrance, host, joined }.
 * Хурал бүх байрных (entrance = null) эсвэл нэг орцных. Орцны хурлыг зөвхөн тэр орцны оршин суугчид харж, нэгдэнэ.
 *
 * Мессежүүд (client → сервер):
 *   { type: 'status' }                — одоо явагдаж буй хурал: { type: 'live', meeting: { title, entrance } | null }
 *   { type: 'host', title, entrance } — ажилтан хурал нээнэ (нэг л host). Өөр host байвал { type: 'meeting', busy: true }.
 *                                       Харах эрхтэй бүх хүнд { type: 'live', meeting } илгээнэ
 *   { type: 'join' }                  — оршин суугч орно. Хурал алга бол { type: 'meeting', open: false }, байвал өөрт нь { type: 'meeting', open: true, title }, host-д { type: 'join', from }
 *   { type: 'signal', to, data }      — offer/answer/ice-г тухайн хүнд { type: 'signal', from, data } болгож дамжуулна (host ↔ оролцогч л)
 *   { type: 'leave' }                 — гарна. Host гарвал оролцогчдод { type: 'ended' }, бүгдэд { type: 'live', meeting: null }; оролцогч гарвал host-д { type: 'left', from }
 *
 * handle(ws, msg, hub) - нэг мессежийг боловсруулна
 * leave(ws, hub) - хурлаас гаргана (холболт тасрахад ч дуудна)
 */

function send(ws, msg) {
  try {
    ws.send(JSON.stringify(msg));
  } catch (err) {
    return;
  }
}

function findHost(hub) {
  return hub.sockets().find(function (s) { return hub.info(s).host; });
}

function liveFor(me, hub) {
  var host = findHost(hub);
  if (!host) return null;
  var h = hub.info(host);
  if (me.role !== 'admin' && h.entrance != null && h.entrance !== me.entrance) return null;
  return { title: h.title, entrance: h.entrance };
}

function announce(hub) {
  hub.sockets().forEach(function (s) {
    if (!hub.info(s).host) send(s, { type: 'live', meeting: liveFor(hub.info(s), hub) });
  });
}

function leave(ws, hub) {
  var me = hub.info(ws);
  if (me.host) {
    hub.set(ws, { host: false, joined: false });
    hub.sockets().forEach(function (s) {
      if (!hub.info(s).joined) return;
      hub.set(s, { joined: false });
      send(s, { type: 'ended' });
    });
    return announce(hub);
  }
  if (me.joined) {
    var host = findHost(hub);
    if (host) send(host, { type: 'left', from: me.id });
  }
  hub.set(ws, { joined: false });
}

function handle(ws, msg, hub) {
  var me = hub.info(ws);
  var host = findHost(hub);

  if (msg.type === 'status') return send(ws, { type: 'live', meeting: liveFor(me, hub) });

  if (msg.type === 'host' && me.role === 'admin') {
    if (host && hub.info(host).id !== me.id) return send(ws, { type: 'meeting', busy: true });
    hub.set(ws, {
      host: true,
      title: String(msg.title || 'Хурал').slice(0, 100),
      entrance: Number(msg.entrance) || null,
    });
    return announce(hub);
  }

  if (msg.type === 'join') {
    var live = liveFor(me, hub);
    if (!live) return send(ws, { type: 'meeting', open: false });
    hub.set(ws, { joined: true });
    send(ws, { type: 'meeting', open: true, title: live.title });
    return send(host, { type: 'join', from: me.id });
  }

  if (msg.type === 'signal') {
    var to = hub.sockets().find(function (s) { return hub.info(s).id === msg.to; });
    if (to && (me.host || hub.info(to).host)) send(to, { type: 'signal', from: me.id, data: msg.data });
    return;
  }

  if (msg.type === 'leave') leave(ws, hub);
}

module.exports = { handle, leave };
