/**
 * Ажилтны чатботын функцүүд — Claude function calling-оор дуудна. БҮГД ЗӨВХӨН УНШИНА (өөрчлөх функц алга)
 * Хэн дууддаг: services/adminChatService.js (POST /api/admin/chat — зөвхөн ажилтан, requireRole('admin'))
 * Оршин суугчийн chatTools.js-ээс ялгаа: бүх тоот, оршин суугч, санхүү, ажилтныг харна
 *
 * Функц бүр: (input) → энгийн JSON объект. Токен хэмнэхийн тулд хэрэгтэй талбаруудыг л буцааж,
 * жагсаалтыг limit-ээр (хамгийн ихдээ MAX_LIMIT), урт текстийг cut-ээр богиносгоно
 *
 * getOverview() - СӨХ-ийн ерөнхий байдал: энэ сарын төлөлт, хэтэрсэн өр, хүсэлт, нөөц сан, тоот
 * getFinance(input) - сар бүрийн нэхэмжилсэн/цугларсан/зарлага { months? }
 * getDebtors(input) - хугацаа хэтэрсэн өртэй тоотууд, өр ихээс нь { limit?, entrance? }
 * findUnit(input) - нэг тоотын бүх мэдээлэл: оршин суугчид, нэхэмжлэл, төлбөр, хүсэлт { code }
 * searchResidents(input) - оршин суугч хайх: нэр, утас, имэйлээр { query }
 * getPayments(input) - хугацааны төлбөр: нийт дүн, аргаар, сүүлийнхүүд { from?, to?, method?, limit? }
 * getRequests(input) - засварын хүсэлтүүд: төлвөөр, ангиллаар, дундаж шийдэх хугацаа { stage?, category?, limit? }
 * getExpenses(input) - зарлага ангиллаар, нөөц сан { months? }
 * getEntrances() - орц бүрийн тоот, оршин суугч, энэ сарын төлөлт, ахлагч, менежер
 * getPolls() - бүх санал хураалт, идэвхтэйн дүн
 * getStaff() - ажилтнууд ба сүүлийн үйлдлүүд
 * getAnnouncements(input) - сүүлийн зарлалууд { limit? }
 * getMeeting() - дараагийн хурал, хэлэлцэх асуудал
 * run(name, input) - Claude-ийн хүссэн функцийг нэрээр нь ажиллуулна
 * TOOLS - Claude-д өгөх функцүүдийн тайлбар (name, description, input_schema)
 *
 * limitOf(input, fallback) - (дотоод) limit-ийг 1..MAX_LIMIT хооронд барина
 * monthsOf(input, fallback) - (дотоод) months-ийг 1..24 хооронд барина
 * tool(name, description, properties, required) - (дотоод) TOOLS-ийн нэг мөр
 * cut(text, max) - (дотоод) урт текстийг таслана
 * isDate(text) - (дотоод) 'YYYY-MM-DD' эсэх
 */

var db = require('../db');
var { Invoices, Payments, Requests, Polls, Units, Users, Announcements, Admins, Meetings, Expenses, Entrances } = require('../db/models');
var time = require('../lib/time');

var MAX_LIMIT = 50;

function limitOf(input, fallback) {
  var n = Number(input && input.limit);
  return n >= 1 ? Math.min(Math.floor(n), MAX_LIMIT) : fallback;
}

function cut(text, max) {
  if (!text) return '';
  return text.length > max ? text.slice(0, max) + '…' : text;
}

function isDate(text) {
  return typeof text === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(text);
}

function monthsOf(input, fallback) {
  var n = Number(input && input.months);
  return n >= 1 ? Math.min(Math.floor(n), 24) : fallback;
}

async function getOverview() {
  var [month, overdue, today, stages, occupancy, residents, reserve, polls] = await Promise.all([
    Invoices.monthlySummary(time.monthStart(0)),
    Invoices.overdueTotal(),
    Payments.todayTotal(),
    Requests.stageCounts(),
    Units.occupancy(),
    Users.residentCount(),
    Expenses.reserve(),
    Polls.active(),
  ]);
  var m = month[0] || { billed: 0, collected: 0, units: 0, paid_units: 0 };
  return {
    today: time.ymd(),
    this_month: { period: time.monthStart(0), billed: m.billed, collected: m.collected, invoices: m.units, fully_paid: m.paid_units },
    overdue: { debt: overdue.debt, units: overdue.units },
    payments_today: today,
    requests: stages,
    units: { total: occupancy.total, occupied: occupancy.occupied, residents: residents },
    reserve_fund: reserve,
    active_polls: polls.map(function (p) { return { id: p.id, title: p.title, ends_at: p.ends_at }; }),
  };
}

async function getFinance(input) {
  var from = time.monthStart(monthsOf(input, 6) - 1);
  var [months, expenses] = await Promise.all([Invoices.monthlySummary(from), Expenses.byCategory(from)]);
  var spent = {};
  expenses.forEach(function (e) {
    spent[e.period] = (spent[e.period] || 0) + e.amount;
  });
  return months.map(function (m) {
    return {
      period: m.period,
      billed: m.billed,
      collected: m.collected,
      collection_rate: m.billed ? Math.round((m.collected / m.billed) * 100) + '%' : '0%',
      fully_paid_units: m.paid_units + '/' + m.units,
      expenses: spent[m.period] || 0,
    };
  });
}

async function getDebtors(input) {
  var entrance = Number(input && input.entrance) || null;
  var rows = await Invoices.debtors(entrance ? MAX_LIMIT * 4 : limitOf(input, 10));
  if (entrance) rows = rows.filter(function (r) { return r.entrance === entrance; });
  return rows.slice(0, limitOf(input, 10)).map(function (r) {
    return { unit: r.code, entrance: r.entrance, floor: r.floor, resident: r.name, debt: r.debt, months: r.months };
  });
}

async function findUnit(input) {
  var code = String((input && input.code) || '').trim();
  if (!code) return { error: 'Тоотын код хэрэгтэй, жишээ нь 1-01' };

  var unit = await db('units as u').join('entrances as e', 'e.id', 'u.entrance_id')
    .select('u.id', 'u.code', 'u.floor', 'u.area_m2', 'e.number as entrance').where('u.code', code).first();
  if (!unit) return { error: code + ' тоот олдсонгүй' };

  var [full, invoices, payments, requests, onTime] = await Promise.all([
    Units.withResidents(unit.id),
    Invoices.forUnit(unit.id),
    Payments.forUnit(unit.id, 6),
    db('requests').select('id', 'category', 'title', 'status', 'created_at').where('unit_id', unit.id).orderBy('created_at', 'desc').limit(5),
    Invoices.onTimeCount(unit.id),
  ]);

  var unpaid = invoices.filter(function (i) { return i.status !== 'paid'; });
  return {
    unit: { code: unit.code, entrance: unit.entrance, floor: unit.floor, area_m2: unit.area_m2 },
    residents: (full.residents || []).map(function (r) { return { name: r.name, phone: r.phone, email: r.email }; }),
    debt: unpaid.reduce(function (s, i) { return s + i.amount - Number(i.paid || 0); }, 0),
    unpaid_invoices: unpaid.map(function (i) { return { period: i.period, amount: i.amount, paid: Number(i.paid || 0), due: i.due_date }; }),
    on_time_months_last_year: onTime,
    recent_payments: payments.map(function (p) { return { period: p.period, amount: p.amount, method: p.method, paid_at: time.ymd(new Date(p.paid_at)) }; }),
    recent_requests: requests.map(function (r) { return { title: r.title, category: r.category, status: r.status, created: time.ymd(new Date(r.created_at)) }; }),
  };
}

async function searchResidents(input) {
  var query = String((input && input.query) || '').trim();
  if (query.length < 2) return { error: 'Хайх үг 2-оос дээш тэмдэгттэй байна' };
  var like = '%' + query + '%';
  var rows = await db('users as s')
    .leftJoin('units as u', 'u.id', 's.unit_id')
    .select('s.name', 's.phone', 's.email', 'u.code as unit')
    .where(function () {
      this.where('s.name', 'like', like).orWhere('s.phone', 'like', like).orWhere('s.email', 'like', like);
    })
    .orderBy('s.name')
    .limit(20);
  return { count: rows.length, residents: rows };
}

async function getPayments(input) {
  var from = isDate(input && input.from) ? input.from : time.monthStart(0);
  var to = isDate(input && input.to) ? input.to : time.ymd();
  var method = input && ['cash', 'bank', 'qpay', 'card'].includes(input.method) ? input.method : null;

  function scope(q) {
    q.where('p.paid_at', '>=', from).where('p.paid_at', '<', db.raw("date(?, '+1 day')", [to]));
    if (method) q.where('p.method', method);
    return q;
  }

  var [byMethod, recent] = await Promise.all([
    scope(db('payments as p')).select('p.method').sum({ amount: 'p.amount' }).count({ count: '*' }).groupBy('p.method'),
    scope(db('payments as p'))
      .join('invoices as i', 'i.id', 'p.invoice_id')
      .join('units as u', 'u.id', 'i.unit_id')
      .leftJoin('admins as a', 'a.id', 'p.recorded_by')
      .select('u.code as unit', 'p.amount', 'p.method', 'p.paid_at', 'a.name as recorded_by')
      .orderBy('p.paid_at', 'desc')
      .limit(limitOf(input, 10)),
  ]);

  var total = byMethod.reduce(function (s, r) { return s + Number(r.amount); }, 0);
  var count = byMethod.reduce(function (s, r) { return s + Number(r.count); }, 0);
  return {
    from: from,
    to: to,
    total: total,
    count: count,
    by_method: byMethod.map(function (r) { return { method: r.method, amount: Number(r.amount), count: Number(r.count) }; }),
    recent: recent.map(function (p) {
      return { unit: p.unit, amount: p.amount, method: p.method, paid_at: time.toDb(new Date(p.paid_at)).slice(0, 16), recorded_by: p.recorded_by || 'онлайн' };
    }),
  };
}

async function getRequests(input) {
  var stage = input && ['open', 'new', 'assigned', 'progress', 'done'].includes(input.stage) ? input.stage : 'open';
  var category = input && ['plumbing', 'electrical', 'cleaning', 'elevator', 'other'].includes(input.category) ? input.category : null;
  var monthAgo = new Date(Date.now() - 30 * 24 * 3600 * 1000);

  var [rows, stages, categories, hours] = await Promise.all([
    Requests.list({ stage: stage, limit: category ? MAX_LIMIT * 4 : limitOf(input, 15) }),
    Requests.stageCounts(),
    Requests.countByCategory(monthAgo),
    Requests.avgResolveHours(monthAgo),
  ]);
  if (category) rows = rows.filter(function (r) { return r.category === category; });

  return {
    counts: stages,
    last_30_days: { by_category: categories, avg_resolve_hours: hours },
    list: rows.slice(0, limitOf(input, 15)).map(function (r) {
      return {
        id: r.id,
        unit: r.unit_code,
        title: cut(r.title, 80),
        category: r.category,
        stage: r.stage,
        assigned: r.assigned_name || null,
        created: time.ymd(new Date(r.created_at)),
      };
    }),
  };
}

async function getExpenses(input) {
  var from = time.monthStart(monthsOf(input, 3) - 1);
  var [rows, reserve] = await Promise.all([Expenses.byCategory(from), Expenses.reserve()]);
  return { from: from, by_month_category: rows, reserve_fund: reserve };
}

async function getEntrances() {
  var [entrances, month, residents] = await Promise.all([
    Entrances.list(),
    Invoices.entranceSummary(time.monthStart(0)),
    db('users as s').join('units as u', 'u.id', 's.unit_id').select('u.entrance_id').count({ n: '*' }).groupBy('u.entrance_id'),
  ]);
  return entrances.map(function (e) {
    var m = month.find(function (x) { return x.entrance === e.number; }) || { units: 0, paid_units: 0 };
    var r = residents.find(function (x) { return x.entrance_id === e.id; });
    return {
      entrance: e.number,
      floors: e.floors,
      units: e.units,
      residents: r ? Number(r.n) : 0,
      this_month_paid: m.paid_units + '/' + m.units,
      leader: e.leader_name || null,
      manager: e.manager_name || null,
      has_elevator: Boolean(e.has_elevator),
    };
  });
}

async function getPolls() {
  var list = await Polls.list();
  var active = list.filter(function (p) { return p.status === 'active'; });
  var results = await Promise.all(active.map(function (p) { return Polls.results(p.id); }));
  return list.map(function (p) {
    var r = results.find(function (x) { return x && x.id === p.id; });
    return {
      id: p.id,
      title: cut(p.title, 100),
      status: p.status,
      turnout: p.turnout_percent + '% (' + p.votes + '/' + p.total_units + ')',
      threshold: p.threshold_percent + '%',
      ends_at: time.ymd(new Date(p.ends_at)),
      options: r ? r.options.map(function (o) { return o.label + ': ' + o.votes; }) : undefined,
    };
  });
}

async function getStaff() {
  var [staff, actions] = await Promise.all([Admins.list(), Admins.recentActions(10)]);
  return {
    staff: staff.map(function (a) { return { name: a.name, position: a.position, phone: a.phone, email: a.email }; }),
    recent_actions: actions.map(function (a) {
      return { who: a.name, type: a.type, what: a.title || (a.code + ' тоот ' + a.amount + '₮'), at: time.ymd(new Date(a.at)) };
    }),
  };
}

async function getAnnouncements(input) {
  var rows = await Announcements.list(limitOf(input, 5));
  return rows.map(function (a) {
    return { title: a.title, body: cut(a.body, 200), audience: a.audience, important: Boolean(a.important), created: time.ymd(new Date(a.created_at)) };
  });
}

async function getMeeting() {
  var m = await Meetings.next();
  if (!m) return { meeting: null };
  return {
    title: m.title,
    starts_at: time.toDb(new Date(m.starts_at)).slice(0, 16),
    location: m.location,
    online: m.online,
    agenda: m.agenda.map(function (a) { return a.position + '. ' + a.title + (a.poll_title ? ' (санал хураалт: ' + a.poll_title + ')' : ''); }),
  };
}

var HANDLERS = {
  get_overview: getOverview,
  get_finance: getFinance,
  get_debtors: getDebtors,
  find_unit: findUnit,
  search_residents: searchResidents,
  get_payments: getPayments,
  get_requests: getRequests,
  get_expenses: getExpenses,
  get_entrances: getEntrances,
  get_polls: getPolls,
  get_staff: getStaff,
  get_announcements: getAnnouncements,
  get_meeting: getMeeting,
};

async function run(name, input) {
  var handler = HANDLERS[name];
  if (!handler) throw new Error('Үл мэдэх функц: ' + name);
  return handler(input || {});
}

function tool(name, description, properties, required) {
  return {
    name: name,
    description: description,
    input_schema: { type: 'object', properties: properties || {}, required: required || [], additionalProperties: false },
  };
}

var limit = { type: 'integer', description: 'Хэдэн мөр (1-50)' };
var months = { type: 'integer', description: 'Сүүлийн хэдэн сар (1-24)' };

var TOOLS = [
  tool('get_overview', 'СӨХ-ийн ерөнхий байдал нэг дор: энэ сарын нэхэмжилсэн/цугларсан, хэтэрсэн өр, өнөөдрийн төлбөр, хүсэлтийн тоо төлвөөр, тоот/оршин суугчийн тоо, нөөц сан, идэвхтэй санал хураалт. Ерөнхий асуултад эхэлж үүнийг дууд.'),
  tool('get_finance', 'Сар бүрийн санхүү: нэхэмжилсэн, цугларсан, цуглуулалтын хувь, бүрэн төлсөн тоот, зарлага. Сар хооронд харьцуулах, чиг хандлага асуухад.', { months: months }),
  tool('get_debtors', 'Хугацаа хэтэрсэн өртэй тоотууд өр ихээс нь: тоот, орц, оршин суугч, өрийн дүн, хэдэн сарын өр.', { limit: limit, entrance: { type: 'integer', description: 'Зөвхөн энэ орц' } }),
  tool('find_unit', 'Нэг тоотын бүх мэдээлэл: оршин суугчид (утас, имэйл), өр, төлөөгүй нэхэмжлэл, сүүлийн төлбөр, хүсэлтүүд. Тоотын кодоор.', { code: { type: 'string', description: 'Тоотын код, жишээ нь 1-01, 3-115' } }, ['code']),
  tool('search_residents', 'Оршин суугчийг нэр, утас, имэйлийн хэсгээр хайна — аль тоотод амьдардгийг олно.', { query: { type: 'string', description: 'Нэр, утас эсвэл имэйлийн хэсэг' } }, ['query']),
  tool('get_payments', 'Тодорхой хугацааны төлбөр: нийт дүн, тоо, арга бүрээр (cash/bank/qpay/card), сүүлийн төлбөрүүд хэн бүртгэсэнтэй. Анхдагч нь энэ сарын 1-нээс өнөөдөр хүртэл.', {
    from: { type: 'string', description: 'Эхлэх огноо YYYY-MM-DD' },
    to: { type: 'string', description: 'Дуусах огноо YYYY-MM-DD (орно)' },
    method: { type: 'string', enum: ['cash', 'bank', 'qpay', 'card'] },
    limit: limit,
  }),
  tool('get_requests', 'Засварын хүсэлтүүд: тоо төлвөөр, сүүлийн 30 хоногийн ангилал, дундаж шийдэх цаг, жагсаалт (тоот, хариуцагч).', {
    stage: { type: 'string', enum: ['open', 'new', 'assigned', 'progress', 'done'], description: 'open = шийдээгүй бүгд (анхдагч), new = хариуцагчгүй, assigned = хариуцагчтай, progress = хийгдэж буй, done = дууссан' },
    category: { type: 'string', enum: ['plumbing', 'electrical', 'cleaning', 'elevator', 'other'] },
    limit: limit,
  }),
  tool('get_expenses', 'Зарлага сар, ангиллаар (цалин, дулаан, лифт, цэвэрлэгээ, цахилгаан, засвар) ба нөөц сан (нийт цугласан - нийт зарлага).', { months: months }),
  tool('get_entrances', 'Орц бүрийн мэдээлэл: давхар, тоот, оршин суугчийн тоо, энэ сарын төлөлт, ахлагч, менежер, лифт. Орц хооронд харьцуулахад.'),
  tool('get_polls', 'Бүх санал хураалт: төлөв, ирц, босго, идэвхтэйн сонголт бүрийн санал.'),
  tool('get_staff', 'Ажилтнууд (албан тушаал, утас) ба тэдний сүүлийн үйлдлүүд (төлбөр бүртгэсэн, зарлал, санал хураалт).'),
  tool('get_announcements', 'Сүүлийн зарлалууд.', { limit: limit }),
  tool('get_meeting', 'Дараагийн хурал ба хэлэлцэх асуудал.'),
];

module.exports = { TOOLS, run };
