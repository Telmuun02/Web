var db = require('..');
var createModel = require('./base');

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
async function monthlySummary(fromPeriod) {
  var rows = await db('invoices as i')
    .leftJoin(paidPerInvoice(), 'p.invoice_id', 'i.id')
    .select('i.period')
    .sum({ billed: 'i.amount' })
    .select(db.raw('COALESCE(SUM(p.paid), 0) AS collected'))
    .count({ units: 'i.id' })
    .select(db.raw("SUM(i.status = 'paid') AS paid_units"))
    .where('i.period', '>=', fromPeriod)
    .groupBy('i.period')
    .orderBy('i.period');

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
async function debtors(limit) {
  var rows = await db('invoices as i')
    .join('units as u', 'u.id', 'i.unit_id')
    .leftJoin(paidPerInvoice(), 'p.invoice_id', 'i.id')
    .select('u.id as unit_id', 'u.code', 'u.entrance', 'u.floor', 'u.area_m2')
    .select(db.raw('SUM(i.amount - COALESCE(p.paid, 0)) AS debt'))
    .count({ months: 'i.id' })
    .whereIn('i.status', ['unpaid', 'partial'])
    .where('i.due_date', '<', db.fn.now())
    .groupBy('u.id', 'u.code', 'u.entrance', 'u.floor', 'u.area_m2')
    .orderBy('debt', 'desc')
    .limit(limit || 10);

  return rows.map(function (r) {
    return { ...r, debt: Number(r.debt), months: Number(r.months) };
  });
}

// Нийт хугацаа хэтэрсэн өр болон хэдэн тоот
async function overdueTotal() {
  var row = await db('invoices as i')
    .leftJoin(paidPerInvoice(), 'p.invoice_id', 'i.id')
    .select(db.raw('COALESCE(SUM(i.amount - COALESCE(p.paid, 0)), 0) AS debt'))
    .countDistinct({ units: 'i.unit_id' })
    .whereIn('i.status', ['unpaid', 'partial'])
    .where('i.due_date', '<', db.fn.now())
    .first();

  return { debt: Number(row.debt), units: Number(row.units) };
}

module.exports = { ...base, forUnit, monthlySummary, debtors, overdueTotal };
