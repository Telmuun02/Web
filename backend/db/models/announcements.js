var db = require('..');
var createModel = require('./base');

var base = createModel('announcements');

// audience — FE-д өмнөх шигээ: 'all' эсвэл орцны дугаар ('2').
// DB-д entrance_id (NULL = бүх орц) хадгалагдана
function toAudience(row) {
  var { entrance_number, ...rest } = row;
  return { ...rest, audience: entrance_number == null ? 'all' : String(entrance_number) };
}

// Зарлалууд, шинээс нь — нийтэлсэн ажилтны нэр, орцны дугаартай
async function list(limit) {
  var rows = await db('announcements as a')
    .leftJoin('admins as s', 's.id', 'a.created_by')
    .leftJoin('entrances as e', 'e.id', 'a.entrance_id')
    .select('a.*', 's.name as created_by_name', 'e.number as entrance_number')
    .orderBy('a.created_at', 'desc')
    .orderBy('a.id', 'desc')
    .limit(limit || 50);
  return rows.map(toAudience);
}

// Нэг зарлал — list-тэй ижил хэлбэрээр
async function find(id) {
  var row = await db('announcements as a')
    .leftJoin('entrances as e', 'e.id', 'a.entrance_id')
    .select('a.*', 'e.number as entrance_number')
    .where('a.id', id)
    .first();
  return row && toAudience(row);
}

// Шинэ зарлал — entrance_id-аар хадгалаад audience-тэй нь буцаана
async function create(data) {
  var created = await base.create(data);
  return find(created.id);
}

module.exports = { ...base, list, find, create };
