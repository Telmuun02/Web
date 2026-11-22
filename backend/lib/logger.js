/**
 * Төвлөрсөн logger — log.info({ id: 1 }, 'Нэвтэрлээ') гэж хэрэглэнэ
 *   Компьютер дээр (Node)  — pino: терминалд өнгөтэй + logs/app.log (JSON), npm run logs-оор харна
 *   Cloudflare Workers     — console руу JSON мөр бичнэ, Cloudflare dashboard → Workers → Logs-д харагдана
 *                             (Workers дээр файл бичих боломжгүй)
 * Хөгжүүлэлтэд debug хүртэл, production-д info-оос дээш бичнэ (LOG_LEVEL-ээр солино)
 * Нууц үг, token логт хэзээ ч бичигдэхгүй (redact)
 *
 * workerLogger(bindings) - (дотоод) pino-тэй ижил API-тай (info, warn, error, child...) console logger
 * nodeLogger() - (дотоод) pino logger, logger.fileOnly нь зөвхөн файлд бичнэ
 */

var { isWorker } = require('./runtime');

var LEVELS = { trace: 10, debug: 20, info: 30, warn: 40, error: 50, fatal: 60 };
var SECRET_KEYS = ['password', 'token'];

function level() {
  return process.env.LOG_LEVEL || (process.env.NODE_ENV === 'production' ? 'info' : 'debug');
}

function clean(obj) {
  var out = {};
  for (var key in obj) {
    var v = obj[key];
    if (SECRET_KEYS.indexOf(key) !== -1) out[key] = '[Redacted]';
    else if (v instanceof Error) out[key] = { message: v.message, stack: v.stack };
    else out[key] = v;
  }
  return out;
}

function workerLogger(bindings) {
  var logger = {};

  Object.keys(LEVELS).forEach(function (name) {
    logger[name] = function (obj, msg) {
      if (LEVELS[name] < LEVELS[level()]) return;
      if (typeof obj === 'string') {
        msg = obj;
        obj = {};
      }
      var line = Object.assign({ level: name }, bindings, clean(obj || {}), { msg: msg });
      var write = LEVELS[name] >= 50 ? console.error : LEVELS[name] >= 40 ? console.warn : console.log;
      write(JSON.stringify(line));
    };
  });

  logger.child = function (extra) {
    return workerLogger(Object.assign({}, bindings, extra));
  };
  logger.fileOnly = logger;
  return logger;
}

function nodeLogger() {
  var fs = require('fs');
  var path = require('path');
  var pino = require('pino');
  var pretty = require('pino-pretty');

  var logDir = path.join(__dirname, '..', 'logs');
  fs.mkdirSync(logDir, { recursive: true });

  var options = {
    level: level(),
    timestamp: pino.stdTimeFunctions.isoTime,
    redact: ['password', '*.password', 'token', '*.token'],
  };

  var file = pino.destination({ dest: path.join(logDir, 'app.log'), sync: true });

  var logger = pino(options, pino.multistream([
    { level: 'debug', stream: pretty({ colorize: true, translateTime: 'SYS:yyyy-mm-dd HH:MM:ss' }) },
    { level: 'debug', stream: file },
  ]));

  // Зөвхөн logs/app.log-д — чатбот гэх мэт олон давтагддаг лог терминалыг дүүргэхгүйн тулд
  logger.fileOnly = pino(options, file);
  return logger;
}

module.exports = isWorker ? workerLogger({}) : nodeLogger();
