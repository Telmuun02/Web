var express = require('express');
var fs = require('fs');
var path = require('path');
var cookieParser = require('cookie-parser');
var morgan = require('morgan');
var log = require('./lib/logger'); // logs/ хавтсыг мөн үүсгэнэ

var apiRouter = require('./routes/api');

var app = express();

// Хүсэлт бүр: терминалд товч, logs/access.log-д дэлгэрэнгүй
var accessLog = fs.createWriteStream(path.join(__dirname, 'logs', 'access.log'), { flags: 'a' });
app.use(morgan('dev'));
app.use(morgan('combined', { stream: accessLog }));

// access.log-ийг өөр програм түгжвэл сервер унахгүй
accessLog.on('error', function (err) {
  log.error({ err: err }, 'access.log руу бичиж чадсангүй');
});
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
