/**
 * Buildings - СӨХ-ийн удирддаг байр (buildings хүснэгт)
 * buildings ──< entrances ──< units
 *
 * base: all, find, where, create, update, remove
 * list() - байр бүр орц, тоотын тоо, хамгийн өндөр давхартай (тоолж гаргана)
 */

var db = require('..');
var createModel = require('./base');

var base = createModel('buildings');

async function list() {
  var rows = await db('buildings as b')
    .select('b.*')
    .select(db.raw('(SELECT COUNT(*) FROM entrances e WHERE e.building_id = b.id) AS entrances'))
    .select(db.raw('(SELECT MAX(e.floors) FROM entrances e WHERE e.building_id = b.id) AS floors'))
    .select(db.raw('(SELECT COUNT(*) FROM units u JOIN entrances e ON e.id = u.entrance_id WHERE e.building_id = b.id) AS units'))
    .orderBy('b.id');
  return rows.map(function (r) {
    return { ...r, entrances: Number(r.entrances), units: Number(r.units) };
  });
}

module.exports = { ...base, list };
