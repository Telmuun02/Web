var { Requests } = require('../db/models');

/**
 * index -- засварын хүсэлтийн жагсаалт, таб бүр энэ нэг функцээр:
 *   GET /api/requests                    — Нээлттэй (анхдагч)
 *   GET /api/requests?stage=new          — new, assigned, progress, done
 *   GET /api/requests?limit=20&offset=20 — хуудаслалт (анхдагч 20, дээд тал нь 100)
 * Хариу: { rows: [...], has_more: true, next_offset: 40 }
 * Мөр бүрд stage ирнэ — frontend өнгө, явцын алхмаа үүгээр сонгоно
 */
async function index(req, res, next) {
  try {
    var stage = Requests.stages.includes(req.query.stage) ? req.query.stage : 'open';

    // Хуудаслалт (infinite scroll): ?limit=20&offset=40 — 40-р мөрөөс хойш 20-ыг
    var limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 20, 1), 100);
    var offset = Math.max(parseInt(req.query.offset, 10) || 0, 0);

    // Нэгийг илүү авч дараагийн хуудас байгаа эсэхийг мэднэ
    var rows = await Requests.list({ stage: stage, limit: limit + 1, offset: offset });
    var hasMore = rows.length > limit;

    res.json({
      rows: rows.slice(0, limit),
      has_more: hasMore,
      next_offset: hasMore ? offset + limit : null, // дараагийн хүсэлтэд өгөх offset
    });
  } catch (err) {
    next(err);
  }
}

/**
 * counts -- табуудын дээрх тоо, бүгдийг нэг дор:
 *   GET /api/requests/counts → { open, new, assigned, progress, done }
 */
async function counts(req, res, next) {
  try {
    res.json(await Requests.stageCounts());
  } catch (err) {
    next(err);
  }
}

/**
 * openCount -- Navbar-ын "Засварын хүсэлт" дээрх тоо
 *   GET /api/requests/open-count → { count: 7 }
 * Нээлттэй = open, in_progress (шийдээгүй бүх хүсэлт)
 */
async function openCount(req, res, next) {
  try {
    res.json({ count: await Requests.openCount() });
  } catch (err) {
    next(err);
  }
}

module.exports = { index, counts, openCount };
