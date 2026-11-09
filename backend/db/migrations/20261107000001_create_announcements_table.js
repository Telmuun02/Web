// Зарлал — СӨХ-өөс оршин суугчдад
async function up(knex) {
  await knex.schema.createTable('announcements', function (t) {
    t.increments('id');
    t.integer('created_by').unsigned().references('users.id').onDelete('SET NULL');
    t.string('title', 150).notNullable();
    t.text('body').notNullable();
    t.string('audience', 16).notNullable().defaultTo('all'); // 'all' эсвэл орцны дугаар: '1', '2', '3'
    t.boolean('sms').notNullable().defaultTo(false); // SMS-ээр давхар илгээх эсэх
    t.boolean('important').notNullable().defaultTo(false); // мэдэгдлээ унтраасан хүнд ч очно
    t.timestamps(true, true);
    t.index('created_at');
  });
}

async function down(knex) {
  await knex.schema.dropTable('announcements');
}

module.exports = { up, down };
