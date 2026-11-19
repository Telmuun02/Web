/**
 * Профайл - /api/resident/profile
 * Хуудас: resident Profile (/profile)
 *
 * show - өөрийн мэдээлэл, тоот, гэр бүл, хугацаандаа төлсөн сарын тоо
 *   GET /api/resident/profile
 * (засах нь PUT /api/profile - controllers/profileController.js)
 */

var { Users, Invoices } = require('../../db/models');
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
        Users.where({ unit_id: me.unit.id }),
        Invoices.onTimeCount(me.unit.id),
      ]);
    }

    log.debug({ id: me.user.id, unit: me.unit ? me.unit.code : null }, 'Профайл хуудас');

    res.json({
      user: me.user,
      unit: me.unit ? { id: me.unit.id, code: me.unit.code, entrance: me.unit.entrance, floor: me.unit.floor } : null,
      family: family.map(function (f) {
        return { id: f.id, name: f.name, me: f.id === me.user.id };
      }),
      on_time_months: onTime,
    });
  } catch (err) {
    next(err);
  }
}

module.exports = { show };
