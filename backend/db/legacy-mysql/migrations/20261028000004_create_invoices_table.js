/**
 * invoices хүснэгт - нэхэмжлэл, тоот бүрт сар бүр нэг: unique(unit_id, period)
 *
 * up(knex) - хүснэгт үүсгэнэ
 * down(knex) - хүснэгт устгана
 */

async function up(knex) {
  await knex.schema.createTable('invoices', function (t) {
    t.increments('id');
    t.integer('unit_id').unsigned().notNullable().references('units.id').onDelete('CASCADE');
    t.date('period').notNullable();
    t.integer('amount').unsigned().notNullable();
    t.date('due_date').notNullable();
    t.enu('status', ['unpaid', 'partial', 'paid']).notNullable().defaultTo('unpaid');
    t.timestamps(true, true);

    t.unique(['unit_id', 'period']);
    t.index(['period', 'status']);
  });
}

async function down(knex) {
  await knex.schema.dropTable('invoices');
}

module.exports = { up, down };
