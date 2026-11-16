/**
 * Оршин суугчид (users): user1@sokh.mn … userN@sokh.mn (~150), нууц үг бүгд 11111111
 * Орц бүрийн ахлагч
 * 01_demo_invoices.js-ийн тоот, 02_demo_admins.js-ийн ажилтнууд байх ёстой.
 * Дахин ажиллуулж болно: @sokh.mn оршин суугчдыг устгаад шинээр үүсгэнэ
 * (requests, poll_votes, entrances дээрх холбоос нь SET NULL).
 *
 * random(seed) - тогтмол "санамсаргүй" тоо
 * pick(list, seed) - жагсаалтаас нэгийг сонгоно
 * residentsFor(units) - тоот бүрт 0–2 оршин суугч үүсгэнэ
 * seed(knex) - оршин суугчид болон орцны ахлагчдыг оруулна
 */

var bcrypt = require('bcryptjs');

var DOMAIN = '@sokh.mn';
var PASSWORD = '11111111';

var STAFF_RESIDENTS = ['admin8@sokh.mn'];

var INITIALS = 'БДГОЦЭНСТЖМАЛХЧПРЯ'.split('');
var MALE = ['Бат-Эрдэнэ', 'Ганбаатар', 'Тэмүүлэн', 'Мөнх-Очир', 'Билгүүн', 'Эрдэнэбат', 'Сүхбат', 'Төгөлдөр', 'Анхбаяр', 'Ганхуяг', 'Батжаргал', 'Пүрэвдорж', 'Энхбаяр', 'Цогтбаяр', 'Хүслэн'];
var FEMALE = ['Анужин', 'Сарнай', 'Оюунаа', 'Мөнхзул', 'Нандин-Эрдэнэ', 'Энхжин', 'Цэцэгмаа', 'Болормаа', 'Хулан', 'Солонго', 'Уянга', 'Номуун', 'Гэрэлмаа', 'Наранцэцэг', 'Индра'];

function random(seed) {
  var x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
}

function pick(list, seed) {
  return list[Math.floor(random(seed) * list.length)];
}

function residentsFor(units) {
  var rows = [];
  units.forEach(function (unit, u) {
    if (random(u * 31 + 7) < 0.12) return;
    var count = random(u * 37 + 3) < 0.45 ? 2 : 1;
    for (var k = 0; k < count; k++) {
      var n = rows.length + 1;
      var female = random(u * 41 + k) < 0.5;
      rows.push({
        unit_id: unit.id,
        name: pick(INITIALS, u * 43 + k) + '. ' + pick(female ? FEMALE : MALE, u * 47 + k * 13),
        phone: '88' + String(200000 + n),
        email: 'user' + n + DOMAIN,
      });
    }
  });
  return rows;
}

async function seed(knex) {
  var units = await knex('units').select('id').orderBy('id');
  if (!units.length) throw new Error('Эхлээд 01_demo_invoices.js-ийг ажиллуулж тоот үүсгэнэ үү');

  await knex('users').where('email', 'like', '%sokh.mn').del();

  var passwordHash = await bcrypt.hash(PASSWORD, 10);

  var residents = residentsFor(units).map(function (r) {
    return { ...r, password_hash: passwordHash };
  });
  await knex.batchInsert('users', residents, 200);

  var staff = await knex('admins').whereIn('email', STAFF_RESIDENTS).select('name', 'phone', 'email');
  for (var s of staff) {
    await knex('users').insert({ ...s, unit_id: units[0].id, password_hash: passwordHash });
  }

  var entrances = await knex('entrances').select('id');
  for (var e of entrances) {
    var leader = await knex('users as us')
      .join('units as u', 'u.id', 'us.unit_id')
      .where('u.entrance_id', e.id)
      .where('us.email', 'like', 'user%' + DOMAIN)
      .orderBy('us.id')
      .select('us.id')
      .first();
    await knex('entrances').where({ id: e.id }).update({ leader_id: leader ? leader.id : null });
  }
}

module.exports = { seed };
