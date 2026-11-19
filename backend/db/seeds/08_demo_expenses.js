/**
 * Зарлага: сүүлийн 12 сарын зарлага ангилал бүрээр, нягтлан (admin2@sokh.mn) бүртгэсэн
 * Сарын зарлага ~8 сая₮, орлого ~10 сая₮ тул нөөц сан аажмаар өснө. Өвөл дулаан, ус илүү.
 * Энэ сарын зарлагаас зөвхөн өнөөдрийг хүртэл гарсан нь орно.
 * 02_demo_admins.js-ийн дараа ажиллана. expenses-ийг устгаад шинээр үүсгэнэ.
 *
 * ITEMS - ангилал, нэр, сарын үндсэн дүн, зарцуулдаг өдөр
 * random(seed) - тогтмол "санамсаргүй" тоо
 * monthDay(monthsAgo, day) - энэ сараас monthsAgo сарын өмнөх сарын day-ний өдөр
 * toDate(date) - Date → 'YYYY-MM-DD'
 * seed(knex) - 12 сарын зарлагыг оруулна
 */

var MONTHS = 12;

var ITEMS = [
  { category: 'salary', title: 'Ажилчдын цалин', amount: 3200000, day: 5 },
  { category: 'utilities', title: 'Нийтийн дулаан, ус', amount: 1500000, day: 15, winter: 700000 },
  { category: 'elevator', title: 'Лифтний үйлчилгээ', amount: 1100000, day: 10 },
  { category: 'cleaning', title: 'Цэвэрлэгээ', amount: 900000, day: 20 },
  { category: 'electricity', title: 'Нийтийн цахилгаан', amount: 650000, day: 18 },
  { category: 'repair', title: 'Засвар үйлчилгээ', amount: 400000, day: 25, spread: 800000 },
  { category: 'other', title: 'Бичиг хэрэг, банкны шимтгэл', amount: 150000, day: 28 },
];

function random(seed) {
  var x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
}

function monthDay(monthsAgo, day) {
  var d = new Date();
  d.setDate(1);
  d.setMonth(d.getMonth() - monthsAgo);
  d.setDate(day);
  return d;
}

function toDate(date) {
  return date.getFullYear() + '-' + String(date.getMonth() + 1).padStart(2, '0') + '-' + String(date.getDate()).padStart(2, '0');
}

async function seed(knex) {
  await knex('expenses').del();

  var accountant = await knex('admins').where({ email: 'admin2@sokh.mn' }).first();
  var today = new Date();
  var rows = [];

  for (var m = MONTHS - 1; m >= 0; m--) {
    var month = monthDay(m, 1).getMonth() + 1;
    var winter = month >= 10 || month <= 3;

    ITEMS.forEach(function (item, i) {
      var spentAt = monthDay(m, item.day);
      if (spentAt > today) return;

      var amount = item.amount;
      if (item.winter && winter) amount += item.winter;
      if (item.spread) amount += Math.round((random(m * 10 + i) * item.spread) / 1000) * 1000;

      rows.push({
        period: toDate(monthDay(m, 1)),
        category: item.category,
        title: item.title,
        amount: amount,
        spent_at: toDate(spentAt),
        recorded_by: accountant ? accountant.id : null,
      });
    });
  }

  await knex.batchInsert('expenses', rows, 200);
}

module.exports = { seed };
