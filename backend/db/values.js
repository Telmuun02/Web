/**
 * JS утга ↔ SQLite утга хөрвүүлэлт. D1 болон локал client хоёулаа ашиглана
 *   Date, ISO текст → 'YYYY-MM-DD HH:MM:SS' (Монголын цаг)
 *   true/false → 1/0, undefined → null
 *   Хариуны 'YYYY-MM-DD HH:MM:SS' → ISO UTC (MySQL-ийн үеийнхтэй адил JSON гарна)
 *
 * toParams(bindings) - query-ийн параметрүүдийг хөрвүүлнэ
 * fromRows(rows) - хариуны мөрүүдийн огноо-цагийг хөрвүүлнэ
 */

var time = require('../lib/time');

var DB_DATETIME = /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/;
var ISO_UTC = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d+)?Z$/;

function toParam(v) {
  if (v === undefined) return null;
  if (v instanceof Date) return time.toDb(v);
  if (typeof v === 'boolean') return v ? 1 : 0;
  if (typeof v === 'string' && ISO_UTC.test(v)) return time.toDb(new Date(v));
  return v;
}

function toParams(bindings) {
  return (bindings || []).map(toParam);
}

function fromRow(row) {
  var out = {};
  for (var key in row) {
    var v = row[key];
    out[key] = typeof v === 'string' && DB_DATETIME.test(v) ? time.fromDb(v) : v;
  }
  return out;
}

function fromRows(rows) {
  return (rows || []).map(fromRow);
}

module.exports = { toParams, fromRows };
