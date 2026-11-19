/**
 * Оршин суугчийн controller-уудад нийтлэг туслах функцүүд
 *
 * currentResident(req) - нэвтэрсэн оршин суугч + тоот { user, unit } (token-оос)
 * noUnit(req, res) - тоотгүй эсвэл устсан оршин суугчид буцаах хариу
 */

var { Users, Units } = require('../../db/models');
var log = require('../../lib/logger').child({ module: 'user' });

async function currentResident(req) {
  var user = await Users.find(req.user.id);
  if (!user) {
    log.warn({ id: req.user.id, url: req.originalUrl, ip: req.ip }, 'Token хүчинтэй, хэрэглэгч олдсонгүй');
    return null;
  }
  var unit = user.unit_id ? await Units.find(user.unit_id) : null;
  return { user: user, unit: unit };
}

function noUnit(req, res) {
  log.warn({ id: req.user.id, url: req.originalUrl }, 'Тоотгүй оршин суугчийн хүсэлт');
  return res.status(404).json({ error: 'Таны тоот бүртгэгдээгүй байна. СӨХ-д хандана уу' });
}

module.exports = { currentResident, noUnit };
