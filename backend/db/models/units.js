var db = require('..');
var createModel = require('./base');

var base = createModel('units');

// Бүх тоот — орц, тоотоор эрэмбэлсэн
async function all() {
  return db('units').orderBy(['entrance', 'code']);
}

// Нэг орцны тоотууд
async function byEntrance(entrance) {
  return db('units').where({ entrance: entrance }).orderBy('code');
}

// Тоот + тэнд амьдардаг хэрэглэгчид
async function withResidents(id) {
  var unit = await base.find(id);
  if (!unit) return null;

  unit.residents = await db('users')
    .select('id', 'name', 'phone', 'email', 'role')
    .where({ unit_id: id })
    .orderBy('id');
  return unit;
}

module.exports = { ...base, all, byEntrance, withResidents };
