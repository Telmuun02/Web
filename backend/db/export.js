/**
 * Компьютер дээрх .data/dev.sqlite-ийн өгөгдлийг Cloudflare D1 руу илгээх SQL файл болгоно (npm run d1:seed)
 * Гаралт: .data/seed.sql — хүснэгт бүрийг цэвэрлээд мөр бүрийг INSERT болгоно.
 * Дараа нь: wrangler d1 execute sukh-hub --remote --file .data/seed.sql
 *
 * TABLES - хуулах хүснэгтүүд (import-mysql.js-тэй ижил)
 * literal(v) - (дотоод) утгыг SQL текст болгоно
 * main() - seed.sql-ийг бичнэ
 */

var fs = require('fs');
var path = require('path');
var { open } = require('./clients/local');

var OUT = path.join(__dirname, '..', '.data', 'seed.sql');
var TABLES = [
  'buildings', 'admins', 'entrances', 'units', 'users', 'invoices', 'invoice_lines', 'payments',
  'requests', 'polls', 'poll_options', 'poll_votes', 'announcements', 'meetings', 'meeting_agenda', 'expenses',
];

function literal(v) {
  if (v === null || v === undefined) return 'NULL';
  if (typeof v === 'number' || typeof v === 'bigint') return String(v);
  return "'" + String(v).replace(/'/g, "''") + "'";
}

function main() {
  var db = open();
  var lines = ['PRAGMA defer_foreign_keys = true;'];

  TABLES.slice().reverse().forEach(function (t) {
    lines.push('DELETE FROM ' + t + ';');
  });

  TABLES.forEach(function (t) {
    var rows = db.prepare('SELECT * FROM ' + t + ' ORDER BY id').all();
    rows.forEach(function (r) {
      var cols = Object.keys(r);
      lines.push('INSERT INTO ' + t + ' (' + cols.join(', ') + ') VALUES (' + cols.map(function (c) { return literal(r[c]); }).join(', ') + ');');
    });
    console.log(t.padEnd(16) + rows.length);
  });

  fs.writeFileSync(OUT, lines.join('\n') + '\n');
  console.log('→ ' + OUT);
}

main();
