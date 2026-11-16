/**
 * requests хүснэгт - засварын хүсэлт (ангилал, төлөв, засварчин)
 *
 * up(knex) - хүснэгт үүсгэнэ
 * down(knex) - хүснэгт устгана
 */

async function up(knex) {
  await knex.schema.createTable('requests', function (t) {
    t.increments('id');
    t.integer('unit_id').unsigned().references('units.id').onDelete('SET NULL');
    t.integer('created_by').unsigned().references('users.id').onDelete('SET NULL');
    t.integer('assigned_to').unsigned().references('users.id').onDelete('SET NULL');
    t.enu('category', ['plumbing', 'electrical', 'cleaning', 'elevator', 'other']).notNullable();
    t.string('title', 150).notNullable();
    t.text('description');
    t.enu('status', ['open', 'in_progress', 'resolved', 'rejected']).notNullable().defaultTo('open');
    t.datetime('resolved_at');
    t.timestamps(true, true);

    t.index(['status', 'category']);
  });
}

async function down(knex) {
  await knex.schema.dropTable('requests');
}

module.exports = { up, down };
