/**
 * ERD-ийн логик алдааг засна:
 *   1. poll_votes - сонголт нь заавал тухайн санал хураалтынх байна (нийлмэл FK)
 *   2. Санхүүгийн түүх, санал устахгүй - invoices, payments, poll_votes-ийн CASCADE → RESTRICT
 *   3. announcements.audience ('all' | '1' | '2' | '3' текст) → entrance_id (NULL = бүх орц)
 *   4. buildings.floors хасна - давхрын тоо орц бүрт entrances.floors-д
 *   5. admins.active - ажилтныг устгахгүй, идэвхгүй болгоно.
 *      Ажилтан руу заасан FK-ууд RESTRICT - "хэн хийсэн" түүх алдагдахгүй
 *
 * setDeleteRule(knex, table, column, ref, rule) - (дотоод) FK-ийн onDelete бодлогыг солино
 * up(knex) - дээрх 5 засварыг хийнэ
 * down(knex) - бүгдийг өмнөх байдалд буцаана
 */

var restrictColumns = [
  ['invoices', 'unit_id', 'units.id', 'CASCADE'],
  ['payments', 'invoice_id', 'invoices.id', 'CASCADE'],
  ['poll_votes', 'unit_id', 'units.id', 'CASCADE'],
  ['requests', 'assigned_to', 'admins.id', 'SET NULL'],
  ['polls', 'created_by', 'admins.id', 'SET NULL'],
  ['announcements', 'created_by', 'admins.id', 'SET NULL'],
  ['entrances', 'manager_id', 'admins.id', 'SET NULL'],
  ['payments', 'recorded_by', 'admins.id', 'SET NULL'],
];

async function setDeleteRule(knex, table, column, ref, rule) {
  await knex.schema.alterTable(table, function (t) {
    t.dropForeign(column);
  });
  await knex.schema.alterTable(table, function (t) {
    t.foreign(column).references(ref).onDelete(rule);
  });
}

async function up(knex) {
  var [bad] = await knex('poll_votes as v')
    .join('poll_options as o', 'o.id', 'v.option_id')
    .whereRaw('o.poll_id <> v.poll_id')
    .count({ n: '*' });
  if (Number(bad.n)) throw new Error(bad.n + ' санал өөр санал хураалтын сонголттой — эхлээд засна уу');

  await knex.schema.alterTable('poll_options', function (t) {
    t.unique(['id', 'poll_id']);
  });
  await knex.schema.alterTable('poll_votes', function (t) {
    t.dropForeign('option_id');
  });
  await knex.schema.alterTable('poll_votes', function (t) {
    t.foreign(['option_id', 'poll_id']).references(['id', 'poll_id']).inTable('poll_options').onDelete('CASCADE');
  });

  for (var [table, column, ref] of restrictColumns) {
    await setDeleteRule(knex, table, column, ref, 'RESTRICT');
  }

  await knex.schema.alterTable('announcements', function (t) {
    t.integer('entrance_id').unsigned().references('entrances.id').onDelete('RESTRICT');
  });
  await knex.raw(
    'UPDATE announcements a SET a.entrance_id = ' +
      '(SELECT MIN(e.id) FROM entrances e WHERE e.number = a.audience) ' +
      "WHERE a.audience <> 'all'"
  );
  await knex.schema.alterTable('announcements', function (t) {
    t.dropColumn('audience');
  });

  await knex.schema.alterTable('buildings', function (t) {
    t.dropColumn('floors');
  });

  await knex.schema.alterTable('admins', function (t) {
    t.boolean('active').notNullable().defaultTo(true);
  });
}

async function down(knex) {
  await knex.schema.alterTable('admins', function (t) {
    t.dropColumn('active');
  });

  await knex.schema.alterTable('buildings', function (t) {
    t.tinyint('floors').unsigned().notNullable().defaultTo(0);
  });
  await knex.raw('UPDATE buildings b SET b.floors = COALESCE((SELECT MAX(e.floors) FROM entrances e WHERE e.building_id = b.id), 0)');

  await knex.schema.alterTable('announcements', function (t) {
    t.string('audience', 16).notNullable().defaultTo('all');
  });
  await knex.raw('UPDATE announcements a JOIN entrances e ON e.id = a.entrance_id SET a.audience = e.number');
  await knex.schema.alterTable('announcements', function (t) {
    t.dropForeign('entrance_id');
  });
  await knex.schema.alterTable('announcements', function (t) {
    t.dropColumn('entrance_id');
  });

  for (var [table, column, ref, rule] of restrictColumns) {
    await setDeleteRule(knex, table, column, ref, rule);
  }

  await knex.schema.alterTable('poll_votes', function (t) {
    t.dropForeign(['option_id', 'poll_id']);
  });
  await knex.schema.alterTable('poll_votes', function (t) {
    t.dropIndex(['option_id', 'poll_id'], 'poll_votes_option_id_poll_id_foreign');
  });
  await knex.schema.alterTable('poll_votes', function (t) {
    t.foreign('option_id').references('poll_options.id').onDelete('CASCADE');
  });
  await knex.schema.alterTable('poll_options', function (t) {
    t.dropUnique(['id', 'poll_id']);
  });
}

module.exports = { up, down };
