/**
 * Оршин суугчийн бүртгэл — нэг тоот = нэг бүртгэл, тоот бүрт 1–2 утас. Утсаар нэвтэрнэ, нууц үг бүгд 11111111
 *   Утас: 88200001, 88200002 … (тоотуудын ихэнх), өмнө нь хоосон байсан тоотод 99111111, 99111112 …
 *   Нэр нь тоот ("1-01 тоот"), имэйлгүй. Мөн 1-01 тоотод ажилтан admin8-ийн утас (байрандаа амьдардаг ажилтан)
 *   Орц бүрийн ахлагч — тухайн орцны эхний бүртгэл
 * 01_demo_invoices.js-ийн тоот, 02_demo_admins.js-ийн ажилтнууд байх ёстой.
 * Дахин ажиллуулж болно: зөвхөн seed-ийн дугааруудыг (882000xx, 991111xx, ажилтны утас) устгаад шинээр үүсгэнэ.
 * Өөрөө бүртгүүлсэн бодит дугааруудад хүрэхгүй (тоот дахин үүссэн бол ажилтан дахин холбоно).
 *
 * random(seed) - тогтмол "санамсаргүй" тоо
 * phonesFor(units) - тоот бүрт 1–2 утас
 * seed(knex) - утаснууд болон орцны ахлагчдыг оруулна
 */

var bcrypt = require('bcryptjs');

var PASSWORD = '11111111';
var STAFF_RESIDENTS = ['admin8@sokh.mn'];

function random(seed) {
  var x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
}

function phonesFor(units) {
  var rows = [];
  var main = 0;
  var spare = 0;
  units.forEach(function (unit, u) {
    var name = unit.code + ' тоот';
    if (random(u * 31 + 7) < 0.12) {
      spare += 1;
      rows.push({ unit_id: unit.id, name: name, phone: String(99111110 + spare) });
      return;
    }
    var count = random(u * 37 + 3) < 0.45 ? 2 : 1;
    for (var k = 0; k < count; k++) {
      main += 1;
      rows.push({ unit_id: unit.id, name: name, phone: '88' + String(200000 + main) });
    }
  });
  return rows;
}

async function seed(knex) {
  var units = await knex('units').select('id', 'code').orderBy('id');
  if (!units.length) throw new Error('Эхлээд 01_demo_invoices.js-ийг ажиллуулж тоот үүсгэнэ үү');

  var staff = await knex('admins').whereIn('email', STAFF_RESIDENTS).select('phone');
  var staffPhones = staff.map(function (s) { return s.phone; }).filter(Boolean);

  await knex('users')
    .where(function () {
      this.where('phone', 'like', '882_____').orWhere('phone', 'like', '991111__').orWhereIn('phone', staffPhones);
    })
    .del();

  var passwordHash = await bcrypt.hash(PASSWORD, 10);
  var rows = phonesFor(units).map(function (r) {
    return { ...r, password_hash: passwordHash };
  });
  staffPhones.forEach(function (phone) {
    rows.push({ unit_id: units[0].id, name: units[0].code + ' тоот', phone: phone, password_hash: passwordHash });
  });
  await knex.batchInsert('users', rows, 200);

  var entrances = await knex('entrances').select('id');
  for (var e of entrances) {
    var leader = await knex('users as us')
      .join('units as u', 'u.id', 'us.unit_id')
      .where('u.entrance_id', e.id)
      .orderBy('us.id')
      .select('us.id')
      .first();
    await knex('entrances').where({ id: e.id }).update({ leader_id: leader ? leader.id : null });
  }
}

module.exports = { seed };
