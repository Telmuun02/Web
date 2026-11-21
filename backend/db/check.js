/**
 * Холболт шалгах: npm run db:check
 * Компьютер дээрх .data/dev.sqlite-ийн SQLite хувилбар, хүснэгт бүрийн мөрийн тоог хэвлэнэ
 *
 * main() - хувилбар, хүснэгтүүдийн мөрийн тоог хэвлэнэ
 */

var db = require('./index');

async function main() {
  var [version] = await db.raw('SELECT sqlite_version() AS version');
  console.log('SQLite ' + version.version + ' — ' + db.client.config.connection.filename);

  var tables = await db('sqlite_master').where('type', 'table').whereNot('name', 'like', 'sqlite_%').orderBy('name').pluck('name');
  for (var name of tables) {
    var row = await db(name).count({ n: '*' }).first();
    console.log('  ' + name.padEnd(16) + row.n);
  }
}

main()
  .catch(function (err) {
    console.error('Холбогдож чадсангүй: ' + err.message);
    process.exitCode = 1;
  })
  .finally(function () {
    db.destroy();
  });
