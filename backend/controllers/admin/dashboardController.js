/**
 * Самбар - /api/admin/dashboard
 * Хуудас: admin Dashboard (/admin) — canvas "Удирдлагын самбар — ажилтан (шууд)", Invoices-ийн "Өр ихтэй" таб
 *
 * show - самбарын бүх өгөгдөл нэг дор
 *   GET /api/admin/dashboard
 * topDebtors - өр ихтэй тоотууд (q: тоот эсвэл оршин суугчийн нэрээр хайх)
 *   GET /api/admin/dashboard/debtors?limit=&q=
 *
 * Дотоод туслах (show дуудна):
 *   (огноо: lib/time.js — Монголын цагаар)
 *   month - энэ сарын төлөлт: төлсөн тоот, нэхэмжилсэн, цугласан
 *   building - байрны "гэрэл": орц бүрийн тоот бүр энэ сард төлсөн эсэх (дээд давхраас доош)
 *   payments - сүүлийн 6 төлбөр
 *   requests - шийдээгүй хүсэлтүүд: хариугүй (хариуцагчгүй) нь эхэндээ, хүлээж авсан ажилтны нэртэй
 *   poll - идэвхтэй санал хураалт: ирц, босго, дуусах огноо
 */

var { Invoices, Payments, Requests, Polls, Units, Entrances } = require('../../db/models');
var time = require('../../lib/time');

var methodLabel = { qpay: 'QPay', bank: 'Дансаар', cash: 'Бэлэн', card: 'Карт' };

async function month() {
  var [row] = await Invoices.monthlySummary(time.monthStart(0));
  row = row || { units: 0, paid_units: 0, collected: 0, billed: 0 };
  return { paidUnits: row.paid_units, units: row.units, collected: row.collected, billed: row.billed };
}

async function building() {
  var entrances = await Entrances.list();
  return Promise.all(entrances.map(async function (e) {
    var units = await Invoices.entranceMonth(e.id);
    return {
      number: e.number,
      units: units.map(function (u) { return { code: u.code, paid: u.paid }; }),
    };
  }));
}

async function payments() {
  var rows = await Payments.recent(6);
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
  var rows = await Requests.list({ stage: 'open', limit: 8 });
  return rows
    .map(function (r) {
      return {
        id: r.id,
        unit: r.unit_code || '—',
        title: r.title,
        category: r.category,
        seen: r.stage !== 'new',
        who: r.assigned_name || null,
        createdAt: r.created_at,
      };
    })
    .sort(function (a, b) { return Number(a.seen) - Number(b.seen); })
    .slice(0, 5);
}

async function poll() {
  var [active, units] = await Promise.all([Polls.active(), Units.occupancy()]);
  if (!active[0]) return null;

  var stats = await Polls.voteStats(active[0].id);
  return {
    id: active[0].id,
    title: active[0].title,
    voted: stats.votes,
    units: units.total,
    threshold: active[0].threshold_percent,
    endsAt: active[0].ends_at,
  };
}

async function show(req, res, next) {
  try {
    var [today, monthStats, openRequests, buildingList, paymentList, requestList, pollStats, debtors] =
      await Promise.all([
        Payments.todayTotal(),
        month(),
        Requests.openCount(),
        building(),
        payments(),
        requests(),
        poll(),
        Invoices.debtors(5),
      ]);

    res.json({
      today: today,
      month: monthStats,
      openRequests: openRequests,
      building: buildingList,
      payments: paymentList,
      requests: requestList,
      poll: pollStats,
      debtors: debtors,
    });
  } catch (err) {
    next(err);
  }
}

async function topDebtors(req, res, next) {
  try {
    var q = String(req.query.q || '').trim();
    res.json(await Invoices.debtors(Number(req.query.limit) || 6, null, q));
  } catch (err) {
    next(err);
  }
}

module.exports = { show, topDebtors };
