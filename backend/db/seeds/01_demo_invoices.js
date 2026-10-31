// Самбарыг турших хуурамч өгөгдөл: 120 тоот, сүүлийн 12 сарын нэхэмжлэл, төлбөр
//   npm run seed
// Дахин ажиллуулж болно — тоот, нэхэмжлэл, төлбөрийг устгаад шинээр үүсгэнэ. users-ийг устгахгүй.

var ENTRANCES = 3;
var UNITS_PER_ENTRANCE = 40;
var MONTHS = 12;

// Тогтмол "санамсаргүй" тоо — seed бүрд ижил өгөгдөл гарна
function random(seed) {
  var x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
}

// Date → 'YYYY-MM-DD'
function toDate(date) {
  return date.getFullYear() + '-' + String(date.getMonth() + 1).padStart(2, '0') + '-' + String(date.getDate()).padStart(2, '0');
}

// Энэ сараас monthsAgo сарын өмнөх сарын day-ний өдөр
function monthDay(monthsAgo, day) {
  var d = new Date();
  d.setDate(1);
  d.setMonth(d.getMonth() - monthsAgo);
  d.setDate(day);
  return d;
}

// Тоот энэ сард хэр төлсөн бэ: 1 = бүтэн, 0.5 = хагас, 0 = төлөөгүй
function paidShare(unitIndex, monthsAgo) {
  var r = random(unitIndex * 100 + monthsAgo);

  // Энэ сар — төлөх хугацаа дуусаагүй тул олон тоот төлөөгүй байна
  if (monthsAgo === 0) return r < 0.75 ? 1 : r < 0.8 ? 0.5 : 0;

  // Өртэй 14 тоот — сүүлийн 1–3 сард төлөөгүй
  if (unitIndex % 9 === 4) {
    var debtMonths = 1 + (unitIndex % 3);
    if (monthsAgo <= debtMonths) return monthsAgo === debtMonths && r < 0.4 ? 0.5 : 0;
  }
  return 1;
}

async function seed(knex) {
  await knex('payments').del();
  await knex('invoices').del();
  await knex('units').del(); // users.unit_id нь SET NULL болно

  // 1. Тоотууд: 1-01 … 3-120
  var units = [];
  for (var e = 1; e <= ENTRANCES; e++) {
    for (var i = 1; i <= UNITS_PER_ENTRANCE; i++) {
      var n = (e - 1) * UNITS_PER_ENTRANCE + i;
      units.push({
        code: e + '-' + String(n).padStart(2, '0'),
        entrance: e,
        floor: Math.ceil(i / 4),
        area_m2: 45 + Math.round(random(n) * 45),
      });
    }
  }
  await knex('units').insert(units);
  var unitRows = await knex('units').select('id', 'code').orderBy('id');

  // Оршин суугч хэрэглэгчдийг эхний тоотуудад холбоно — debtors-д нэр нь гарна
  var residents = await knex('users').select('id').where({ role: 'user' }).orderBy('id');
  for (var r = 0; r < residents.length; r++) {
    await knex('users').where({ id: residents[r].id }).update({ unit_id: unitRows[r].id });
  }

  // 2. Нэхэмжлэл: сүүлийн 12 сар. 5 сарын өмнөөс хураамж 81,700 → 85,000₮
  var invoices = [];
  unitRows.forEach(function (unit, u) {
    for (var m = MONTHS - 1; m >= 0; m--) {
      var share = paidShare(u, m);
      invoices.push({
        unit_id: unit.id,
        period: toDate(monthDay(m, 1)),
        amount: m <= 5 ? 85000 : 81700,
        due_date: toDate(monthDay(m - 1, 10)), // дараа сарын 10-нд төлнө
        status: share === 1 ? 'paid' : share > 0 ? 'partial' : 'unpaid',
      });
    }
  });
  await knex.batchInsert('invoices', invoices, 500);

  // 3. Төлбөр: төлсөн нэхэмжлэл бүрд нэг төлбөр
  var invoiceRows = await knex('invoices').select('id', 'unit_id', 'period', 'amount').orderBy('id');
  var unitIndex = {};
  unitRows.forEach(function (unit, u) { unitIndex[unit.id] = u; });

  // '2026-10-01' → 0 (хэдэн сарын өмнөх вэ)
  var monthsAgoOf = {};
  for (var m = 0; m < MONTHS; m++) monthsAgoOf[toDate(monthDay(m, 1))] = m;

  var methods = ['bank', 'qpay', 'cash', 'card'];
  var today = new Date().getDate();
  var payments = [];
  invoiceRows.forEach(function (inv) {
    var u = unitIndex[inv.unit_id];
    var m = monthsAgoOf[inv.period];
    var share = paidShare(u, m);
    if (share === 0) return;

    var day = 3 + Math.floor(random(inv.id) * 25);
    if (m === 0) day = Math.min(day, today); // энэ сарын төлбөр ирээдүйд байж болохгүй
    payments.push({
      invoice_id: inv.id,
      amount: Math.round(inv.amount * share),
      method: methods[inv.id % methods.length],
      paid_at: toDate(monthDay(m, day)) + ' 12:00:00',
    });
  });
  await knex.batchInsert('payments', payments, 500);
}

module.exports = { seed };
