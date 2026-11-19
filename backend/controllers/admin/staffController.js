/**
 * Ажилтнууд - /api/admin/staff
 * Хуудас: admin Requests (засварчин сонгох жагсаалт)
 *
 * index - идэвхтэй ажилтнууд
 *   GET /api/admin/staff
 */

var { Admins } = require('../../db/models');

async function index(req, res, next) {
  try {
    var staff = await Admins.list();
    res.json(staff.map(function (u) {
      return { id: u.id, name: u.name, phone: u.phone, email: u.email, position: u.position };
    }));
  } catch (err) {
    next(err);
  }
}

module.exports = { index };
