// Бүх model-д нийтлэг CRUD — хүснэгт бүр үүнийг ашиглаад өөрийн функцээ нэмнэ
var db = require('..');

function createModel(table, options) {
  options = options || {};
  var columns = options.columns || '*'; // users шиг нууц багана нуух бол жагсааж өгнө
  var timestamps = options.timestamps !== false;

  // Бүх мөр
  async function all() {
    return db(table).select(columns).orderBy('id');
  }

  // id-аар нэг мөр, олдохгүй бол undefined
  async function find(id) {
    return db(table).select(columns).where({ id: id }).first();
  }

  // Нөхцөлөөр шүүх: where({ entrance: 1 })
  async function where(conditions) {
    return db(table).select(columns).where(conditions);
  }

  // Шинэ мөр нэмээд нэмэгдсэн мөрийг буцаана
  async function create(data) {
    var [id] = await db(table).insert(data);
    return find(id);
  }

  // Мөр засаад шинэчлэгдсэн мөрийг буцаана
  async function update(id, data) {
    if (timestamps) data = Object.assign({}, data, { updated_at: db.fn.now() });
    await db(table).where({ id: id }).update(data);
    return find(id);
  }

  // Устгасан мөрийн тоог буцаана (0 эсвэл 1)
  async function remove(id) {
    return db(table).where({ id: id }).del();
  }

  return { all, find, where, create, update, remove };
}

module.exports = createModel;
