var { Invoices, Requests } = require('../../db/models');

// '2026-11-01' — n сарын өмнөх сарын 1-ний өдөр
function monthStart(monthsAgo) {
  var d = new Date();
  d.setDate(1);
  d.setMonth(d.getMonth() - monthsAgo);
  return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-01';
}

/**
 * show -- тайлан: санхүү ба хүсэлтийн тойм
 *   GET /api/admin/reports?months=6   (анхдагч 6, дээд тал нь 24)
 * Хариу: {
 *   months:     [{ period, billed, collected, units, paid_units }],  — сар бүрээр
 *   totals:     { billed, collected, percent },                       — тэр хугацааны нийт
 *   overdue:    { debt, units },                                      — одоогийн хугацаа хэтэрсэн өр
 *   categories: [{ category, count }],                                — хүсэлт ангиллаар
 *   avg_resolve_hours                                                 — хүсэлт шийдэх дундаж
 * }
 */
async function show(req, res, next) {
  try {
    var count = Math.min(Math.max(parseInt(req.query.months, 10) || 6, 1), 24);
    var from = monthStart(count - 1);

    var [months, overdue, categories, avgHours] = await Promise.all([
      Invoices.monthlySummary(from),
      Invoices.overdueTotal(),
      Requests.countByCategory(from),
      Requests.avgResolveHours(from),
    ]);

    var billed = months.reduce(function (sum, m) { return sum + m.billed; }, 0);
    var collected = months.reduce(function (sum, m) { return sum + m.collected; }, 0);

    res.json({
      months: months,
      totals: { billed: billed, collected: collected, percent: billed ? Math.round((collected / billed) * 100) : 0 },
      overdue: overdue,
      categories: categories,
      avg_resolve_hours: avgHours,
    });
  } catch (err) {
    next(err);
  }
}

module.exports = { show };
