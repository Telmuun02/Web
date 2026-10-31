// Нэвтэрсэн эсэхийг шалгана — Laravel-ийн auth middleware шиг
// Token-ийг cookie (вэб) эсвэл Authorization: Bearer header (mobile)-аас уншина
var jwt = require('jsonwebtoken');

function auth(req, res, next) {
  var header = req.headers.authorization || '';
  var token = req.cookies.token || (header.startsWith('Bearer ') ? header.slice(7) : null);

  if (!token) {
    return res.status(401).json({ error: 'Нэвтрээгүй байна' });
  }

  try {
    // { id, role } — дараагийн controller-ууд req.user-ээс авна
    req.user = jwt.verify(token, process.env.JWT_SECRET);
    next();
  } catch (err) {
    // Хугацаа нь дууссан эсвэл хуурамч token
    res.status(401).json({ error: 'Нэвтрэх хугацаа дууссан, дахин нэвтэрнэ үү' });
  }
}

module.exports = auth;
