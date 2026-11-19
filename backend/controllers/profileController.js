/**
 * Профайл засах - ажилтан, оршин суугч хоёулаа
 * Хуудас: admin Profile (/admin/profile), resident Profile (/profile)
 *
 * update - нэр, утас, имэйл, нууц үг солих. Одоогийн нууц үгээр баталгаажуулна
 *   PUT /api/profile
 */

var bcrypt = require('bcryptjs');
var { Users, Admins } = require('../db/models');
var log = require('../lib/logger').child({ module: 'profile' });

async function update(req, res, next) {
  try {
    var name = String(req.body.name || '').trim();
    var phone = String(req.body.phone || '').trim() || null; 
    var email = String(req.body.email || '').trim().toLowerCase() || null;
    var password = req.body.password;

    if (!password) {
      return res.status(400).json({ error: 'Мэдээллээ солихын тулд нууц үгээ оруулна уу' });
    }
    if (!name) {
      return res.status(400).json({ error: 'Нэрээ оруулна уу' });
    }
    if (!phone && !email) {
      return res.status(400).json({ error: 'Утас эсвэл имэйлийн аль нэгийг оруулна уу' });
    }
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({ error: 'Имэйл буруу байна' });
    }

    var Model = req.user.role === 'admin' ? Admins : Users;
    var user = await Model.findWithPassword(req.user.id);

    if (!user) {
      return res.status(401).json({ error: 'Хэрэглэгч олдсонгүй' });
    }

    var ok = user.password_hash && (await bcrypt.compare(password, user.password_hash));
    if (!ok) {
      log.warn({ id: user.id, as: req.user.role, ip: req.ip }, 'Профайл солих: нууц үг буруу');
      return res.status(401).json({ error: 'Нууц үг буруу байна' });
    }

    var updated = await Model.update(user.id, { name: name, phone: phone, email: email });

    log.info({
      id: user.id,
      as: req.user.role,
      changed: ['name', 'phone', 'email'].filter(function (k) { return user[k] !== updated[k]; }),
    }, 'Профайл шинэчиллээ');

    res.json({ ...updated, role: req.user.role });
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ error: 'Энэ утас эсвэл имэйлийг өөр хэрэглэгч ашиглаж байна' });
    }
    next(err);
  }
}

module.exports = { update };
