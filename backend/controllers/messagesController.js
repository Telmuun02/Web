/**
 * Чат (хүн хоорондын) - /api/messages — оршин суугч, ажилтан хоёулаа ашиглана
 * Хуудас: оршин суугчийн Чат (/chat), admin Чат (/admin/chat)
 * Өрөө: 'entrance:<орцны id>' — орцны групп, 'soh:<тоотын id>' — тоот ↔ СӨХ
 * (Чатбот бол өөр — /api/resident/chat, /api/admin/chat)
 *
 * index - чатын жагсаалт. Ажилтан: оршин суугчдын чатууд + орцны группүүд.
 *         Оршин суугч: хоёр өрөө (уншаагүйтэй) + тогтоосон зарлал, ажилтнууд, хөршүүд
 *   GET /api/messages
 * show - өрөөний мессежүүд, уншсан гэж тэмдэглэнэ. Ажилтанд өрөөний толгой нэмэгдэнэ
 *   GET /api/messages/:room?before=
 * send - мессеж илгээнэ (ажилтан тоотын чат, орцны групп хоёуланд бичнэ)
 *   POST /api/messages/:room - { text } → мессеж
 * read - өрөөг уншсан гэж тэмдэглэнэ
 *   POST /api/messages/:room/read
 * hide - зүй бус мессежийг нуух / буцааж харуулах (зөвхөн ажилтан)
 *   PATCH /api/messages/item/:id - { hidden: true | false }
 *
 * who(req) - (дотоод) нэвтэрсэн хүн { role, id, ... }, тоотгүй оршин суугч бол null
 * header(room, chairman) - (дотоод) ажилтанд өрөөний гарчиг: тоот + утаснууд (даргаас бусдад нууцалсан) эсвэл орц
 * forResident(message) - (дотоод) нуусан мессежийн бичвэрийг оршин суугчид харуулахгүй
 */

var { Messages, Announcements, Admins, Entrances, Users, Units } = require('../db/models');
var { maskPhone } = require('../lib/verify');
var db = require('../db');
var log = require('../lib/logger').child({ module: 'messages' });

var MAX_LEN = 1000;
var NO_ROOM = { error: 'Ийм чат алга' };

async function who(req) {
  if (req.user.role === 'admin') {
    var admin = await Admins.find(req.user.id);
    return admin && { role: 'admin', id: admin.id, chairman: admin.position === 'chairman' };
  }
  var user = await Users.find(req.user.id);
  var unit = user && user.unit_id ? await Units.find(user.unit_id) : null;
  return unit && { role: 'user', id: user.id, unitId: unit.id, entranceId: unit.entrance_id, unit: unit };
}

async function header(room, chairman) {
  var r = Messages.parseRoom(room);
  if (r.kind === 'soh') {
    var unit = await db('units').select('id', 'code').where('id', r.id).first();
    if (!unit) return null;
    var phones = await db('users').where('unit_id', unit.id).orderBy('id').pluck('phone');
    if (!chairman) phones = phones.map(maskPhone);
    return { kind: 'soh', title: unit.code + ' тоот', unit: unit.code, phones: phones, unitId: unit.id };
  }
  var entrance = (await Entrances.list()).find(function (e) { return e.id === r.id; });
  if (!entrance) return null;
  return { kind: 'entrance', title: entrance.number + '-р орцны групп', entranceId: entrance.id, entrance: entrance.number };
}

function forResident(message) {
  return message.hidden ? Object.assign({}, message, { body: 'СӨХ энэ мессежийг нуусан' }) : message;
}

async function index(req, res, next) {
  try {
    var me = await who(req);
    if (!me) return res.status(404).json({ error: 'Таны тоот бүртгэгдээгүй байна. СӨХ-д хандана уу' });

    if (me.role === 'admin') {
      var [threads, groups] = await Promise.all([Messages.sohThreads(me.id), Messages.entranceGroups()]);
      return res.json({ threads: threads, groups: groups });
    }

    var entrance = Messages.entranceRoom(me.entranceId);
    var soh = Messages.sohRoom(me.unitId);
    var [lastE, lastS, unreadE, unreadS, news, staff, neighbors] = await Promise.all([
      Messages.last(entrance),
      Messages.last(soh),
      Messages.unread(entrance, 'user', me.id),
      Messages.unread(soh, 'user', me.id),
      Announcements.forEntrance(me.entranceId, 10),
      Admins.list(),
      Messages.residentsOf(me.entranceId),
    ]);
    var pinned = news.find(function (a) { return a.important; });
    res.json({
      rooms: [
        { key: 'entrance', room: entrance, title: me.unit.entrance + '-р орцны групп', last: lastE, unread: unreadE },
        { key: 'soh', room: soh, title: 'СӨХ', last: lastS, unread: unreadS },
      ],
      pinned: pinned ? { id: pinned.id, title: pinned.title } : null,
      homes: new Set(neighbors.map(function (n) { return n.code; })).size,
      neighbors: neighbors.map(function (n) { return { id: n.id, unitId: n.unit_id, name: n.name, unit: n.code }; }),
      staff: staff.map(function (a) { return { id: a.id, name: a.name, position: a.position }; }),
    });
  } catch (err) {
    next(err);
  }
}

async function show(req, res, next) {
  try {
    var me = await who(req);
    var room = req.params.room;
    if (!Messages.canAccess(me, room)) return res.status(404).json(NO_ROOM);
    var head = me.role === 'admin' ? await header(room, me.chairman) : null;
    if (me.role === 'admin' && !head) return res.status(404).json(NO_ROOM);

    var before = Number(req.query.before) || null;
    var messages = await Messages.list(room, before, 50);
    if (!before) await Messages.markRead(room, me.role, me.id);
    res.json({ room: room, header: head, messages: me.role === 'admin' ? messages : messages.map(forResident) });
  } catch (err) {
    next(err);
  }
}

async function send(req, res, next) {
  try {
    var me = await who(req);
    var room = req.params.room;
    if (!Messages.canAccess(me, room)) return res.status(404).json(NO_ROOM);
    if (me.role === 'admin' && !(await header(room))) return res.status(404).json(NO_ROOM);

    var text = typeof req.body.text === 'string' ? req.body.text.trim().slice(0, MAX_LEN) : '';
    if (!text) return res.status(400).json({ error: 'Мессеж хоосон байна' });

    var message = await Messages.create(room, me.role, me.id, text);
    await Messages.markRead(room, me.role, me.id);
    log.info({ role: me.role, id: me.id, room: room }, 'Чатын мессеж');
    res.status(201).json(message);
  } catch (err) {
    next(err);
  }
}

async function read(req, res, next) {
  try {
    var me = await who(req);
    if (!Messages.canAccess(me, req.params.room)) return res.status(404).json(NO_ROOM);
    await Messages.markRead(req.params.room, me.role, me.id);
    res.status(204).end();
  } catch (err) {
    next(err);
  }
}

async function hide(req, res, next) {
  try {
    var message = await Messages.find(Number(req.params.id));
    if (!message) return res.status(404).json({ error: 'Мессеж олдсонгүй' });
    var updated = await Messages.setHidden(message.id, req.body.hidden !== false);
    log.info({ by: req.user.id, messageId: message.id, hidden: updated.hidden }, 'Чатын мессеж нуув');
    res.json(updated);
  } catch (err) {
    next(err);
  }
}

module.exports = { index, show, send, read, hide };
