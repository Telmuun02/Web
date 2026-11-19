/**
 * Төлбөр - /api/resident/pay
 * Хуудас: resident Pay (/pay)
 *
 * summary(me) - (дотоод) энэ сарын нэхэмжлэл, өр, орцны гэрэл, сүүлийн 12 төлбөрийг нэг объект болгоно
 * show - энэ сарын нэхэмжлэл, өр, орцны гэрэл, сүүлийн 12 төлбөр
 *   GET /api/resident/pay
 * pay - энэ сарын үлдэгдлийг QPay-ээр төлсөн мэт бүртгэнэ (демо, жинхэнэ QPay холбогдох хүртэл)
 *   POST /api/resident/pay
 */

var { Invoices, Payments } = require('../../db/models');
var { currentResident, noUnit } = require('./helpers');
var log = require('../../lib/logger').child({ module: 'user/pay' });

async function summary(me) {
  var [invoice, invoices, windows, history] = await Promise.all([
    Invoices.currentForUnit(me.unit.id),
    Invoices.forUnit(me.unit.id),
    Invoices.entranceMonth(me.unit.entrance_id),
    Payments.forUnit(me.unit.id, 12),
  ]);

  var debt = invoices
    .filter(function (i) { return i.status !== 'paid' && (!invoice || i.id !== invoice.id); })
    .reduce(function (sum, i) { return sum + i.amount - Number(i.paid); }, 0);

  return {
    unit: { code: me.unit.code, entrance: me.unit.entrance, area_m2: me.unit.area_m2 ? Number(me.unit.area_m2) : null },
    invoice: invoice || null,
    debt: debt,
    entrance_light: {
      units: windows.length,
      paid: windows.filter(function (w) { return w.paid; }).length,
    },
    history: history,
  };
}

async function show(req, res, next) {
  try {
    var me = await currentResident(req);
    if (!me || !me.unit) return noUnit(req, res);

    var data = await summary(me);
    if (!data.invoice) log.warn({ id: me.user.id, unit: me.unit.code }, 'Энэ сарын нэхэмжлэл үүсээгүй байна');
    log.debug({ id: me.user.id, unit: me.unit.code, debt: data.debt }, 'Төлбөр хуудас');

    res.json(data);
  } catch (err) {
    next(err);
  }
}

async function pay(req, res, next) {
  try {
    var me = await currentResident(req);
    if (!me || !me.unit) return noUnit(req, res);

    var invoice = await Invoices.currentForUnit(me.unit.id);
    if (!invoice) return res.status(404).json({ error: 'Энэ сарын нэхэмжлэл үүсээгүй байна' });

    var left = invoice.amount - invoice.paid;
    if (left <= 0) return res.status(409).json({ error: 'Энэ сарын төлбөр аль хэдийн төлөгдсөн байна' });

    await Payments.record(invoice.id, {
      amount: left,
      method: 'qpay',
      paid_at: new Date(),
      note: 'Демо QPay төлбөр (оршин суугч өөрөө)',
      recorded_by: null,
    });

    log.info({ by: me.user.id, unit: me.unit.code, invoiceId: invoice.id, amount: left }, 'Демо QPay төлбөр');
    res.status(201).json(await summary(me));
  } catch (err) {
    next(err);
  }
}

module.exports = { show, pay };
