/**
 * Санал хүсэлт - /api/resident/requests
 * Хуудас: resident Requests (/requests)
 *
 * index - өөрийн илгээсэн хүсэлтүүд
 *   GET /api/resident/requests
 * store - шинэ хүсэлт илгээх (тоот, хэрэглэгчийг token-оос)
 *   POST /api/resident/requests
 */

var { Requests } = require('../../db/models');
var { currentResident, noUnit } = require('./helpers');
var log = require('../../lib/logger').child({ module: 'user/requests' });

async function index(req, res, next) {
  try {
    var rows = await Requests.forUser(req.user.id, 50);
    log.debug({ id: req.user.id, count: rows.length }, 'Миний хүсэлтүүд');
    res.json(rows);
  } catch (err) {
    next(err);
  }
}

async function store(req, res, next) {
  try {
    var me = await currentResident(req);
    if (!me || !me.unit) return noUnit(req, res);

    var category = String(req.body.category || '');
    var title = String(req.body.title || '').trim();
    var description = String(req.body.description || '').trim() || null;

    var error = null;
    if (!Requests.categories.includes(category)) error = 'Төрлөө сонгоно уу';
    else if (!title) error = 'Гарчгаа оруулна уу';
    else if (title.length > 150) error = 'Гарчиг 150 тэмдэгтээс ихгүй';
    else if (description && description.length > 2000) error = 'Тайлбар 2000 тэмдэгтээс ихгүй';

    if (error) {
      log.debug({ id: me.user.id, category: category, reason: error }, 'Хүсэлт буцаагдлаа');
      return res.status(400).json({ error: error });
    }

    var created = await Requests.create({
      unit_id: me.unit.id,
      created_by: me.user.id,
      category: category,
      title: title,
      description: description,
      anonymous: req.body.anonymous === true,
    });

    log.info({ by: me.user.id, unit: me.unit.code, requestId: created.id, category: category }, 'Хүсэлт илгээлээ');
    res.status(201).json({ ...created, stage: Requests.stageOf(created) });
  } catch (err) {
    next(err);
  }
}

module.exports = { index, store };
