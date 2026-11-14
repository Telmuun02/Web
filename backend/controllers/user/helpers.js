var { Users, Units } = require('../../db/models');
var log = require('../../lib/logger').child({ module: 'user' });

// Оршин суугчийн controller-уудад нийтлэг туслах функцүүд

// Нэвтэрсэн оршин суугч + түүний тоот (орцны дугаар, entrance_id, building_id-тэй).
// Хэрэглэгчийг ҮРГЭЛЖ token-оос (req.user) авна. Тоотод холбогдоогүй бол unit = null.
// Token хүчинтэй ч хэрэглэгч DB-ээс устсан бол null
async function currentResident(req) {
  var user = await Users.find(req.user.id);
  if (!user) {
    log.warn({ id: req.user.id, url: req.originalUrl, ip: req.ip }, 'Token хүчинтэй, хэрэглэгч олдсонгүй');
    return null;
  }
  var unit = user.unit_id ? await Units.find(user.unit_id) : null;
  return { user: user, unit: unit };
}

// Тоотгүй (эсвэл устсан) оршин суугчид буцаах хариу
function noUnit(req, res) {
  log.warn({ id: req.user.id, url: req.originalUrl }, 'Тоотгүй оршин суугчийн хүсэлт');
  return res.status(404).json({ error: 'Таны тоот бүртгэгдээгүй байна. СӨХ-д хандана уу' });
}

module.exports = { currentResident, noUnit };
