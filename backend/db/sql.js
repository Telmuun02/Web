/**
 * SQL дотор хэрэглэх огнооны туслахууд (Монголын цаг, UTC+8)
 * MySQL-ийн NOW(), CURDATE(), DATE_FORMAT(..., '%Y-%m-01')-ийн SQLite орлуулга
 *   var { now, today, monthStart } = require('../sql');
 *   db('polls').where('ends_at', '>', now())
 *
 * now() - одоо: 'YYYY-MM-DD HH:MM:SS'
 * today() - өнөөдөр: 'YYYY-MM-DD'
 * monthStart(monthsAgo) - n сарын өмнөх сарын 1-ний огноо, анхдагч нь энэ сар
 * hoursAgo(n) - n цагийн өмнөх цаг
 */

var db = require('.');

var NOW = "datetime('now', '+8 hours')";

function now() {
  return db.raw(NOW);
}

function today() {
  return db.raw("date('now', '+8 hours')");
}

function monthStart(monthsAgo) {
  return db.raw("date('now', '+8 hours', 'start of month', ?)", ['-' + (monthsAgo || 0) + ' months']);
}

function hoursAgo(n) {
  return db.raw("datetime('now', '+8 hours', ?)", ['-' + n + ' hours']);
}

module.exports = { NOW, now, today, monthStart, hoursAgo };
