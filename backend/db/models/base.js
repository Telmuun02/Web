/**
 * Бүх model-д нийтлэг CRUD — хүснэгт бүр үүнийг ашиглаад өөрийн функцээ нэмнэ
 *   var base = createModel('units', { columns, timestamps });
 *   module.exports = { ...base, myFn };
 *
 * createModel(table, options) - доорх функцүүдтэй объект буцаана
 *   options.columns    - select хийх баганууд (нууц багана нуух бол), анхдагч '*'
 *   options.timestamps - false бол update-д updated_at тавихгүй
 *
 * all() - бүх мөр, id-аар эрэмбэлсэн
 * find(id) - id-аар нэг мөр, олдохгүй бол undefined
 * where(conditions) - нөхцөлөөр шүүх: where({ entrance_id: 1 })
 * create(data) - мөр нэмээд нэмэгдсэн мөрийг буцаана
 * update(id, data) - мөр засаад шинэчлэгдсэн мөрийг буцаана
 * remove(id) - мөр устгаад устгасан тоог (0 эсвэл 1) буцаана
 */

var db = require('..');

function createModel(table, options) {
  options = options || {};
  var columns = options.columns || '*';
  var timestamps = options.timestamps !== false;

  async function all() {
    return db(table).select(columns).orderBy('id');
  }

  async function find(id) {
    return db(table).select(columns).where({ id: id }).first();
  }

  async function where(conditions) {
    return db(table).select(columns).where(conditions);
  }

  async function create(data) {
    var [id] = await db(table).insert(data);
    return find(id);
  }

  async function update(id, data) {
    if (timestamps) data = Object.assign({}, data, { updated_at: db.fn.now() });
    await db(table).where({ id: id }).update(data);
    return find(id);
  }

  async function remove(id) {
    return db(table).where({ id: id }).del();
  }

  return { all, find, where, create, update, remove };
}

module.exports = createModel;
