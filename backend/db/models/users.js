var db = require('..');
var createModel = require('./base');

// password_hash-ийг API руу хэзээ ч буцаахгүй
var publicColumns = ['id', 'unit_id', 'name', 'phone', 'email', 'role', 'created_at', 'updated_at'];

var base = createModel('users', { columns: publicColumns });

// Нэвтрэх үед л password_hash хэрэгтэй — имэйл эсвэл утсаар хайна
async function findForLogin(login) {
  return db('users').where({ email: login }).orWhere({ phone: login }).first();
}

// Бүх admin
async function admins() {
  return db('users').select(publicColumns).where({ role: 'admin' }).orderBy('name');
}

module.exports = { ...base, findForLogin, admins };
