var db = require('..');
var createModel = require('./base');

var base = createModel('entrances');

// Байрны орцууд — тоотын тоо, ахлагч, хариуцсан ажилтны нэртэй
async function list(buildingId) {
  var q = db('entrances as e')
    .leftJoin('users as l', 'l.id', 'e.leader_id')
    .leftJoin('admins as m', 'm.id', 'e.manager_id')
    .select('e.*', 'l.name as leader_name', 'm.name as manager_name')
    .select(db.raw('(SELECT COUNT(*) FROM units u WHERE u.entrance_id = e.id) AS units'))
    .orderBy(['e.building_id', 'e.number']);
  if (buildingId) q.where('e.building_id', buildingId);

  var rows = await q;
  return rows.map(function (r) {
    return { ...r, units: Number(r.units) };
  });
}

module.exports = { ...base, list };
