/**
 * Announcements - СӨХ-өөс оршин суугчдад зарлал (announcements хүснэгт)
 * DB-д entrance_id (NULL = бүх орц), FE-д audience ('all' эсвэл орцны дугаар '2') болгож өгнө
 *
 * base: all, where, update, remove
 * toAudience(row) - (дотоод) entrance_number → audience
 * list(limit) - зарлалууд шинээс нь, ажилтны нэр, орцны дугаартай
 * find(id) - нэг зарлал, list-тэй ижил хэлбэрээр
 * create(data) - шинэ зарлал нэмээд audience-тэй нь буцаана
 * forEntrance(entranceId, limit) - оршин суугчид харагдах: бүх орцынх + өөрийн орцных
 */

var db = require('..');
var createModel = require('./base');

var base = createModel('announcements');

function toAudience(row) {
  var { entrance_number, ...rest } = row;
  return { ...rest, audience: entrance_number == null ? 'all' : String(entrance_number) };
}

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

async function find(id) {
  var row = await db('announcements as a')
    .leftJoin('entrances as e', 'e.id', 'a.entrance_id')
    .select('a.*', 'e.number as entrance_number')
    .where('a.id', id)
    .first();
  return row && toAudience(row);
}

async function create(data) {
  var created = await base.create(data);
  return find(created.id);
}

async function forEntrance(entranceId, limit) {
  var rows = await db('announcements as a')
    .leftJoin('entrances as e', 'e.id', 'a.entrance_id')
    .select('a.id', 'a.title', 'a.body', 'a.important', 'a.created_at', 'e.number as entrance_number')
    .where(function () {
      this.whereNull('a.entrance_id').orWhere('a.entrance_id', entranceId);
    })
    .orderBy([{ column: 'a.created_at', order: 'desc' }, { column: 'a.id', order: 'desc' }])
    .limit(limit || 30);
  return rows.map(toAudience);
}

module.exports = { ...base, list, find, create, forEntrance };
