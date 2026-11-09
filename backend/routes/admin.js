var express = require('express');
var dashboardController = require('../controllers/admin/dashboardController');
var invoicesController = require('../controllers/admin/invoicesController');
var requestsController = require('../controllers/admin/requestsController');
var unitsController = require('../controllers/admin/unitsController');
var pollsController = require('../controllers/admin/pollsController');
var announcementsController = require('../controllers/admin/announcementsController');
var reportsController = require('../controllers/admin/reportsController');
var staffController = require('../controllers/admin/staffController');
var liveController = require('../controllers/admin/liveController');

// Ажилтны API — /api/admin/...
// auth болон requireRole('admin')-ийг api.js-д нэг удаа тавьсан тул энд route бүрд бичихгүй.
// :id(\\d+) — зөвхөн тоо таарна, '/units/abc' гэвэл 404
var router = express.Router();

// Самбар — бүх өгөгдөл нэг дор
router.get('/dashboard', dashboardController.show);
router.get('/dashboard/debtors', dashboardController.topDebtors); // Invoices-ийн "Өр ихтэй" таб

// Нэхэмжлэл
router.get('/invoices', invoicesController.index);
router.get('/invoices/counts', invoicesController.counts); // табуудын тоо
router.post('/invoices/:id(\\d+)/payments', invoicesController.pay); // төлбөр бүртгэх

// Засварын хүсэлт
router.get('/requests', requestsController.index);
router.get('/requests/counts', requestsController.counts); // табуудын тоо
router.get('/requests/open-count', requestsController.openCount); // Navbar дээрх тоо
router.patch('/requests/:id(\\d+)', requestsController.update); // төлөв солих, засварчин томилох

// Тоот ба оршин суугч
router.get('/units', unitsController.index);
router.get('/units/:id(\\d+)', unitsController.show);

// Санал хураалт
router.get('/polls', pollsController.index);
router.get('/polls/:id(\\d+)', pollsController.show);
router.post('/polls', pollsController.store);

// Зарлал
router.get('/announcements', announcementsController.index);
router.post('/announcements', announcementsController.store);
router.delete('/announcements/:id(\\d+)', announcementsController.destroy);

// Тайлан
router.get('/reports', reportsController.show);

// Ажилтнууд — засварчин сонгох жагсаалт
router.get('/staff', staffController.index);

// "ШУУД" мөр — бүх хуудсанд нэг
router.get('/live/:page', liveController.show);

module.exports = router;
