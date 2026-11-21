/**
 * Requests - засварын хүсэлт (requests хүснэгт)
 * Таб (stage) DB-д байхгүй, status болон assigned_to-оос гаргана:
 *   open (шийдээгүй бүгд), new, assigned, progress, done
 *
 * base: all, find, where, create, update, remove
 * categories - ангиллууд (DB-ийн enum-тэй ижил)
 * stages - табуудын жагсаалт
 * whereStage(q, stage) - (дотоод) query-д табын нөхцөл нэмнэ
 *
 * stageOf(r) - мөр аль табынх вэ
 * list(filters, buildingId) - хүсэлтүүд { stage, limit, offset }, шинэ нь эхэндээ
 * stageCounts(buildingId) - таб бүрийн тоо
 * openCount(buildingId) - шийдвэрлэгдээгүй хүсэлтийн тоо
 * countByCategory(from, buildingId) - ангилал бүрээр хэдэн хүсэлт (Dashboard)
 * avgResolveHours(from, buildingId) - дунджаар хэдэн цагт шийддэг
 * setStatus(id, status) - төлөв солих, шийдсэн бол resolved_at тэмдэглэнэ
 * resolvedToday(buildingId) - өнөөдөр шийдсэн тоо
 * recent(limit, buildingId) - сүүлд өөрчлөгдсөн хүсэлтүүд
 * forUser(userId, limit) - оршин суугчийн өөрийн хүсэлтүүд
 */

var db = require('..');
var { now, today } = require('../sql');
var createModel = require('./base');
var Units = require('./units');

var base = createModel('requests');

var openStatuses = ['open', 'in_progress'];

var categories = ['plumbing', 'electrical', 'cleaning', 'elevator', 'other'];

var stages = ['open', 'new', 'assigned', 'progress', 'done'];

function whereStage(q, stage) {
  if (stage === 'open') q.whereIn('r.status', openStatuses);
  if (stage === 'new') q.where('r.status', 'open').whereNull('r.assigned_to');
  if (stage === 'assigned') q.where('r.status', 'open').whereNotNull('r.assigned_to');
  if (stage === 'progress') q.where('r.status', 'in_progress');
  if (stage === 'done') q.whereIn('r.status', ['resolved', 'rejected']);
}

function stageOf(r) {
  if (r.status === 'open') return r.assigned_to ? 'assigned' : 'new';
  if (r.status === 'in_progress') return 'progress';
  return 'done';
}

async function list(filters, buildingId) {
  filters = filters || {};
  var q = db('requests as r')
    .leftJoin('units as u', 'u.id', 'r.unit_id')
    .leftJoin('users as c', 'c.id', 'r.created_by')
    .leftJoin('admins as a', 'a.id', 'r.assigned_to')
    .select('r.*', 'u.code as unit_code', 'c.name as created_by_name', 'a.name as assigned_name')
    .orderBy([{ column: 'r.created_at', order: 'desc' }, { column: 'r.id', order: 'desc' }]);

  if (filters.stage) whereStage(q, filters.stage);
  Units.inBuilding(q, buildingId, 'r.unit_id');
  if (filters.limit) q.limit(filters.limit).offset(filters.offset || 0);

  var rows = await q;
  return rows.map(function (r) {
    return Object.assign({}, r, { stage: stageOf(r) });
  });
}

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
    counts[s] = Number(row[s] || 0);
  });
  return counts;
}

async function openCount(buildingId) {
  var q = db('requests').whereIn('status', openStatuses).count({ c: '*' }).first();
  var row = await Units.inBuilding(q, buildingId, 'unit_id');
  return Number(row.c);
}

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

async function avgResolveHours(from, buildingId) {
  var q = db('requests')
    .select(db.raw('AVG(CAST((julianday(resolved_at) - julianday(created_at)) * 24 AS INTEGER)) AS hours'))
    .whereNotNull('resolved_at')
    .where('created_at', '>=', from)
    .first();
  var row = await Units.inBuilding(q, buildingId, 'unit_id');

  return row.hours == null ? null : Math.round(Number(row.hours));
}

async function setStatus(id, status) {
  return base.update(id, {
    status: status,
    resolved_at: status === 'resolved' ? now() : null,
  });
}

async function resolvedToday(buildingId) {
  var q = db('requests')
    .where('status', 'resolved')
    .where('resolved_at', '>=', today())
    .count({ n: '*' })
    .first();
  var row = await Units.inBuilding(q, buildingId, 'unit_id');
  return Number(row.n);
}

async function recent(limit, buildingId) {
  var q = db('requests as r')
    .leftJoin('units as u', 'u.id', 'r.unit_id')
    .select('u.code', 'r.title', 'r.status', 'r.updated_at')
    .orderBy('r.updated_at', 'desc')
    .limit(limit);
  return Units.inBuilding(q, buildingId, 'r.unit_id');
}

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
