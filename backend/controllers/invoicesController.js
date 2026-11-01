var { Invoices } = require('../db/models');

/**
 * index -- нэхэмжлэлийн жагсаалт. Бүх таб (Бүгд … Хэтэрсэн) энэ нэг функцээр:
 *   GET /api/invoices                 — Бүгд
 *   GET /api/invoices?status=overdue  — тухайн табынх
 *   GET /api/invoices?q=1-12          — тоот эсвэл нэрээр хайх
 *   GET /api/invoices?period=2026-10-01 — өөр сар (байхгүй бол энэ сар)
 *   GET /api/invoices?limit=30&offset=30 — хуудаслалт (анхдагч 30, дээд тал нь 100)
 * Хариу: { rows: [...], has_more: true, next_offset: 60 }
 */

var statuses = ['unpaid', 'partial', 'paid', 'overdue'];

// ?period=2026-10-01 өгвөл тэр сар, үгүй бол энэ сар
function periodFrom(req) {
  var p = String(req.query.period || '');
  if (/^\d{4}-\d{2}-01$/.test(p)) return p;

  var d = new Date();
  return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-01';
}

async function index(req, res, next) {
  try {
    var status = statuses.includes(req.query.status) ? req.query.status : null; // null = Бүгд
    var q = String(req.query.q || '').trim();

    // Хуудаслалт (infinite scroll): ?limit=30&offset=60 — 60-р мөрөөс хойш 30-ыг
    var limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 30, 1), 100);
    var offset = Math.max(parseInt(req.query.offset, 10) || 0, 0);

    // Нэгийг илүү авч дараагийн хуудас байгаа эсэхийг мэднэ
    var rows = await Invoices.list(periodFrom(req), { status: status, q: q, limit: limit + 1, offset: offset });
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
 *   GET /api/invoices/counts      → { all, unpaid, partial, paid, overdue }
 *   GET /api/invoices/counts?q=1-1 → хайлтад таарсан нэхэмжлэлүүдийн тоо
 */
async function counts(req, res, next) {
  try {
    var q = String(req.query.q || '').trim();

    res.json(await Invoices.counts(periodFrom(req), q));
  } catch (err) {
    next(err);
  }
}

module.exports = { index, counts };
