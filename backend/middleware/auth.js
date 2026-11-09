// Нэвтэрсэн эсэхийг шалгана — Laravel-ийн auth middleware шиг
// Token-ийг cookie (вэб) эсвэл Authorization: Bearer header (mobile)-аас уншина
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
