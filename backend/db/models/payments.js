var db = require('..');
var createModel = require('./base');

var base = createModel('payments');

// Нэг нэхэмжлэлийн төлбөрүүд
async function forInvoice(invoiceId) {
  return db('payments').where({ invoice_id: invoiceId }).orderBy('paid_at');
}

// Төлбөр бүртгээд нэхэмжлэлийн төлөвийг (unpaid/partial/paid) шинэчилнэ.
// Хоёулаа нэг transaction дотор — аль нэг нь алдвал юу ч хадгалагдахгүй.
async function record(invoiceId, data) {
  return db.transaction(async function (trx) {
    var invoice = await trx('invoices').where({ id: invoiceId }).forUpdate().first();
    if (!invoice) return null;

    var [id] = await trx('payments').insert({ ...data, invoice_id: invoiceId });

    var row = await trx('payments').where({ invoice_id: invoiceId }).sum({ paid: 'amount' }).first();
    var paid = Number(row.paid);
    var status = paid >= invoice.amount ? 'paid' : paid > 0 ? 'partial' : 'unpaid';

    await trx('invoices').where({ id: invoiceId }).update({ status: status, updated_at: trx.fn.now() });
    return trx('payments').where({ id: id }).first();
  });
}

module.exports = { ...base, forInvoice, record };
