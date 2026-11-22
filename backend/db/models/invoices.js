/**
 * Invoices - сарын нэхэмжлэл (invoices хүснэгт), тоот бүрт сар бүр нэг
 * status (unpaid/partial/paid) DB-д, 'overdue' нь due_date-ээс тооцогдоно
 * buildingId өгвөл тухайн байраар шүүнэ, өгөхгүй бол бүх байр
 *
 * base: all, find, where, create, update, remove
 * paidPerInvoice() - (дотоод) нэхэмжлэл бүрийн төлөгдсөн дүн, join-д
 * inScope(q, period, search) - (дотоод) list, counts-ын нийтлэг нөхцөл
 * thisMonth() - (дотоод) энэ сарын 1-ний өдөр
 *
 * forUnit(unitId) - нэг тоотын нэхэмжлэлүүд, шинээс нь
 * monthlySummary(fromPeriod, buildingId) - сар бүрийн нэхэмжилсэн / цугларсан дүн (Dashboard)
 * entranceSummary(fromPeriod, buildingId) - сар, орц бүрээр нэхэмжлэлийн тоо ба бүрэн төлөгдсөн нь (Reports "Төлөлт орцоор")
 * debtors(limit, buildingId) - хугацаа хэтэрсэн өртэй тоотууд, өр ихээс нь
 * overdueTotal(buildingId) - нийт хэтэрсэн өр, хэдэн тоот
 * counts(period, search, buildingId) - таб бүрийн тоо { all, unpaid, partial, paid, overdue }
 * list(period, filters, buildingId) - нэхэмжлэлийн жагсаалт (таб, хайлттай). Төлсөн дүн, сүүлийн төлбөрийг
 *   мөр бүрт index-ээр (payments.invoice_id) хайна — бүх төлбөрийг нэгтгэх join-оос хэдэн арав дахин цөөн мөр уншина
 * monthProgress(buildingId) - энэ сарын нэхэмжлэлээс хэд нь бүрэн төлөгдсөн
 * currentForUnit(unitId) - тоотын энэ сарын нэхэмжлэл, төлсөн дүн, задаргааны мөрүүдтэй (lines)
 * entranceMonth(entranceId) - орцны тоот бүр энэ сард төлсөн эсэх ("орцны гэрэл")
 * onTimeCount(unitId) - сүүлийн 12 сард хугацаандаа төлсөн сарын тоо
 */

var db = require('..');
var { now, monthStart } = require('../sql');
var createModel = require('./base');
var Units = require('./units');

var base = createModel('invoices');

function paidPerInvoice() {
  return db('payments').select('invoice_id').sum({ paid: 'amount' }).groupBy('invoice_id').as('p');
}

async function forUnit(unitId) {
  return db('invoices as i')
    .leftJoin(paidPerInvoice(), 'p.invoice_id', 'i.id')
    .select('i.*', db.raw('COALESCE(p.paid, 0) AS paid'))
    .where('i.unit_id', unitId)
    .orderBy('i.period', 'desc');
}

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

async function entranceSummary(fromPeriod, buildingId) {
  var q = db('invoices as i')
    .join('units as u', 'u.id', 'i.unit_id')
    .join('entrances as e', 'e.id', 'u.entrance_id')
    .select('i.period', 'e.number as entrance')
    .count({ units: 'i.id' })
    .select(db.raw("SUM(i.status = 'paid') AS paid_units"))
    .where('i.period', '>=', fromPeriod)
    .groupBy('i.period', 'e.number')
    .orderBy(['i.period', 'e.number']);
  var rows = await Units.inBuilding(q, buildingId, 'i.unit_id');

  return rows.map(function (r) {
    return { period: r.period, entrance: r.entrance, units: Number(r.units), paid_units: Number(r.paid_units) };
  });
}

async function debtors(limit, buildingId) {
  var q = db('invoices as i')
    .join('units as u', 'u.id', 'i.unit_id')
    .join('entrances as e', 'e.id', 'u.entrance_id')
    .leftJoin(paidPerInvoice(), 'p.invoice_id', 'i.id')
    .select('u.id as unit_id', 'u.code', 'e.number as entrance', 'u.floor', 'u.area_m2', Units.residentName('u.id'))
    .select(db.raw('SUM(i.amount - COALESCE(p.paid, 0)) AS debt'))
    .count({ months: 'i.id' })
    .whereIn('i.status', ['unpaid', 'partial'])
    .where('i.due_date', '<', now())
    .groupBy('u.id', 'u.code', 'e.number', 'u.floor', 'u.area_m2')
    .orderBy([{ column: 'debt', order: 'desc' }, { column: 'u.id' }])
    .limit(limit || 10);
  var rows = await Units.inBuilding(q, buildingId, 'i.unit_id');

  return rows.map(function (r) {
    return { ...r, debt: Number(r.debt), months: Number(r.months) };
  });
}

async function overdueTotal(buildingId) {
  var q = db('invoices as i')
    .leftJoin(paidPerInvoice(), 'p.invoice_id', 'i.id')
    .select(db.raw('COALESCE(SUM(i.amount - COALESCE(p.paid, 0)), 0) AS debt'))
    .countDistinct({ units: 'i.unit_id' })
    .whereIn('i.status', ['unpaid', 'partial'])
    .where('i.due_date', '<', now())
    .first();
  var row = await Units.inBuilding(q, buildingId, 'i.unit_id');

  return { debt: Number(row.debt), units: Number(row.units) };
}

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

async function counts(period, search, buildingId) {
  var q = db('invoices as i')
    .join('units as u', 'u.id', 'i.unit_id')
    .select(db.raw('COUNT(*) AS total'))
    .select(db.raw("COALESCE(SUM(i.status = 'unpaid' AND i.due_date >= datetime('now', '+8 hours')), 0) AS unpaid"))
    .select(db.raw("COALESCE(SUM(i.status = 'partial' AND i.due_date >= datetime('now', '+8 hours')), 0) AS partial"))
    .select(db.raw("COALESCE(SUM(i.status = 'paid'), 0) AS paid"))
    .select(db.raw("COALESCE(SUM(i.status <> 'paid' AND i.due_date < datetime('now', '+8 hours')), 0) AS overdue"))
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

async function list(period, filters, buildingId) {
  filters = filters || {};

  var q = db('invoices as i')
    .join('units as u', 'u.id', 'i.unit_id')
    .select('i.id', 'i.unit_id', 'u.code as unit_code', 'i.period', 'i.amount', 'i.due_date', 'i.status')
    .select(db.raw('(SELECT COALESCE(SUM(amount), 0) FROM payments WHERE payments.invoice_id = i.id) AS paid'))
    .select(db.raw('(SELECT method FROM payments WHERE payments.invoice_id = i.id ORDER BY id DESC LIMIT 1) AS last_method'))
    .select(db.raw('(SELECT paid_at FROM payments WHERE payments.invoice_id = i.id ORDER BY id DESC LIMIT 1) AS last_paid_at'))
    .select(db.raw('(SELECT name FROM users WHERE users.unit_id = i.unit_id ORDER BY id LIMIT 1) AS resident_name'))
    .select(db.raw("(i.status <> 'paid' AND i.due_date < datetime('now', '+8 hours')) AS overdue"))
    .orderBy([{ column: 'i.period' }, { column: 'u.code' }, { column: 'i.id' }]);

  inScope(q, period, filters.q);
  Units.inBuilding(q, buildingId, 'i.unit_id');

  if (filters.limit) q.limit(filters.limit).offset(filters.offset || 0);

  if (filters.status === 'paid') q.where('i.status', 'paid');
  if (filters.status === 'overdue') q.whereNot('i.status', 'paid').where('i.due_date', '<', now());
  if (filters.status === 'unpaid' || filters.status === 'partial') {
    q.where('i.status', filters.status).where('i.due_date', '>=', now());
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

async function monthProgress(buildingId) {
  var q = db('invoices')
    .where('period', monthStart())
    .select(db.raw("COUNT(*) AS total, COALESCE(SUM(status = 'paid'), 0) AS paid"))
    .first();
  var row = await Units.inBuilding(q, buildingId, 'unit_id');
  return { total: Number(row.total), paid: Number(row.paid) };
}

function thisMonth() {
  return monthStart();
}

async function currentForUnit(unitId) {
  var row = await db('invoices as i')
    .leftJoin(paidPerInvoice(), 'p.invoice_id', 'i.id')
    .select('i.*', db.raw('COALESCE(p.paid, 0) AS paid'))
    .where('i.unit_id', unitId)
    .where('i.period', thisMonth())
    .first();
  if (!row) return row;
  var lines = await db('invoice_lines').select('name', 'amount').where('invoice_id', row.id).orderBy('position');
  return { ...row, paid: Number(row.paid), lines: lines };
}

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

async function onTimeCount(unitId) {
  var row = await db('invoices as i')
    .where('i.unit_id', unitId)
    .where('i.status', 'paid')
    .where('i.period', '>=', monthStart(12))
    .whereRaw("(SELECT MAX(p.paid_at) FROM payments p WHERE p.invoice_id = i.id) < date(i.due_date, '+1 day')")
    .count({ n: '*' })
    .first();
  return Number(row.n);
}

module.exports = {
  ...base,
  entranceSummary,
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
