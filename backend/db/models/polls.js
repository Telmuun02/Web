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

// Нэг тоот нэг л удаа санал өгнө — давтвал DB-ийн unique алдаа (ER_DUP_ENTRY) гарна
async function vote(pollId, optionId, unitId, userId) {
  var option = await db('poll_options').where({ id: optionId, poll_id: pollId }).first();
  if (!option) return null;

  await db('poll_votes').insert({ poll_id: pollId, option_id: optionId, unit_id: unitId, user_id: userId });
  return results(pollId);
}

module.exports = { ...base, active, results, createWithOptions, vote };
