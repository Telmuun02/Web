/**
 * Realtime-ийн гол логик — change_log-ийг уншаад хэнд юу илгээхийг шийднэ.
 * Workers (lib/realtime/durable.js) болон Node (lib/realtime/node.js) хоёулаа үүнийг ашиглана,
 * тэд зөвхөн WebSocket-оо хэрхэн барьж, илгээхээрээ ялгаатай.
 *
 * Client бүр { role: 'admin' | 'user', id, unitId, entranceId } гэсэн "хэн бэ" мэдээлэлтэй.
 * Илгээх мессежүүд:
 *   { type: 'change', tables: ['requests', ...] } — хуудас тухайн хүснэгтээс хамааралтай бол дахин татна
 *   { type: 'notify', title, body, link }          — toast мэдэгдэл
 *
 * latestId() - change_log-ийн хамгийн сүүлийн id (анх эхлэхэд хуучин өөрчлөлтүүдийг алгасна)
 * read(afterId) - afterId-аас хойшхи өөрчлөлтүүд
 * plan(changes) - өөрчлөлтүүдээс илгээх жагсаалт [{ to, msg }] гаргана
 * messageFor(client, item) - plan-ий нэг зүйлээс тухайн client-д илгээх мессеж (хамаагүй бол null)
 * matches(client, to) - (дотоод) client энэ хүлээн авагчид орох эсэх
 * changesFor(client, changes) - (дотоод) client-д харагдах хүснэгтүүд: ажилтан бүгдийг,
 *   оршин суугч нийтийнхийг (зарлал, санал хураалт, хурал) болон өөрийн тоотынхыг л харна
 * notifications(changes) - (дотоод) мэдэгдлүүд, мөрийн дэлгэрэнгүйг DB-ээс уншина.
 *   Нэг төрлийн өөрчлөлт BULK-аас олон бол (импорт, сарын нэхэмжлэл) тэр төрөлд мэдэгдэл явуулахгүй —
 *   хуудсууд нь шинэчлэгдэнэ, харин хүмүүст олон toast очихгүй, бусад төрлийн мэдэгдэл дарагдахгүй
 */

var db = require('../../db');
var log = require('../logger').child({ module: 'realtime' });

var BATCH = 200;
var BULK = 3;

var PUBLIC_TABLES = ['announcements', 'polls', 'poll_votes', 'meetings'];
var UNIT_TABLES = ['invoices', 'payments', 'requests', 'users', 'units'];

var statusLabel = { open: 'Хүлээн авлаа', in_progress: 'Ажил эхэллээ', resolved: 'Шийдэгдлээ', rejected: 'Татгалзав' };

function money(n) {
  return Number(n || 0).toLocaleString('en-US') + '₮';
}

async function latestId() {
  var row = await db('change_log').max({ id: 'id' }).first();
  return (row && row.id) || 0;
}

async function read(afterId) {
  return db('change_log').where('id', '>', afterId).orderBy('id').limit(BATCH);
}

function changesFor(client, changes) {
  var tables = new Set();
  changes.forEach(function (c) {
    if (client.role === 'admin') tables.add(c.tbl);
    else if (PUBLIC_TABLES.includes(c.tbl)) tables.add(c.tbl);
    else if (UNIT_TABLES.includes(c.tbl) && c.unit_id === client.unitId) tables.add(c.tbl);
  });
  return Array.from(tables);
}

async function notifications(changes) {
  var out = [];
  var count = {};
  changes.forEach(function (c) {
    count[c.tbl + ':' + c.op] = (count[c.tbl + ':' + c.op] || 0) + 1;
  });
  var picked = changes.filter(function (c) {
    return (c.op === 'insert' || c.op === 'status') && count[c.tbl + ':' + c.op] <= BULK;
  });

  for (var c of picked) {
    if (c.tbl === 'requests' && c.op === 'insert') {
      var req = await db('requests as r').leftJoin('units as u', 'u.id', 'r.unit_id')
        .select('r.title', 'u.code').where('r.id', c.row_id).first();
      if (req) out.push({ to: { role: 'admin' }, msg: { title: 'Шинэ хүсэлт', body: (req.code ? req.code + ' тоот — ' : '') + req.title, link: '/admin/requests' } });
    }

    if (c.tbl === 'requests' && c.op === 'status' && c.unit_id) {
      var r = await db('requests').select('title', 'status').where('id', c.row_id).first();
      if (r) out.push({ to: { unitId: c.unit_id }, msg: { title: 'Хүсэлт: ' + r.title, body: statusLabel[r.status] || r.status, link: '/requests' } });
    }

    if (c.tbl === 'payments' && c.op === 'insert') {
      var p = await db('payments as p').join('invoices as i', 'i.id', 'p.invoice_id').join('units as u', 'u.id', 'i.unit_id')
        .select('p.amount', 'p.recorded_by', 'u.code').where('p.id', c.row_id).first();
      if (p) {
        out.push({ to: { unitId: c.unit_id }, msg: { title: 'Төлбөр бүртгэгдлээ', body: money(p.amount), link: '/pay' } });
        if (!p.recorded_by) out.push({ to: { role: 'admin' }, msg: { title: 'Төлбөр орлоо', body: p.code + ' тоот — ' + money(p.amount), link: '/admin/invoices' } });
      }
    }

    if (c.tbl === 'invoices' && c.op === 'insert' && c.unit_id) {
      var inv = await db('invoices').select('amount', 'period').where('id', c.row_id).first();
      if (inv) out.push({ to: { unitId: c.unit_id }, msg: { title: 'Шинэ нэхэмжлэл', body: inv.period.slice(0, 7) + ' — ' + money(inv.amount), link: '/pay' } });
    }

    if (c.tbl === 'announcements' && c.op === 'insert') {
      var a = await db('announcements').select('title', 'entrance_id').where('id', c.row_id).first();
      if (a) out.push({ to: { role: 'user', entranceId: a.entrance_id || undefined }, msg: { title: 'Шинэ зарлал', body: a.title, link: '/news' } });
    }

    if (c.tbl === 'polls' && c.op === 'insert') {
      var poll = await db('polls').select('title').where('id', c.row_id).first();
      if (poll) out.push({ to: { role: 'user' }, msg: { title: 'Шинэ санал хураалт', body: poll.title, link: '/news' } });
    }

    if (c.tbl === 'meetings' && c.op === 'insert') {
      var m = await db('meetings').select('title').where('id', c.row_id).first();
      if (m) out.push({ to: { role: 'user' }, msg: { title: 'Хурал товлогдлоо', body: m.title, link: '/meeting' } });
    }
  }
  return out;
}

async function plan(changes) {
  if (!changes.length) return [];

  var list = [{ to: { each: true }, changes: changes }];

  try {
    (await notifications(changes)).forEach(function (n) {
      list.push({ to: n.to, msg: Object.assign({ type: 'notify' }, n.msg) });
    });
  } catch (err) {
    log.error({ err: err }, 'Мэдэгдэл бэлдэж чадсангүй');
  }
  return list;
}

function matches(client, to) {
  if (to.role && client.role !== to.role) return false;
  if (to.unitId && (client.role !== 'user' || client.unitId !== to.unitId)) return false;
  if (to.entranceId && client.entranceId !== to.entranceId) return false;
  return true;
}

function messageFor(client, item) {
  if (item.to.each) {
    var tables = changesFor(client, item.changes);
    return tables.length ? { type: 'change', tables: tables } : null;
  }
  return matches(client, item.to) ? item.msg : null;
}

module.exports = { latestId, read, plan, messageFor };
