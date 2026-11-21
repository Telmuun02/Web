/**
 * Туршилтын ажилтнууд: admin1, admin2, user1@sokh.mn (ажилтан). Ажилтан имэйлээр нэвтэрнэ.
 * Оршин суугчид (утсаар нэвтэрдэг, тоотоор нэрлэгддэг) — 03_demo_users.js
 * Дахин ажиллуулж болно - имэйлээр нь upsert хийнэ, бусад хэрэглэгчийг устгахгүй.
 * Бүгдийн нууц үг: password123 (02_demo_admins.js дахин 11111111 гэх мэтээр солино)
 *
 * upsert(knex, table, rows, passwordHash) - имэйлээр нь байвал шинэчилнэ, үгүй бол нэмнэ
 * seed(knex) - ADMINS-ийг оруулна
 */

var bcrypt = require('bcryptjs');

var BCRYPT_ROUNDS = 12;
var PASSWORD = 'password123';

var ADMINS = [
  { name: 'Admin 1', email: 'admin1@sokh.mn', phone: '99110001', position: 'chairman' },
  { name: 'Admin 2', email: 'admin2@sokh.mn', phone: '99110002', position: 'accountant' },
  { name: 'User 1', email: 'user1@sokh.mn', phone: '88110001', position: 'staff' },
];

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
  var passwordHash = await bcrypt.hash(PASSWORD, BCRYPT_ROUNDS);

  await upsert(knex, 'admins', ADMINS, passwordHash);
}

module.exports = { seed };
