/**
 * Тоот ба оршин суугч - /api/admin/units
 * Хуудас: admin Units (/admin/units)
 *
 * index - тоотын жагсаалт, орц болон хайлтаар шүүнэ
 *   GET /api/admin/units?entrance=&q=
 * show - нэг тоот, тэнд амьдардаг хүмүүстэй
 *   GET /api/admin/units/:id
 */

var { Units } = require('../../db/models');

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
    var unit = await Units.withResidents(req.params.id);
    if (!unit) return res.status(404).json({ error: 'Тоот олдсонгүй' });
    res.json(unit);
  } catch (err) {
    next(err);
  }
}

module.exports = { index, show };
