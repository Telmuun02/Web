/**
 * Тоот ба оршин суугч - /api/admin/units
 * Хуудас: admin Units (/admin/units)
 *
 * index - тоотын жагсаалт, орц болон хайлтаар шүүнэ
 *   GET /api/admin/units?entrance=&q=
 * show - нэг тоот, бүртгэлтэй утаснуудтай
 *   GET /api/admin/units/:id
 * addPhone - тоотод утас холбоно:
 *   - оршин суугч өөрөө бүртгүүлсэн (холбогдоогүй) дугаар бол тэр бүртгэлийг тоотод холбоно → шууд нэвтэрнэ
 *   - шинэ дугаар бол урьдчилан бүртгэнэ → оршин суугч /register-ээр баталгаажуулж нэвтэрнэ
 *   POST /api/admin/units/:id/phones - { phone }
 * removePhone - тоотоос утас хасна (тэр утсаар нэвтрэх боломжгүй болно)
 *   DELETE /api/admin/units/:id/phones/:userId
 * pending - өөрөө бүртгүүлсэн, тоотод холбогдоогүй бүртгэлүүд
 *   GET /api/admin/units/pending
 * link - холбогдоогүй бүртгэлийг тоотод холбоно
 *   POST /api/admin/units/pending/:userId - { unitId }
 * reject - холбогдоогүй бүртгэлийг устгана (танихгүй дугаар)
 *   DELETE /api/admin/units/pending/:userId
 *
 * Утасны бүтэн дугаарыг зөвхөн СӨХ-ийн дарга харна, бусад ажилтанд '9911-••33'
 * isChairman(req) - (дотоод) хүсэлт илгээсэн ажилтан дарга эсэх
 * withPhones(unitId, req) - (дотоод) тоот + утаснууд, эрхээс хамаарч нууцалсан
 */

var db = require('../../db');
var { Units, Admins } = require('../../db/models');
var { normalizePhone, maskPhone } = require('../../lib/verify');
var { isDuplicate } = require('../../db/errors');
var log = require('../../lib/logger').child({ module: 'admin/units' });

async function isChairman(req) {
  var admin = await Admins.find(req.user.id);
  return Boolean(admin && admin.position === 'chairman');
}

async function withPhones(unitId, req) {
  var [unit, chairman] = await Promise.all([Units.withResidents(unitId), isChairman(req)]);
  if (unit && !chairman) {
    unit.residents = unit.residents.map(function (r) { return { ...r, phone: maskPhone(r.phone) }; });
  }
  return unit;
}

async function index(req, res, next) {
  try {
    res.json(await Units.list({
      entrance: Number(req.query.entrance) || null,
      q: String(req.query.q || '').trim(),
    }));
  } catch (err) {
    next(err);
  }
}

async function show(req, res, next) {
  try {
    var unit = await withPhones(req.params.id, req);
    if (!unit) return res.status(404).json({ error: 'Тоот олдсонгүй' });
    res.json(unit);
  } catch (err) {
    next(err);
  }
}

async function addPhone(req, res, next) {
  try {
    var unit = await Units.find(req.params.id);
    if (!unit) return res.status(404).json({ error: 'Тоот олдсонгүй' });

    var phone = normalizePhone(req.body.phone);
    if (!phone) return res.status(400).json({ error: 'Утасны дугаар буруу байна (8 оронтой)' });

    var existing = await db('users').select('id', 'unit_id').where({ phone: phone }).first();
    if (existing && existing.unit_id === unit.id) return res.status(409).json({ error: 'Энэ утас энэ тоотод аль хэдийн бүртгэлтэй' });
    if (existing && existing.unit_id) return res.status(409).json({ error: 'Энэ утас өөр тоотод бүртгэлтэй байна' });

    if (existing) {
      await db('users').where({ id: existing.id }).update({ unit_id: unit.id, name: unit.code + ' тоот' });
      log.info({ by: req.user.id, unit: unit.code, userId: existing.id }, 'Өөрөө бүртгүүлсэн утсыг тоотод холболоо');
    } else {
      await db('users').insert({ unit_id: unit.id, phone: phone, name: unit.code + ' тоот' });
      log.info({ by: req.user.id, unit: unit.code }, 'Тоотод утас бүртгэлээ');
    }
    res.status(201).json(await withPhones(unit.id, req));
  } catch (err) {
    if (isDuplicate(err)) return res.status(409).json({ error: 'Энэ утас өөр тоотод бүртгэлтэй байна' });
    next(err);
  }
}

async function removePhone(req, res, next) {
  try {
    var removed = await db('users').where({ id: req.params.userId, unit_id: req.params.id }).del();
    if (!removed) return res.status(404).json({ error: 'Утас олдсонгүй' });
    log.info({ by: req.user.id, unitId: Number(req.params.id), userId: Number(req.params.userId) }, 'Тоотоос утас хаслаа');
    res.json(await withPhones(req.params.id, req));
  } catch (err) {
    next(err);
  }
}

async function pending(req, res, next) {
  try {
    var rows = await db('users')
      .select('id', 'phone', 'created_at')
      .whereNull('unit_id')
      .whereNotNull('password_hash')
      .orderBy('created_at', 'desc');
    var chairman = await isChairman(req);
    res.json(chairman ? rows : rows.map(function (r) { return { ...r, phone: maskPhone(r.phone) }; }));
  } catch (err) {
    next(err);
  }
}

async function link(req, res, next) {
  try {
    var user = await db('users').select('id', 'phone', 'unit_id').where({ id: req.params.userId }).first();
    if (!user) return res.status(404).json({ error: 'Бүртгэл олдсонгүй' });
    if (user.unit_id) return res.status(409).json({ error: 'Энэ бүртгэл аль хэдийн тоотод холбогдсон байна' });

    var unit = await Units.find(Number(req.body.unitId));
    if (!unit) return res.status(400).json({ error: 'Тоотоо сонгоно уу' });

    var linked = await db('users').where({ id: user.id }).whereNull('unit_id').update({ unit_id: unit.id, name: unit.code + ' тоот' });
    if (!linked) return res.status(409).json({ error: 'Энэ бүртгэлийг өөр ажилтан дөнгөж сая холбосон байна' });
    log.info({ by: req.user.id, userId: user.id, unit: unit.code }, 'Бүртгэлийг тоотод холболоо');
    res.json({ id: user.id, unit: unit.code });
  } catch (err) {
    next(err);
  }
}

async function reject(req, res, next) {
  try {
    var removed = await db('users').where({ id: req.params.userId }).whereNull('unit_id').del();
    if (!removed) return res.status(404).json({ error: 'Бүртгэл олдсонгүй' });
    log.info({ by: req.user.id, userId: Number(req.params.userId) }, 'Холбогдоогүй бүртгэлийг устгалаа');
    res.status(204).end();
  } catch (err) {
    next(err);
  }
}

module.exports = { index, show, addPhone, removePhone, pending, link, reject };
