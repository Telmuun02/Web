/**
 * expenses хүснэгт - СӨХ-ийн зарлага (цалин, дулаан, лифт, цэвэрлэгээ...)
 * Мөнгөн дүн бүхэл тоогоор (₮). Нөөц сан = нийт цугласан төлбөр - нийт зарлага (тооцоолно, хадгалахгүй)
 * Санхүүгийн түүх тул бүртгэсэн ажилтан руу RESTRICT
 *
 * up(knex) - хүснэгт үүсгэнэ
 * down(knex) - хүснэгт устгана
 */

async function up(knex) {
  await knex.schema.createTable('expenses', function (t) {
    t.increments('id');
    t.date('period').notNullable();
    t.enu('category', ['salary', 'utilities', 'elevator', 'cleaning', 'electricity', 'repair', 'other']).notNullable();
    t.string('title', 150).notNullable();
    t.integer('amount').unsigned().notNullable();
    t.date('spent_at').notNullable();
    t.integer('recorded_by').unsigned().references('admins.id').onDelete('RESTRICT');
    t.timestamps(true, true);
    t.index('period');
  });
}

async function down(knex) {
  await knex.schema.dropTable('expenses');
}

module.exports = { up, down };
