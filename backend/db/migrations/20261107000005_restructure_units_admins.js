/**
 * Бүтцийн өөрчлөлт:
 *   1. Тоот орцонд холбогдоно: buildings ──< entrances ──< units (entrance_id).
 *      units.building_id, units.entrance хасагдана - байрыг орцоор нь дамжиж олно
 *   2. admins нь users-ээс тусдаа, өөрийн нэвтрэх мэдээлэлтэй болно.
 *      Ажилтан оршин суугчидтай орцоор дамжиж холбогдоно: admins ← entrances.manager_id
 *      Одоогийн ажилтнуудыг (users + admins) шинэ admins руу шилжүүлнэ.
 *      Тоотгүй ажилтныг users-ээс хасна, тоотой бол оршин суугчаар үлдэнэ
 *
 * up(knex) - дээрх 2 өөрчлөлтийг хийнэ
 * down(knex) - эсрэг дарааллаар: admins-ийг users-тэй 1:1 болгож, дараа нь units-ийг буцаана
 */

var staffColumns = [
  ['requests', 'assigned_to'],
  ['polls', 'created_by'],
  ['announcements', 'created_by'],
  ['entrances', 'manager_id'],
  ['payments', 'recorded_by'],
];

async function up(knex) {
  await knex.schema.alterTable('units', function (t) {
    t.integer('entrance_id').unsigned().references('entrances.id').onDelete('RESTRICT');
  });
  await knex.raw(
    'UPDATE units u JOIN entrances e ON e.building_id = u.building_id AND e.number = u.entrance ' +
      'SET u.entrance_id = e.id'
  );
  var [orphan] = await knex('units').whereNull('entrance_id').count({ n: '*' });
  if (Number(orphan.n)) throw new Error(orphan.n + ' тоот орцгүй байна — entrances-д орцыг нь эхлээд нэмнэ үү');

  await knex.schema.alterTable('units', function (t) {
    t.dropForeign(['building_id', 'entrance']);
    t.dropForeign('building_id');
  });
  await knex.schema.alterTable('units', function (t) {
    t.dropIndex(['building_id', 'entrance'], 'units_building_id_entrance_foreign');
    t.dropUnique(['building_id', 'code']);
    t.dropIndex('entrance');
    t.dropColumn('building_id');
    t.dropColumn('entrance');
  });
  await knex.schema.alterTable('units', function (t) {
    t.integer('entrance_id').unsigned().notNullable().alter();
    t.unique(['entrance_id', 'code']);
  });

  for (var [table, column] of staffColumns) {
    await knex.schema.alterTable(table, function (t) {
      t.dropForeign(column);
    });
  }
  await knex.schema.renameTable('admins', 'admins_old');

  await knex.schema.createTable('admins', function (t) {
    t.increments('id');
    t.string('name', 100).notNullable();
    t.string('phone', 20).unique();
    t.string('email', 150).unique();
    t.string('password_hash', 255);
    t.enu('position', ['chairman', 'accountant', 'technician', 'staff']).notNullable().defaultTo('staff');
    t.date('hired_at');
    t.integer('old_user_id').unsigned();
    t.timestamps(true, true);
  });

  await knex.raw(
    'INSERT INTO admins (name, phone, email, password_hash, position, hired_at, old_user_id, created_at, updated_at) ' +
      'SELECT u.name, u.phone, u.email, u.password_hash, a.position, a.hired_at, u.id, a.created_at, a.updated_at ' +
      'FROM admins_old a JOIN users u ON u.id = a.user_id ORDER BY u.id'
  );

  for (var [table2, column2] of staffColumns) {
    await knex.raw(
      'UPDATE ?? x LEFT JOIN admins a ON a.old_user_id = x.?? SET x.?? = a.id WHERE x.?? IS NOT NULL',
      [table2, column2, column2, column2]
    );
    await knex.schema.alterTable(table2, function (t) {
      t.foreign(column2).references('admins.id').onDelete('SET NULL');
    });
  }

  await knex('users').whereIn('id', knex('admins_old').select('user_id')).whereNull('unit_id').del();

  await knex.schema.alterTable('admins', function (t) {
    t.dropColumn('old_user_id');
  });
  await knex.schema.dropTable('admins_old');
}

async function down(knex) {
  for (var [table, column] of staffColumns) {
    await knex.schema.alterTable(table, function (t) {
      t.dropForeign(column);
    });
  }
  await knex.schema.renameTable('admins', 'admins_new');
  await knex.schema.alterTable('admins_new', function (t) {
    t.integer('user_id').unsigned();
  });

  var staff = await knex('admins_new').orderBy('id');
  for (var s of staff) {
    var user = null;
    if (s.email) user = await knex('users').where({ email: s.email }).first();
    if (!user && s.phone) user = await knex('users').where({ phone: s.phone }).first();
    var userId = user && user.id;
    if (!userId) {
      [userId] = await knex('users').insert({ name: s.name, phone: s.phone, email: s.email, password_hash: s.password_hash });
    }
    await knex('admins_new').where({ id: s.id }).update({ user_id: userId });
  }

  await knex.schema.createTable('admins', function (t) {
    t.integer('user_id').unsigned().primary().references('users.id').onDelete('CASCADE');
    t.enu('position', ['chairman', 'accountant', 'technician', 'staff']).notNullable().defaultTo('staff');
    t.date('hired_at');
    t.timestamps(true, true);
  });
  await knex.raw(
    'INSERT INTO admins (user_id, position, hired_at, created_at, updated_at) ' +
      'SELECT user_id, position, hired_at, created_at, updated_at FROM admins_new'
  );

  for (var [table2, column2] of staffColumns) {
    await knex.raw(
      'UPDATE ?? x LEFT JOIN admins_new a ON a.id = x.?? SET x.?? = a.user_id WHERE x.?? IS NOT NULL',
      [table2, column2, column2, column2]
    );
    await knex.schema.alterTable(table2, function (t) {
      t.foreign(column2).references('admins.user_id').onDelete('SET NULL');
    });
  }
  await knex.schema.dropTable('admins_new');

  await knex.schema.alterTable('units', function (t) {
    t.integer('building_id').unsigned();
    t.tinyint('entrance').unsigned();
  });
  await knex.raw(
    'UPDATE units u JOIN entrances e ON e.id = u.entrance_id SET u.building_id = e.building_id, u.entrance = e.number'
  );
  await knex.schema.alterTable('units', function (t) {
    t.dropForeign('entrance_id');
  });
  await knex.schema.alterTable('units', function (t) {
    t.dropUnique(['entrance_id', 'code']);
    t.dropColumn('entrance_id');
    t.tinyint('entrance').unsigned().notNullable().alter();
    t.foreign('building_id').references('buildings.id').onDelete('RESTRICT');
    t.unique(['building_id', 'code']);
    t.index('entrance');
  });
  await knex.schema.alterTable('units', function (t) {
    t.foreign(['building_id', 'entrance']).references(['building_id', 'number']).inTable('entrances').onDelete('RESTRICT');
  });
}

module.exports = { up, down };
