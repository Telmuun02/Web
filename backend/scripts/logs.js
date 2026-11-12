// logs/app.log-ийг терминалд гоё харуулж, шинэ мөрийг шууд дагана (tail -f шиг)
//   npm run logs
var fs = require('fs');
var path = require('path');
var pretty = require('pino-pretty');

var file = path.join(__dirname, '..', 'logs', 'app.log');
var out = pretty({ colorize: true, translateTime: 'SYS:yyyy-mm-dd HH:MM:ss' });

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

console.log('📄 app.log — шинэ мөрийг хүлээж байна (Ctrl+C зогсооно)\n');
read();
setInterval(read, 500);
