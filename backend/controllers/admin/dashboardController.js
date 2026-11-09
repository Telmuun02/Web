var { Invoices, Payments, Requests, Polls, Units } = require('../../db/models');

// Шууд самбар — хуудас нээгдэхэд бүх өгөгдлийг нэг удаа өгнө (REST).
// Дараа нь WebSocket нэмэгдэхэд шинэ үйл явдлыг (төлбөр, хүсэлт) түлхэж өгөх ба
// эхний төлөв, дахин холбогдох үед энэ endpoint хэрэгтэй хэвээр үлдэнэ.
// Лифт, дулаан, камер, онлайн, ажилтны үйлдлийн өгөгдөл DB-д байхгүй — frontend sample-аа харуулна.

var methodLabel = { qpay: 'QPay', bank: 'Дансаар', cash: 'Бэлэн', card: 'Карт' };

// 2026-11-07 → '2026-11-01'
function toPeriod(date) {
  return date.getFullYear() + '-' + String(date.getMonth() + 1).padStart(2, '0') + '-01';
}

// n сарын өмнөх сарын 1-ний өдөр
function monthStart(monthsAgo) {
  var d = new Date();
  d.setDate(1);
  d.setMonth(d.getMonth() - monthsAgo);
  return toPeriod(d);
}

// ---------- Самбарын хэсэг бүр ----------

// "Сарын төлөлт" карт
async function month() {
  var [row] = await Invoices.monthlySummary(toPeriod(new Date()));
  row = row || { units: 0, paid_units: 0, collected: 0, billed: 0 };
  return { paidUnits: row.paid_units, units: row.units, collected: row.collected, billed: row.billed };
}

// Сүүлийн 6 цагийн орлого — орлогогүй цаг 0, сүүлийнх нь "одоо"
async function hours() {
  var rows = await Payments.hourly(6);
  var current = new Date().getHours();
  var list = [];
  for (var i = 5; i >= 0; i--) {
    var hour = (current - i + 24) % 24;
    var row = rows.find(function (r) { return r.hour === hour; });
    list.push({ label: i === 0 ? 'одоо' : String(hour).padStart(2, '0'), amount: row ? row.amount : 0 });
  }
  return list;
}

// Төлбөрийн урсгал — сүүлийн 5 төлбөр
async function payments() {
  var rows = await Payments.recent(5);
  return rows.map(function (p) {
    return {
      id: p.id,
      unit: p.code,
      name: p.name || '—',
      amount: p.amount,
      via: methodLabel[p.method],
      paidAt: p.paid_at,
    };
  });
}

// Шинэ хүсэлт — шийдээгүй сүүлийн 5. Засварчин томилоогүй бол "хариугүй" (seen: false)
async function requests() {
  var rows = await Requests.list({ stage: 'open', limit: 5 });
  return rows.map(function (r) {
    return {
      id: r.id,
      unit: r.unit_code || '—',
      title: r.title,
      category: r.category,
      urgent: false, // DB-д яаралтай гэсэн талбар одоохондоо алга
      seen: r.stage !== 'new',
      createdAt: r.created_at,
    };
  });
}

// Идэвхтэй санал хураалт — хамгийн түрүүнд дуусах нь, байхгүй бол null
async function poll() {
  var [active, units] = await Promise.all([Polls.active(), Units.occupancy()]);
  if (!active[0]) return null;

  var stats = await Polls.voteStats(active[0].id);
  return {
    title: active[0].title,
    voted: stats.votes,
    units: units.total,
    threshold: active[0].threshold_percent,
  };
}

// Сүүлийн 12 сарын орлого — нэхэмжлэлгүй сар 0
async function months() {
  var rows = await Invoices.monthlySummary(monthStart(11));
  var list = [];
  for (var m = 11; m >= 0; m--) {
    var period = monthStart(m);
    var row = rows.find(function (r) { return r.period === period; });
    list.push({ period: period, billed: row ? row.billed : 0, collected: row ? row.collected : 0 });
  }
  return list;
}

// ---------- Endpoint-ууд ----------

/**
 * show -- самбарын бүх өгөгдөл нэг дор
 *   GET /api/admin/dashboard →
 *   { today, month, openRequests, hours, payments, requests, poll, months, debtors }
 * Түлхүүрүүд frontend-ийн samples/admin/dashboard.js-тэй ижил — sample-ийг шууд сольж болно
 */
async function show(req, res, next) {
  try {
    var [today, monthStats, openRequests, hourList, paymentList, requestList, pollStats, monthList, debtors] =
      await Promise.all([
        Payments.todayTotal(),
        month(),
        Requests.openCount(),
        hours(),
        payments(),
        requests(),
        poll(),
        months(),
        Invoices.debtors(6),
      ]);

    res.json({
      today: today,
      month: monthStats,
      openRequests: openRequests,
      hours: hourList,
      payments: paymentList,
      requests: requestList,
      poll: pollStats,
      months: monthList,
      debtors: debtors,
    });
  } catch (err) {
    next(err);
  }
}

/**
 * topDebtors -- өр ихтэй тоотууд (Invoices хуудасны "Өр ихтэй" таб)
 *   GET /api/admin/dashboard/debtors?limit=1000
 */
async function topDebtors(req, res, next) {
  try {
    res.json(await Invoices.debtors(Number(req.query.limit) || 6));
  } catch (err) {
    next(err);
  }
}

module.exports = { show, topDebtors };
