/**
 * Компьютер дээрх .data/dev.sqlite-ийн өгөгдлийг Cloudflare D1 руу илгээх SQL файл болгоно (npm run d1:seed)
 * Гаралт: .data/seed.sql — хүснэгт бүрийг цэвэрлээд мөр бүрийг INSERT болгоно.
 * Дараа нь: wrangler d1 execute sukh-hub --remote --file .data/seed.sql
 *
 * D1 файл импортлохдоо foreign key-г мөр бүрт шууд шалгадаг (defer_foreign_keys тоохгүй).
 * entrances.leader_id → users нь users-ээс өмнө орох тул эхлээд NULL-оор оруулж, төгсгөлд нь UPDATE хийнэ.
 *
 * TABLES - хуулах хүснэгтүүд (import-mysql.js-тэй ижил)
 * LATER - INSERT-ийн дараа UPDATE-ээр тавих баганууд { хүснэгт: [багана] }
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
var LATER = { entrances: ['leader_id'] };

function literal(v) {
  if (v === null || v === undefined) return 'NULL';
  if (typeof v === 'number' || typeof v === 'bigint') return String(v);
  return "'" + String(v).replace(/'/g, "''") + "'";
}

function main() {
  var db = open();
  var lines = [];
  var updates = [];

  TABLES.slice().reverse().forEach(function (t) {
    lines.push('DELETE FROM ' + t + ';');
  });

  TABLES.forEach(function (t) {
    var later = LATER[t] || [];
    var rows = db.prepare('SELECT * FROM ' + t + ' ORDER BY id').all();
    rows.forEach(function (r) {
      var cols = Object.keys(r);
      var vals = cols.map(function (c) { return later.indexOf(c) === -1 ? literal(r[c]) : 'NULL'; });
      lines.push('INSERT INTO ' + t + ' (' + cols.join(', ') + ') VALUES (' + vals.join(', ') + ');');
      later.forEach(function (c) {
        if (r[c] !== null) updates.push('UPDATE ' + t + ' SET ' + c + ' = ' + literal(r[c]) + ' WHERE id = ' + r.id + ';');
      });
    });
    console.log(t.padEnd(16) + rows.length);
  });

  lines = lines.concat(updates);

  fs.writeFileSync(OUT, lines.join('\n') + '\n');
  console.log('→ ' + OUT);
}

main();
