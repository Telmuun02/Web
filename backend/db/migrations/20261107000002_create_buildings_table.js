// Байр — СӨХ-ийн удирддаг байр. Нэг байранд олон тоот
async function up(knex) {
  await knex.schema.createTable('buildings', function (t) {
    t.increments('id');
    t.string('name', 100).notNullable();              // нэр: '12-р байр'
    t.string('address', 255).notNullable();           // хаяг
    t.string('district', 50);                         // дүүрэг: 'Сүхбаатар'
    t.string('khoroo', 20);                           // хороо: '1-р хороо'
    t.tinyint('entrances').unsigned().notNullable();  // орцны тоо
    t.tinyint('floors').unsigned().notNullable();     // давхрын тоо
    t.smallint('built_year').unsigned();              // ашиглалтад орсон он
    t.string('phone', 20);                            // СӨХ-ийн утас
    t.string('bank_name', 50);                        // төлбөр хүлээн авах банк
    t.string('bank_account', 30);                     // дансны дугаар
    t.timestamps(true, true);
  });

  // units → buildings. Байрыг устгавал тоот болон нэхэмжлэл нь устахгүй, алдаа заана
  await knex.schema.alterTable('units', function (t) {
    t.integer('building_id').unsigned().references('buildings.id').onDelete('RESTRICT');
    t.dropUnique(['code']);                // '1-12' өөр байранд ч байж болно
    t.unique(['building_id', 'code']);     // нэг байрны дотор давтагдахгүй
  });
}

async function down(knex) {
  await knex.schema.alterTable('units', function (t) {
    t.dropUnique(['building_id', 'code']);
    t.dropForeign('building_id');
    t.dropColumn('building_id');
    t.unique(['code']);
  });
  await knex.schema.dropTable('buildings');
}

module.exports = { up, down };
