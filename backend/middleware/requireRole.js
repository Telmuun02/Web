// Role шалгана — auth-ын ДАРАА ажиллана (req.user-ийг auth тавьдаг)
// Жишээ: router.use('/admin', auth, requireRole('admin'), adminRoutes)
// Laravel-ийн ->middleware('role:admin')-тай адил санаа
function requireRole(role) {
  return function (req, res, next) {
    if (req.user.role !== role) {
      return res.status(403).json({ error: 'Эрх хүрэхгүй байна' });
    }
    next();
  };
}

module.exports = requireRole;
