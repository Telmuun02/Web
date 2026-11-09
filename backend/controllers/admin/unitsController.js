var { Units } = require('../../db/models');

/**
 * index -- тоотын жагсаалт
 *   GET /api/admin/units                 — бүх тоот
 *   GET /api/admin/units?entrance=2      — нэг орцных
 *   GET /api/admin/units?q=1-12          — тоот эсвэл оршин суугчийн нэрээр хайх
 * Мөр бүрд: тоотын мэдээлэл + name (эхний оршин суугч), residents (хэдэн хүн)
 */
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

/**
 * show -- нэг тоот, тэнд амьдардаг хүмүүстэй
 *   GET /api/admin/units/12 → { ...unit, residents: [{ id, name, phone, email }] }
 */
async function show(req, res, next) {
  try {
    var unit = await Units.withResidents(req.params.id);
    if (!unit) return res.status(404).json({ error: 'Тоот олдсонгүй' });
    res.json(unit);
  } catch (err) {
    next(err);
  }
}

module.exports = { index, show };
