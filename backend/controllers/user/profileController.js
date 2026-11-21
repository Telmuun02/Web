/**
 * Профайл - /api/resident/profile
 * Хуудас: resident Profile (/profile)
 *
 * show - өөрийн мэдээлэл, тоот, гэр бүл (апп-д нэвтэрч чадах эсэхтэй), хугацаандаа төлсөн сарын тоо
 *   GET /api/resident/profile
 * (засах нь PUT /api/profile - controllers/profileController.js)
 */

var db = require('../../db');
var { Invoices } = require('../../db/models');
var { currentResident } = require('./helpers');
var log = require('../../lib/logger').child({ module: 'user/profile' });

async function show(req, res, next) {
  try {
    var me = await currentResident(req);
    if (!me) return res.status(401).json({ error: 'Хэрэглэгч олдсонгүй' });

    var family = [];
    var onTime = 0;
    if (me.unit) {
      [family, onTime] = await Promise.all([
        db('users').select('id', 'name', 'phone').select(db.raw('password_hash IS NOT NULL AS has_app')).where({ unit_id: me.unit.id }).orderBy('id'),
        Invoices.onTimeCount(me.unit.id),
      ]);
    }

    log.debug({ id: me.user.id, unit: me.unit ? me.unit.code : null }, 'Профайл хуудас');

    res.json({
      user: me.user,
      unit: me.unit ? { id: me.unit.id, code: me.unit.code, entrance: me.unit.entrance, floor: me.unit.floor } : null,
      family: family.map(function (f) {
        return { id: f.id, phone: f.phone, me: f.id === me.user.id, app: Boolean(f.has_app) };
      }),
      on_time_months: onTime,
    });
  } catch (err) {
    next(err);
  }
}

module.exports = { show };
