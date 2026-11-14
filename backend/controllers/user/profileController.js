var { Users, Invoices } = require('../../db/models');
var { currentResident } = require('./helpers');
var log = require('../../lib/logger').child({ module: 'user/profile' });

/**
 * show -- Профайл хуудас
 *   GET /api/resident/profile →
 *   {
 *     user:           { id, unit_id, name, phone, email, ... },
 *     unit:           { id, code, entrance, floor } | null,
 *     family:         [{ id, name, me }] — нэг тоотод бүртгэлтэй хүмүүс,
 *     on_time_months: сүүлийн 12 сард хугацаандаа төлсөн сарын тоо
 *   }
 * Мэдээлэл засах нь PUT /api/profile (controllers/profileController.js) хэвээр
 */
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
      // Гэр бүлийн гишүүдийн утас, имэйлийг ил гаргахгүй — зөвхөн нэр
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
