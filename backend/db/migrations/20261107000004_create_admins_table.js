// Ажилтан — СӨХ-ийн дарга, нягтлан, засварчин. users-тэй 1:1 (нэвтрэлт users-ээр)
// user_id нь PK — admins.user_id = users.id тул req.user.id-г шууд ашиглана.
//
// users.role-ыг хасна. Эрхийг хүснэгтээр нь тодорхойлно:
//   оршин суугч — users.unit_id байгаа
//   ажилтан     — admins-д мөртэй
// Нэг хүн хоёулаа байж болно (байрандаа амьдардаг дарга) — нэвтрэхдээ аль нэгийг сонгоно

// Ажилтан руу заах FK-ууд: [хүснэгт, багана]
var staffColumns = [
  ['requests', 'assigned_to'],
  ['polls', 'created_by'],
  ['announcements', 'created_by'],
];

async function up(knex) {
  await knex.schema.createTable('admins', function (t) {
    t.integer('user_id').unsigned().primary().references('users.id').onDelete('CASCADE');
    // дарга, нягтлан, засварчин, бусад ажилтан
    t.enu('position', ['chairman', 'accountant', 'technician', 'staff']).notNullable().defaultTo('staff');
    t.date('hired_at'); // ажилд орсон огноо
    t.timestamps(true, true);
  });

  // Одоогийн admin хэрэглэгчдийг шилжүүлнэ
  await knex.raw("INSERT INTO admins (user_id, position) SELECT id, 'chairman' FROM users WHERE role = 'admin'");

  for (var [table, column] of staffColumns) {
    // admin биш хүн рүү заасан утгыг цэвэрлэнэ — эс тэгвэл шинэ FK үүсэхгүй
    await knex(table).whereNotIn(column, knex('admins').select('user_id')).update({ [column]: null });

    // FK-г users → admins руу шилжүүлнэ
    await knex.schema.alterTable(table, function (t) {
      t.dropForeign(column);
      t.foreign(column).references('admins.user_id').onDelete('SET NULL');
    });
  }

  await knex.schema.alterTable('entrances', function (t) {
    t.integer('manager_id').unsigned().references('admins.user_id').onDelete('SET NULL'); // орцыг хариуцсан ажилтан
  });
  await knex.schema.alterTable('payments', function (t) {
    t.integer('recorded_by').unsigned().references('admins.user_id').onDelete('SET NULL'); // төлбөр бүртгэсэн ажилтан
  });

  await knex.schema.alterTable('users', function (t) {
    t.dropColumn('role');
  });
}

// Эсрэг дарааллаар — role-ыг буцааж, FK-уудыг users руу буцаагаад admins-ийг устгана
async function down(knex) {
  await knex.schema.alterTable('users', function (t) {
    t.enu('role', ['admin', 'user']).notNullable().defaultTo('user');
  });
  await knex.raw("UPDATE users SET role = 'admin' WHERE id IN (SELECT user_id FROM admins)");

  await knex.schema.alterTable('payments', function (t) {
    t.dropForeign('recorded_by');
    t.dropColumn('recorded_by');
  });
  await knex.schema.alterTable('entrances', function (t) {
    t.dropForeign('manager_id');
    t.dropColumn('manager_id');
  });

  for (var [table, column] of staffColumns) {
    await knex.schema.alterTable(table, function (t) {
      t.dropForeign(column);
      t.foreign(column).references('users.id').onDelete('SET NULL');
    });
  }

  await knex.schema.dropTable('admins');
}

module.exports = { up, down };
