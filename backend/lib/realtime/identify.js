/**
 * WebSocket-оор холбогдож буй хүнийг таних — нэвтрэлтийн JWT-ээр (cookie эсвэл ?token=)
 * Ажилтан идэвхтэй (admins.active), оршин суугч тоотод бүртгэлтэй байх ёстой.
 *
 * tokenFrom(cookieHeader, url) - cookie-ийн token, байхгүй бол ?token= (mobile)
 * identify(token) - { role, unitId, entrance (оршин суугчийн орцны дугаар) } эсвэл null (token буруу, эрх хаагдсан)
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

  var user = await db('users')
    .join('units', 'units.id', 'users.unit_id')
    .join('entrances', 'entrances.id', 'units.entrance_id')
    .select('users.unit_id', 'entrances.number')
    .where('users.id', payload.id)
    .first();
  if (!user) return null;
  return { role: 'user', unitId: user.unit_id, entrance: user.number };
}

module.exports = { tokenFrom, identify };
