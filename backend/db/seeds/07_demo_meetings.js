/**
 * Хурал: 2 болсон, 1 удахгүй (маргааш 19:00, онлайн) - хэлэлцэх асуудлынх нь хамт
 * Удахгүй болох хурлын 1-р асуудлыг хурал дээр хураах санал хураалт (polls) болгож үүсгэнэ.
 * Болсон хурлуудын асуудлыг 05_demo_polls.js-ийн дууссан санал хураалтуудтай гарчгаар нь холбоно.
 * 02_demo_admins.js, 05_demo_polls.js-ийн дараа ажиллана. meetings-ийг устгаад шинээр үүсгэнэ.
 *
 * MEETINGS - хурал бүрийн огноо, хэлэлцэх асуудал (vote - хурал дээр санал хураах, poll - холбох санал хураалтын гарчиг)
 * at(daysFromNow, hour) - өнөөдрөөс daysFromNow хоногийн дараах hour цаг
 * seed(knex) - хурал, хэлэлцэх асуудал, хурлын санал хураалтыг оруулна
 */

var HOUR = 3600 * 1000;

var MEETINGS = [
  {
    title: 'СӨХ-ийн ээлжит хурал',
    description: '3 асуудал хэлэлцэнэ, тоглоомын талбайн шинэчлэлээр хурал дээр санал хураана.',
    daysFromNow: 1, hour: 19, hours: 1, location: 'Онлайн', online: true,
    agenda: [
      { title: 'Тоглоомын талбай шинэчлэх', description: 'Төсөв 18 сая₮, нөөц сангаас. Хурал дээр санал хураана.', vote: 'Тоглоомын талбай шинэчлэх үү?' },
      { title: 'Орцонд дугуйн зогсоол байрлуулах', description: 'Оршин суугчийн саналаар орсон асуудал.' },
      { title: 'Өвлийн бэлтгэл, дулааны шугам', description: 'Дулааны шугамын засварын дүн, цаашдын төлөвлөгөө.' },
    ],
  },
  {
    title: 'Ээлжит хурал',
    description: 'Орцны хаалга, зогсоолын асуудлаар.',
    daysFromNow: -82, hour: 19, hours: 1.5, location: 'Онлайн', online: true,
    agenda: [
      { title: 'Орцны хаалгыг ухаалаг түгжээтэй болгох', description: 'Хурлын дараа 14 хоног онлайнаар санал авсан.', poll: 'Орцны хаалгыг ухаалаг түгжээтэй болгох' },
      { title: 'Зогсоолын зураас шинэчлэх', description: 'Хаврын засварын ажлын хүрээнд.' },
    ],
  },
  {
    title: 'Жилийн тайлант хурал',
    description: 'Өнгөрсөн жилийн санхүүгийн тайлан, хураамжийн өөрчлөлт.',
    daysFromNow: -177, hour: 11, hours: 2, location: '1-р орцны үүдэнд', online: false,
    agenda: [
      { title: 'Санхүүгийн тайлан', description: 'Орлого, зарлага, нөөц сангийн үлдэгдэл.' },
      { title: 'Хураамжийг 85,000₮ болгох', description: 'Хурлын дараа онлайнаар санал авсан.', poll: 'СӨХ-ийн сарын хураамжийг 85,000₮ болгох' },
    ],
  },
];

function at(daysFromNow, hour) {
  var d = new Date(Date.now() + daysFromNow * 24 * HOUR);
  d.setHours(hour, 0, 0, 0);
  return d;
}

async function seed(knex) {
  var voteTitles = [];
  MEETINGS.forEach(function (m) {
    m.agenda.forEach(function (a) { if (a.vote) voteTitles.push(a.vote); });
  });

  await knex('meetings').del();
  await knex('polls').whereIn('title', voteTitles).whereNotIn('id', knex('poll_votes').select('poll_id')).del();

  var chairman = await knex('admins').where({ email: 'admin1@sokh.mn' }).first();
  var createdBy = chairman ? chairman.id : null;

  for (var def of MEETINGS) {
    var startsAt = at(def.daysFromNow, def.hour);
    var endsAt = new Date(startsAt.getTime() + def.hours * HOUR);

    var [meetingId] = await knex('meetings').insert({
      title: def.title,
      description: def.description,
      starts_at: startsAt,
      ends_at: endsAt,
      location: def.location,
      online: def.online,
      created_by: createdBy,
      created_at: new Date(Math.min(startsAt.getTime() - 7 * 24 * HOUR, Date.now())),
    });

    for (var i = 0; i < def.agenda.length; i++) {
      var item = def.agenda[i];
      var pollId = null;

      if (item.vote) {
        [pollId] = await knex('polls').insert({
          created_by: createdBy,
          title: item.vote,
          description: item.description,
          threshold_percent: 50,
          starts_at: startsAt,
          ends_at: endsAt,
        });
        await knex('poll_options').insert([
          { poll_id: pollId, label: 'Тийм', position: 0 },
          { poll_id: pollId, label: 'Үгүй', position: 1 },
        ]);
      } else if (item.poll) {
        var poll = await knex('polls').where({ title: item.poll }).first();
        pollId = poll ? poll.id : null;
      }

      await knex('meeting_agenda').insert({
        meeting_id: meetingId,
        position: i,
        title: item.title,
        description: item.description,
        poll_id: pollId,
      });
    }
  }
}

module.exports = { seed };
