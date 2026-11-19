/**
 * Admins - СӨХ-ийн ажилтан (admins хүснэгт)
 * users-ээс тусдаа хүснэгт, өөрийн нэвтрэх мэдээлэлтэй.
 * Оршин суугчидтай орцоор дамжиж холбогдоно: entrances.manager_id → admins.id
 * password_hash-ийг энгийн query-д буцаахгүй (publicColumns)
 *
 * base: all, find, where, create, update, remove
 * findForLogin(login) - имэйл эсвэл утсаар, password_hash-тай нь (нэвтрэхэд)
 * findWithPassword(id) - id-аар, password_hash-тай нь (мэдээлэл солихын өмнө шалгахад)
 * list() - идэвхтэй ажилтнууд, нэрээр эрэмбэлсэн
 * byAdmin(q, column, adminId) - (дотоод) adminId өгсөн бол query-г тэр ажилтнаар шүүнэ
 * recentActions(limit, adminId) - сүүлийн үйлдлүүд: бүртгэсэн төлбөр, нийтэлсэн зарлал, үүсгэсэн санал хураалт, шинээс нь (adminId өгвөл зөвхөн тэр ажилтных)
 * monthCounts(adminId) - ажилтны энэ сард бүртгэсэн төлбөр, нийтэлсэн зарлал, үүсгэсэн санал хураалтын тоо
 */

var db = require('..');
var createModel = require('./base');

var publicColumns = ['id', 'name', 'phone', 'email', 'position', 'hired_at', 'active', 'created_at', 'updated_at'];

var base = createModel('admins', { columns: publicColumns });

async function findForLogin(login) {
  return db('admins').where({ email: login }).orWhere({ phone: login }).first();
}

async function findWithPassword(id) {
  return db('admins').where({ id: id }).first();
}

async function list() {
  return db('admins').select(publicColumns).where({ active: true }).orderBy('name');
}

function byAdmin(q, column, adminId) {
  if (adminId) q.where(column, adminId);
  return q;
}

async function recentActions(limit, adminId) {
  var [payments, announcements, polls] = await Promise.all([
    byAdmin(db('payments as p')
      .join('admins as a', 'a.id', 'p.recorded_by')
      .join('invoices as i', 'i.id', 'p.invoice_id')
      .join('units as u', 'u.id', 'i.unit_id')
      .select('p.id', 'a.name', 'u.code', 'p.amount', 'p.method', 'p.created_at as at')
      .orderBy('p.created_at', 'desc')
      .limit(limit), 'p.recorded_by', adminId),
    byAdmin(db('announcements as n')
      .join('admins as a', 'a.id', 'n.created_by')
      .select('n.id', 'a.name', 'n.title', 'n.created_at as at')
      .orderBy('n.created_at', 'desc')
      .limit(limit), 'n.created_by', adminId),
    byAdmin(db('polls as p')
      .join('admins as a', 'a.id', 'p.created_by')
      .select('p.id', 'a.name', 'p.title', 'p.created_at as at')
      .orderBy('p.created_at', 'desc')
      .limit(limit), 'p.created_by', adminId),
  ]);

  return []
    .concat(
      payments.map(function (r) { return { ...r, type: 'payment' }; }),
      announcements.map(function (r) { return { ...r, type: 'announcement' }; }),
      polls.map(function (r) { return { ...r, type: 'poll' }; })
    )
    .sort(function (a, b) { return new Date(b.at) - new Date(a.at); })
    .slice(0, limit);
}

async function monthCounts(adminId) {
  var monthStart = db.raw("DATE_FORMAT(CURDATE(), '%Y-%m-01')");
  var [payments, announcements, polls] = await Promise.all([
    db('payments').where('recorded_by', adminId).where('paid_at', '>=', monthStart).count({ n: '*' }).first(),
    db('announcements').where('created_by', adminId).where('created_at', '>=', monthStart).count({ n: '*' }).first(),
    db('polls').where('created_by', adminId).where('created_at', '>=', monthStart).count({ n: '*' }).first(),
  ]);
  return { payments: Number(payments.n), announcements: Number(announcements.n), polls: Number(polls.n) };
}

module.exports = { ...base, findForLogin, findWithPassword, list, recentActions, monthCounts };
