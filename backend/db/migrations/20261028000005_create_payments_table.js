// Төлбөр — нэг нэхэмжлэлийг хэд хэдэн удаа хувааж төлж болно
async function up(knex) {
  await knex.schema.createTable('payments', function (t) {
    t.increments('id');
    t.integer('invoice_id').unsigned().notNullable().references('invoices.id').onDelete('CASCADE');
    t.integer('amount').unsigned().notNullable(); // ₮
    t.enu('method', ['cash', 'bank', 'qpay', 'card']).notNullable().defaultTo('bank');
    t.datetime('paid_at').notNullable().defaultTo(knex.fn.now());
    t.string('note', 255);
    t.timestamps(true, true);

    t.index('paid_at');
  });
}

async function down(knex) {
  await knex.schema.dropTable('payments');
}

module.exports = { up, down };
