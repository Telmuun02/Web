// Нэвтэрсэн эсэхийг шалгах authentication middleware. 
// Энэ нь Express.js-ийн middleware функц бөгөөд HTTP хүсэлтүүдийг шалгаж, хэрэглэгчийн токен хүчинтэй эсэхийг 
// баталгаажуулдаг. Хэрэв токен хүчинтэй бол хэрэглэгчийн мэдээллийг `req.user` 
// руу оруулж, дараагийн middleware рүү шилжүүлнэ. 
// Хэрэв токен байхгүй эсвэл хүчинтэй бус бол 401 Unauthorized хариу илгээнэ.

var jwt = require('jsonwebtoken');
var log = require('../lib/logger').child({ module: 'auth' });

function auth(req, res, next) {
  var header = req.headers.authorization || '';
  var token = req.cookies.token || (header.startsWith('Bearer ') ? header.slice(7) : null);

  if (!token) {
    log.debug({ url: req.originalUrl, ip: req.ip }, 'Token байхгүй');
    return res.status(401).json({ error: 'Нэвтрээгүй байна' });
  }

  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET);
    next();
  } catch (err) {
    log.debug({ url: req.originalUrl, ip: req.ip, reason: err.message }, 'Token хүчингүй');
    res.status(401).json({ error: 'Нэвтрэх хугацаа дууссан, дахин нэвтэрнэ үү' });
  }
}

module.exports = auth;
