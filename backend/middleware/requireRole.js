// Role шалгана — auth-ын ДАРАА ажиллана (req.user-ийг auth тавьдаг)
// Жишээ: router.use('/admin', auth, requireRole('admin'), adminRoutes)
// Laravel-ийн ->middleware('role:admin')-тай адил санаа

var log = require('../lib/logger').child({ module: 'requireRole' });

function requireRole(role) {
  return function (req, res, next) {
    if (req.user.role !== role) {
      log.warn({ id: req.user.id, as: req.user.role, need: role, url: req.originalUrl, ip: req.ip }, 'Эрхгүй хандалт');
      return res.status(403).json({ error: 'Эрх хүрэхгүй байна' });
    }
    next();
  };
}

module.exports = requireRole;
