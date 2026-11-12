var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var morgan = require('morgan');
var log = require('./lib/logger');

var apiRouter = require('./routes/api');

var app = express();

// Хүсэлт бүр терминалд товч харагдана (файлд бичихгүй)
app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

// API замууд — routes/api.js
app.use('/api', apiRouter);

// Байхгүй API зам
app.use('/api', function (req, res) {
  res.status(404).json({ error: 'Зам олдсонгүй' });
});

// Бүх controller-ийн next(err) энд ирнэ
app.use(function (err, req, res, next) {
  // Хариу аль хэдийн явчихсан бол Express-ийн анхдагч handler-т өгнө
  if (res.headersSent) return next(err);

  var status = err.status || 500;

  // 4xx — хэрэглэгчийн буруу хүсэлт (эвдэрхий JSON гэх мэт), серверийн алдаа биш
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
