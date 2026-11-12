// logs/ доторх бүх .log файлыг хоосолно
//   npm run logs:clear
// Устгахын оронд хоосолдог — сервер ажиллаж байхад ч (файл нээлттэй үед) болно
var fs = require('fs');
var path = require('path');

var logDir = path.join(__dirname, '..', 'logs');

if (!fs.existsSync(logDir)) {
  console.log('logs/ хавтас алга — цэвэрлэх юм байхгүй');
  process.exit(0);
}

fs.readdirSync(logDir)
  .filter(function (name) { return name.endsWith('.log'); })
  .forEach(function (name) {
    fs.truncateSync(path.join(logDir, name), 0);
    console.log('🧹 ' + name + ' хоосоллоо');
  });
