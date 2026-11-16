/**
 * Санал хураалт: 3 дууссан (нэг нь ирц хүрээгүй), 2 явагдаж буй, 1 удахгүй эхлэх
 * 03_demo_users.js-ийн оршин суугчид байх ёстой. polls-ийг устгаад шинээр үүсгэнэ.
 *
 * random(seed) - тогтмол "санамсаргүй" тоо
 * weighted(weights, r) - жингийн дагуу сонголтын индекс
 * seed(knex) - POLLS-ийг сонголт, саналтай нь оруулна
 */

var DAY = 24 * 3600 * 1000;
var YES_NO = ['Тийм', 'Үгүй'];
var YES_NO_ABSTAIN = ['Тийм', 'Үгүй', 'Түдгэлзэнэ'];

var POLLS = [
  {
    title: 'СӨХ-ийн сарын хураамжийг 85,000₮ болгох',
    description: 'Ашиглалтын зардал өссөнтэй холбогдуулан хураамжийг 81,700₮-өөс 85,000₮ болгох санал.',
    startDaysAgo: 175, days: 14, threshold: 50, turnout: 0.82, options: YES_NO_ABSTAIN, weights: [0.58, 0.36, 0.06],
  },
  {
    title: 'Орцны хаалгыг ухаалаг түгжээтэй болгох',
    description: 'Карт болон утсаар нээгддэг түгжээ. Нэг удаагийн 15,000₮ хураамжтай.',
    startDaysAgo: 80, days: 14, threshold: 50, turnout: 0.74, options: YES_NO_ABSTAIN, weights: [0.71, 0.22, 0.07],
  },
  {
    title: 'Хүүхдийн тоглоомын талбайг шинэчлэх',
    description: 'Хуучин тоглоомуудыг солиж, зөөлөн хучилт хийнэ.',
    startDaysAgo: 40, days: 10, threshold: 60, turnout: 0.41, options: YES_NO, weights: [0.84, 0.16],
  },
  {
    title: 'Зогсоолын автомат хаалт суурилуулах',
    description: 'Гадны машин зогсохоос сэргийлж, оршин суугчдад пульт олгоно.',
    startDaysAgo: 6, days: 12, threshold: 50, turnout: 0.47, options: YES_NO_ABSTAIN, weights: [0.62, 0.3, 0.08],
  },
  {
    title: 'Лифтний засварын сан бүрдүүлэх (сард 5,000₮)',
    description: 'Гурван орцны лифтний их засварт зориулж тусдаа сан байгуулна.',
    startDaysAgo: 1, days: 7, threshold: 50, turnout: 0.18, options: YES_NO, weights: [0.55, 0.45],
  },
  {
    title: 'Хашаанд мод, цэцэг тарих',
    description: 'Хаврын тарилтад оршин суугчдын хандиваар мод суулгана.',
    startDaysAgo: -4, days: 14, threshold: 40, turnout: 0, options: YES_NO, weights: [1, 0],
  },
];

function random(seed) {
  var x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
}

function weighted(weights, r) {
  var acc = 0;
  for (var k = 0; k < weights.length - 1; k++) {
    acc += weights[k];
    if (r < acc) return k;
  }
  return weights.length - 1;
}

async function seed(knex) {
  await knex('poll_votes').del();
  await knex('poll_options').del();
  await knex('polls').del();

  var chairman = await knex('admins').where({ email: 'admin1@sokh.mn' }).first();
  var voters = await knex('users')
    .whereNotNull('unit_id')
    .select('unit_id', knex.raw('MIN(id) AS user_id'))
    .groupBy('unit_id')
    .orderBy('unit_id');
  var now = Date.now();

  for (var p = 0; p < POLLS.length; p++) {
    var def = POLLS[p];
    var startsAt = new Date(now - def.startDaysAgo * DAY);
    startsAt.setHours(9, 0, 0, 0);
    var endsAt = new Date(startsAt.getTime() + def.days * DAY);

    var [pollId] = await knex('polls').insert({
      created_by: chairman ? chairman.id : null,
      title: def.title,
      description: def.description,
      threshold_percent: def.threshold,
      starts_at: startsAt,
      ends_at: endsAt,
      created_at: new Date(Math.min(startsAt.getTime() - DAY, now)),
    });

    await knex('poll_options').insert(
      def.options.map(function (label, i) {
        return { poll_id: pollId, label: label, position: i };
      })
    );
    var optionIds = (await knex('poll_options').where({ poll_id: pollId }).orderBy('position')).map(function (o) {
      return o.id;
    });

    var span = Math.min(endsAt.getTime(), now) - startsAt.getTime();
    var votes = [];
    voters.forEach(function (v, i) {
      var s = (p + 1) * 1000 + i;
      if (random(s) >= def.turnout) return;
      votes.push({
        poll_id: pollId,
        option_id: optionIds[weighted(def.weights, random(s + 500))],
        unit_id: v.unit_id,
        user_id: v.user_id,
        created_at: new Date(startsAt.getTime() + random(s + 900) * span),
      });
    });
    if (votes.length) await knex.batchInsert('poll_votes', votes, 200);
  }
}

module.exports = { seed };
