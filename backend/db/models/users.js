var db = require('..');
var createModel = require('./base');

// password_hash-ийг API руу хэзээ ч буцаахгүй
var publicColumns = ['id', 'unit_id', 'name', 'phone', 'email', 'role', 'created_at', 'updated_at'];

var base = createModel('users', { columns: publicColumns });

// Нэвтрэх үед л password_hash хэрэгтэй — имэйл эсвэл утсаар хайна
async function findForLogin(login) {
  return db('users').where({ email: login }).orWhere({ phone: login }).first();
}

// Мэдээлэл солихын өмнө нууц үг шалгахад — id-аар password_hash-тай нь авна
async function findWithPassword(id) {
  return db('users').where({ id: id }).first();
}

// Бүх admin
async function admins() {
  return db('users').select(publicColumns).where({ role: 'admin' }).orderBy('name');
}

// Бүртгэлтэй оршин суугчийн тоо
async function residentCount() {
  var row = await db('users').where('role', 'user').count({ n: '*' }).first();
  return Number(row.n);
}

// Сүүлд бүртгэгдсэн оршин суугчид — тоотын кодтой
async function recentResidents(limit) {
  return db('users as s')
    .leftJoin('units as u', 'u.id', 's.unit_id')
    .where('s.role', 'user')
    .select('s.name', 'u.code', 's.created_at')
    .orderBy('s.created_at', 'desc')
    .limit(limit);
}

module.exports = { ...base, findForLogin, findWithPassword, admins, residentCount, recentResidents };
