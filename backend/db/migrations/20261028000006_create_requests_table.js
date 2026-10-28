// Засварын хүсэлт
async function up(knex) {
  await knex.schema.createTable('requests', function (t) {
    t.increments('id');
    t.integer('unit_id').unsigned().references('units.id').onDelete('SET NULL');
    t.integer('created_by').unsigned().references('users.id').onDelete('SET NULL');
    t.integer('assigned_to').unsigned().references('users.id').onDelete('SET NULL');
    // сантехник, цахилгаан, цэвэрлэгээ, лифт, бусад
    t.enu('category', ['plumbing', 'electrical', 'cleaning', 'elevator', 'other']).notNullable();
    t.string('title', 150).notNullable();
    t.text('description');
    t.enu('status', ['open', 'in_progress', 'resolved', 'rejected']).notNullable().defaultTo('open');
    t.datetime('resolved_at'); // шийдсэн хугацааг (дунджаар 19 цаг) эндээс бодно
    t.timestamps(true, true);

    t.index(['status', 'category']);
  });
}

async function down(knex) {
  await knex.schema.dropTable('requests');
}

module.exports = { up, down };
