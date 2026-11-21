/**
 * Чат (ажилтан) - /api/admin/messages
 * Хуудас: admin Чат (/admin/chat) — оршин суугчдын хувийн чат (хариулах), орцны группүүд (унших, нуух)
 * (Ажилтны чатбот бол өөр — /api/admin/chat)
 *
 * index - хоёр табын жагсаалт: оршин суугчдын чатууд (уншаагүйтэй), орцны группүүд
 *   GET /api/admin/messages
 * show - нэг өрөөний мессежүүд + толгойн мэдээлэл, уншсан гэж тэмдэглэнэ
 *   GET /api/admin/messages/:room?before=  (room = soh:<оршин суугчийн id> | entrance:<орцны id>)
 * send - оршин суугчид хариулна (зөвхөн хувийн чатад — группт ажилтан бичихгүй, зарлалаар хандана)
 *   POST /api/admin/messages/:room - { text } → мессеж
 * read - өрөөг уншсан гэж тэмдэглэнэ
 *   POST /api/admin/messages/:room/read
 * hide - зүй бус мессежийг нуух / буцааж харуулах
 *   PATCH /api/admin/messages/item/:id - { hidden: true | false }
 *
 * header(room) - (дотоод) өрөөний гарчиг: оршин суугчийн нэр, тоот, утас эсвэл орцны дугаар
 */

var { Messages, Entrances } = require('../../db/models');
var db = require('../../db');
var log = require('../../lib/logger').child({ module: 'admin/messages' });

var MAX_LEN = 1000;

async function header(room) {
  var r = Messages.parseRoom(room);
  if (r.kind === 'soh') {
    var user = await db('users as s').leftJoin('units as u', 'u.id', 's.unit_id')
      .select('s.id', 's.name', 's.phone', 'u.code').where('s.id', r.id).first();
    if (!user) return null;
    return { kind: 'soh', title: user.name, unit: user.code, phone: user.phone, userId: user.id };
  }
  var entrance = (await Entrances.list()).find(function (e) { return e.id === r.id; });
  if (!entrance) return null;
  return { kind: 'entrance', title: entrance.number + '-р орцны групп', entranceId: entrance.id, entrance: entrance.number };
}

async function index(req, res, next) {
  try {
    var [threads, groups] = await Promise.all([Messages.sohThreads(req.user.id), Messages.entranceGroups()]);
    res.json({ threads: threads, groups: groups });
  } catch (err) {
    next(err);
  }
}

async function show(req, res, next) {
  try {
    var room = req.params.room;
    if (!Messages.parseRoom(room)) return res.status(404).json({ error: 'Ийм чат алга' });
    var head = await header(room);
    if (!head) return res.status(404).json({ error: 'Ийм чат алга' });

    var before = Number(req.query.before) || null;
    var messages = await Messages.list(room, before, 50);
    if (!before) await Messages.markRead(room, 'admin', req.user.id);
    res.json({ room: room, header: head, messages: messages });
  } catch (err) {
    next(err);
  }
}

async function send(req, res, next) {
  try {
    var room = req.params.room;
    var parsed = Messages.parseRoom(room);
    if (!parsed || parsed.kind !== 'soh') return res.status(400).json({ error: 'Зөвхөн оршин суугчийн чатад хариулна' });
    if (!(await header(room))) return res.status(404).json({ error: 'Ийм чат алга' });

    var text = typeof req.body.text === 'string' ? req.body.text.trim().slice(0, MAX_LEN) : '';
    if (!text) return res.status(400).json({ error: 'Мессеж хоосон байна' });

    var message = await Messages.create(room, 'admin', req.user.id, text);
    await Messages.markRead(room, 'admin', req.user.id);
    log.info({ by: req.user.id, room: room }, 'Оршин суугчид хариуллаа');
    res.status(201).json(message);
  } catch (err) {
    next(err);
  }
}

async function read(req, res, next) {
  try {
    if (!Messages.parseRoom(req.params.room)) return res.status(404).json({ error: 'Ийм чат алга' });
    await Messages.markRead(req.params.room, 'admin', req.user.id);
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
