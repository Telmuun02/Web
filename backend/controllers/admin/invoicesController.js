/**
 * Нэхэмжлэл ба төлбөр - /api/admin/invoices
 * Хуудас: admin Invoices (/admin/invoices)
 *
 * index - нэхэмжлэлийн жагсаалт (таб, хайлт, сар)
 *   GET /api/admin/invoices?period=&status=&q=&limit=&offset=
 * counts - табуудын дээрх тоо
 *   GET /api/admin/invoices/counts
 * pay - төлбөр бүртгэх, нэхэмжлэлийн төлөв автоматаар шинэчлэгдэнэ
 *   POST /api/admin/invoices/:id/payments
 *
 * periodFrom(req) - (дотоод) ?period-ээс сар, үгүй бол энэ сар
 */

var { Invoices, Payments } = require('../../db/models');
var time = require('../../lib/time');
var log = require('../../lib/logger').child({ module: 'admin/invoices' });

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

function periodFrom(req) {
  var p = String(req.query.period || '');
  if (/^\d{4}-\d{2}-01$/.test(p)) return p;

  return time.monthStart(0);
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

async function counts(req, res, next) {
  try {
    var q = String(req.query.q || '').trim();

    res.json(await Invoices.counts(periodFrom(req), q));
  } catch (err) {
    next(err);
  }
}

var methods = ['cash', 'bank', 'qpay', 'card'];

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

    var paid = (await Payments.forInvoice(invoice.id)).reduce(function (sum, p) { return sum + p.amount; }, 0);
    if (amount > invoice.amount - paid) {
      log.warn({ by: req.user.id, invoiceId: invoice.id, amount: amount, remaining: invoice.amount - paid }, 'Үлдэгдлээс их төлбөр бүртгэх оролдлого');
      return res.status(400).json({ error: 'Үлдэгдлээс их дүн бүртгэх боломжгүй' });
    }

    var payment = await Payments.record(invoice.id, {
      recorded_by: req.user.id,
      amount: amount,
      method: method,
      note: String(req.body.note || '').trim().slice(0, 255) || null,
    });

    log.info({
      by: req.user.id,
      invoiceId: invoice.id,
      paymentId: payment.id,
      amount: amount,
      method: method,
      remaining: invoice.amount - paid - amount,
    }, 'Төлбөр бүртгэлээ');

    res.status(201).json(payment);
  } catch (err) {
    next(err);
  }
}

module.exports = { index, counts, pay };
