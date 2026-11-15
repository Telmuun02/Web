var { Invoices, Payments, Requests, Announcements, Polls } = require('../db/models');

// Чатботын туслах функцүүд — Claude function calling-оор дуудна.
// Функц бүр: (me, input) → энгийн JSON объект.
//   me    — currentResident(req)-ийн үр дүн { user, unit }. ҮРГЭЛЖ token-оос олсон хэрэглэгч —
//           Claude-аас ирсэн id-д итгэхгүй, тиймээс input-д user_id, unit_id байхгүй
//   input — Claude-ийн өгсөн параметрүүд (limit гэх мэт)
// Токен хэмнэхийн тулд зөвхөн хэрэгтэй талбаруудыг буцааж, урт текстийг таслана

var MAX_LIMIT = 10;

// Date | string → '2026-11-15'
function day(d) {
  return d ? new Date(d).toISOString().slice(0, 10) : null;
}

// Claude-ийн өгсөн limit-ийг 1..MAX_LIMIT хооронд барина
function limitOf(input, fallback) {
  var n = Number(input && input.limit);
  return n >= 1 ? Math.min(Math.floor(n), MAX_LIMIT) : fallback;
}

// Урт текстийг таслана
function cut(text, max) {
  if (!text) return '';
  return text.length > max ? text.slice(0, max) + '…' : text;
}

var BILL_STATUS = { unpaid: 'төлөөгүй', partial: 'хэсэгчлэн төлсөн', paid: 'төлсөн' };
var REQUEST_STAGE = { new: 'шинэ', assigned: 'засварчин томилсон', progress: 'хийгдэж байна', done: 'шийдэгдсэн' };
var PAY_METHOD = { cash: 'бэлэн', bank: 'дансаар', card: 'карт' };

/**
 * getMyBill -- Энэ сарын нэхэмжлэл + өмнөх саруудын өр
 *   → { current: { period, amount, paid, left, due_date, status } | null, debt }
 */
async function getMyBill(me) {
  var [current, invoices] = await Promise.all([
    Invoices.currentForUnit(me.unit.id),
    Invoices.forUnit(me.unit.id),
  ]);

  var debt = invoices
    .filter(function (i) { return i.status !== 'paid' && (!current || i.id !== current.id); })
    .reduce(function (sum, i) { return sum + i.amount - Number(i.paid); }, 0);

  return {
    current: current && {
      period: current.period,
      amount: current.amount,
      paid: current.paid,
      left: current.amount - current.paid,
      due_date: day(current.due_date),
      status: BILL_STATUS[current.status] || current.status,
    },
    debt: debt,
  };
}

/**
 * getPaymentHistory -- Сүүлийн төлбөрүүд, шинээс нь
 *   input: { limit? } (анхдагч 5, дээд 10)
 *   → { payments: [{ period, amount, method, paid_at }] }
 */
async function getPaymentHistory(me, input) {
  var rows = await Payments.forUnit(me.unit.id, limitOf(input, 5));
  return {
    payments: rows.map(function (p) {
      return { period: p.period, amount: p.amount, method: PAY_METHOD[p.method] || p.method, paid_at: day(p.paid_at) };
    }),
  };
}

/**
 * getMyRequests -- Миний илгээсэн санал хүсэлтүүд, шинээс нь
 *   input: { limit? } (анхдагч 5, дээд 10)
 *   → { requests: [{ id, title, category, stage, assigned_to, created_at, resolved_at }] }
 */
async function getMyRequests(me, input) {
  var rows = await Requests.forUser(me.user.id, limitOf(input, 5));
  return {
    requests: rows.map(function (r) {
      return {
        id: r.id,
        title: r.title,
        category: r.category,
        stage: REQUEST_STAGE[r.stage] || r.stage,
        rejected: r.status === 'rejected',
        assigned_to: r.assigned_name || null,
        created_at: day(r.created_at),
        resolved_at: day(r.resolved_at),
      };
    }),
  };
}

/**
 * getAnnouncements -- Миний орцонд харагдах зарлалууд (бүх орцных + өөрийн орцных), шинээс нь
 *   input: { limit? } (анхдагч 5, дээд 10)
 *   → { announcements: [{ title, body, important, audience, created_at }] }
 */
async function getAnnouncements(me, input) {
  var rows = await Announcements.forEntrance(me.unit.entrance_id, limitOf(input, 5));
  return {
    announcements: rows.map(function (a) {
      return {
        title: a.title,
        body: cut(a.body, 400),
        important: !!a.important,
        audience: a.audience === 'all' ? 'бүх орц' : a.audience + '-р орц',
        created_at: day(a.created_at),
      };
    }),
  };
}

/**
 * getPolls -- Явагдаж буй санал хураалтууд (миний өгсөн саналтай) + сүүлд дууссан 3
 *   → { active: [{ title, ends_at, options: [{ label, votes }], turnout_percent, my_vote }],
 *       ended:  [{ title, ended_at, turnout_percent, passed }] }
 */
async function getPolls(me) {
  var [polls, myVotes] = await Promise.all([Polls.list(), Polls.votesOfUnit(me.unit.id)]);

  var active = await Promise.all(
    polls
      .filter(function (p) { return p.status === 'active'; })
      .map(function (p) { return Polls.results(p.id); })
  );

  return {
    active: active.map(function (p) {
      var mine = p.options.find(function (o) { return o.id === myVotes[p.id]; });
      return {
        title: p.title,
        ends_at: day(p.ends_at),
        options: p.options.map(function (o) { return { label: o.label, votes: o.votes }; }),
        turnout_percent: p.turnout_percent,
        my_vote: mine ? mine.label : null,
      };
    }),
    // Батлагдсан = ирц босгод хүрсэн + «Тийм» (эхний сонголт) нь олонх — newsController-тэй ижил
    ended: polls
      .filter(function (p) { return p.status === 'ended'; })
      .slice(0, 3)
      .map(function (p) {
        return {
          title: p.title,
          ended_at: day(p.ends_at),
          turnout_percent: p.turnout_percent,
          passed: p.turnout_percent >= p.threshold_percent && p.yes_votes * 2 > p.votes,
        };
      }),
  };
}

// ---------- Claude-д өгөх тайлбар ----------
// Claude кодыг харахгүй — зөвхөн name, description, input_schema-г уншиж аль функцийг дуудахаа шийднэ

var LIMIT_INPUT = {
  type: 'object',
  properties: {
    limit: { type: 'integer', description: 'Хэдийг авах (1-10). Өгөхгүй бол 5' },
  },
  additionalProperties: false,
};

var NO_INPUT = { type: 'object', properties: {}, additionalProperties: false };

var TOOLS = [
  {
    name: 'getMyBill',
    description: 'Оршин суугчийн энэ сарын нэхэмжлэл (дүн, төлсөн, үлдэгдэл, эцсийн хугацаа, төлөв) ба өмнөх саруудын төлөгдөөгүй өр.',
    input_schema: NO_INPUT,
  },
  {
    name: 'getPaymentHistory',
    description: 'Оршин суугчийн хийсэн төлбөрүүдийн түүх, шинээс нь (аль сарынх, дүн, хэлбэр, огноо).',
    input_schema: LIMIT_INPUT,
  },
  {
    name: 'getMyRequests',
    description: 'Оршин суугчийн илгээсэн санал хүсэлтүүд (засвар, цэвэрлэгээ г.м.) ба төлөв, томилогдсон засварчин.',
    input_schema: LIMIT_INPUT,
  },
  {
    name: 'getAnnouncements',
    description: 'Оршин суугчийн орцонд харагдах СӨХ-ийн зарлалууд, шинээс нь (хурал, засвар, мэдэгдэл).',
    input_schema: LIMIT_INPUT,
  },
  {
    name: 'getPolls',
    description: 'Явагдаж буй санал хураалтууд (сонголт, санал, ирц, оршин суугч саналаа өгсөн эсэх) ба сүүлд дууссан 3.',
    input_schema: NO_INPUT,
  },
];

var HANDLERS = { getMyBill, getPaymentHistory, getMyRequests, getAnnouncements, getPolls };

/**
 * run -- Claude-ийн хүссэн функцийг нэрээр нь ажиллуулна
 *   → JSON объект. Мэдэгдэхгүй нэр ирвэл алдаа шиднэ
 */
async function run(name, me, input) {
  var handler = HANDLERS[name];
  if (!handler) throw new Error('Мэдэгдэхгүй функц: ' + name);
  return handler(me, input || {});
}

module.exports = { TOOLS, run, getMyBill, getPaymentHistory, getMyRequests, getAnnouncements, getPolls };
