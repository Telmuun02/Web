/**
 * Зарлалын сэтгэгдэл - /api/announcements/:id/comments — оршин суугч, ажилтан хоёулаа ашиглана
 * Хуудас: admin Зарлал (/admin/announcements), оршин суугчийн Зарлал (/news) — пост бүрийн доор
 *
 * index - зарлалын сэтгэгдлүүд хуучнаас шинэ рүү
 *   GET /api/announcements/:id/comments
 * store - сэтгэгдэл бичнэ. Бусдад WebSocket-оор шууд харагдана (change_log → lib/realtime)
 *   POST /api/announcements/:id/comments - { text } → сэтгэгдэл
 *
 * canSee(req, announcement) - (дотоод) ажилтан бүгдийг, оршин суугч бүх орцны болон өөрийн орцны зарлалыг харна
 */

var { Announcements, Comments, Users, Units } = require('../db/models');
var log = require('../lib/logger').child({ module: 'comments' });

var MAX_LEN = 1000;
var NOT_FOUND = { error: 'Зарлал олдсонгүй' };

async function canSee(req, announcement) {
  if (!announcement) return false;
  if (req.user.role === 'admin') return true;
  if (announcement.entrance_id == null) return true;
  var user = await Users.find(req.user.id);
  var unit = user && user.unit_id ? await Units.find(user.unit_id) : null;
  return Boolean(unit) && unit.entrance_id === announcement.entrance_id;
}

async function index(req, res, next) {
  try {
    var announcement = await Announcements.find(Number(req.params.id));
    if (!(await canSee(req, announcement))) return res.status(404).json(NOT_FOUND);
    res.json(await Comments.list(announcement.id));
  } catch (err) {
    next(err);
  }
}

async function store(req, res, next) {
  try {
    var announcement = await Announcements.find(Number(req.params.id));
    if (!(await canSee(req, announcement))) return res.status(404).json(NOT_FOUND);

    var text = typeof req.body.text === 'string' ? req.body.text.trim().slice(0, MAX_LEN) : '';
    if (!text) return res.status(400).json({ error: 'Сэтгэгдэл хоосон байна' });

    var comment = await Comments.create(announcement.id, req.user.role, req.user.id, text);
    log.info({ role: req.user.role, id: req.user.id, announcementId: announcement.id }, 'Сэтгэгдэл бичлээ');
    res.status(201).json(comment);
  } catch (err) {
    next(err);
  }
}

module.exports = { index, store };
