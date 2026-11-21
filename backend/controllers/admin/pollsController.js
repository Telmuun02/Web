/**
 * Санал хураалт - /api/admin/polls
 * Хуудас: admin Polls (/admin/polls)
 *
 * index - бүх санал хураалт, status-тай
 *   GET /api/admin/polls
 * show - нэг санал хураалтын үр дүн, ирц
 *   GET /api/admin/polls/:id
 * store - шинэ санал хураалт сонголтуудтай нь
 *   POST /api/admin/polls
 */

var { Polls } = require('../../db/models');
var time = require('../../lib/time');
var log = require('../../lib/logger').child({ module: 'admin/polls' });

async function index(req, res, next) {
  try {
    res.json(await Polls.list());
  } catch (err) {
    next(err);
  }
}

async function show(req, res, next) {
  try {
    var poll = await Polls.results(req.params.id);
    if (!poll) return res.status(404).json({ error: 'Санал хураалт олдсонгүй' });
    res.json(poll);
  } catch (err) {
    next(err);
  }
}

async function store(req, res, next) {
  try {
    var title = String(req.body.title || '').trim();
    var endsAt = time.parseLocal(req.body.ends_at);
    var threshold = req.body.threshold_percent === undefined ? 50 : Number(req.body.threshold_percent);
    var options = (Array.isArray(req.body.options) ? req.body.options : [])
      .map(function (o) { return String(o).trim(); })
      .filter(Boolean);

    if (!title) return res.status(400).json({ error: 'Гарчгаа оруулна уу' });
    if (isNaN(endsAt) || endsAt <= new Date()) {
      return res.status(400).json({ error: 'Дуусах хугацаа ирээдүйд байх ёстой' });
    }
    if (options.length < 2) return res.status(400).json({ error: 'Хамгийн багадаа 2 сонголт оруулна уу' });
    if (!Number.isInteger(threshold) || threshold < 0 || threshold > 100) {
      return res.status(400).json({ error: 'Босго 0–100% байна' });
    }

    var poll = await Polls.createWithOptions({
      created_by: req.user.id,
      title: title,
      description: String(req.body.description || '').trim() || null,
      threshold_percent: threshold,
      ends_at: endsAt,
    }, options);

    log.info({
      by: req.user.id,
      pollId: poll.id,
      options: options.length,
      threshold: threshold,
      endsAt: endsAt.toISOString(),
    }, 'Санал хураалт үүсгэлээ');

    res.status(201).json(poll);
  } catch (err) {
    next(err);
  }
}

module.exports = { index, show, store };
