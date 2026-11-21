/**
 * WebSocket-оор холбогдож буй хүнийг таних — нэвтрэлтийн JWT-ээр (cookie эсвэл ?token=)
 * Ажилтан идэвхтэй (admins.active), оршин суугч тоотод бүртгэлтэй байх ёстой.
 *
 * tokenFrom(cookieHeader, url) - cookie-ийн token, байхгүй бол ?token= (mobile)
 * identify(token) - { role, id, name, unitId, entranceId } эсвэл null (token буруу, эрх хаагдсан)
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
    var admin = await db('admins').select('id', 'name', 'active').where('id', payload.id).first();
    if (!admin || !admin.active) return null;
    return { role: 'admin', id: admin.id, name: admin.name, unitId: null, entranceId: null };
  }

  var user = await db('users as s').leftJoin('units as u', 'u.id', 's.unit_id')
    .select('s.id', 's.name', 's.unit_id', 'u.entrance_id').where('s.id', payload.id).first();
  if (!user || !user.unit_id) return null;
  return { role: 'user', id: user.id, name: user.name, unitId: user.unit_id, entranceId: user.entrance_id };
}

module.exports = { tokenFrom, identify };
