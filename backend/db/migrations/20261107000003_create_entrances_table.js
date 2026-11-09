// Орц — байр бүр хэд хэдэн орцтой. Тоот нь (building_id, entrance)-аар орцондоо холбогдоно
async function up(knex) {
  await knex.schema.createTable('entrances', function (t) {
    t.increments('id');
    t.integer('building_id').unsigned().notNullable().references('buildings.id').onDelete('RESTRICT');
    t.tinyint('number').unsigned().notNullable();        // орцны дугаар: 1, 2, 3
    t.tinyint('floors').unsigned();                      // давхрын тоо
    t.boolean('has_elevator').notNullable().defaultTo(true);
    t.string('door_code', 20);                           // хаалганы код
    t.integer('leader_id').unsigned().references('users.id').onDelete('SET NULL'); // орцны ахлагч
    t.timestamps(true, true);

    t.unique(['building_id', 'number']);                 // нэг байранд 2-р орц нэг л байна
  });

  // Одоо байгаа тоотуудын орцыг үүсгэнэ — эс тэгвэл доорх FK үүсэхгүй
  await knex.raw(
    'INSERT INTO entrances (building_id, number, floors) ' +
      'SELECT u.building_id, u.entrance, b.floors FROM units u JOIN buildings b ON b.id = u.building_id ' +
      'GROUP BY u.building_id, u.entrance, b.floors'
  );

  // Байхгүй орцонд тоот нэмэх боломжгүй. Тоот байгаа орцыг устгах боломжгүй
  await knex.schema.alterTable('units', function (t) {
    t.foreign(['building_id', 'entrance']).references(['building_id', 'number']).inTable('entrances').onDelete('RESTRICT');
  });

  // Орцны тоог entrances-ээс тоолно — давхар хадгалахгүй
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
    t.dropIndex(['building_id', 'entrance'], 'units_building_id_entrance_foreign'); // FK-д MySQL автоматаар үүсгэсэн index
  });
  await knex.schema.dropTable('entrances');
}

module.exports = { up, down };
