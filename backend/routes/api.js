
var express = require('express');
var auth = require('../middleware/auth');
var authController = require('../controllers/authController');
var dashboardController = require('../controllers/dashboardController');
var invoicesController = require('../controllers/invoicesController');

var router = express.Router();

// Нэвтрэлт
router.post('/auth/login', authController.login);
router.post('/auth/logout', authController.logout);
router.get('/auth/me', auth, authController.me); // auth — эхлээд token шалгана

// Самбар — нэвтэрсэн хэрэглэгч л харна
router.get('/dashboard', auth, dashboardController.show);
router.get('/dashboard/monthly', auth, dashboardController.monthlyChart);
router.get('/dashboard/debtors', auth, dashboardController.topDebtors);
router.get('/dashboard/categories', auth, dashboardController.requestCategories);

// Нэхэмжлэл ба төлбөр
router.get('/invoices', auth, invoicesController.index);
router.get('/invoices/summary', auth, invoicesController.summary);
router.post('/invoices/:id/pay', auth, invoicesController.pay); // :id — аль нэхэмжлэлд төлбөр бүртгэх

module.exports = router;
