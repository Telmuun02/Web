/**
 * entrances хүснэгт - орц. Байр бүр хэд хэдэн орцтой
 * Тоот нь (building_id, entrance)-аар орцондоо холбогдоно
 *
 * up(knex) - хүснэгт үүсгэнэ
 * down(knex) - хүснэгт устгана
 */

async function up(knex) {
  await knex.schema.createTable('entrances', function (t) {
    t.increments('id');
    t.integer('building_id').unsigned().notNullable().references('buildings.id').onDelete('RESTRICT');
    t.tinyint('number').unsigned().notNullable();
    t.tinyint('floors').unsigned();
    t.boolean('has_elevator').notNullable().defaultTo(true);
    t.string('door_code', 20);
    t.integer('leader_id').unsigned().references('users.id').onDelete('SET NULL');
    t.timestamps(true, true);

    t.unique(['building_id', 'number']);
  });

  await knex.raw(
    'INSERT INTO entrances (building_id, number, floors) ' +
      'SELECT u.building_id, u.entrance, b.floors FROM units u JOIN buildings b ON b.id = u.building_id ' +
      'GROUP BY u.building_id, u.entrance, b.floors'
  );

  await knex.schema.alterTable('units', function (t) {
    t.foreign(['building_id', 'entrance']).references(['building_id', 'number']).inTable('entrances').onDelete('RESTRICT');
  });

  await knex.schema.alterTable('buildings', function (t) {
    t.dropColumn('entrances');
  });
}

async function down(knex) {
  await knex.schema.alterTable('buildings', function (t) {
    t.tinyint('entrances').unsigned().notNullable().defaultTo(0);
  });
  await knex.raw('UPDATE buildings b SET entrances = (SELECT COUNT(*) FROM entrances e WHERE e.building_id = b.id)');

  await knex.schema.alterTable('units', function (t) {
    t.dropForeign(['building_id', 'entrance']);
    t.dropIndex(['building_id', 'entrance'], 'units_building_id_entrance_foreign');
  });
  await knex.schema.dropTable('entrances');
}

module.exports = { up, down };
