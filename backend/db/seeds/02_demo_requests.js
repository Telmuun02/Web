// Самбарыг турших хуурамч засварын хүсэлтүүд: сүүлийн 3 сар
//   npm run seed                                    — бүх seed (тоот, нэхэмжлэлийг ч шинээр үүсгэнэ)
//   npx knex --knexfile db/knexfile.js seed:run --specific=02_demo_requests.js  — зөвхөн хүсэлт
// 01_demo_invoices.js-ийн тоотууд байх ёстой. requests-ийг устгаад шинээр үүсгэнэ.

// Ангилал бүрийн гарчиг, энэ сард ирэх тоо — Dashboard-ийн "Хүсэлт ангиллаар"
var CATEGORIES = {
  plumbing: { count: 14, titles: ['Хоолой гоожиж байна', 'Угаалтуур бөглөрсөн', 'Халуун ус ирэхгүй байна', 'Жорлонгийн сав гоожиж байна'] },
  electrical: { count: 8, titles: ['Шатны гэрэл асахгүй байна', 'Залгуур ажиллахгүй байна', 'Цахилгаан тасарсан'] },
  cleaning: { count: 6, titles: ['Шат цэвэрлээгүй байна', 'Хогийн сав дүүрсэн', 'Подъездийн шал бохир'] },
  elevator: { count: 5, titles: ['Лифт зогссон', 'Лифтний хаалга хаагдахгүй байна'] },
  other: { count: 3, titles: ['Орцны хаалганы код ажиллахгүй', 'Зогсоолд машин саатуулсан'] },
};

// Тогтмол "санамсаргүй" тоо — seed бүрд ижил өгөгдөл гарна
function random(seed) {
  var x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
}

// Өнөөдрөөс daysAgo хоногийн өмнөх hour цаг
function daysAgoAt(daysAgo, hour) {
  var d = new Date();
  d.setDate(d.getDate() - daysAgo);
  d.setHours(hour, 0, 0, 0);
  return d;
}

async function seed(knex) {
  await knex('requests').del();

  var units = await knex('units').select('id').orderBy('id');
  if (!units.length) throw new Error('Эхлээд 01_demo_invoices.js-ийг ажиллуулж тоот үүсгэнэ үү');

  var admin = await knex('users').select('id').where({ role: 'admin' }).first();
  var resident = await knex('users').select('id', 'unit_id').where({ role: 'user' }).whereNotNull('unit_id').first();

  var today = new Date().getDate();
  var requests = [];
  var seq = 0;

  // monthIndex 0 = энэ сар, 1 = өмнөх сар, 2 = түүний өмнөх
  for (var monthIndex = 0; monthIndex < 3; monthIndex++) {
    Object.keys(CATEGORIES).forEach(function (category) {
      var cat = CATEGORIES[category];
      var count = monthIndex === 0 ? cat.count : Math.round(cat.count * (0.7 + random(monthIndex * 7 + cat.count) * 0.5));

      for (var i = 0; i < count; i++) {
        seq++;
        var r = random(seq);

        // Энэ сарынх бол сарын эхнээс өнөөдөр хүртэл, өмнөх сарынх бол тухайн сард
        var daysAgo = monthIndex === 0
          ? Math.floor(r * (today - 1))
          : today + (monthIndex - 1) * 30 + Math.floor(r * 29);
        var createdAt = daysAgoAt(daysAgo, 8 + Math.floor(random(seq + 1) * 12));

        // Төлөв: энэ сарын сүүлийн хүсэлтүүд нээлттэй, бусад нь ихэвчлэн шийдэгдсэн.
        // Огнооноос тусдаа тоо — эс бөгөөс сүүлийн өдрүүдийнх үргэлж ижил төлөвтэй болно
        var s = random(seq + 5);
        var status = 'resolved';
        if (monthIndex === 0 && daysAgo <= 3) status = s < 0.5 ? 'open' : 'in_progress';
        else if (monthIndex === 0 && s < 0.12) status = 'in_progress';
        else if (s > 0.95) status = 'rejected';

        // Шийдсэн хугацаа 3–40 цаг (дунджаар ~20)
        var resolvedAt = null;
        if (status === 'resolved') {
          resolvedAt = new Date(createdAt.getTime() + (3 + Math.floor(random(seq + 2) * 38)) * 3600 * 1000);
          if (resolvedAt > new Date()) resolvedAt = new Date();
        }

        // Эхний хэдэн хүсэлтийг бүртгэлтэй оршин суугч илгээсэн
        var fromResident = resident && seq % 6 === 0;

        requests.push({
          unit_id: fromResident ? resident.unit_id : units[Math.floor(random(seq + 3) * units.length)].id,
          created_by: fromResident ? resident.id : null,
          assigned_to: status === 'open' || !admin ? null : admin.id,
          category: category,
          title: cat.titles[seq % cat.titles.length],
          status: status,
          resolved_at: resolvedAt,
          created_at: createdAt,
          updated_at: resolvedAt || createdAt,
        });
      }
    });
  }

  await knex.batchInsert('requests', requests, 200);
}

module.exports = { seed };
