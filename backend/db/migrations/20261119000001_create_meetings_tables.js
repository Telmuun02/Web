/**
 * meetings, meeting_agenda хүснэгт - СӨХ-ийн хурал ба хэлэлцэх асуудал
 * Хэлэлцэх асуудал хурал дээр санал хураах бол poll_id-аар polls-той холбогдоно
 * Хурлыг устгавал хэлэлцэх асуудал нь хамт устна (CASCADE), санал хураалт нь үлдэнэ (SET NULL)
 *
 * up(knex) - хоёр хүснэгт үүсгэнэ
 * down(knex) - хоёр хүснэгт устгана
 */

async function up(knex) {
  await knex.schema.createTable('meetings', function (t) {
    t.increments('id');
    t.string('title', 150).notNullable();
    t.text('description');
    t.datetime('starts_at').notNullable();
    t.datetime('ends_at').notNullable();
    t.string('location', 150).notNullable().defaultTo('Онлайн');
    t.boolean('online').notNullable().defaultTo(true);
    t.integer('created_by').unsigned().references('admins.id').onDelete('RESTRICT');
    t.timestamps(true, true);
    t.index('starts_at');
  });

  await knex.schema.createTable('meeting_agenda', function (t) {
    t.increments('id');
    t.integer('meeting_id').unsigned().notNullable().references('meetings.id').onDelete('CASCADE');
    t.tinyint('position').unsigned().notNullable();
    t.string('title', 150).notNullable();
    t.text('description');
    t.integer('poll_id').unsigned().references('polls.id').onDelete('SET NULL');
    t.unique(['meeting_id', 'position']);
  });
}

async function down(knex) {
  await knex.schema.dropTable('meeting_agenda');
  await knex.schema.dropTable('meetings');
}

module.exports = { up, down };
