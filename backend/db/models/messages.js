/**
 * Messages - чат (chat_messages, chat_reads хүснэгтүүд)
 * Өрөө: 'entrance:<орцны id>' — орцны групп, 'soh:<оршин суугчийн id>' — оршин суугч ↔ СӨХ
 *
 * entranceRoom(id), sohRoom(userId) - өрөөний нэр
 * parseRoom(room) - 'entrance:34' → { kind: 'entrance', id: 34 }, буруу бол null
 * canAccess(who, room) - who = { role, id, entranceId }: ажилтан бүх өрөөнд, оршин суугч өөрийн орц ба өөрийн СӨХ чатад
 * list(room, before, limit) - өрөөний мессежүүд хуучнаас шинэ рүү, before өгвөл түүнээс өмнөх
 * find(id) - нэг мессеж илгээгчийн нэртэй
 * create(room, senderType, senderId, body) - мессеж нэмээд буцаана
 * setHidden(id, hidden) - мессежийг нуух / буцааж харуулах (ажилтан)
 * markRead(room, readerType, readerId) - өрөөний сүүлийн мессеж хүртэл уншсан гэж тэмдэглэнэ
 * unread(room, readerType, readerId) - уншаагүй мессежийн тоо (өөрийнхөө бичснийг тоолохгүй)
 * last(room) - сүүлийн мессеж
 * sohThreads(adminId) - СӨХ-тэй бичигдсэн бүх хувийн чат: оршин суугч, тоот, сүүлийн мессеж, уншаагүй
 * entranceGroups() - орц бүрийн групп: айл, сүүлийн мессеж
 * residentsOf(entranceId) - орцны оршин суугчид (онлайн жагсаалтад)
 *
 * withSender() - (дотоод) мессеж + илгээгчийн нэр, тоот / албан тушаал
 * toMessage(row) - (дотоод) мөрийг frontend-ийн хэлбэрт
 */

var db = require('..');

var positionLabel = { chairman: 'СӨХ-ийн дарга', accountant: 'Нягтлан', technician: 'Засварчин', staff: 'Ажилтан' };

function entranceRoom(id) {
  return 'entrance:' + id;
}

function sohRoom(userId) {
  return 'soh:' + userId;
}

function parseRoom(room) {
  var match = /^(entrance|soh):(\d+)$/.exec(String(room || ''));
  return match ? { kind: match[1], id: Number(match[2]) } : null;
}

function canAccess(who, room) {
  var r = parseRoom(room);
  if (!r || !who) return false;
  if (who.role === 'admin') return true;
  if (r.kind === 'entrance') return who.entranceId === r.id;
  return who.id === r.id;
}

function withSender() {
  return db('chat_messages as m')
    .leftJoin('users as s', function () {
      this.on('s.id', 'm.sender_id').andOn('m.sender_type', db.raw("'user'"));
    })
    .leftJoin('units as u', 'u.id', 's.unit_id')
    .leftJoin('admins as a', function () {
      this.on('a.id', 'm.sender_id').andOn('m.sender_type', db.raw("'admin'"));
    })
    .select('m.*', 's.name as user_name', 'u.code as unit_code', 'a.name as admin_name', 'a.position');
}

function toMessage(row) {
  var admin = row.sender_type === 'admin';
  return {
    id: row.id,
    room: row.room,
    body: row.body,
    hidden: Boolean(row.hidden),
    created_at: row.created_at,
    sender: {
      type: row.sender_type,
      id: row.sender_id,
      name: (admin ? row.admin_name : row.user_name) || 'Хэрэглэгч',
      sub: admin ? 'СӨХ · ' + (positionLabel[row.position] || 'Ажилтан') : row.unit_code ? row.unit_code + ' тоот' : '',
    },
  };
}

async function list(room, before, limit) {
  var q = withSender().where('m.room', room).orderBy('m.id', 'desc').limit(limit || 50);
  if (before) q.where('m.id', '<', before);
  var rows = await q;
  return rows.reverse().map(toMessage);
}

async function find(id) {
  var row = await withSender().where('m.id', id).first();
  return row && toMessage(row);
}

async function create(room, senderType, senderId, body) {
  var [id] = await db('chat_messages').insert({ room: room, sender_type: senderType, sender_id: senderId, body: body });
  return find(id);
}

async function setHidden(id, hidden) {
  await db('chat_messages').where({ id: id }).update({ hidden: hidden ? 1 : 0 });
  return find(id);
}

async function markRead(room, readerType, readerId) {
  var row = await db('chat_messages').where('room', room).max({ id: 'id' }).first();
  var lastId = (row && row.id) || 0;
  await db('chat_reads')
    .insert({ room: room, reader_type: readerType, reader_id: readerId, last_read_id: lastId })
    .onConflict(['room', 'reader_type', 'reader_id'])
    .merge({ last_read_id: lastId });
  return lastId;
}

async function unread(room, readerType, readerId) {
  var read = await db('chat_reads').where({ room: room, reader_type: readerType, reader_id: readerId }).first();
  var row = await db('chat_messages')
    .where('room', room)
    .where('id', '>', (read && read.last_read_id) || 0)
    .where('hidden', 0)
    .whereNot(function () {
      this.where('sender_type', readerType).where('sender_id', readerId);
    })
    .count({ n: '*' })
    .first();
  return Number(row.n);
}

async function last(room) {
  var row = await withSender().where('m.room', room).where('m.hidden', 0).orderBy('m.id', 'desc').first();
  return row ? toMessage(row) : null;
}

async function sohThreads(adminId) {
  var rooms = await db('chat_messages')
    .where('room', 'like', 'soh:%')
    .select('room')
    .max({ last_id: 'id' })
    .groupBy('room')
    .orderBy('last_id', 'desc');
  if (!rooms.length) return [];

  var userIds = rooms.map(function (r) { return parseRoom(r.room).id; });
  var [users, lasts, unreadRows] = await Promise.all([
    db('users as s').leftJoin('units as u', 'u.id', 's.unit_id').select('s.id', 's.name', 's.phone', 'u.code').whereIn('s.id', userIds),
    withSender().whereIn('m.id', rooms.map(function (r) { return r.last_id; })),
    db('chat_messages as m')
      .leftJoin('chat_reads as r', function () {
        this.on('r.room', 'm.room').andOn('r.reader_type', db.raw("'admin'")).andOn('r.reader_id', db.raw('?', [adminId]));
      })
      .where('m.room', 'like', 'soh:%')
      .where('m.sender_type', 'user')
      .where('m.hidden', 0)
      .whereRaw('m.id > COALESCE(r.last_read_id, 0)')
      .select('m.room')
      .count({ n: '*' })
      .groupBy('m.room'),
  ]);

  return rooms.map(function (r) {
    var userId = parseRoom(r.room).id;
    var user = users.find(function (x) { return x.id === userId; }) || {};
    var lastRow = lasts.find(function (x) { return x.id === r.last_id; });
    var count = unreadRows.find(function (x) { return x.room === r.room; });
    return {
      room: r.room,
      user: { id: userId, name: user.name || 'Хэрэглэгч', phone: user.phone || null, unit: user.code || null },
      last: lastRow ? toMessage(lastRow) : null,
      unread: count ? Number(count.n) : 0,
    };
  });
}

async function entranceGroups() {
  var entrances = await db('entrances as e')
    .select('e.id', 'e.number')
    .select(db.raw('(SELECT COUNT(DISTINCT s.unit_id) FROM users s JOIN units u ON u.id = s.unit_id WHERE u.entrance_id = e.id) AS homes'))
    .orderBy('e.number');
  return Promise.all(entrances.map(async function (e) {
    var room = entranceRoom(e.id);
    return { room: room, entrance: { id: e.id, number: e.number }, homes: Number(e.homes), last: await last(room) };
  }));
}

async function residentsOf(entranceId) {
  return db('users as s')
    .join('units as u', 'u.id', 's.unit_id')
    .select('s.id', 's.name', 'u.code')
    .where('u.entrance_id', entranceId)
    .orderBy('u.code');
}

module.exports = {
  entranceRoom,
  sohRoom,
  parseRoom,
  canAccess,
  list,
  find,
  create,
  setHidden,
  markRead,
  unread,
  last,
  sohThreads,
  entranceGroups,
  residentsOf,
};
