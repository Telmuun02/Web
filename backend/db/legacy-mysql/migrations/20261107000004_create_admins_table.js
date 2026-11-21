/**
 * admins хүснэгт - ажилтан (дарга, нягтлан, засварчин). users-тэй 1:1 (нэвтрэлт users-ээр)
 * user_id нь PK - admins.user_id = users.id тул req.user.id-г шууд ашиглана.
 * (05_restructure-д admins нь users-ээс бүрэн тусдаа болсон)
 *
 * users.role-ыг хасна. Эрхийг хүснэгтээр нь тодорхойлно:
 *   оршин суугч - users.unit_id байгаа
 *   ажилтан     - admins-д мөртэй
 * Нэг хүн хоёулаа байж болно (байрандаа амьдардаг дарга) - нэвтрэхдээ аль нэгийг сонгоно
 *
 * up(knex) - admins үүсгэж, ажилтан руу заах FK-уудыг (staffColumns) admins руу шилжүүлнэ
 * down(knex) - эсрэг дарааллаар: role-ыг буцааж, FK-уудыг users руу буцаагаад admins-ийг устгана
 */

var staffColumns = [
  ['requests', 'assigned_to'],
  ['polls', 'created_by'],
  ['announcements', 'created_by'],
];

async function up(knex) {
  await knex.schema.createTable('admins', function (t) {
    t.integer('user_id').unsigned().primary().references('users.id').onDelete('CASCADE');
    t.enu('position', ['chairman', 'accountant', 'technician', 'staff']).notNullable().defaultTo('staff');
    t.date('hired_at');
    t.timestamps(true, true);
  });

  await knex.raw("INSERT INTO admins (user_id, position) SELECT id, 'chairman' FROM users WHERE role = 'admin'");

  for (var [table, column] of staffColumns) {
    await knex(table).whereNotIn(column, knex('admins').select('user_id')).update({ [column]: null });

    await knex.schema.alterTable(table, function (t) {
      t.dropForeign(column);
      t.foreign(column).references('admins.user_id').onDelete('SET NULL');
    });
  }

  await knex.schema.alterTable('entrances', function (t) {
    t.integer('manager_id').unsigned().references('admins.user_id').onDelete('SET NULL');
  });
  await knex.schema.alterTable('payments', function (t) {
    t.integer('recorded_by').unsigned().references('admins.user_id').onDelete('SET NULL');
  });

  await knex.schema.alterTable('users', function (t) {
    t.dropColumn('role');
  });
}

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
