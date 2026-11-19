/**
 * Төлбөр - /api/resident/pay
 * Хуудас: resident Pay (/pay)
 *
 * show - энэ сарын нэхэмжлэл, өр, орцны гэрэл, сүүлийн 12 төлбөр
 *   GET /api/resident/pay
 */

var { Invoices, Payments } = require('../../db/models');
var { currentResident, noUnit } = require('./helpers');
var log = require('../../lib/logger').child({ module: 'user/pay' });

async function show(req, res, next) {
  try {
    var me = await currentResident(req);
    if (!me || !me.unit) return noUnit(req, res);

    var [invoice, invoices, windows, history] = await Promise.all([
      Invoices.currentForUnit(me.unit.id),
      Invoices.forUnit(me.unit.id),
      Invoices.entranceMonth(me.unit.entrance_id),
      Payments.forUnit(me.unit.id, 12),
    ]);

    var debt = invoices
      .filter(function (i) { return i.status !== 'paid' && (!invoice || i.id !== invoice.id); })
      .reduce(function (sum, i) { return sum + i.amount - Number(i.paid); }, 0);

    if (!invoice) log.warn({ id: me.user.id, unit: me.unit.code }, 'Энэ сарын нэхэмжлэл үүсээгүй байна');
    log.debug({ id: me.user.id, unit: me.unit.code, debt: debt }, 'Төлбөр хуудас');

    res.json({
      unit_code: me.unit.code,
      invoice: invoice || null,
      debt: debt,
      entrance_light: {
        units: windows.length,
        paid: windows.filter(function (w) { return w.paid; }).length,
      },
      history: history,
    });
  } catch (err) {
    next(err);
  }
}

module.exports = { show };
