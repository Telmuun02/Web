var { Invoices, Payments } = require('../../db/models');
var { currentResident, noUnit } = require('./helpers');
var log = require('../../lib/logger').child({ module: 'user/pay' });

/**
 * show -- Төлбөр хуудас
 *   GET /api/resident/pay →
 *   {
 *     unit_code:      '1-01',
 *     invoice:        энэ сарын нэхэмжлэл { id, period, amount, paid, due_date, status } | null,
 *     debt:           өмнөх саруудаас төлөгдөөгүй үлдсэн дүн (₮),
 *     entrance_light: { units, paid } — орцны хэдэн айл энэ сард төлсөн,
 *     history:        [{ id, period, amount, method, paid_at }] — сүүлийн 12 төлбөр
 *   }
 * Оршин суугч өөрөө төлөх (POST) хэсэг QPay холбогдох үед нэмэгдэнэ
 */
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

    // Энэ сарынхаас бусад төлөгдөөгүй нэхэмжлэлийн үлдэгдэл
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
