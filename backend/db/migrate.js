/**
 * Компьютер дээрх .data/dev.sqlite-д migrations/*.sql-ийг ажиллуулна (npm run migrate)
 * Cloudflare дээрх D1-д: npm run d1:migrate (wrangler d1 migrations apply)
 * Хоёулаа ажилласан файлаа d1_migrations хүснэгтэд тэмдэглэдэг тул нэг файл хоёр удаа ажиллахгүй.
 *
 * main() - ажиллаагүй байгаа .sql файлуудыг нэрийн дарааллаар ажиллуулна
 */

var fs = require('fs');
var path = require('path');
var { open, FILE } = require('./clients/local');

var DIR = path.join(__dirname, '..', 'migrations');

function main() {
  var db = open();
  db.exec(
    'CREATE TABLE IF NOT EXISTS d1_migrations (' +
      'id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT UNIQUE, applied_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP)'
  );

  var done = db.prepare('SELECT name FROM d1_migrations').all().map(function (r) { return r.name; });
  var files = fs.readdirSync(DIR).filter(function (f) { return f.endsWith('.sql'); }).sort();
  var todo = files.filter(function (f) { return done.indexOf(f) === -1; });

  todo.forEach(function (name) {
    db.exec('BEGIN');
    try {
      db.exec(fs.readFileSync(path.join(DIR, name), 'utf8'));
      db.prepare('INSERT INTO d1_migrations (name) VALUES (?)').run(name);
      db.exec('COMMIT');
      console.log('✓ ' + name);
    } catch (err) {
      db.exec('ROLLBACK');
      console.error('✗ ' + name + ': ' + err.message);
      process.exit(1);
    }
  });

  console.log(todo.length ? todo.length + ' migration ажиллав → ' + FILE : 'Шинэ migration алга');
}

main();
