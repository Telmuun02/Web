/**
 * Ажилтны үйлдэл - /api/admin/activity
 * Хуудас: admin Profile (/admin/profile) - дээд талын 3 тоо, "Сүүлийн үйлдэл" карт
 * Dashboard-ийн "Ажилтны үйлдэл" карт describe-ийг ашиглана
 *
 * show - нэвтэрсэн ажилтны энэ сарын тоо ба сүүлийн 6 үйлдэл
 *   GET /api/admin/activity
 * describe(row) - Admins.recentActions-ийн нэг мөрийг { id, who, what, at } болгоно
 */

var { Admins } = require('../../db/models');

var methodLabel = { qpay: 'QPay', bank: 'дансаар', cash: 'бэлнээр', card: 'картаар' };

function describe(r) {
  var what;
  if (r.type === 'payment') what = r.code + ' тоотод ' + Number(r.amount).toLocaleString('en-US') + '₮ ' + methodLabel[r.method] + ' бүртгэв';
  else if (r.type === 'announcement') what = '«' + r.title + '» зарлал нийтлэв';
  else what = '«' + r.title + '» санал хураалт үүсгэв';
  return { id: r.type + '-' + r.id, who: r.name, what: what, at: r.at };
}

async function show(req, res, next) {
  try {
    var [counts, recent] = await Promise.all([
      Admins.monthCounts(req.user.id),
      Admins.recentActions(6, req.user.id),
    ]);
    res.json({ counts: counts, recent: recent.map(describe) });
  } catch (err) {
    next(err);
  }
}

module.exports = { show, describe };
