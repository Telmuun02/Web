/**
 * Тайлан - /api/admin/reports
 * Хуудас: admin Reports (/admin/reports)
 *
 * show - сар бүрийн орлого, зарлага ангиллаар, нөөц сан, хэтэрсэн өр, хүсэлт ангиллаар, шийдэх дундаж хугацаа, орц бүрийн төлөлт
 *   GET /api/admin/reports?months=6
 *
 * (огноо: lib/time.js — Монголын цагаар)
 */

var { Invoices, Requests, Expenses } = require('../../db/models');
var time = require('../../lib/time');

async function show(req, res, next) {
  try {
    var count = Math.min(Math.max(parseInt(req.query.months, 10) || 6, 1), 24);
    var from = time.monthStart(count - 1);

    var [months, overdue, categories, avgHours, entrances, expenses, reserve] = await Promise.all([
      Invoices.monthlySummary(from),
      Invoices.overdueTotal(),
      Requests.countByCategory(from),
      Requests.avgResolveHours(from),
      Invoices.entranceSummary(from),
      Expenses.byCategory(from),
      Expenses.reserve(),
    ]);

    var billed = months.reduce(function (sum, m) { return sum + m.billed; }, 0);
    var collected = months.reduce(function (sum, m) { return sum + m.collected; }, 0);

    res.json({
      months: months,
      totals: { billed: billed, collected: collected, percent: billed ? Math.round((collected / billed) * 100) : 0 },
      overdue: overdue,
      categories: categories,
      avg_resolve_hours: avgHours,
      entrances: entrances,
      expenses: expenses,
      reserve: reserve,
    });
  } catch (err) {
    next(err);
  }
}

module.exports = { show };
