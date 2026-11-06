var express = require('express');
var auth = require('../middleware/auth');
var requireRole = require('../middleware/requireRole');
var authController = require('../controllers/authController');
var profileController = require('../controllers/profileController');
var adminRoutes = require('./admin');
var residentRoutes = require('./resident');

var router = express.Router();

// ---------- Хоёулаа ----------

// Нэвтрэлт
router.post('/auth/login', authController.login);
router.post('/auth/logout', authController.logout);
router.get('/auth/me', auth, authController.me); // auth — эхлээд token шалгана

// Профайл — өөрийн мэдээллээ солих (нууц үгээр дахин баталгаажуулна)
router.put('/profile', auth, profileController.update);

// ---------- Role-оор ----------
// Хамгаалалтыг бүлэг бүрд НЭГ удаа тавина — доторх шинэ route бүр автоматаар хамгаалагдана

// Ажилтан — /api/admin/... Оршин суугч дуудвал 403
router.use('/admin', auth, requireRole('admin'), adminRoutes);

// Оршин суугч — /api/resident/... Ажилтан дуудвал 403
router.use('/resident', auth, requireRole('user'), residentRoutes);

module.exports = router;
