// Ажилтнууд (admins): admin1@sokh.mn … admin9@sokh.mn, нууц үг 11111111 … 99999999 (дугаараа 8 давтана)
// Орц бүрийг хариуцах засварчин, бэлэн төлбөр бүртгэсэн нягтлан
//   npm run seed
// 01_demo_invoices.js-ийн орц, төлбөр байх ёстой.
// Дахин ажиллуулж болно: @sokh.mn ажилтнуудыг устгаад шинээр үүсгэнэ.
var bcrypt = require('bcryptjs');

var DOMAIN = '@sokh.mn';

// Дугаар нь массивын индекс + 1 → admin1, admin2, …
var STAFF = [
  { name: 'Д. Батбаяр', phone: '99001001', position: 'chairman', hired_at: '2019-03-01' },
  { name: 'О. Сарантуяа', phone: '99001002', position: 'accountant', hired_at: '2020-01-15' },
  { name: 'Г. Номин', phone: '99001003', position: 'accountant', hired_at: '2023-09-01' },
  { name: 'Б. Ганзориг', phone: '99001004', position: 'technician', hired_at: '2019-05-10' }, // сантехник
  { name: 'Ц. Энхтөр', phone: '99001005', position: 'technician', hired_at: '2021-04-01' }, // цахилгаан
  { name: 'Л. Мөнхбат', phone: '99001006', position: 'technician', hired_at: '2022-02-20' }, // лифт
  { name: 'Э. Оюунчимэг', phone: '99001007', position: 'staff', hired_at: '2020-06-01' }, // цэвэрлэгээ
  { name: 'Х. Ариунаа', phone: '99001008', position: 'staff', hired_at: '2024-03-01' }, // 1-01-д амьдардаг — 03_demo_users.js
  { name: 'С. Должин', phone: '99001009', position: 'staff', hired_at: '2018-08-01', active: false }, // ажлаас гарсан
];

// Орцыг хариуцах засварчин: орцны дугаар → имэйл
var MANAGERS = { 1: 'admin4@sokh.mn', 2: 'admin5@sokh.mn', 3: 'admin6@sokh.mn' };
var ACCOUNTANTS = ['admin2@sokh.mn', 'admin3@sokh.mn'];

// 1 → 11111111, 2 → 22222222
function password(n) {
  return String(n).repeat(8).slice(0, 8);
}

async function seed(knex) {
  // 0. Ажилтан руу заасан хүснэгтүүд RESTRICT — эхлээд тэднийг устгана, 04–06 seed шинээр үүсгэнэ
  await knex('poll_votes').del();
  await knex('poll_options').del();
  await knex('polls').del();
  await knex('announcements').del();
  await knex('requests').del();
  await knex('entrances').update({ manager_id: null });
  await knex('payments').update({ recorded_by: null });
  await knex('admins').where('email', 'like', '%' + DOMAIN).del();

  // 1. Ажилтнууд
  var staff = {}; // имэйл → id
  for (var i = 0; i < STAFF.length; i++) {
    var email = 'admin' + (i + 1) + DOMAIN;
    var passwordHash = await bcrypt.hash(password(i + 1), 10);
    [staff[email]] = await knex('admins').insert({ active: true, ...STAFF[i], email: email, password_hash: passwordHash });
  }

  // 2. Орц бүрийг хариуцах засварчин
  var entrances = await knex('entrances').select('id', 'number');
  for (var e of entrances) {
    await knex('entrances').where({ id: e.id }).update({ manager_id: staff[MANAGERS[e.number]] || null });
  }

  // 3. Бэлэн, картын төлбөрийг нягтлан бүртгэнэ — банк, QPay автоматаар орно
  await knex('payments').whereIn('method', ['cash', 'card']).whereRaw('id % 2 = 0').update({ recorded_by: staff[ACCOUNTANTS[0]] });
  await knex('payments').whereIn('method', ['cash', 'card']).whereRaw('id % 2 = 1').update({ recorded_by: staff[ACCOUNTANTS[1]] });
}

module.exports = { seed };
