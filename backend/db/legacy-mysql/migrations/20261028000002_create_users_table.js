/**
 * users хүснэгт - хэрэглэгч
 * Анх оршин суугч, ажилтан хоёулаа энд байсан (role). 04, 05-д ажилтныг admins руу салгасан
 *
 * up(knex) - хүснэгт үүсгэнэ
 * down(knex) - хүснэгт устгана
 */

async function up(knex) {
  await knex.schema.createTable('users', function (t) {
    t.increments('id');
    t.integer('unit_id').unsigned().references('units.id').onDelete('SET NULL');
    t.string('name', 100).notNullable();
    t.string('phone', 20).unique();
    t.string('email', 150).unique();
    t.string('password_hash', 255);
    t.enu('role', ['admin', 'user']).notNullable().defaultTo('user');
    t.timestamps(true, true);
  });
}

async function down(knex) {
  await knex.schema.dropTable('users');
}

module.exports = { up, down };
