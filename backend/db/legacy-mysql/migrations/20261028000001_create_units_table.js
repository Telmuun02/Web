/**
 * units хүснэгт - тоот. '1-12' гэвэл 1-р орцны 12 тоот
 * (05_restructure-д entrance багана → entrance_id болсон)
 *
 * up(knex) - хүснэгт үүсгэнэ
 * down(knex) - хүснэгт устгана
 */

async function up(knex) {
  await knex.schema.createTable('units', function (t) {
    t.increments('id');
    t.string('code', 16).notNullable().unique();
    t.tinyint('entrance').unsigned().notNullable();
    t.tinyint('floor').unsigned();
    t.decimal('area_m2', 6, 2);
    t.timestamps(true, true);

    t.index('entrance');
  });
}

async function down(knex) {
  await knex.schema.dropTable('units');
}

module.exports = { up, down };
