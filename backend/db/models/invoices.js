var db = require('..');
var createModel = require('./base');
var Units = require('./units');

var base = createModel('invoices');

// Нэхэмжлэл бүрийн төлөгдсөн дүн — бусад query-д join хийж ашиглана
function paidPerInvoice() {
  return db('payments').select('invoice_id').sum({ paid: 'amount' }).groupBy('invoice_id').as('p');
}

// Нэг тоотын нэхэмжлэлүүд, шинээс нь
async function forUnit(unitId) {
  return db('invoices as i')
    .leftJoin(paidPerInvoice(), 'p.invoice_id', 'i.id')
    .select('i.*', db.raw('COALESCE(p.paid, 0) AS paid'))
    .where('i.unit_id', unitId)
    .orderBy('i.period', 'desc');
}

// Сар бүрийн нэхэмжилсэн / цугларсан дүн — Dashboard-ийн график, статистик
async function monthlySummary(fromPeriod, buildingId) {
  var q = db('invoices as i')
    .leftJoin(paidPerInvoice(), 'p.invoice_id', 'i.id')
    .select('i.period')
    .sum({ billed: 'i.amount' })
    .select(db.raw('COALESCE(SUM(p.paid), 0) AS collected'))
    .count({ units: 'i.id' })
    .select(db.raw("SUM(i.status = 'paid') AS paid_units"))
    .where('i.period', '>=', fromPeriod)
    .groupBy('i.period')
    .orderBy('i.period');
  var rows = await Units.inBuilding(q, buildingId, 'i.unit_id');

  // MySQL SUM нь string буцаадаг тул тоо болгоно
  return rows.map(function (r) {
    return {
      period: r.period,
      billed: Number(r.billed),
      collected: Number(r.collected),
      units: Number(r.units),
      paid_units: Number(r.paid_units),
    };
  });
}

// Хугацаа хэтэрсэн өртэй тоотууд, өр ихээс нь эрэмбэлсэн
async function debtors(limit, buildingId) {
  var q = db('invoices as i')
    .join('units as u', 'u.id', 'i.unit_id')
    .join('entrances as e', 'e.id', 'u.entrance_id')
    .leftJoin(paidPerInvoice(), 'p.invoice_id', 'i.id')
    .select('u.id as unit_id', 'u.code', 'e.number as entrance', 'u.floor', 'u.area_m2', Units.residentName('u.id'))
    .select(db.raw('SUM(i.amount - COALESCE(p.paid, 0)) AS debt'))
    .count({ months: 'i.id' })
    .whereIn('i.status', ['unpaid', 'partial'])
    .where('i.due_date', '<', db.fn.now())
    .groupBy('u.id', 'u.code', 'e.number', 'u.floor', 'u.area_m2')
    .orderBy('debt', 'desc')
    .limit(limit || 10);
  var rows = await Units.inBuilding(q, buildingId, 'i.unit_id');

  return rows.map(function (r) {
    return { ...r, debt: Number(r.debt), months: Number(r.months) };
  });
}

// Нийт хугацаа хэтэрсэн өр болон хэдэн тоот
async function overdueTotal(buildingId) {
  var q = db('invoices as i')
    .leftJoin(paidPerInvoice(), 'p.invoice_id', 'i.id')
    .select(db.raw('COALESCE(SUM(i.amount - COALESCE(p.paid, 0)), 0) AS debt'))
    .countDistinct({ units: 'i.unit_id' })
    .whereIn('i.status', ['unpaid', 'partial'])
    .where('i.due_date', '<', db.fn.now())
    .first();
  var row = await Units.inBuilding(q, buildingId, 'i.unit_id');

  return { debt: Number(row.debt), units: Number(row.units) };
}

// Нэхэмжлэл бүрийн хамгийн сүүлийн төлбөр (хэлбэр, огноо)
function lastPayment() {
  return db('payments as lp')
    .select('lp.invoice_id', 'lp.method', 'lp.paid_at')
    .whereIn('lp.id', db('payments').max('id').groupBy('invoice_id'))
    .as('lp');
}

// list, counts хоёрын нийтлэг нөхцөл — хоёулаа яг ижил нэхэмжлэлүүдээс тооцно:
// тухайн сарынх + өмнөх саруудаас төлөгдөөгүй үлдсэн нь, хайлт (тоот эсвэл оршин суугчийн нэр)
function inScope(q, period, search) {
  q.where(function () {
    this.where('i.period', period).orWhere(function () {
      this.where('i.period', '<', period).whereIn('i.status', ['unpaid', 'partial']);
    });
  });

  if (search) {
    var like = '%' + search + '%';
    q.where(function () {
      this.where('u.code', 'like', like).orWhereExists(
        db('users').whereRaw('users.unit_id = i.unit_id').where('users.name', 'like', like)
      );
    });
  }
  return q;
}

// Таб бүрийн нэхэмжлэлийн тоо нэг query-ээр — { all, unpaid, partial, paid, overdue }
// Нөхцөл нь list()-ийн таб шүүлттэй ижил (overdue нь due_date-ээс тооцогдоно)
async function counts(period, search, buildingId) {
  var q = db('invoices as i')
    .join('units as u', 'u.id', 'i.unit_id')
    .select(db.raw('COUNT(*) AS total')) // `all` нь MySQL-ийн нөөц үг тул total гэж нэрлэв
    .select(db.raw("COALESCE(SUM(i.status = 'unpaid' AND i.due_date >= NOW()), 0) AS unpaid"))
    .select(db.raw("COALESCE(SUM(i.status = 'partial' AND i.due_date >= NOW()), 0) AS partial"))
    .select(db.raw("COALESCE(SUM(i.status = 'paid'), 0) AS paid"))
    .select(db.raw("COALESCE(SUM(i.status <> 'paid' AND i.due_date < NOW()), 0) AS overdue"))
    .first();

  var row = await Units.inBuilding(inScope(q, period, search), buildingId, 'i.unit_id');

  return {
    all: Number(row.total),
    unpaid: Number(row.unpaid),
    partial: Number(row.partial),
    paid: Number(row.paid),
    overdue: Number(row.overdue),
  };
}

// Нэхэмжлэлийн жагсаалт: тухайн сарынх + өмнөх саруудаас төлөгдөөгүй үлдсэн нь.
// filters.status — 'unpaid' | 'partial' | 'paid' | 'overdue', null бол бүгд
// filters.q — тоотын дугаар эсвэл оршин суугчийн нэрээр хайх
// Буцаах status-д хугацаа хэтэрсэн бол 'overdue' гэж орно (DB-д тусдаа төлөв биш, due_date-ээс тооцно)
async function list(period, filters, buildingId) {
  filters = filters || {};

  var q = db('invoices as i')
    .join('units as u', 'u.id', 'i.unit_id')
    .leftJoin(paidPerInvoice(), 'p.invoice_id', 'i.id')
    .leftJoin(lastPayment(), 'lp.invoice_id', 'i.id')
    .select('i.id', 'i.unit_id', 'u.code as unit_code', 'i.period', 'i.amount', 'i.due_date', 'i.status')
    .select(db.raw('COALESCE(p.paid, 0) AS paid'))
    .select('lp.method as last_method', 'lp.paid_at as last_paid_at')
    // Тоотын анхны бүртгэлтэй оршин суугч
    .select(db.raw('(SELECT name FROM users WHERE users.unit_id = i.unit_id ORDER BY id LIMIT 1) AS resident_name'))
    // Dashboard-ийн overdueTotal, debtors-той ижил нөхцөл
    .select(db.raw("(i.status <> 'paid' AND i.due_date < NOW()) AS overdue"))
    // хуучин өр эхэндээ; i.id — эрэмбэ тогтвортой байж хуудас хооронд мөр давхцаж/алдагдахгүй
    .orderBy([{ column: 'i.period' }, { column: 'u.code' }, { column: 'i.id' }]);

  inScope(q, period, filters.q);
  Units.inBuilding(q, buildingId, 'i.unit_id');

  // Хуудаслалт — filters.limit өгөөгүй бол бүгдийг
  if (filters.limit) q.limit(filters.limit).offset(filters.offset || 0);

  // Таб бүрийн нөхцөл
  if (filters.status === 'paid') q.where('i.status', 'paid');
  if (filters.status === 'overdue') q.whereNot('i.status', 'paid').where('i.due_date', '<', db.fn.now());
  if (filters.status === 'unpaid' || filters.status === 'partial') {
    q.where('i.status', filters.status).where('i.due_date', '>=', db.fn.now());
  }

  var rows = await q;

  return rows.map(function (r) {
    return {
      id: r.id,
      unit_id: r.unit_id,
      unit_code: r.unit_code,
      resident_name: r.resident_name,
      period: r.period,
      amount: Number(r.amount),
      paid: Number(r.paid),
      due_date: r.due_date,
      status: Number(r.overdue) ? 'overdue' : r.status,
      last_payment: r.last_method ? { method: r.last_method, paid_at: r.last_paid_at } : null,
    };
  });
}

// Энэ сарын нэхэмжлэлээс хэд нь бүрэн төлөгдсөн
async function monthProgress(buildingId) {
  var q = db('invoices')
    .where('period', db.raw("DATE_FORMAT(CURDATE(), '%Y-%m-01')"))
    .select(db.raw("COUNT(*) AS total, COALESCE(SUM(status = 'paid'), 0) AS paid"))
    .first();
  var row = await Units.inBuilding(q, buildingId, 'unit_id');
  return { total: Number(row.total), paid: Number(row.paid) };
}

// Энэ сарын 1-ний өдөр — period баганатай харьцуулна
function thisMonth() {
  return db.raw("DATE_FORMAT(CURDATE(), '%Y-%m-01')");
}

// Тоотын энэ сарын нэхэмжлэл, төлсөн дүнтэй — байхгүй бол undefined
async function currentForUnit(unitId) {
  var row = await db('invoices as i')
    .leftJoin(paidPerInvoice(), 'p.invoice_id', 'i.id')
    .select('i.*', db.raw('COALESCE(p.paid, 0) AS paid'))
    .where('i.unit_id', unitId)
    .where('i.period', thisMonth())
    .first();
  return row && { ...row, paid: Number(row.paid) };
}

// Орцны тоот бүр энэ сард төлсөн эсэх — оршин суугчийн "орцны гэрэл", Home-ийн цонхнууд.
// Дээд давхраас доош, давхар дотроо тоотоор эрэмбэлнэ
async function entranceMonth(entranceId) {
  var rows = await db('units as u')
    .leftJoin('invoices as i', function () {
      this.on('i.unit_id', 'u.id').andOn('i.period', thisMonth());
    })
    .select('u.id', 'u.code', 'u.floor', 'i.status')
    .where('u.entrance_id', entranceId)
    .orderBy([{ column: 'u.floor', order: 'desc' }, { column: 'u.code' }]);
  return rows.map(function (r) {
    return { id: r.id, code: r.code, floor: r.floor, paid: r.status === 'paid' };
  });
}

// Сүүлийн 12 сард хугацаандаа (due_date-ийн өдрийн төгсгөл хүртэл) бүрэн төлсөн сарын тоо
async function onTimeCount(unitId) {
  var row = await db('invoices as i')
    .where('i.unit_id', unitId)
    .where('i.status', 'paid')
    .where('i.period', '>=', db.raw("DATE_FORMAT(CURDATE() - INTERVAL 12 MONTH, '%Y-%m-01')"))
    .whereRaw('(SELECT MAX(p.paid_at) FROM payments p WHERE p.invoice_id = i.id) < i.due_date + INTERVAL 1 DAY')
    .count({ n: '*' })
    .first();
  return Number(row.n);
}

module.exports = {
  ...base,
  onTimeCount,
  forUnit,
  monthlySummary,
  debtors,
  overdueTotal,
  list,
  counts,
  monthProgress,
  currentForUnit,
  entranceMonth,
};
