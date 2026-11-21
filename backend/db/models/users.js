/**
 * Users - оршин суугч (users хүснэгт), тоотод (unit_id) холбогдоно
 * password_hash-ийг энгийн query-д буцаахгүй (publicColumns)
 *
 * base: all, find, where, create, update, remove
 * findForLogin(login) - имэйл эсвэл утсаар, password_hash-тай нь (нэвтрэхэд)
 * findWithPassword(id) - id-аар, password_hash-тай нь (мэдээлэл солихын өмнө шалгахад)
 * residentCount(buildingId) - тоотод холбогдсон оршин суугчийн тоо
 * recentResidents(limit, buildingId) - сүүлд бүртгэгдсэн оршин суугчид
 */

var db = require('..');
var createModel = require('./base');
var Units = require('./units');

var publicColumns = ['id', 'unit_id', 'name', 'phone', 'email', 'created_at', 'updated_at'];

var base = createModel('users', { columns: publicColumns });

async function findForLogin(login) {
  return db('users').where({ email: login }).orWhere({ phone: login }).first();
}

async function findWithPassword(id) {
  return db('users').where({ id: id }).first();
}

async function residentCount(buildingId) {
  var q = db('users').whereNotNull('unit_id').count({ n: '*' }).first();
  var row = await Units.inBuilding(q, buildingId, 'unit_id');
  return Number(row.n);
}

async function recentResidents(limit, buildingId) {
  var q = db('users as s')
    .leftJoin('units as u', 'u.id', 's.unit_id')
    .whereNotNull('s.unit_id')
    .select('s.name', 'u.code', 's.created_at')
    .orderBy([{ column: 's.created_at', order: 'desc' }, { column: 's.id', order: 'desc' }])
    .limit(limit);
  return Units.inBuilding(q, buildingId, 's.unit_id');
}

module.exports = { ...base, findForLogin, findWithPassword, residentCount, recentResidents };
