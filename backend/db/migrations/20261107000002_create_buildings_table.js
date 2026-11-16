/**
 * buildings хүснэгт - СӨХ-ийн удирддаг байр. Нэг байранд олон тоот
 *
 * up(knex) - хүснэгт үүсгэнэ
 * down(knex) - хүснэгт устгана
 */

async function up(knex) {
  await knex.schema.createTable('buildings', function (t) {
    t.increments('id');
    t.string('name', 100).notNullable();
    t.string('address', 255).notNullable();
    t.string('district', 50);
    t.string('khoroo', 20);
    t.tinyint('entrances').unsigned().notNullable();
    t.tinyint('floors').unsigned().notNullable();
    t.smallint('built_year').unsigned();
    t.string('phone', 20);
    t.string('bank_name', 50);
    t.string('bank_account', 30);
    t.timestamps(true, true);
  });

  await knex.schema.alterTable('units', function (t) {
    t.integer('building_id').unsigned().references('buildings.id').onDelete('RESTRICT');
    t.dropUnique(['code']);
    t.unique(['building_id', 'code']);
  });
}

async function down(knex) {
  await knex.schema.alterTable('units', function (t) {
    t.dropUnique(['building_id', 'code']);
    t.dropForeign('building_id');
    t.dropColumn('building_id');
    t.unique(['code']);
  });
  await knex.schema.dropTable('buildings');
}

module.exports = { up, down };
