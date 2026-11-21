/**
 * Самбар - /api/admin/dashboard
 * Хуудас: admin Dashboard (/admin), Invoices-ийн "Өр ихтэй" таб
 *
 * show - самбарын бүх өгөгдөл нэг дор
 *   GET /api/admin/dashboard
 * topDebtors - өр ихтэй тоотууд
 *   GET /api/admin/dashboard/debtors?limit=
 *
 * Дотоод туслах (show дуудна):
 *   (огноо: lib/time.js — Монголын цагаар)
 *   month - "Сарын төлөлт" карт
 *   hours - сүүлийн 6 цагийн орлого
 *   payments - сүүлийн 5 төлбөр
 *   requests - шийдээгүй сүүлийн 5 хүсэлт
 *   poll - идэвхтэй санал хураалт
 *   months - сүүлийн 12 сарын орлого
 *   staffLog - ажилтнуудын сүүлийн 4 үйлдэл ("Ажилтны үйлдэл" карт)
 */

var { Invoices, Payments, Requests, Polls, Units, Admins } = require('../../db/models');
var activity = require('./activityController');
var time = require('../../lib/time');

var methodLabel = { qpay: 'QPay', bank: 'Дансаар', cash: 'Бэлэн', card: 'Карт' };

async function month() {
  var [row] = await Invoices.monthlySummary(time.monthStart(0));
  row = row || { units: 0, paid_units: 0, collected: 0, billed: 0 };
  return { paidUnits: row.paid_units, units: row.units, collected: row.collected, billed: row.billed };
}

async function hours() {
  var rows = await Payments.hourly(6);
  var current = time.hour();
  var list = [];
  for (var i = 5; i >= 0; i--) {
    var hour = (current - i + 24) % 24;
    var row = rows.find(function (r) { return r.hour === hour; });
    list.push({ label: i === 0 ? 'одоо' : String(hour).padStart(2, '0'), amount: row ? row.amount : 0 });
  }
  return list;
}

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

async function requests() {
  var rows = await Requests.list({ stage: 'open', limit: 5 });
  return rows.map(function (r) {
    return {
      id: r.id,
      unit: r.unit_code || '—',
      title: r.title,
      category: r.category,
      urgent: false,
      seen: r.stage !== 'new',
      createdAt: r.created_at,
    };
  });
}

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

async function months() {
  var rows = await Invoices.monthlySummary(time.monthStart(11));
  var list = [];
  for (var m = 11; m >= 0; m--) {
    var period = time.monthStart(m);
    var row = rows.find(function (r) { return r.period === period; });
    list.push({ period: period, billed: row ? row.billed : 0, collected: row ? row.collected : 0 });
  }
  return list;
}

async function staffLog() {
  var rows = await Admins.recentActions(4);
  return rows.map(activity.describe);
}

async function show(req, res, next) {
  try {
    var [today, monthStats, openRequests, hourList, paymentList, requestList, pollStats, monthList, debtors, log] =
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
        staffLog(),
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
      log: log,
    });
  } catch (err) {
    next(err);
  }
}

async function topDebtors(req, res, next) {
  try {
    res.json(await Invoices.debtors(Number(req.query.limit) || 6));
  } catch (err) {
    next(err);
  }
}

module.exports = { show, topDebtors };
