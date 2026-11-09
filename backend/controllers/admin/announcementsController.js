var { Announcements, Entrances } = require('../../db/models');
var log = require('../../lib/logger').child({ module: 'admin/announcements' });

/**
 * index -- нийтэлсэн зарлалууд, шинээс нь
 *   GET /api/admin/announcements → [{ id, title, body, audience, sms, important, created_by_name, created_at }]
 */
async function index(req, res, next) {
  try {
    res.json(await Announcements.list(50));
  } catch (err) {
    next(err);
  }
}

/**
 * store -- шинэ зарлал нийтлэх
 *   POST /api/admin/announcements — { title, body, audience: 'all' | орцны дугаар ('2'), sms, important }
 * SMS-ийг одоохондоо илгээхгүй — зөвхөн тэмдэглэнэ (SMS үйлчилгээ холбогдох хүртэл)
 */
async function store(req, res, next) {
  try {
    var title = String(req.body.title || '').trim();
    var body = String(req.body.body || '').trim();
    var audience = String(req.body.audience || 'all');

    if (!title) return res.status(400).json({ error: 'Гарчгаа оруулна уу' });
    if (!body) return res.status(400).json({ error: 'Агуулгаа оруулна уу' });
    if (title.length > 150) return res.status(400).json({ error: 'Гарчиг 150 тэмдэгтээс ихгүй' });

    // 'all' — бүх орц (entrance_id = NULL), эс бөгөөс тухайн дугаартай орц байх ёстой
    var entrance = null;
    if (audience !== 'all') {
      entrance = (await Entrances.list()).find(function (e) { return String(e.number) === audience; });
      if (!entrance) return res.status(400).json({ error: 'Ийм орц алга' });
    }

    var post = await Announcements.create({
      created_by: req.user.id,
      title: title,
      body: body,
      entrance_id: entrance ? entrance.id : null,
      sms: Boolean(req.body.sms),
      important: Boolean(req.body.important),
    });

    log.info({
      by: req.user.id,
      announcementId: post.id,
      entrance: entrance ? entrance.number : 'all',
      sms: Boolean(req.body.sms),
      important: Boolean(req.body.important),
    }, 'Зарлал нийтэллээ');

    res.status(201).json(post);
  } catch (err) {
    next(err);
  }
}

/**
 * destroy -- зарлал устгах
 *   DELETE /api/admin/announcements/5 → 204
 */
async function destroy(req, res, next) {
  try {
    var removed = await Announcements.remove(req.params.id);
    if (!removed) return res.status(404).json({ error: 'Зарлал олдсонгүй' });

    log.info({ by: req.user.id, announcementId: Number(req.params.id) }, 'Зарлал устгалаа');
    res.status(204).end();
  } catch (err) {
    next(err);
  }
}

module.exports = { index, store, destroy };
