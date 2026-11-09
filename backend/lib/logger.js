// Төвлөрсөн logger
//   терминал       — бүх лог, өнгөтэй (pino-pretty)
//   logs/app.log   — бүх лог нэг дор, JSON
//   logs/debug.log, info.log, warn.log, error.log — түвшин тус бүр тусдаа (error.log-д fatal ч орно)
// Хөгжүүлэлтэд debug хүртэл, production-д info-оос дээш бичнэ (LOG_LEVEL-ээр солино)
var fs = require('fs');
var path = require('path');
var pino = require('pino');
var pretty = require('pino-pretty');

var logDir = path.join(__dirname, '..', 'logs');
fs.mkdirSync(logDir, { recursive: true });

function file(name) {
  return pino.destination({ dest: path.join(logDir, name), sync: true });
}

// Зөвхөн яг өгсөн түвшний мөрийг дамжуулна. pino мөр бүрийг {"level":30,... гэж эхлүүлдэг
function only(levels, name) {
  var dest = file(name);
  var marks = levels.map(function (n) { return '{"level":' + n + ','; });
  return {
    write: function (line) {
      if (marks.some(function (m) { return line.startsWith(m); })) dest.write(line);
    },
  };
}

var L = pino.levels.values; // { trace: 10, debug: 20, info: 30, warn: 40, error: 50, fatal: 60 }

var streams = [
  { level: 'debug', stream: pretty({ colorize: true, translateTime: 'SYS:yyyy-mm-dd HH:MM:ss' }) },
  { level: 'debug', stream: file('app.log') },
  { level: 'debug', stream: only([L.debug], 'debug.log') },
  { level: 'info', stream: only([L.info], 'info.log') },
  { level: 'warn', stream: only([L.warn], 'warn.log') },
  { level: 'error', stream: only([L.error, L.fatal], 'error.log') },
];

var logger = pino({
  level: process.env.LOG_LEVEL || (process.env.NODE_ENV === 'production' ? 'info' : 'debug'),
  timestamp: pino.stdTimeFunctions.isoTime,
  // Нууц үг, token логт хэзээ ч бичигдэхгүй
  redact: ['password', '*.password', 'token', '*.token'],
}, pino.multistream(streams));

module.exports = logger;
