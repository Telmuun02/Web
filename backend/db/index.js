/**
 * Өгөгдлийн сангийн холболт — route, model-ууд require('../db') гэж ашиглана
 *   Cloudflare Workers дээр → D1 (clients/d1.js)
 *   Компьютер дээр (npm run dev) → .data/dev.sqlite (clients/local.js)
 * Хоёулаа SQLite тул model-уудын SQL нэг л байна.
 *
 * batch(queries) - knex query-уудыг нэг transaction-д дарааллаар нь ажиллуулна.
 *   D1 BEGIN/COMMIT дэмждэггүй тул db.transaction()-ийн оронд үүнийг ашиглана.
 *   Хариу: query бүрийн { rows, lastID, changes }
 */

var knex = require('knex');
var { isWorker } = require('../lib/runtime');

var Client = isWorker ? require('./clients/d1') : require('./clients/local');

var db = knex({ client: Client, connection: { filename: isWorker ? 'D1' : Client.FILE }, useNullAsDefault: true });

async function batch(queries) {
  var compiled = queries.map(function (q) {
    var native = q.toSQL().toNative();
    return { sql: native.sql, bindings: native.bindings };
  });
  return db.client.batch(compiled);
}

db.batch = batch;

module.exports = db;
