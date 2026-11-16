/**
 * Units - тоот (units хүснэгт)
 * Тоот орцонд, орц байранд холбогдоно: buildings ──< entrances ──< units
 *
 * base: create, update, remove (all, find-ийг доор дахин тодорхойлсон)
 * withEntrance() - (дотоод) тоот + орцны дугаар, байртай query
 *
 * inBuilding(q, buildingId, unitColumn) - бусад model-ийн query-г байраар шүүнэ
 * residentName(unitColumn) - select дотор тоотын эхний оршин суугчийн нэр
 * all(buildingId) - бүх тоот, орц, тоотоор эрэмбэлсэн
 * byEntrance(entrance, buildingId) - нэг орцны тоотууд
 * find(id) - нэг тоот, орцны дугаартай
 * withResidents(id) - тоот + тэнд амьдардаг оршин суугчид
 * occupancy(buildingId) - нийт тоот, оршин суугчтай тоот
 * list(filters, buildingId) - тоотын жагсаалт, оршин суугч, өртэй { entrance, q }
 */

var db = require('..');
var createModel = require('./base');

var base = createModel('units');

function inBuilding(q, buildingId, unitColumn) {
  if (buildingId) {
    q.whereIn(unitColumn, db('units as bu')
      .join('entrances as be', 'be.id', 'bu.entrance_id')
      .select('bu.id')
      .where('be.building_id', buildingId));
  }
  return q;
}

function withEntrance() {
  return db('units as u')
    .join('entrances as e', 'e.id', 'u.entrance_id')
    .select('u.*', 'e.number as entrance', 'e.building_id');
}

async function all(buildingId) {
  var q = withEntrance().orderBy(['e.number', 'u.code']);
  if (buildingId) q.where('e.building_id', buildingId);
  return q;
}

async function byEntrance(entrance, buildingId) {
  var q = withEntrance().where('e.number', entrance).orderBy('u.code');
  if (buildingId) q.where('e.building_id', buildingId);
  return q;
}

async function find(id) {
  return withEntrance().where('u.id', id).first();
}

async function withResidents(id) {
  var unit = await find(id);
  if (!unit) return null;

  unit.residents = await db('users')
    .select('id', 'name', 'phone', 'email')
    .where({ unit_id: id })
    .orderBy('id');
  return unit;
}

async function occupancy(buildingId) {
  var [total, occupied] = await Promise.all([
    inBuilding(db('units').count({ n: '*' }).first(), buildingId, 'id'),
    inBuilding(db('users').whereNotNull('unit_id').countDistinct({ n: 'unit_id' }).first(), buildingId, 'unit_id'),
  ]);
  return { total: Number(total.n), occupied: Number(occupied.n) };
}

function residentName(unitColumn) {
  return db.raw(
    "(SELECT s.name FROM users s WHERE s.unit_id = ?? ORDER BY s.id LIMIT 1) AS name",
    [unitColumn],
  );
}

async function list(filters, buildingId) {
  filters = filters || {};
  var residents = db('users')
    .select('unit_id')
    .count({ residents: '*' })
    .whereNotNull('unit_id')
    .groupBy('unit_id')
    .as('r');

  var debt = db.raw(
    "(SELECT COALESCE(SUM(i.amount - COALESCE((SELECT SUM(p.amount) FROM payments p WHERE p.invoice_id = i.id), 0)), 0)" +
      " FROM invoices i WHERE i.unit_id = u.id AND i.status IN ('unpaid', 'partial')) AS debt"
  );

  var q = withEntrance()
    .leftJoin(residents, 'r.unit_id', 'u.id')
    .select(residentName('u.id'), db.raw('COALESCE(r.residents, 0) AS residents'), debt)
    .orderBy([{ column: 'e.number' }, { column: 'u.code' }]);

  if (buildingId) q.where('e.building_id', buildingId);
  if (filters.entrance) q.where('e.number', filters.entrance);
  if (filters.q) {
    var like = '%' + filters.q + '%';
    q.where(function () {
      this.where('u.code', 'like', like).orWhereExists(
        db('users as s').whereRaw('s.unit_id = u.id').where('s.name', 'like', like)
      );
    });
  }

  var rows = await q;
  return rows.map(function (r) {
    return { ...r, residents: Number(r.residents), debt: Number(r.debt) };
  });
}

module.exports = { ...base, inBuilding, all, byEntrance, find, withResidents, occupancy, residentName, list };
