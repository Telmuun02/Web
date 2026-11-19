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

/**
 * admin хуудастай холбоотой api ууд ба доор байдлаар харагдана.
 */

var router = express.Router();

router.get('/dashboard', dashboardController.show);
router.get('/dashboard/debtors', dashboardController.topDebtors); 

router.get('/invoices', invoicesController.index);
router.get('/invoices/counts', invoicesController.counts);
router.post('/invoices/:id(\\d+)/payments', invoicesController.pay); 

router.get('/requests', requestsController.index);
router.get('/requests/counts', requestsController.counts);
router.get('/requests/open-count', requestsController.openCount); 
router.patch('/requests/:id(\\d+)', requestsController.update); 

router.get('/units', unitsController.index);
router.get('/units/:id(\\d+)', unitsController.show);

router.get('/polls', pollsController.index);
router.get('/polls/:id(\\d+)', pollsController.show);
router.post('/polls', pollsController.store);

router.get('/announcements', announcementsController.index);
router.post('/announcements', announcementsController.store);
router.delete('/announcements/:id(\\d+)', announcementsController.destroy);

router.get('/reports', reportsController.show);

router.get('/staff', staffController.index);

router.get('/live/:page', liveController.show);

module.exports = router;
