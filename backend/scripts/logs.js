// Лог файлыг терминалд гоё харуулж, шинэ мөрийг шууд дагана (tail -f шиг)
//   npm run logs          — бүгд (app.log)
//   npm run logs -- warn  — зөвхөн warn.log (debug, info, warn, error, access)
var fs = require('fs');
var path = require('path');
var pretty = require('pino-pretty');

var name = (process.argv[2] || 'app') + '.log';
var file = path.join(__dirname, '..', 'logs', name);

// access.log нь JSON биш — шууд хэвлэнэ
var out = name === 'access.log'
  ? process.stdout
  : pretty({ colorize: true, translateTime: 'SYS:yyyy-mm-dd HH:MM:ss' });

var pos = 0;

function read() {
  var size;
  try { size = fs.statSync(file).size; } catch (e) { return; } // файл хараахан үүсээгүй
  if (size < pos) pos = 0;   // файл цэвэрлэгдсэн бол эхнээс нь
  if (size === pos) return;

  fs.createReadStream(file, { start: pos, end: size - 1 }).on('data', function (chunk) {
    out.write(chunk);
  });
  pos = size;
}

console.log('📄 ' + name + ' — шинэ мөрийг хүлээж байна (Ctrl+C зогсооно)\n');
read();
setInterval(read, 500);
