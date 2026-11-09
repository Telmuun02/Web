var { Invoices, Payments } = require('../../db/models');

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
    var status = statuses.includes(req.query.status) ? req.query.status : null; 
    var q = String(req.query.q || '').trim();

    var limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 30, 1), 100);
    var offset = Math.max(parseInt(req.query.offset, 10) || 0, 0);

    var rows = await Invoices.list(periodFrom(req), { status: status, q: q, limit: limit + 1, offset: offset });
    var hasMore = rows.length > limit;

    res.json({
      rows: rows.slice(0, limit),
      has_more: hasMore,
      next_offset: hasMore ? offset + limit : null,
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

var methods = ['cash', 'bank', 'qpay', 'card'];

/**
 * pay -- нэхэмжлэлд төлбөр бүртгэх (жижүүрийн өрөөнд бэлнээр, дансаар орсон төлбөр)
 *   POST /api/admin/invoices/12/payments — { amount: 85000, method: 'cash', note }
 * Нэхэмжлэлийн төлөв (unpaid/partial/paid) автоматаар шинэчлэгдэнэ.
 * Хариу: бүртгэгдсэн төлбөр
 */
async function pay(req, res, next) {
  try {
    var amount = Number(req.body.amount);
    var method = methods.includes(req.body.method) ? req.body.method : null;

    if (!Number.isInteger(amount) || amount <= 0) {
      return res.status(400).json({ error: 'Дүн 0-ээс их бүхэл тоо байна' });
    }
    if (!method) return res.status(400).json({ error: 'Төлбөрийн хэлбэр буруу байна' });

    var invoice = await Invoices.find(req.params.id);
    if (!invoice) return res.status(404).json({ error: 'Нэхэмжлэл олдсонгүй' });

    // Үлдэгдлээс их дүн бүртгэхгүй
    var paid = (await Payments.forInvoice(invoice.id)).reduce(function (sum, p) { return sum + p.amount; }, 0);
    if (amount > invoice.amount - paid) {
      return res.status(400).json({ error: 'Үлдэгдлээс их дүн бүртгэх боломжгүй' });
    }

    var payment = await Payments.record(invoice.id, {
      recorded_by: req.user.id, // бүртгэсэн ажилтан
      amount: amount,
      method: method,
      note: String(req.body.note || '').trim().slice(0, 255) || null,
    });

    res.status(201).json(payment);
  } catch (err) {
    next(err);
  }
}

module.exports = { index, counts, pay };
