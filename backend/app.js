var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var morgan = require('morgan');
var log = require('./lib/logger');
var { isWorker } = require('./lib/runtime');

var apiRouter = require('./routes/api');

var app = express();

// Cloudflare (Pages proxy + Tunnel)-аар дамжих тул req.ip-г X-Forwarded-For-оос авна.
app.set('trust proxy', true);

// Хүсэлт бүр терминалд товч харагдана (файлд бичихгүй).
// Чатботын хүсэлтүүдийг алгасна — тэдгээрийн лог зөвхөн npm run logs-
var quietPaths = ['/api/resident/chat', '/api/resident/transcribe'];

/** 
 * Доорх нь middleware уудыг хийсэн ба эдгээрээр дамжиж хүсэлт ирэх болно.
 */

app.use(morgan('dev', {
  skip: function (req) { return quietPaths.indexOf(req.originalUrl.split('?')[0]) !== -1; },
}));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
// Cloudflare дээр static файлыг assets (frontend/dist) өгнө, __dirname ч байхгүй
if (!isWorker) app.use(express.static(path.join(__dirname, 'public')));

app.use('/api', apiRouter);

app.use('/api', function (req, res) {
  res.status(404).json({ error: 'Зам олдсонгүй' });
});

app.use(function (err, req, res, next) {
  if (res.headersSent) return next(err);

  var status = err.status || 500;

  if (status < 500) {
    log.warn({ method: req.method, url: req.originalUrl, reason: err.message }, 'Буруу хүсэлт');
    return res.status(status).json({ error: 'Хүсэлт буруу байна' });
  }

  log.error({
    err: err,
    method: req.method,
    url: req.originalUrl,
    user: req.user ? req.user.id + ':' + req.user.role : null,
  }, 'Серверийн алдаа');
  res.status(status).json({ error: 'Серверийн алдаа' });
});

module.exports = app;
