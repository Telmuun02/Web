var { Polls } = require('../../db/models');
var log = require('../../lib/logger').child({ module: 'admin/polls' });

/**
 * index -- бүх санал хураалт, шинээс нь
 *   GET /api/admin/polls → [{ id, title, starts_at, ends_at, threshold_percent, votes, status }]
 *   status: 'upcoming' | 'active' | 'ended'
 */
async function index(req, res, next) {
  try {
    res.json(await Polls.list());
  } catch (err) {
    next(err);
  }
}

/**
 * show -- нэг санал хураалтын үр дүн
 *   GET /api/admin/polls/3 → { ...poll, options: [{ id, label, votes }], turnout_percent, quorum_reached }
 */
async function show(req, res, next) {
  try {
    var poll = await Polls.results(req.params.id);
    if (!poll) return res.status(404).json({ error: 'Санал хураалт олдсонгүй' });
    res.json(poll);
  } catch (err) {
    next(err);
  }
}

/**
 * store -- шинэ санал хураалт
 *   POST /api/admin/polls — { title, description, ends_at, threshold_percent, options: ['Тийм', 'Үгүй'] }
 * Хариу: үүссэн санал хураалт (show-ийн хэлбэрээр)
 */
async function store(req, res, next) {
  try {
    var title = String(req.body.title || '').trim();
    var endsAt = new Date(req.body.ends_at);
    // 0 — босгогүй. Өгөөгүй бол 50%
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
