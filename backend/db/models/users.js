var db = require('..');
var createModel = require('./base');
var Units = require('./units');

// password_hash-ийг API руу хэзээ ч буцаахгүй
var publicColumns = ['id', 'unit_id', 'name', 'phone', 'email', 'created_at', 'updated_at'];

var base = createModel('users', { columns: publicColumns });

// Нэвтрэх үед л password_hash хэрэгтэй — имэйл эсвэл утсаар хайна
async function findForLogin(login) {
  return db('users').where({ email: login }).orWhere({ phone: login }).first();
}

// Мэдээлэл солихын өмнө нууц үг шалгахад — id-аар password_hash-тай нь авна
async function findWithPassword(id) {
  return db('users').where({ id: id }).first();
}

// Бүртгэлтэй оршин суугчийн тоо — тоотод холбогдсон хэрэглэгч
async function residentCount(buildingId) {
  var q = db('users').whereNotNull('unit_id').count({ n: '*' }).first();
  var row = await Units.inBuilding(q, buildingId, 'unit_id');
  return Number(row.n);
}

// Сүүлд бүртгэгдсэн оршин суугчид — тоотын кодтой
async function recentResidents(limit, buildingId) {
  var q = db('users as s')
    .leftJoin('units as u', 'u.id', 's.unit_id')
    .whereNotNull('s.unit_id')
    .select('s.name', 'u.code', 's.created_at')
    .orderBy('s.created_at', 'desc')
    .limit(limit);
  return Units.inBuilding(q, buildingId, 's.unit_id');
}

module.exports = { ...base, findForLogin, findWithPassword, residentCount, recentResidents };
