/**
 * Зарлал - /api/admin/announcements
 * Хуудас: admin Announcements (/admin/announcements)
 *
 * index - нийтэлсэн зарлалууд, шинээс нь
 *   GET /api/admin/announcements
 * store - шинэ зарлал (бүх орц эсвэл нэг орцонд)
 *   POST /api/admin/announcements
 * update - зарлалын гарчиг, агуулгыг засах
 *   PATCH /api/admin/announcements/:id - { title, body }
 * destroy - зарлал устгах
 *   DELETE /api/admin/announcements/:id
 */

var { Announcements, Entrances } = require('../../db/models');
var log = require('../../lib/logger').child({ module: 'admin/announcements' });

async function index(req, res, next) {
  try {
    res.json(await Announcements.list(50));
  } catch (err) {
    next(err);
  }
}

async function store(req, res, next) {
  try {
    var title = String(req.body.title || '').trim();
    var body = String(req.body.body || '').trim();
    var audience = String(req.body.audience || 'all');

    if (!title) return res.status(400).json({ error: 'Гарчгаа оруулна уу' });
    if (!body) return res.status(400).json({ error: 'Агуулгаа оруулна уу' });
    if (title.length > 150) return res.status(400).json({ error: 'Гарчиг 150 тэмдэгтээс ихгүй' });

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

async function update(req, res, next) {
  try {
    var title = String(req.body.title || '').trim();
    var body = String(req.body.body || '').trim();
    if (!title) return res.status(400).json({ error: 'Гарчгаа оруулна уу' });
    if (!body) return res.status(400).json({ error: 'Агуулгаа оруулна уу' });
    if (title.length > 150) return res.status(400).json({ error: 'Гарчиг 150 тэмдэгтээс ихгүй' });

    if (!(await Announcements.find(req.params.id))) return res.status(404).json({ error: 'Зарлал олдсонгүй' });
    await Announcements.update(req.params.id, { title: title, body: body });

    log.info({ by: req.user.id, announcementId: Number(req.params.id) }, 'Зарлал засав');
    res.json(await Announcements.find(req.params.id));
  } catch (err) {
    next(err);
  }
}

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

module.exports = { index, store, update, destroy };
