var db = require('..');
var createModel = require('./base');

var base = createModel('units');

// Тоот орцонд (entrance_id), орц байранд холбогдоно: buildings ──< entrances ──< units

// Байраар шүүх — buildingId өгөөгүй бол бүх байр.
// unitColumn — тоотын id-тай багана: inBuilding(q, buildingId, 'i.unit_id')
// units-тэй join хийсэн эсэхээс үл хамааран ажиллана
function inBuilding(q, buildingId, unitColumn) {
  if (buildingId) {
    q.whereIn(unitColumn, db('units as bu')
      .join('entrances as be', 'be.id', 'bu.entrance_id')
      .select('bu.id')
      .where('be.building_id', buildingId));
  }
  return q;
}

// Тоот + орцны дугаар, байр — FE өмнөх шигээ entrance (дугаар) авна
function withEntrance() {
  return db('units as u')
    .join('entrances as e', 'e.id', 'u.entrance_id')
    .select('u.*', 'e.number as entrance', 'e.building_id');
}

// Бүх тоот — орц, тоотоор эрэмбэлсэн
async function all(buildingId) {
  var q = withEntrance().orderBy(['e.number', 'u.code']);
  if (buildingId) q.where('e.building_id', buildingId);
  return q;
}

// Нэг орцны тоотууд — орцны дугаараар
async function byEntrance(entrance, buildingId) {
  var q = withEntrance().where('e.number', entrance).orderBy('u.code');
  if (buildingId) q.where('e.building_id', buildingId);
  return q;
}

// Нэг тоот — орцны дугаартай
async function find(id) {
  return withEntrance().where('u.id', id).first();
}

// Тоот + тэнд амьдардаг оршин суугчид
async function withResidents(id) {
  var unit = await find(id);
  if (!unit) return null;

  unit.residents = await db('users')
    .select('id', 'name', 'phone', 'email')
    .where({ unit_id: id })
    .orderBy('id');
  return unit;
}

// Нийт тоот, оршин суугчтай тоот
async function occupancy(buildingId) {
  var [total, occupied] = await Promise.all([
    inBuilding(db('units').count({ n: '*' }).first(), buildingId, 'id'),
    inBuilding(db('users').whereNotNull('unit_id').countDistinct({ n: 'unit_id' }).first(), buildingId, 'unit_id'),
  ]);
  return { total: Number(total.n), occupied: Number(occupied.n) };
}

// Тоотын эхний оршин суугчийн нэр — бусад query-ийн select дотор:
//   .select('u.code', Units.residentName('u.id'))  → мөр бүрд name ирнэ (оршин суугчгүй бол null)
function residentName(unitColumn) {
  return db.raw(
    "(SELECT s.name FROM users s WHERE s.unit_id = ?? ORDER BY s.id LIMIT 1) AS name",
    [unitColumn],
  );
}

// Тоотын жагсаалт — оршин суугчийн нэр, тоо, өртэй. { entrance, q }
// q — тоот эсвэл оршин суугчийн нэрээр хайна
async function list(filters, buildingId) {
  filters = filters || {};
  var residents = db('users')
    .select('unit_id')
    .count({ residents: '*' })
    .whereNotNull('unit_id')
    .groupBy('unit_id')
    .as('r');

  // Төлөгдөөгүй нэхэмжлэлүүдийн үлдэгдэл (нэхэмжилсэн − төлсөн)
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
