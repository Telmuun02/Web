// Хэрэглэгч — оршин суугч (user) болон СӨХ-ийн ажилтан (admin)
async function up(knex) {
  await knex.schema.createTable('users', function (t) {
    t.increments('id');
    t.integer('unit_id').unsigned().references('units.id').onDelete('SET NULL'); // admin тоотгүй байж болно
    t.string('name', 100).notNullable();
    t.string('phone', 20).unique(); // SMS сануулга энэ дугаар руу явна
    t.string('email', 150).unique();
    t.string('password_hash', 255);
    t.enu('role', ['admin', 'user']).notNullable().defaultTo('user');
    t.timestamps(true, true);
  });
}

async function down(knex) {
  await knex.schema.dropTable('users');
}

module.exports = { up, down };
