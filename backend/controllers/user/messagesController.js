/**
 * Чат (оршин суугч) - /api/resident/messages
 * Хуудас: оршин суугчийн Чат (/chat) — орцны групп ба СӨХ-тэй хувийн чат
 * (Чатбот бол өөр — /api/resident/chat)
 *
 * rooms - хоёр өрөө (орцны групп, СӨХ) сүүлийн мессеж, уншаагүйн тоотой + тогтоосон зарлал, ажилтнууд, хөршүүд
 *   GET /api/resident/messages
 * show - өрөөний мессежүүд, уншсан гэж тэмдэглэнэ
 *   GET /api/resident/messages/:key?before=  (key = entrance | soh)
 * send - мессеж илгээнэ. Бусдад WebSocket-оор шууд хүрнэ (change_log → lib/realtime)
 *   POST /api/resident/messages/:key - { text } → мессеж
 * read - өрөөг уншсан гэж тэмдэглэнэ (нээлттэй өрөөнд шинэ мессеж ирэхэд)
 *   POST /api/resident/messages/:key/read
 *
 * roomOf(me, key) - (дотоод) 'entrance' → 'entrance:<орцны id>', 'soh' → 'soh:<миний id>'
 * forResident(message) - (дотоод) нуусан мессежийн бичвэрийг оршин суугчид харуулахгүй
 */

var { Messages, Announcements, Admins } = require('../../db/models');
var { currentResident, noUnit } = require('./helpers');
var log = require('../../lib/logger').child({ module: 'user/messages' });

var MAX_LEN = 1000;

function roomOf(me, key) {
  if (key === 'entrance') return Messages.entranceRoom(me.unit.entrance_id);
  if (key === 'soh') return Messages.sohRoom(me.user.id);
  return null;
}

function forResident(message) {
  return message.hidden ? Object.assign({}, message, { body: 'СӨХ энэ мессежийг нуусан' }) : message;
}

async function rooms(req, res, next) {
  try {
    var me = await currentResident(req);
    if (!me || !me.unit) return noUnit(req, res);

    var entrance = roomOf(me, 'entrance');
    var soh = roomOf(me, 'soh');
    var [lastE, lastS, unreadE, unreadS, news, staff, neighbors] = await Promise.all([
      Messages.last(entrance),
      Messages.last(soh),
      Messages.unread(entrance, 'user', me.user.id),
      Messages.unread(soh, 'user', me.user.id),
      Announcements.forEntrance(me.unit.entrance_id, 10),
      Admins.list(),
      Messages.residentsOf(me.unit.entrance_id),
    ]);

    var pinned = news.find(function (a) { return a.important; });
    res.json({
      rooms: [
        { key: 'entrance', room: entrance, title: me.unit.entrance + '-р орцны групп', last: lastE, unread: unreadE },
        { key: 'soh', room: soh, title: 'СӨХ', last: lastS, unread: unreadS },
      ],
      pinned: pinned ? { id: pinned.id, title: pinned.title } : null,
      homes: new Set(neighbors.map(function (n) { return n.code; })).size,
      neighbors: neighbors.map(function (n) { return { id: n.id, name: n.name, unit: n.code }; }),
      staff: staff.map(function (a) { return { id: a.id, name: a.name, position: a.position }; }),
    });
  } catch (err) {
    next(err);
  }
}

async function show(req, res, next) {
  try {
    var me = await currentResident(req);
    if (!me || !me.unit) return noUnit(req, res);
    var room = roomOf(me, req.params.key);
    if (!room) return res.status(404).json({ error: 'Ийм чат алга' });

    var before = Number(req.query.before) || null;
    var messages = await Messages.list(room, before, 50);
    if (!before) await Messages.markRead(room, 'user', me.user.id);
    res.json({ room: room, messages: messages.map(forResident) });
  } catch (err) {
    next(err);
  }
}

async function send(req, res, next) {
  try {
    var me = await currentResident(req);
    if (!me || !me.unit) return noUnit(req, res);
    var room = roomOf(me, req.params.key);
    if (!room) return res.status(404).json({ error: 'Ийм чат алга' });

    var text = typeof req.body.text === 'string' ? req.body.text.trim().slice(0, MAX_LEN) : '';
    if (!text) return res.status(400).json({ error: 'Мессеж хоосон байна' });

    var message = await Messages.create(room, 'user', me.user.id, text);
    await Messages.markRead(room, 'user', me.user.id);
    log.debug({ id: me.user.id, room: room, length: text.length }, 'Чатын мессеж');
    res.status(201).json(message);
  } catch (err) {
    next(err);
  }
}

async function read(req, res, next) {
  try {
    var me = await currentResident(req);
    if (!me || !me.unit) return noUnit(req, res);
    var room = roomOf(me, req.params.key);
    if (!room) return res.status(404).json({ error: 'Ийм чат алга' });
    await Messages.markRead(room, 'user', me.user.id);
    res.status(204).end();
  } catch (err) {
    next(err);
  }
}

module.exports = { rooms, show, send, read };
