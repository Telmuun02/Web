/**
 * Нэг удаагийн шилжүүлэг: хуучин MySQL-ийн өгөгдлийг .data/dev.sqlite руу хуулна (npm run db:import-mysql)
 * .env-ийн DB_HOST, DB_USER, DB_PASSWORD, DB_NAME-ээр MySQL-д холбогдоно. Эхлээд npm run migrate хийсэн байх ёстой.
 * Огноо-цагийг MySQL-д байсан шигээ (Монголын цаг) текстээр нь хуулна. Хүснэгтүүдийн хуучин мөрүүдийг устгана.
 *
 * TABLES - хуулах хүснэгтүүд
 * main() - хүснэгт бүрийг хуулж, foreign key-ийн алдаа байгаа эсэхийг шалгана
 */

var path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env'), quiet: true });
var mysql = require('mysql2/promise');
var { open, FILE } = require('./clients/local');

var TABLES = [
  'buildings', 'admins', 'entrances', 'units', 'users', 'invoices', 'invoice_lines', 'payments',
  'requests', 'polls', 'poll_options', 'poll_votes', 'announcements', 'meetings', 'meeting_agenda', 'expenses',
];

async function main() {
  var my = await mysql.createConnection({
    host: process.env.DB_HOST || '127.0.0.1',
    port: Number(process.env.DB_PORT) || 3306,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    charset: 'utf8mb4',
    dateStrings: true,
  });
  var lite = open();

  lite.exec('PRAGMA foreign_keys = OFF');
  lite.exec('BEGIN');
  try {
    for (var table of TABLES.slice().reverse()) lite.exec('DELETE FROM ' + table);

    for (var t of TABLES) {
      var [rows] = await my.query('SELECT * FROM ?? ORDER BY 1', [t]);
      if (!rows.length) continue;
      var cols = Object.keys(rows[0]);
      var stmt = lite.prepare(
        'INSERT INTO ' + t + ' (' + cols.join(', ') + ') VALUES (' + cols.map(function () { return '?'; }).join(', ') + ')'
      );
      rows.forEach(function (r) {
        stmt.run(...cols.map(function (c) {
          var v = r[c];
          return v === undefined ? null : typeof v === 'boolean' ? Number(v) : v;
        }));
      });
      console.log(t.padEnd(16) + rows.length);
    }

    var broken = lite.prepare('PRAGMA foreign_key_check').all();
    if (broken.length) throw new Error('Foreign key алдаа: ' + JSON.stringify(broken.slice(0, 5)));
    lite.exec('COMMIT');
  } catch (err) {
    lite.exec('ROLLBACK');
    throw err;
  } finally {
    lite.exec('PRAGMA foreign_keys = ON');
    await my.end();
  }

  console.log('MySQL → ' + FILE + ' хуулж дууслаа');
}

main().catch(function (err) {
  console.error(err.message);
  process.exit(1);
});
