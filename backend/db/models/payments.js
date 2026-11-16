/**
 * Payments - төлбөр (payments хүснэгт). Нэг нэхэмжлэлийг хувааж төлж болно
 *
 * base: all, find, where, create, update, remove
 * forInvoice(invoiceId) - нэг нэхэмжлэлийн төлбөрүүд
 * record(invoiceId, data) - төлбөр бүртгээд нэхэмжлэлийн төлөвийг шинэчилнэ (transaction)
 * todayTotal(buildingId) - өнөөдөр орсон нийт дүн, төлбөрийн тоо
 * hourly(hours, buildingId) - сүүлийн n цагийн орлого, цаг тутам
 * recent(limit, buildingId) - сүүлийн төлбөрүүд, тоот, оршин суугчийн нэртэй
 * forUnit(unitId, limit) - нэг тоотын төлбөрийн түүх, шинээс нь
 */

var db = require('..');
var createModel = require('./base');
var Units = require('./units');

var base = createModel('payments');

async function forInvoice(invoiceId) {
  return db('payments').where({ invoice_id: invoiceId }).orderBy('paid_at');
}

async function record(invoiceId, data) {
  return db.transaction(async function (trx) {
    var invoice = await trx('invoices').where({ id: invoiceId }).forUpdate().first();
    if (!invoice) return null;

    var [id] = await trx('payments').insert({ ...data, invoice_id: invoiceId });

    var row = await trx('payments').where({ invoice_id: invoiceId }).sum({ paid: 'amount' }).first();
    var paid = Number(row.paid);
    var status = paid >= invoice.amount ? 'paid' : paid > 0 ? 'partial' : 'unpaid';

    await trx('invoices').where({ id: invoiceId }).update({ status: status, updated_at: trx.fn.now() });
    return trx('payments').where({ id: id }).first();
  });
}

async function todayTotal(buildingId) {
  var q = db('payments as p')
    .join('invoices as i', 'i.id', 'p.invoice_id')
    .where('p.paid_at', '>=', db.raw('CURDATE()'))
    .select(db.raw('COALESCE(SUM(p.amount), 0) AS amount, COUNT(*) AS count'))
    .first();
  var row = await Units.inBuilding(q, buildingId, 'i.unit_id');
  return { amount: Number(row.amount), count: Number(row.count) };
}

async function hourly(hours, buildingId) {
  var q = db('payments as p')
    .join('invoices as i', 'i.id', 'p.invoice_id')
    .where('p.paid_at', '>=', db.raw("DATE_FORMAT(NOW() - INTERVAL ? HOUR, '%Y-%m-%d %H:00:00')", [hours - 1]))
    .select(db.raw('HOUR(p.paid_at) AS hour, SUM(p.amount) AS amount'))
    .groupBy('hour');
  var rows = await Units.inBuilding(q, buildingId, 'i.unit_id');
  return rows.map(function (r) {
    return { hour: Number(r.hour), amount: Number(r.amount) };
  });
}

async function recent(limit, buildingId) {
  var q = db('payments as p')
    .join('invoices as i', 'i.id', 'p.invoice_id')
    .join('units as u', 'u.id', 'i.unit_id')
    .select('p.id', 'u.code', 'p.amount', 'p.method', 'p.paid_at', Units.residentName('u.id'))
    .orderBy('p.paid_at', 'desc')
    .limit(limit);
  return Units.inBuilding(q, buildingId, 'i.unit_id');
}

async function forUnit(unitId, limit) {
  return db('payments as p')
    .join('invoices as i', 'i.id', 'p.invoice_id')
    .select('p.id', 'i.period', 'p.amount', 'p.method', 'p.paid_at')
    .where('i.unit_id', unitId)
    .orderBy([{ column: 'p.paid_at', order: 'desc' }, { column: 'p.id', order: 'desc' }])
    .limit(limit || 12);
}

module.exports = { ...base, forInvoice, record, todayTotal, hourly, recent, forUnit };
