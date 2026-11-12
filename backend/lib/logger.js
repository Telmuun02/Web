// Төвлөрсөн logger
//   терминал      — бүх лог, өнгөтэй (pino-pretty)
//   logs/app.log  — бүх лог нэг файлд, JSON
// Хөгжүүлэлтэд debug хүртэл, production-д info-оос дээш бичнэ (LOG_LEVEL-ээр солино)
var fs = require('fs');
var path = require('path');
var pino = require('pino');
var pretty = require('pino-pretty');

var logDir = path.join(__dirname, '..', 'logs');
fs.mkdirSync(logDir, { recursive: true });

var logger = pino({
  level: process.env.LOG_LEVEL || (process.env.NODE_ENV === 'production' ? 'info' : 'debug'),
  timestamp: pino.stdTimeFunctions.isoTime,
  // Нууц үг, token логт хэзээ ч бичигдэхгүй
  redact: ['password', '*.password', 'token', '*.token'],
}, pino.multistream([
  { level: 'debug', stream: pretty({ colorize: true, translateTime: 'SYS:yyyy-mm-dd HH:MM:ss' }) },
  { level: 'debug', stream: pino.destination({ dest: path.join(logDir, 'app.log'), sync: true }) },
]));

module.exports = logger;
