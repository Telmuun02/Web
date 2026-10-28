// Санал хураалт — нэг тоот нэг л санал өгнө
async function up(knex) {
  await knex.schema.createTable('polls', function (t) {
    t.increments('id');
    t.integer('created_by').unsigned().references('users.id').onDelete('SET NULL');
    t.string('title', 150).notNullable();
    t.text('description');
    t.tinyint('threshold_percent').unsigned().notNullable().defaultTo(50); // хүчинтэй болох ирцийн босго
    t.datetime('starts_at').notNullable().defaultTo(knex.fn.now());
    t.datetime('ends_at').notNullable();
    t.timestamps(true, true);
  });

  await knex.schema.createTable('poll_options', function (t) {
    t.increments('id');
    t.integer('poll_id').unsigned().notNullable().references('polls.id').onDelete('CASCADE');
    t.string('label', 150).notNullable();
    t.tinyint('position').unsigned().notNullable().defaultTo(0);
  });

  await knex.schema.createTable('poll_votes', function (t) {
    t.increments('id');
    t.integer('poll_id').unsigned().notNullable().references('polls.id').onDelete('CASCADE');
    t.integer('option_id').unsigned().notNullable().references('poll_options.id').onDelete('CASCADE');
    t.integer('unit_id').unsigned().notNullable().references('units.id').onDelete('CASCADE');
    t.integer('user_id').unsigned().references('users.id').onDelete('SET NULL');
    t.timestamp('created_at').notNullable().defaultTo(knex.fn.now());

    t.unique(['poll_id', 'unit_id']);
  });
}

// Үүсгэснээс эсрэг дарааллаар устгана — FK-тай хүснэгтүүд эхэлж
async function down(knex) {
  await knex.schema.dropTable('poll_votes');
  await knex.schema.dropTable('poll_options');
  await knex.schema.dropTable('polls');
}

module.exports = { up, down };
