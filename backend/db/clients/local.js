/**
 * Knex ↔ Node.js-ийн суурин SQLite (node:sqlite). Компьютер дээр хөгжүүлэхэд ашиглана
 * Файл: backend/.data/dev.sqlite (SQLITE_PATH-аар солино). D1-тэй ижил SQLite тул SQL нь адилхан
 *
 * open() - файлыг нэг удаа нээж, foreign key шалгалтыг асаана
 * run(sql, bindings) - (дотоод) нэг SQL ажиллуулна, мөр буцаадаг эсэхийг SQL-ээс нь таньна
 * acquireConnection() - нээлттэй файлыг буцаана
 * _query(conn, obj) - нэг SQL-ийг ажиллуулж knex-ийн хүлээдэг хэлбэрээр хариуг тавина
 * batch(queries) - хэд хэдэн SQL-ийг нэг transaction-д ажиллуулна (D1-ийн batch-тай адил)
 */

var fs = require('fs');
var path = require('path');
var Client_SQLite3 = require('knex/lib/dialects/sqlite3');
var values = require('../values');

var FILE = process.env.SQLITE_PATH || path.join(__dirname, '..', '..', '.data', 'dev.sqlite');
var database = null;

function open() {
  if (!database) {
    var { DatabaseSync } = require('node:sqlite');
    fs.mkdirSync(path.dirname(FILE), { recursive: true });
    database = new DatabaseSync(FILE);
    database.exec('PRAGMA foreign_keys = ON');
  }
  return database;
}

function run(sql, bindings) {
  var stmt = open().prepare(sql);
  var params = values.toParams(bindings);
  if (stmt.columns().length) return { rows: values.fromRows(stmt.all(...params)), lastID: null, changes: 0 };
  var info = stmt.run(...params);
  return { rows: [], lastID: Number(info.lastInsertRowid), changes: Number(info.changes) };
}

class Client_Local extends Client_SQLite3 {
  _driver() {
    return {};
  }

  async acquireConnection() {
    return open();
  }

  async releaseConnection() {}

  async acquireRawConnection() {
    return open();
  }

  async destroyRawConnection() {}

  async _query(conn, obj) {
    if (!obj.sql) throw new Error('The query is empty');
    var res = run(obj.sql, obj.bindings);
    obj.response = res.rows;
    obj.context = { lastID: res.lastID, changes: res.changes };
    return obj;
  }

  async batch(queries) {
    var db = open();
    db.exec('BEGIN');
    try {
      var results = queries.map(function (q) {
        return run(q.sql, q.bindings);
      });
      db.exec('COMMIT');
      return results;
    } catch (err) {
      db.exec('ROLLBACK');
      throw err;
    }
  }
}

Client_Local.FILE = FILE;
Client_Local.open = open;

module.exports = Client_Local;
