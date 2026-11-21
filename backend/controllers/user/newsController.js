/**
 * Зарлал ба санал хураалт - /api/resident/news
 * Хуудас: resident News (/news)
 *
 * index - өөрийн орцонд харагдах зарлал + санал хураалтууд + удахгүй болох хурал дээр хураах саналууд
 *   GET /api/resident/news
 * vote - санал өгөх эсвэл өгсөн саналаа өөрчлөх (тоотыг token-оос), санал хураалт дуусахаас өмнө
 *   POST /api/resident/polls/:id/vote
 */

var { Announcements, Polls, Meetings } = require('../../db/models');
var { isDuplicate } = require('../../db/errors');
var { currentResident, noUnit } = require('./helpers');
var log = require('../../lib/logger').child({ module: 'user/news' });

async function index(req, res, next) {
  try {
    var me = await currentResident(req);
    if (!me || !me.unit) return noUnit(req, res);

    var [posts, polls, myVotes, meeting] = await Promise.all([
      Announcements.forEntrance(me.unit.entrance_id, 30),
      Polls.list(),
      Polls.votesOfUnit(me.unit.id),
      Meetings.next(),
    ]);

    var active = await Promise.all(
      polls
        .filter(function (p) { return p.status === 'active'; })
        .map(function (p) { return Polls.results(p.id); })
    );

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
      meeting_votes: meeting
        ? meeting.agenda
          .filter(function (a) { return a.poll_id; })
          .map(function (a) { return { meeting_id: meeting.id, starts_at: meeting.starts_at, title: a.poll_title }; })
        : [],
    });
  } catch (err) {
    next(err);
  }
}

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
      log.warn({ by: req.user.id, pollId: poll.id, optionId: req.body.option_id }, 'Буруу сонголтоор санал өгөх оролдлого');
      return res.status(400).json({ error: 'Сонголт буруу байна' });
    }

    log.info({ by: req.user.id, pollId: poll.id, optionId: optionId }, 'Санал өглөө');
    res.status(201).json({ ...result, my_option_id: optionId });
  } catch (err) {
    if (isDuplicate(err)) {
      log.warn({ by: req.user.id, pollId: Number(req.params.id) }, 'Давхар санал өгөх оролдлого');
      return res.status(409).json({ error: 'Танай тоот аль хэдийн санал өгсөн байна' });
    }
    next(err);
  }
}

module.exports = { index, vote };
