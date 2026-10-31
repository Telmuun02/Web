var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');

var apiRouter = require('./routes/api');

var app = express();

app.use(logger('dev'));
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
  console.error(err);
  res.status(err.status || 500).json({ error: 'Серверийн алдаа' });
});

module.exports = app;
