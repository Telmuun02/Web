/**
 * "ШУУД" мөр - /api/admin/live/:page
 * Хуудас: admin Invoices, Requests, Polls, Units, Announcements, Reports, Settings, Profile (дээд талын статистик, үйл явдал)
 *
 * show - тухайн хуудасны { stats, events }
 *   GET /api/admin/live/invoices | requests | polls | units | announcements | reports | settings | profile
 *
 * Дотоод туслах:
 *   money(n) - 1275000 → '1,275,000₮'
 *   invoices, requests, polls, units - хуудас бүрийн өгөгдөл
 *   announcements - энэ сарын зарлал, чухал, SMS-тэйн тоо, сүүлийн зарлалууд
 *   reports - өнөөдрийн орлого, сарын цуглуулалт, хэтэрсэн өр, сүүлийн орлогууд
 *   settings - ажилтан, тоот, энэ сарын нэхэмжлэлийн тоо, ажилтнуудын жагсаалт
 *   profile(req) - нэвтэрсэн ажилтны өнөөдөр бүртгэсэн төлбөр, сүүлд бүртгэсэн төлбөрүүд
 */

var { Invoices, Payments, Requests, Polls, Units, Users, Announcements, Admins } = require('../../db/models');

var methodLabel = { qpay: 'QPay', bank: 'Банк', cash: 'Бэлэн', card: 'Карт' };

function money(n) {
  return Number(n || 0).toLocaleString('en-US') + '₮';
}

async function invoices() {
  var [today, month, overdue, recent] = await Promise.all([
    Payments.todayTotal(),
    Invoices.monthProgress(),
    Invoices.overdueTotal(),
    Payments.recent(5),
  ]);

  return {
    stats: [
      { label: 'Өнөөдөр орсон', value: money(today.amount) },
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
  var poll = active[0];

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

var positionLabel = { chairman: 'Дарга', accountant: 'Нягтлан', technician: 'Засварчин', staff: 'Ажилтан' };

async function announcements() {
  var list = await Announcements.list(50);
  var monthStart = new Date();
  monthStart.setDate(1);
  monthStart.setHours(0, 0, 0, 0);
  var thisMonth = list.filter(function (a) { return new Date(a.created_at) >= monthStart; });

  return {
    stats: [
      { label: 'Энэ сард', value: thisMonth.length + ' зарлал' },
      { label: 'Чухал', value: thisMonth.filter(function (a) { return a.important; }).length + ' зарлал', tone: 'yellow' },
      { label: 'SMS-ээр', value: thisMonth.filter(function (a) { return a.sms; }).length + ' зарлал', tone: 'green' },
    ],
    events: list.slice(0, 5).map(function (a) {
      return (a.created_by_name || 'СӨХ') + ' «' + a.title + '» зарлал нийтлэв';
    }),
  };
}

async function reports() {
  var [today, month, overdue, recent] = await Promise.all([
    Payments.todayTotal(),
    Invoices.monthProgress(),
    Invoices.overdueTotal(),
    Payments.recent(5),
  ]);
  var percent = month.total ? Math.round((month.paid / month.total) * 100) : 0;

  return {
    stats: [
      { label: 'Өнөөдрийн орлого', value: money(today.amount), tone: 'green' },
      { label: 'Сарын цуглуулалт', value: percent + '%' },
      { label: 'Хэтэрсэн өр', value: money(overdue.debt), tone: overdue.debt ? 'yellow' : undefined },
    ],
    events: recent.map(function (p) {
      return 'Орлого: ' + p.code + ' тоот +' + money(p.amount);
    }),
  };
}

async function settings() {
  var [staff, occ, month] = await Promise.all([Admins.list(), Units.occupancy(), Invoices.monthProgress()]);

  return {
    stats: [
      { label: 'Ажилтан', value: staff.length + ' хүн', tone: 'green' },
      { label: 'Тоот', value: occ.total + ' тоот' },
      { label: 'Энэ сарын нэхэмжлэл', value: month.total + ' ширхэг', tone: 'yellow' },
    ],
    events: staff.map(function (a) {
      return (positionLabel[a.position] || 'Ажилтан') + ': ' + a.name;
    }),
  };
}

async function profile(req) {
  var [mine, staff] = await Promise.all([Payments.recordedBy(req.user.id, 5), Admins.list()]);

  return {
    stats: [
      { label: 'Өнөөдөр бүртгэсэн', value: mine.today + ' төлбөр', tone: 'yellow' },
      { label: 'Идэвхтэй ажилтан', value: staff.length + ' хүн', tone: 'green' },
      { label: 'Сүүлд бүртгэсэн', value: mine.recent[0] ? new Date(mine.recent[0].paid_at).toLocaleDateString('en-CA') : '—' },
    ],
    events: mine.recent.map(function (p) {
      return 'Таны бүртгэсэн төлбөр: ' + p.code + ' тоот ' + money(p.amount);
    }),
  };
}

var pages = { invoices, requests, polls, units, announcements, reports, settings, profile };

async function show(req, res, next) {
  if (!Object.hasOwn(pages, req.params.page)) {
    return res.status(404).json({ error: 'Ийм хуудас алга' });
  }
  try {
    res.json(await pages[req.params.page](req));
  } catch (err) {
    next(err);
  }
}

module.exports = { show };
