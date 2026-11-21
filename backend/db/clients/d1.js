/**
 * Knex ↔ Cloudflare D1 driver. Knex-ийн SQLite dialect SQL-ээ бичнэ, энэ нь D1 дээр ажиллуулна
 * D1-ийн binding: wrangler.jsonc → d1_databases → "DB". worker.js эхлэхдээ Client_D1.use(env.DB) гэж өгнө
 * (cloudflare:workers модулийг require-ээр ачаалж болдоггүй тул)
 *
 * use(binding) - D1 binding-ийг тохируулна
 *
 * acquireConnection() - D1-д холболтын pool хэрэггүй, хоосон объект буцаана
 * _query(conn, obj) - нэг SQL-ийг ажиллуулж knex-ийн хүлээдэг хэлбэрээр хариуг тавина
 * batch(queries) - хэд хэдэн SQL-ийг нэг transaction-д ажиллуулна (D1 BEGIN/COMMIT дэмжихгүй)
 * Өгөгдөл өөрчилсөн бол hooks.wrote() — realtime-д "одоо шалга" гэж дохио өгнө
 */

var Client_SQLite3 = require('knex/lib/dialects/sqlite3');
var values = require('../values');
var hooks = require('../hooks');

var DB = null;

class Client_D1 extends Client_SQLite3 {
  _driver() {
    return {};
  }

  async acquireConnection() {
    return {};
  }

  async releaseConnection() {}

  async acquireRawConnection() {
    return {};
  }

  async destroyRawConnection() {}

  async _query(conn, obj) {
    if (!obj.sql) throw new Error('The query is empty');
    var res = await DB.prepare(obj.sql).bind(...values.toParams(obj.bindings)).all();
    obj.response = values.fromRows(res.results);
    obj.context = { lastID: res.meta.last_row_id, changes: res.meta.changes };
    if (hooks.isWrite(obj.sql)) await hooks.wrote();
    return obj;
  }

  async batch(queries) {
    var stmts = queries.map(function (q) {
      return DB.prepare(q.sql).bind(...values.toParams(q.bindings));
    });
    var results = await DB.batch(stmts);
    await hooks.wrote();
    return results.map(function (res) {
      return { rows: values.fromRows(res.results), lastID: res.meta.last_row_id, changes: res.meta.changes };
    });
  }
}

Client_D1.use = function (binding) {
  DB = binding;
};

module.exports = Client_D1;
