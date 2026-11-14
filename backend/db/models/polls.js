var db = require('..');
var createModel = require('./base');

var base = createModel('polls');

// Одоо явагдаж байгаа санал хураалтууд
async function active() {
  return db('polls')
    .where('starts_at', '<=', db.fn.now())
    .where('ends_at', '>', db.fn.now())
    .orderBy('ends_at');
}

// Санал хураалт + сонголт бүрийн санал, ирц, босгод хүрсэн эсэх
async function results(id) {
  var poll = await base.find(id);
  if (!poll) return null;

  var options = await db('poll_options as o')
    .leftJoin('poll_votes as v', 'v.option_id', 'o.id')
    .select('o.id', 'o.label')
    .count({ votes: 'v.id' })
    .where('o.poll_id', id)
    .groupBy('o.id', 'o.label', 'o.position')
    .orderBy('o.position');

  var units = await db('units').count({ c: '*' }).first();
  var totalUnits = Number(units.c);
  var voted = 0;

  poll.options = options.map(function (o) {
    voted += Number(o.votes);
    return { id: o.id, label: o.label, votes: Number(o.votes) };
  });
  poll.voted_units = voted;
  poll.total_units = totalUnits;
  poll.turnout_percent = totalUnits ? Math.round((voted / totalUnits) * 100) : 0;
  poll.quorum_reached = poll.turnout_percent >= poll.threshold_percent;
  return poll;
}

// Санал хураалт сонголтуудтай нь хамт үүсгэнэ
async function createWithOptions(data, labels) {
  var id = await db.transaction(async function (trx) {
    var [pollId] = await trx('polls').insert(data);
    await trx('poll_options').insert(
      labels.map(function (label, i) {
        return { poll_id: pollId, label: label, position: i };
      })
    );
    return pollId;
  });
  return results(id);
}

// Нэг тоот нэг л удаа санал өгнө — давтвал DB-ийн unique алдаа (ER_DUP_ENTRY) гарна.
// Тоотыг оршин суугчийн өөрийнхөөс авна — өөр тоотын нэрээр санал өгөх боломжгүй
async function vote(pollId, optionId, userId) {
  var option = await db('poll_options').where({ id: optionId, poll_id: pollId }).first();
  var user = await db('users').where({ id: userId }).first();
  if (!option || !user || !user.unit_id) return null;

  await db('poll_votes').insert({ poll_id: pollId, option_id: optionId, unit_id: user.unit_id, user_id: userId });
  return results(pollId);
}

// Нэг санал хураалтын нийт санал, сүүлийн 1 цагийнх
async function voteStats(pollId) {
  var row = await db('poll_votes')
    .where('poll_id', pollId)
    .select(db.raw('COUNT(*) AS votes, COALESCE(SUM(created_at >= NOW() - INTERVAL 1 HOUR), 0) AS last_hour'))
    .first();
  return { votes: Number(row.votes), lastHour: Number(row.last_hour) };
}

// Сүүлд санал өгсөн тоотууд
async function recentVotes(pollId, limit) {
  return db('poll_votes as v')
    .join('units as u', 'u.id', 'v.unit_id')
    .where('v.poll_id', pollId)
    .select('u.code', 'v.created_at')
    .orderBy('v.created_at', 'desc')
    .limit(limit);
}

// Бүх санал хураалт, шинээс нь — саналын тоо, ирц, төлөвтэй.
// status: 'upcoming' (эхлээгүй) | 'active' (явагдаж байна) | 'ended' (дууссан)
// yes_votes — эхний сонголтын (position 0, ихэвчлэн «Тийм») санал
async function list() {
  var votes = db('poll_votes').select('poll_id').count({ votes: '*' }).groupBy('poll_id').as('v');
  var yesVotes = db.raw(
    '(SELECT COUNT(*) FROM poll_votes pv JOIN poll_options po ON po.id = pv.option_id' +
      ' WHERE pv.poll_id = p.id AND po.position = 0) AS yes_votes'
  );

  var [rows, units] = await Promise.all([
    db('polls as p')
      .leftJoin(votes, 'v.poll_id', 'p.id')
      .select('p.*', db.raw('COALESCE(v.votes, 0) AS votes'), yesVotes)
      .orderBy('p.starts_at', 'desc'),
    db('units').count({ n: '*' }).first(),
  ]);

  var totalUnits = Number(units.n);
  var now = new Date();
  return rows.map(function (r) {
    var status = new Date(r.starts_at) > now ? 'upcoming' : new Date(r.ends_at) <= now ? 'ended' : 'active';
    var count = Number(r.votes);
    return {
      ...r,
      votes: count,
      yes_votes: Number(r.yes_votes),
      total_units: totalUnits,
      turnout_percent: totalUnits ? Math.round((count / totalUnits) * 100) : 0,
      status: status,
    };
  });
}

// Тоотын өгсөн саналууд — { [poll_id]: option_id }
async function votesOfUnit(unitId) {
  var rows = await db('poll_votes').select('poll_id', 'option_id').where('unit_id', unitId);
  var map = {};
  rows.forEach(function (r) {
    map[r.poll_id] = r.option_id;
  });
  return map;
}

module.exports = { ...base, active, results, createWithOptions, vote, voteStats, recentVotes, list, votesOfUnit };
