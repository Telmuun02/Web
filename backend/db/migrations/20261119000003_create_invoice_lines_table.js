/**
 * invoice_lines хүснэгт - нэхэмжлэлийн задаргаа (СӨХ хураамж, лифт, хамгаалалт, хог...)
 * Мөрүүдийн нийлбэр = invoices.amount. Мөр нь нэхэмжлэлийн нэг хэсэг тул нэхэмжлэлтэйгээ хамт устна (CASCADE),
 * нэхэмжлэл өөрөө төлбөртэй бол payments-ийн RESTRICT устгахыг зөвшөөрөхгүй
 *
 * up(knex) - хүснэгт үүсгэнэ
 * down(knex) - хүснэгт устгана
 */

async function up(knex) {
  await knex.schema.createTable('invoice_lines', function (t) {
    t.increments('id');
    t.integer('invoice_id').unsigned().notNullable().references('invoices.id').onDelete('CASCADE');
    t.tinyint('position').unsigned().notNullable();
    t.string('name', 100).notNullable();
    t.integer('amount').unsigned().notNullable();
    t.unique(['invoice_id', 'position']);
  });
}

async function down(knex) {
  await knex.schema.dropTable('invoice_lines');
}

module.exports = { up, down };
