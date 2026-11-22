/**
 * WebSocket-оор холбогдож буй хүнийг таних — нэвтрэлтийн JWT-ээр (cookie эсвэл ?token=)
 * Ажилтан идэвхтэй (admins.active), оршин суугч тоотод бүртгэлтэй байх ёстой.
 *
 * tokenFrom(cookieHeader, url) - cookie-ийн token, байхгүй бол ?token= (mobile)
 * identify(token) - { role, unitId } эсвэл null (token буруу, эрх хаагдсан)
 */

var jwt = require('jsonwebtoken');
var db = require('../../db');

function tokenFrom(cookieHeader, url) {
  var match = /(?:^|;\s*)token=([^;]+)/.exec(cookieHeader || '');
  if (match) return decodeURIComponent(match[1]);
  return new URL(url, 'http://local').searchParams.get('token');
}

async function identify(token) {
  if (!token) return null;

  var payload;
  try {
    payload = jwt.verify(token, process.env.JWT_SECRET);
  } catch (err) {
    return null;
  }

  if (payload.role === 'admin') {
    var admin = await db('admins').select('active').where('id', payload.id).first();
    if (!admin || !admin.active) return null;
    return { role: 'admin', unitId: null };
  }

  var user = await db('users').select('unit_id').where('id', payload.id).first();
  if (!user || !user.unit_id) return null;
  return { role: 'user', unitId: user.unit_id };
}

module.exports = { tokenFrom, identify };
