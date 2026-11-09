var { Requests, Admins } = require('../../db/models');

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

var statuses = ['open', 'in_progress', 'resolved', 'rejected'];

/**
 * update -- хүсэлтийн төлөв солих, засварчин томилох
 *   PATCH /api/admin/requests/12 — { status: 'in_progress' } эсвэл { assigned_to: 3 } эсвэл хоёулаа
 *   assigned_to: null — томилгоог болиулна
 * Шийдсэн (resolved) болгоход resolved_at автоматаар тэмдэглэгдэнэ.
 * Хариу: шинэчлэгдсэн хүсэлт + stage
 */
async function update(req, res, next) {
  try {
    var request = await Requests.find(req.params.id);
    if (!request) return res.status(404).json({ error: 'Хүсэлт олдсонгүй' });

    var hasStatus = req.body.status !== undefined;
    var hasAssignee = req.body.assigned_to !== undefined;
    if (!hasStatus && !hasAssignee) {
      return res.status(400).json({ error: 'status эсвэл assigned_to-ийн аль нэгийг өгнө үү' });
    }
    if (hasStatus && !statuses.includes(req.body.status)) {
      return res.status(400).json({ error: 'Төлөв буруу байна' });
    }

    // Засварчин нь идэвхтэй ажилтан байх ёстой
    if (hasAssignee && req.body.assigned_to !== null) {
      var worker = await Admins.find(req.body.assigned_to);
      if (!worker || !worker.active) {
        return res.status(400).json({ error: 'Ийм ажилтан олдсонгүй' });
      }
      await Requests.update(request.id, { assigned_to: worker.id });
    } else if (hasAssignee) {
      await Requests.update(request.id, { assigned_to: null });
    }

    if (hasStatus) await Requests.setStatus(request.id, req.body.status);

    var updated = await Requests.find(request.id);
    res.json({ ...updated, stage: Requests.stageOf(updated) });
  } catch (err) {
    next(err);
  }
}

module.exports = { index, counts, openCount, update };
