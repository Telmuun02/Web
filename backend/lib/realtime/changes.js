/**
 * Realtime-ийн логик — change_log-оос шинэ өөрчлөлтийг уншиж, хэн аль хүснэгтийг харахыг шийднэ.
 * Client руу зөвхөн { type: 'change', tables: [...] } очно — хуудас тухайн хүснэгтээс хамаарвал API-аас дахин татна.
 *
 * latestId() - change_log-ийн хамгийн сүүлийн id (анх холбогдоход хуучин өөрчлөлтийг алгасна)
 * read(afterId) - afterId-аас хойшхи өөрчлөлтүүд
 * tablesFor(client, list) - client-д харагдах өөрчлөгдсөн хүснэгтүүд:
 *   ажилтан бүгдийг, оршин суугч нийтийнхийг болон өөрийн тоотынхыг л харна
 */

var db = require('../../db');

var PUBLIC_TABLES = ['announcements', 'polls', 'poll_votes', 'meetings', 'chat_messages'];
var UNIT_TABLES = ['invoices', 'payments', 'requests', 'users', 'units'];

async function latestId() {
  var row = await db('change_log').max({ id: 'id' }).first();
  return (row && row.id) || 0;
}

async function read(afterId) {
  return db('change_log').where('id', '>', afterId).orderBy('id').limit(200);
}

function tablesFor(client, list) {
  var tables = new Set();
  list.forEach(function (c) {
    if (client.role === 'admin' || PUBLIC_TABLES.includes(c.tbl) || (UNIT_TABLES.includes(c.tbl) && c.unit_id === client.unitId)) {
      tables.add(c.tbl);
    }
  });
  return Array.from(tables);
}

module.exports = { latestId, read, tablesFor };
