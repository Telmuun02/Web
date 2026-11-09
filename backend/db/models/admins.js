var db = require('..');
var createModel = require('./base');

// Ажилтан — users-ээс тусдаа хүснэгт, өөрийн нэвтрэх мэдээлэлтэй.
// Оршин суугчидтай орцоор дамжиж холбогдоно: entrances.manager_id → admins.id

// password_hash-ийг API руу хэзээ ч буцаахгүй
var publicColumns = ['id', 'name', 'phone', 'email', 'position', 'hired_at', 'active', 'created_at', 'updated_at'];

var base = createModel('admins', { columns: publicColumns });

// Нэвтрэх үед л password_hash хэрэгтэй — имэйл эсвэл утсаар хайна
async function findForLogin(login) {
  return db('admins').where({ email: login }).orWhere({ phone: login }).first();
}

// Мэдээлэл солихын өмнө нууц үг шалгахад — id-аар password_hash-тай нь авна
async function findWithPassword(id) {
  return db('admins').where({ id: id }).first();
}

// Идэвхтэй ажилтнууд — нэрээр эрэмбэлсэн. Ажлаас гарсныг (active = false) харуулахгүй
async function list() {
  return db('admins').select(publicColumns).where({ active: true }).orderBy('name');
}

module.exports = { ...base, findForLogin, findWithPassword, list };
