/**
 * Самбарыг турших хуурамч өгөгдөл: 120 тоот, сүүлийн 12 сарын нэхэмжлэл, төлбөр
 * Дахин ажиллуулж болно - тоот, нэхэмжлэл, төлбөрийг устгаад шинээр үүсгэнэ. users-ийг устгахгүй.
 *
 * random(seed) - тогтмол "санамсаргүй" тоо, seed бүрд ижил өгөгдөл гарна
 * toDate(date) - Date → 'YYYY-MM-DD'
 * monthDay(monthsAgo, day) - энэ сараас monthsAgo сарын өмнөх сарын day-ний өдөр
 * paidShare(unitIndex, monthsAgo) - тоот тухайн сард хэр төлсөн: 1, 0.5, 0
 * seed(knex) - байр, орц, тоот, нэхэмжлэл, төлбөрийг үүсгэнэ
 */

var ENTRANCES = 3;
var UNITS_PER_ENTRANCE = 40;
var MONTHS = 12;

function random(seed) {
  var x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
}

function toDate(date) {
  return date.getFullYear() + '-' + String(date.getMonth() + 1).padStart(2, '0') + '-' + String(date.getDate()).padStart(2, '0');
}

function monthDay(monthsAgo, day) {
  var d = new Date();
  d.setDate(1);
  d.setMonth(d.getMonth() - monthsAgo);
  d.setDate(day);
  return d;
}

function paidShare(unitIndex, monthsAgo) {
  var r = random(unitIndex * 100 + monthsAgo);

  if (monthsAgo === 0) return r < 0.75 ? 1 : r < 0.8 ? 0.5 : 0;

  if (unitIndex % 9 === 4) {
    var debtMonths = 1 + (unitIndex % 3);
    if (monthsAgo <= debtMonths) return monthsAgo === debtMonths && r < 0.4 ? 0.5 : 0;
  }
  return 1;
}

async function seed(knex) {
  await knex('poll_votes').del();
  await knex('announcements').del();
  await knex('payments').del();
  await knex('invoices').del();
  await knex('units').del();
  await knex('entrances').del();
  await knex('buildings').del();

  var FLOORS = Math.ceil(UNITS_PER_ENTRANCE / 4);
  var [buildingId] = await knex('buildings').insert({
    name: '12-р байр',
    address: 'Сүхбаатар дүүрэг, 1-р хороо, 12-р байр',
    district: 'Сүхбаатар',
    khoroo: '1-р хороо',
    built_year: 2015,
    phone: '7711 2233',
    bank_name: 'Хаан банк',
    bank_account: '5012345678',
  });

  var entrances = [];
  for (var en = 1; en <= ENTRANCES; en++) {
    entrances.push({ building_id: buildingId, number: en, floors: FLOORS, door_code: en + '0' + en + '#' });
  }
  await knex('entrances').insert(entrances);
  var entranceIds = {};
  (await knex('entrances').where({ building_id: buildingId })).forEach(function (row) { entranceIds[row.number] = row.id; });

  var units = [];
  for (var e = 1; e <= ENTRANCES; e++) {
    for (var i = 1; i <= UNITS_PER_ENTRANCE; i++) {
      var n = (e - 1) * UNITS_PER_ENTRANCE + i;
      units.push({
        entrance_id: entranceIds[e],
        code: e + '-' + String(n).padStart(2, '0'),
        floor: Math.ceil(i / 4),
        area_m2: 45 + Math.round(random(n) * 45),
      });
    }
  }
  await knex('units').insert(units);
  var unitRows = await knex('units').select('id', 'code').orderBy('id');

  var residents = await knex('users').select('id').whereNot('email', 'like', '%sokh.mn').orderBy('id');
  for (var r = 0; r < residents.length; r++) {
    await knex('users').where({ id: residents[r].id }).update({ unit_id: unitRows[r].id });
  }

  var invoices = [];
  unitRows.forEach(function (unit, u) {
    for (var m = MONTHS - 1; m >= 0; m--) {
      var share = paidShare(u, m);
      invoices.push({
        unit_id: unit.id,
        period: toDate(monthDay(m, 1)),
        amount: m <= 5 ? 85000 : 81700,
        due_date: toDate(monthDay(m - 1, 10)),
        status: share === 1 ? 'paid' : share > 0 ? 'partial' : 'unpaid',
      });
    }
  });
  await knex.batchInsert('invoices', invoices, 500);

  var invoiceRows = await knex('invoices').select('id', 'unit_id', 'period', 'amount').orderBy('id');
  var unitIndex = {};
  unitRows.forEach(function (unit, u) { unitIndex[unit.id] = u; });

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
    if (m === 0) day = Math.min(day, today);
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
