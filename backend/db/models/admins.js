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

module.exports = { ...base, findForLogin, findWithPassword, list };
