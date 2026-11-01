var { Invoices, Payments } = require('../db/models');

/**
 * index -- нэхэмжлэлийн жагсаалт (хүснэгтийн мөрүүд)
 * summary -- табуудын тоо (Бүгд / Төлөгдөөгүй / ...) болон гарчгийн мөр
 * pay -- "Бэлэн бүртгэх" — төлбөр бүртгэнэ
 */

async function index(req, res, next) {}

async function summary(req, res, next) {}

async function pay(req, res, next) {}

module.exports = { index, summary, pay };
