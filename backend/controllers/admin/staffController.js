var { Admins } = require('../../db/models');

/**
 * index -- ажилтнууд (admin) — засварын хүсэлтэд хариуцагч сонгоход
 *   GET /api/admin/staff → [{ id, name, phone, email, position }]
 *   position: chairman (дарга), accountant (нягтлан), technician (засварчин), staff
 */
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
