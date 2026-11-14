var db = require('..');
var createModel = require('./base');
var Units = require('./units');

var base = createModel('requests');

var openStatuses = ['open', 'in_progress'];

// Хүсэлтийн ангилал — DB-ийн enum-тэй ижил
var categories = ['plumbing', 'electrical', 'cleaning', 'elevator', 'other'];

// Табууд (stage) DB-д шууд байхгүй — status, assigned_to-оос гаргана:
//   open     — шийдээгүй бүгд (open, in_progress)
//   new      — open, засварчин томилоогүй
//   assigned — open, засварчин томилсон
//   progress — in_progress
//   done     — resolved эсвэл rejected
var stages = ['open', 'new', 'assigned', 'progress', 'done'];

function whereStage(q, stage) {
  if (stage === 'open') q.whereIn('r.status', openStatuses);
  if (stage === 'new') q.where('r.status', 'open').whereNull('r.assigned_to');
  if (stage === 'assigned') q.where('r.status', 'open').whereNotNull('r.assigned_to');
  if (stage === 'progress') q.where('r.status', 'in_progress');
  if (stage === 'done') q.whereIn('r.status', ['resolved', 'rejected']);
}

// Мөр бүрийн таб — frontend өнгө, алхмаа үүгээр сонгоно
function stageOf(r) {
  if (r.status === 'open') return r.assigned_to ? 'assigned' : 'new';
  if (r.status === 'in_progress') return 'progress';
  return 'done';
}

// Хүсэлтүүд — { stage, limit, offset }. Шинэ нь эхэндээ
async function list(filters, buildingId) {
  filters = filters || {};
  var q = db('requests as r')
    .leftJoin('units as u', 'u.id', 'r.unit_id')
    .leftJoin('users as c', 'c.id', 'r.created_by')
    .leftJoin('admins as a', 'a.id', 'r.assigned_to')
    .select('r.*', 'u.code as unit_code', 'c.name as created_by_name', 'a.name as assigned_name')
    .orderBy([{ column: 'r.created_at', order: 'desc' }, { column: 'r.id', order: 'desc' }]); // id — ижил цагтай мөрүүд хуудас хооронд үсрэхгүй

  if (filters.stage) whereStage(q, filters.stage);
  Units.inBuilding(q, buildingId, 'r.unit_id');
  if (filters.limit) q.limit(filters.limit).offset(filters.offset || 0);

  var rows = await q;
  return rows.map(function (r) {
    return Object.assign({}, r, { stage: stageOf(r) });
  });
}

// Табуудын тоо нэг query-гээр — { open, new, assigned, progress, done }
// MySQL-д (нөхцөл) нь 1/0 тул SUM нь таарсан мөрийн тоо болно
async function stageCounts(buildingId) {
  var q = db('requests')
    .select(
      db.raw("SUM(status IN ('open', 'in_progress')) AS `open`"),
      db.raw("SUM(status = 'open' AND assigned_to IS NULL) AS `new`"),
      db.raw("SUM(status = 'open' AND assigned_to IS NOT NULL) AS `assigned`"),
      db.raw("SUM(status = 'in_progress') AS `progress`"),
      db.raw("SUM(status IN ('resolved', 'rejected')) AS `done`")
    )
    .first();
  var row = await Units.inBuilding(q, buildingId, 'unit_id');

  var counts = {};
  stages.forEach(function (s) {
    counts[s] = Number(row[s] || 0); // хоосон хүснэгтэд SUM нь null
  });
  return counts;
}

// Шийдвэрлэгдээгүй хүсэлтийн тоо
async function openCount(buildingId) {
  var q = db('requests').whereIn('status', openStatuses).count({ c: '*' }).first();
  var row = await Units.inBuilding(q, buildingId, 'unit_id');
  return Number(row.c);
}

// Ангилал бүрээр хэдэн хүсэлт ирсэн — Dashboard-ийн "Хүсэлт ангиллаар"
async function countByCategory(from, buildingId) {
  var q = db('requests')
    .select('category')
    .count({ count: '*' })
    .where('created_at', '>=', from)
    .groupBy('category')
    .orderBy('count', 'desc');
  var rows = await Units.inBuilding(q, buildingId, 'unit_id');

  return rows.map(function (r) {
    return { category: r.category, count: Number(r.count) };
  });
}

// Шийдвэрлэсэн хүсэлтийг дунджаар хэдэн цагт шийддэг
async function avgResolveHours(from, buildingId) {
  var q = db('requests')
    .select(db.raw('AVG(TIMESTAMPDIFF(HOUR, created_at, resolved_at)) AS hours'))
    .whereNotNull('resolved_at')
    .where('created_at', '>=', from)
    .first();
  var row = await Units.inBuilding(q, buildingId, 'unit_id');

  return row.hours == null ? null : Math.round(Number(row.hours));
}

// Төлөв солих — шийдвэрлэсэн бол resolved_at-ийг тэмдэглэнэ
async function setStatus(id, status) {
  return base.update(id, {
    status: status,
    resolved_at: status === 'resolved' ? db.fn.now() : null,
  });
}

// Өнөөдөр шийдсэн хүсэлтийн тоо
async function resolvedToday(buildingId) {
  var q = db('requests')
    .where('status', 'resolved')
    .where('resolved_at', '>=', db.raw('CURDATE()'))
    .count({ n: '*' })
    .first();
  var row = await Units.inBuilding(q, buildingId, 'unit_id');
  return Number(row.n);
}

// Сүүлд өөрчлөгдсөн хүсэлтүүд — тоотын кодтой
async function recent(limit, buildingId) {
  var q = db('requests as r')
    .leftJoin('units as u', 'u.id', 'r.unit_id')
    .select('u.code', 'r.title', 'r.status', 'r.updated_at')
    .orderBy('r.updated_at', 'desc')
    .limit(limit);
  return Units.inBuilding(q, buildingId, 'r.unit_id');
}

// Оршин суугчийн өөрийн илгээсэн хүсэлтүүд, шинээс нь — засварчны нэр, stage-тэй
async function forUser(userId, limit) {
  var rows = await db('requests as r')
    .leftJoin('admins as a', 'a.id', 'r.assigned_to')
    .select(
      'r.id', 'r.category', 'r.title', 'r.description', 'r.status', 'r.assigned_to',
      'r.created_at', 'r.updated_at', 'r.resolved_at', 'a.name as assigned_name'
    )
    .where('r.created_by', userId)
    .orderBy([{ column: 'r.created_at', order: 'desc' }, { column: 'r.id', order: 'desc' }])
    .limit(limit || 50);
  return rows.map(function (r) {
    return Object.assign({}, r, { stage: stageOf(r) });
  });
}

module.exports = {
  ...base,
  categories,
  forUser,
  stages,
  stageOf,
  list,
  stageCounts,
  openCount,
  countByCategory,
  avgResolveHours,
  setStatus,
  resolvedToday,
  recent,
};
