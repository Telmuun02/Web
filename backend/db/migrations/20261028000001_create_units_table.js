// Тоот (байр) — '1-12' гэвэл 1-р орцны 12 тоот
async function up(knex) {
  await knex.schema.createTable('units', function (t) {
    t.increments('id');
    t.string('code', 16).notNullable().unique();
    t.tinyint('entrance').unsigned().notNullable(); // орц
    t.tinyint('floor').unsigned();
    t.decimal('area_m2', 6, 2); // талбай — хураамжийг м²-ээр бодох бол хэрэгтэй
    t.timestamps(true, true);

    t.index('entrance');
  });
}

async function down(knex) {
  await knex.schema.dropTable('units');
}

module.exports = { up, down };
