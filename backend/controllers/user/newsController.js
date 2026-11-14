var { Announcements, Polls } = require('../../db/models');
var { currentResident, noUnit } = require('./helpers');
var log = require('../../lib/logger').child({ module: 'user/news' });

/**
 * index -- Зарлал ба санал хураалт хуудас
 *   GET /api/resident/news →
 *   {
 *     posts:        [ бүх орцны + өөрийн орцны зарлал ],
 *     active_polls: [{ id, title, options: [{ id, label, votes }], turnout_percent, ..., my_option_id }],
 *     past_polls:   [{ id, title, ends_at, yes_percent, turnout_percent, passed }] — сүүлийн 5
 *   }
 * my_option_id — танай тоот аль сонголтыг сонгосон (өгөөгүй бол null)
 */
async function index(req, res, next) {
  try {
    var me = await currentResident(req);
    if (!me || !me.unit) return noUnit(req, res);

    var [posts, polls, myVotes] = await Promise.all([
      Announcements.forEntrance(me.unit.entrance_id, 30),
      Polls.list(),
      Polls.votesOfUnit(me.unit.id),
    ]);

    // Явагдаж буй санал хураалтад сонголтууд хэрэгтэй тул дэлгэрэнгүйг нь авна
    var active = await Promise.all(
      polls
        .filter(function (p) { return p.status === 'active'; })
        .map(function (p) { return Polls.results(p.id); })
    );

    // Батлагдсан = ирц босгод хүрсэн + «Тийм» (эхний сонголт) нь олонх
    var past = polls
      .filter(function (p) { return p.status === 'ended'; })
      .slice(0, 5)
      .map(function (p) {
        return {
          id: p.id,
          title: p.title,
          ends_at: p.ends_at,
          yes_percent: p.votes ? Math.round((p.yes_votes / p.votes) * 100) : 0,
          turnout_percent: p.turnout_percent,
          passed: p.turnout_percent >= p.threshold_percent && p.yes_votes * 2 > p.votes,
        };
      });

    log.debug({ id: me.user.id, posts: posts.length, active: active.length }, 'Зарлал хуудас');

    res.json({
      posts: posts,
      active_polls: active.map(function (p) {
        return { ...p, my_option_id: myVotes[p.id] || null };
      }),
      past_polls: past,
    });
  } catch (err) {
    next(err);
  }
}

/**
 * vote -- санал өгөх. Нэг тоот нэг л удаа (гэр бүлийн аль нэг гишүүн)
 *   POST /api/resident/polls/3/vote — { option_id } → 201 + шинэчлэгдсэн дүн, my_option_id
 * Тоотыг token-оос авна — өөр тоотын нэрээр санал өгөх боломжгүй
 */
async function vote(req, res, next) {
  try {
    var poll = await Polls.find(req.params.id);
    if (!poll) return res.status(404).json({ error: 'Санал хураалт олдсонгүй' });

    var now = new Date();
    if (new Date(poll.starts_at) > now || new Date(poll.ends_at) <= now) {
      log.warn({ by: req.user.id, pollId: poll.id }, 'Идэвхгүй санал хураалтад санал өгөх оролдлого');
      return res.status(400).json({ error: 'Санал хураалт идэвхгүй байна' });
    }

    var optionId = Number(req.body.option_id);
    var result = await Polls.vote(poll.id, optionId, req.user.id);
    if (!result) {
      // Өөр санал хураалтын сонголт, эсвэл тоотгүй хэрэглэгч
      log.warn({ by: req.user.id, pollId: poll.id, optionId: req.body.option_id }, 'Буруу сонголтоор санал өгөх оролдлого');
      return res.status(400).json({ error: 'Сонголт буруу байна' });
    }

    log.info({ by: req.user.id, pollId: poll.id, optionId: optionId }, 'Санал өглөө');
    res.status(201).json({ ...result, my_option_id: optionId });
  } catch (err) {
    // poll_votes (poll_id, unit_id) unique — тоот аль хэдийн санал өгсөн
    if (err.code === 'ER_DUP_ENTRY') {
      log.warn({ by: req.user.id, pollId: Number(req.params.id) }, 'Давхар санал өгөх оролдлого');
      return res.status(409).json({ error: 'Танай тоот аль хэдийн санал өгсөн байна' });
    }
    next(err);
  }
}

module.exports = { index, vote };
