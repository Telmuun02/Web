// Туршилтын хэрэглэгчид: admin1, admin2 (ажилтан), user1, user2 (оршин суугч)
//   npm run seed
// Дахин ажиллуулж болно — имэйлээр нь upsert хийнэ, бусад хэрэглэгчийг устгахгүй.
// 01_demo_invoices.js нь user1, user2-ийг 1-01, 1-02 тоотод холбоно.
// Бүгдийн нууц үг: password123
var bcrypt = require('bcryptjs');

var BCRYPT_ROUNDS = 12;
var PASSWORD = 'password123';

var ADMINS = [
  { name: 'Admin 1', email: 'admin1@sokh.mn', phone: '99110001', position: 'chairman' },
  { name: 'Admin 2', email: 'admin2@sokh.mn', phone: '99110002', position: 'accountant' },
];

var USERS = [
  { name: 'User 1', email: 'user1@sokh.mn', phone: '88110001' },
  { name: 'User 2', email: 'user2@sokh.mn', phone: '88110002' },
];

// Имэйлээр нь байвал шинэчилнэ, үгүй бол нэмнэ
async function upsert(knex, table, rows, passwordHash) {
  for (var item of rows) {
    var row = { ...item, password_hash: passwordHash };
    var existing = await knex(table).where({ email: item.email }).first();
    if (existing) {
      await knex(table).where({ id: existing.id }).update({ ...row, updated_at: knex.fn.now() });
    } else {
      await knex(table).insert(row);
    }
  }
}

async function seed(knex) {
  var passwordHash = await bcrypt.hash(PASSWORD, BCRYPT_ROUNDS); // нэг удаа — бүгдэд ижил

  await upsert(knex, 'admins', ADMINS, passwordHash);
  await upsert(knex, 'users', USERS, passwordHash);
}

module.exports = { seed };
