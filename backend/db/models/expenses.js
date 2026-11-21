/**
 * Expenses - СӨХ-ийн зарлага (expenses хүснэгт)
 * Нөөц сан хадгалагдахгүй, тооцоолно: нийт цугласан төлбөр - нийт зарлага
 *
 * base: all, find, where, create, update, remove
 * categories - зарлагын ангиллууд (DB-ийн enum-тэй ижил)
 * byCategory(fromPeriod) - сар, ангилал бүрийн нийт зарлага, fromPeriod-оос хойш
 * reserve() - нөөц сан: бүх цаг үеийн төлбөр, зарлага, тэдгээрийн зөрүү { collected, spent, balance }
 */

var db = require('..');
var createModel = require('./base');

var base = createModel('expenses');

var categories = ['salary', 'utilities', 'elevator', 'cleaning', 'electricity', 'repair', 'other'];

async function byCategory(fromPeriod) {
  var rows = await db('expenses')
    .select('period', 'category')
    .sum({ amount: 'amount' })
    .where('period', '>=', fromPeriod)
    .groupBy('period', 'category')
    .orderBy('period');
  return rows
    .map(function (r) {
      return { period: r.period, category: r.category, amount: Number(r.amount) };
    })
    .sort(function (a, b) {
      if (a.period !== b.period) return a.period < b.period ? -1 : 1;
      return categories.indexOf(a.category) - categories.indexOf(b.category);
    });
}

async function reserve() {
  var [paid, spent] = await Promise.all([
    db('payments').sum({ n: 'amount' }).first(),
    db('expenses').sum({ n: 'amount' }).first(),
  ]);
  var collected = Number(paid.n || 0);
  var total = Number(spent.n || 0);
  return { collected: collected, spent: total, balance: collected - total };
}

module.exports = { ...base, categories, byCategory, reserve };
