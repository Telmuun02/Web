/**
 * Зарлалууд: сүүлийн 3 сар - санал хураалт, орцны код, засвартай уялдсан
 * 02_demo_admins.js-ийн ажилтнууд байх ёстой. announcements-ийг устгаад шинээр үүсгэнэ.
 *
 * seed(knex) - ANNOUNCEMENTS-ийг оруулна
 */

var HOUR = 3600 * 1000;

var ANNOUNCEMENTS = [
  { daysAgo: 80, author: 'admin1@sokh.mn', title: 'Ухаалаг түгжээний санал хураалт эхэллээ', body: 'Орцны хаалгыг ухаалаг түгжээтэй болгох эсэх талаар 14 хоногийн турш санал өгнө үү. Тоот бүр нэг санал.', sms: true, important: true },
  { daysAgo: 74, author: 'admin2@sokh.mn', title: 'Шинэ сарын нэхэмжлэл илгээгдлээ', body: 'Сарын хураамж 85,000₮. Төлөх хугацаа — дараа сарын 10. Хаан банк 5012345678.', sms: true },
  { daysAgo: 64, author: 'admin1@sokh.mn', title: 'Санал хураалтын дүн: ухаалаг түгжээ', body: 'Олонхийн саналаар ухаалаг түгжээ суурилуулахаар шийдлээ. Ажил ирэх сард эхэлнэ.' },
  { daysAgo: 60, author: 'admin1@sokh.mn', title: 'Дулааны улирал эхэллээ', body: 'Радиатор халахгүй, агаар суусан бол апп-аар засварын хүсэлт илгээнэ үү.' },
  { daysAgo: 55, author: 'admin5@sokh.mn', title: 'Шатны гэрэл солих ажил', body: 'Энэ долоо хоногт 3-р орцны шатны гэрлийг LED-ээр солино.', entrance: 3 },
  { daysAgo: 44, author: 'admin2@sokh.mn', title: 'Шинэ сарын нэхэмжлэл илгээгдлээ', body: 'Сарын хураамж 85,000₮. Төлөх хугацаа — дараа сарын 10.', sms: true },
  { daysAgo: 40, author: 'admin1@sokh.mn', title: 'Тоглоомын талбайн санал хураалт', body: 'Хүүхдийн тоглоомын талбайг шинэчлэх эсэх талаар 10 хоног санал авна. Ирцийн босго 60%.', important: true },
  { daysAgo: 33, author: 'admin6@sokh.mn', title: 'Лифтний урсгал засвар', body: 'Маргааш 10:00–14:00 цагт 2-р орцны лифт ажиллахгүй.', entrance: 2, sms: true, important: true },
  { daysAgo: 29, author: 'admin1@sokh.mn', title: 'Тоглоомын талбай: ирц хүрсэнгүй', body: 'Санал хураалтын ирц 60%-д хүрээгүй тул хаврын хурлаар дахин хэлэлцэнэ.' },
  { daysAgo: 25, author: 'admin4@sokh.mn', title: 'Халуун ус хязгаарлана', body: 'Шугамын засвартай холбоотой маргааш 09:00–18:00 цагт халуун ус тасарна.', sms: true, important: true },
  { daysAgo: 20, author: 'admin1@sokh.mn', title: '1-р орцны хаалганы код солигдлоо', body: 'Шинэ код: 101#. Гадны хүнд бүү өгнө үү.', entrance: 1, sms: true, important: true },
  { daysAgo: 16, author: 'admin3@sokh.mn', title: 'Өр төлбөрийн сануулга', body: '2-оос дээш сарын төлбөрөө төлөөгүй айлууд энэ сарын 25-ны дотор төлнө үү.', sms: true },
  { daysAgo: 14, author: 'admin2@sokh.mn', title: 'Шинэ сарын нэхэмжлэл илгээгдлээ', body: 'Сарын хураамж 85,000₮. QPay-ээр апп дотроос төлөх боломжтой.', sms: true },
  { daysAgo: 10, author: 'admin7@sokh.mn', title: 'Цэвэрлэгээний хуваарь өөрчлөгдлөө', body: 'Шатыг Даваа, Пүрэв гаригт угаана. Хогоо уутлан гаргана уу.' },
  { daysAgo: 6, author: 'admin1@sokh.mn', title: 'Зогсоолын хаалтын санал хураалт', body: 'Зогсоолд автомат хаалт суурилуулах эсэх талаар санал өгнө үү.', sms: true, important: true },
  { daysAgo: 4, author: 'admin5@sokh.mn', title: '2-р орцны цахилгаан таслана', body: 'Самбарын засвартай холбоотой 14:00–15:00 цагт цахилгаан тасарна.', entrance: 2, sms: true },
  { daysAgo: 3, author: 'admin4@sokh.mn', title: 'Өвлийн бэлтгэл', body: 'Цонхоо битүүмжилж, тагтны усны хоолойг хөлдөхөөс сэргийлнэ үү.' },
  { daysAgo: 1, author: 'admin1@sokh.mn', title: 'Лифтний засварын сангийн санал хураалт', body: 'Сард 5,000₮-өөр лифтний засварын сан бүрдүүлэх эсэх — 7 хоног санал авна.', important: true },
  { daysAgo: 0, author: 'admin1@sokh.mn', title: 'Ээлжит бус хурал', body: 'Энэ бямба 11:00 цагт 1-р орцны үүдэнд оршин суугчдын хурал болно.', important: true },
];

async function seed(knex) {
  await knex('announcements').del();

  var staff = {};
  (await knex('admins').select('id', 'email')).forEach(function (a) { staff[a.email] = a.id; });
  var entrances = {};
  (await knex('entrances').select('id', 'number')).forEach(function (e) { entrances[e.number] = e.id; });

  var now = Date.now();
  var rows = ANNOUNCEMENTS.map(function (a) {
    var createdAt = new Date(now - a.daysAgo * 24 * HOUR);
    if (a.daysAgo > 0) createdAt.setHours(10, 0, 0, 0);
    else createdAt = new Date(now - 2 * HOUR);
    return {
      created_by: staff[a.author] || null,
      title: a.title,
      body: a.body,
      entrance_id: a.entrance ? entrances[a.entrance] : null,
      sms: !!a.sms,
      important: !!a.important,
      created_at: createdAt,
      updated_at: createdAt,
    };
  });
  await knex('announcements').insert(rows);
}

module.exports = { seed };
