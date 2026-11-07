var { Invoices, Payments, Requests, Polls, Units, Users } = require('../../db/models');

var methodLabel = { qpay: 'QPay', bank: 'Банк', cash: 'Бэлэн', card: 'Карт' };

// 1275000 → '1,275,000₮'
function money(n) {
  return Number(n || 0).toLocaleString('en-US') + '₮';
}

// ---------- Хуудас бүрийн "ШУУД" мөр — { stats: [3], events: [...] } ----------

async function invoices() {
  var [today, month, overdue, recent] = await Promise.all([
    Payments.todayTotal(),
    Invoices.monthProgress(),
    Invoices.overdueTotal(),
    Payments.recent(5),
  ]);

  return {
    stats: [
      { label: 'Өнөөдөр орсон', value: money(today) },
      { label: 'Сарын төлөлт', value: month.paid + '/' + month.total + ' тоот', tone: 'yellow' },
      {
        label: 'Хугацаа хэтэрсэн',
        value: overdue.units + ' тоот · ' + money(overdue.debt),
        tone: overdue.units ? 'yellow' : 'green',
      },
    ],
    events: recent.map(function (p) {
      return methodLabel[p.method] + ': ' + p.code + ' тоот ' + money(p.amount) + ' төлөв';
    }),
  };
}

var requestText = {
  open: 'Шинэ хүсэлт ирлээ',
  in_progress: 'Ажил эхэллээ',
  resolved: 'Шийдэгдлээ',
  rejected: 'Татгалзав',
};

async function requests() {
  var monthAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  var [avg, stages, doneToday, recent] = await Promise.all([
    Requests.avgResolveHours(monthAgo),
    Requests.stageCounts(),
    Requests.resolvedToday(),
    Requests.recent(5),
  ]);

  return {
    stats: [
      { label: 'Шийдэх дундаж', value: avg == null ? '—' : avg + ' цаг' },
      { label: 'Ажиллаж байна', value: stages.progress + ' хүсэлт', tone: 'green' },
      { label: 'Өнөөдөр шийдсэн', value: doneToday + ' хүсэлт', tone: 'yellow' },
    ],
    events: recent.map(function (r) {
      return requestText[r.status] + ': ' + (r.code || '—') + ' · ' + r.title;
    }),
  };
}

async function polls() {
  var [active, units] = await Promise.all([Polls.active(), Units.occupancy()]);
  var poll = active[0]; // хамгийн түрүүнд дуусах нь

  if (!poll) {
    return { stats: [{ label: 'Санал хураалт', value: 'Идэвхтэй алга' }], events: [] };
  }

  var [stats, recent] = await Promise.all([Polls.voteStats(poll.id), Polls.recentVotes(poll.id, 5)]);
  var percent = units.total ? Math.round((stats.votes / units.total) * 100) : 0;
  var need = Math.max(Math.ceil((units.total * poll.threshold_percent) / 100) - stats.votes, 0);

  return {
    stats: [
      { label: 'Шууд ирц', value: stats.votes + '/' + units.total + ' · ' + percent + '%', tone: 'yellow' },
      { label: 'Босго хүртэл', value: need ? need + ' тоот' : 'Хүрсэн', tone: need ? undefined : 'green' },
      { label: 'Сүүлийн 1 цагт', value: '+' + stats.lastHour + ' санал', tone: 'green' },
    ],
    events: recent.map(function (v) {
      return v.code + ' тоот санал өгөв';
    }),
  };
}

async function units() {
  var [occ, residents, recent] = await Promise.all([
    Units.occupancy(),
    Users.residentCount(),
    Users.recentResidents(5),
  ]);
  var empty = occ.total - occ.occupied;

  return {
    stats: [
      { label: 'Оршин суугчтай', value: occ.occupied + '/' + occ.total + ' тоот', tone: 'green' },
      { label: 'Хоосон тоот', value: empty + ' тоот', tone: empty ? 'yellow' : undefined },
      { label: 'Бүртгэлтэй', value: residents + ' хүн' },
    ],
    events: recent.map(function (u) {
      return u.name + ' ' + (u.code || '—') + ' тоотод бүртгэгдэв';
    }),
  };
}

// Хуудасны нэр → функц. Шинэ хуудас нэмэхэд энд нэг мөр нэмнэ
var pages = { invoices, requests, polls, units };

/**
 * show -- "ШУУД" мөр
 *   GET /api/admin/live/invoices → { stats: [{ label, value, tone }], events: ['...'] }
 */
async function show(req, res, next) {
  // hasOwn — '/live/constructor' гэх мэтээр Object-ийн өөрийн функцийг дуудуулахгүй
  if (!Object.hasOwn(pages, req.params.page)) {
    return res.status(404).json({ error: 'Ийм хуудас алга' });
  }
  try {
    res.json(await pages[req.params.page]());
  } catch (err) {
    next(err);
  }
}

module.exports = { show };
