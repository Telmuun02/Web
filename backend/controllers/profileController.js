var bcrypt = require('bcryptjs');
var { Users } = require('../db/models');

/**
 * update -- нэвтэрсэн хэрэглэгч өөрийн хувийн мэдээллийг солино
 *   PUT /api/profile — { name, phone, email, password }
 * Нэвтэрсэн ч гэсэн одоогийн нууц үгээ дахин оруулж баталгаажуулна
 * (компьютерээ нээлттэй орхисон үед өөр хүн мэдээллийг нь солихоос хамгаална)
 * Хариу: шинэчлэгдсэн хэрэглэгч (password_hash-гүй)
 */
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

    var user = await Users.findWithPassword(req.user.id);

    if (!user) {
      return res.status(401).json({ error: 'Хэрэглэгч олдсонгүй' });
    }

    var ok = user.password_hash && (await bcrypt.compare(password, user.password_hash));
    if (!ok) {
      return res.status(401).json({ error: 'Нууц үг буруу байна' });
    }

    // Зөвхөн эдгээр талбарыг солино — role, unit_id-г хэрэглэгч өөрөө өөрчилж болохгүй
    var updated = await Users.update(user.id, { name: name, phone: phone, email: email });

    res.json(updated);
  } catch (err) {
    // phone, email нь unique — өөр хэрэглэгч ашиглаж байвал MySQL энэ алдааг өгнө
    if (err.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ error: 'Энэ утас эсвэл имэйлийг өөр хэрэглэгч ашиглаж байна' });
    }
    next(err);
  }
}

module.exports = { update };
