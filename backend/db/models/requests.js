var db = require('..');
var createModel = require('./base');

var base = createModel('requests');

var openStatuses = ['open', 'in_progress'];

// Хүсэлтүүд — { status, category, unitId }-аар шүүж болно
async function list(filters) {
  filters = filters || {};
  var q = db('requests as r')
    .leftJoin('units as u', 'u.id', 'r.unit_id')
    .leftJoin('users as c', 'c.id', 'r.created_by')
    .select('r.*', 'u.code as unit_code', 'c.name as created_by_name')
    .orderBy('r.created_at', 'desc');

  if (filters.status) q.where('r.status', filters.status);
  if (filters.category) q.where('r.category', filters.category);
  if (filters.unitId) q.where('r.unit_id', filters.unitId);
  return q;
}

// Шийдвэрлэгдээгүй хүсэлтийн тоо
async function openCount() {
  var row = await db('requests').whereIn('status', openStatuses).count({ c: '*' }).first();
  return Number(row.c);
}

// Ангилал бүрээр хэдэн хүсэлт ирсэн — Dashboard-ийн "Хүсэлт ангиллаар"
async function countByCategory(from) {
  var rows = await db('requests')
    .select('category')
    .count({ count: '*' })
    .where('created_at', '>=', from)
    .groupBy('category')
    .orderBy('count', 'desc');

  return rows.map(function (r) {
    return { category: r.category, count: Number(r.count) };
  });
}

// Шийдвэрлэсэн хүсэлтийг дунджаар хэдэн цагт шийддэг
async function avgResolveHours(from) {
  var row = await db('requests')
    .select(db.raw('AVG(TIMESTAMPDIFF(HOUR, created_at, resolved_at)) AS hours'))
    .whereNotNull('resolved_at')
    .where('created_at', '>=', from)
    .first();

  return row.hours == null ? null : Math.round(Number(row.hours));
}

// Төлөв солих — шийдвэрлэсэн бол resolved_at-ийг тэмдэглэнэ
async function setStatus(id, status) {
  return base.update(id, {
    status: status,
    resolved_at: status === 'resolved' ? db.fn.now() : null,
  });
}

module.exports = { ...base, list, openCount, countByCategory, avgResolveHours, setStatus };
