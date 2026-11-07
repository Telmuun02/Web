var express = require('express');
var dashboardController = require('../controllers/admin/dashboardController');
var invoicesController = require('../controllers/admin/invoicesController');
var requestsController = require('../controllers/admin/requestsController');
var liveController = require('../controllers/admin/liveController');

// Ажилтны API — /api/admin/...
// auth болон requireRole('admin')-ийг api.js-д нэг удаа тавьсан тул энд route бүрд бичихгүй
var router = express.Router();

// Самбар
router.get('/dashboard', dashboardController.show);
router.get('/dashboard/monthly', dashboardController.monthlyChart);
router.get('/dashboard/debtors', dashboardController.topDebtors);
router.get('/dashboard/categories', dashboardController.requestCategories);

// Нэхэмжлэл
router.get('/invoices', invoicesController.index);
router.get('/invoices/counts', invoicesController.counts); // табуудын тоо

// Засварын хүсэлт
router.get('/requests', requestsController.index);
router.get('/requests/counts', requestsController.counts); // табуудын тоо
router.get('/requests/open-count', requestsController.openCount); // Navbar дээрх тоо

// "ШУУД" мөр — бүх хуудсанд нэг
router.get('/live/:page', liveController.show);

module.exports = router;
