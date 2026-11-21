/**
 * Payments - төлбөр (payments хүснэгт). Нэг нэхэмжлэлийг хувааж төлж болно
 *
 * base: all, find, where, create, update, remove
 * forInvoice(invoiceId) - нэг нэхэмжлэлийн төлбөрүүд
 * record(invoiceId, data) - төлбөр бүртгээд нэхэмжлэлийн төлөвийг шинэчилнэ (db.batch — нэг transaction)
 * todayTotal(buildingId) - өнөөдөр орсон нийт дүн, төлбөрийн тоо
 * hourly(hours, buildingId) - сүүлийн n цагийн орлого, цаг тутам
 * recent(limit, buildingId) - сүүлийн төлбөрүүд, тоот, оршин суугчийн нэртэй
 * forUnit(unitId, limit) - нэг тоотын төлбөрийн түүх, шинээс нь
 * recordedBy(adminId, limit) - ажилтны гараар бүртгэсэн сүүлийн төлбөрүүд, өнөөдрийн тоотой { today, recent }
 */

var db = require('..');
var { now, today } = require('../sql');
var createModel = require('./base');
var Units = require('./units');

var base = createModel('payments');

async function forInvoice(invoiceId) {
  return db('payments').where({ invoice_id: invoiceId }).orderBy('paid_at');
}

async function record(invoiceId, data) {
  var invoice = await db('invoices').where({ id: invoiceId }).first();
  if (!invoice) return null;

  var paid = db('payments').where({ invoice_id: invoiceId }).sum('amount');
  var status = db.raw(
    "CASE WHEN COALESCE(?, 0) >= amount THEN 'paid' WHEN COALESCE(?, 0) > 0 THEN 'partial' ELSE 'unpaid' END",
    [paid, paid]
  );

  var [inserted] = await db.batch([
    db('payments').insert({ ...data, invoice_id: invoiceId }).returning('*'),
    db('invoices').where({ id: invoiceId }).update({ status: status, updated_at: now() }),
  ]);
  return inserted.rows[0];
}

async function todayTotal(buildingId) {
  var q = db('payments as p')
    .join('invoices as i', 'i.id', 'p.invoice_id')
    .where('p.paid_at', '>=', today())
    .select(db.raw('COALESCE(SUM(p.amount), 0) AS amount, COUNT(*) AS count'))
    .first();
  var row = await Units.inBuilding(q, buildingId, 'i.unit_id');
  return { amount: Number(row.amount), count: Number(row.count) };
}

async function hourly(hours, buildingId) {
  var q = db('payments as p')
    .join('invoices as i', 'i.id', 'p.invoice_id')
    .where('p.paid_at', '>=', db.raw("strftime('%Y-%m-%d %H:00:00', datetime('now', '+8 hours', ?))", ['-' + (hours - 1) + ' hours']))
    .select(db.raw("CAST(strftime('%H', p.paid_at) AS INTEGER) AS hour, SUM(p.amount) AS amount"))
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

async function recordedBy(adminId, limit) {
  var [todayRow, recent] = await Promise.all([
    db('payments').where('recorded_by', adminId).where('paid_at', '>=', today()).count({ n: '*' }).first(),
    db('payments as p')
      .join('invoices as i', 'i.id', 'p.invoice_id')
      .join('units as u', 'u.id', 'i.unit_id')
      .select('p.id', 'u.code', 'p.amount', 'p.method', 'p.paid_at')
      .where('p.recorded_by', adminId)
      .orderBy('p.paid_at', 'desc')
      .limit(limit || 5),
  ]);
  return { today: Number(todayRow.n), recent: recent };
}

module.exports = { ...base, forInvoice, record, todayTotal, hourly, recent, forUnit, recordedBy };
