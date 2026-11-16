/**
 * announcements хүснэгт - СӨХ-өөс оршин суугчдад зарлал
 * (06_fix_relations-д audience → entrance_id болсон)
 *
 * up(knex) - хүснэгт үүсгэнэ
 * down(knex) - хүснэгт устгана
 */

async function up(knex) {
  await knex.schema.createTable('announcements', function (t) {
    t.increments('id');
    t.integer('created_by').unsigned().references('users.id').onDelete('SET NULL');
    t.string('title', 150).notNullable();
    t.text('body').notNullable();
    t.string('audience', 16).notNullable().defaultTo('all');
    t.boolean('sms').notNullable().defaultTo(false);
    t.boolean('important').notNullable().defaultTo(false);
    t.timestamps(true, true);
    t.index('created_at');
  });
}

async function down(knex) {
  await knex.schema.dropTable('announcements');
}

module.exports = { up, down };
