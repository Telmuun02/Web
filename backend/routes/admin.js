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
var activityController = require('../controllers/admin/activityController');
var chatController = require('../controllers/admin/chatController');
var voiceController = require('../controllers/user/voiceController');

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
router.post('/units/:id(\\d+)/phones', unitsController.addPhone);
router.delete('/units/:id(\\d+)/phones/:userId(\\d+)', unitsController.removePhone);
router.get('/units/pending', unitsController.pending);
router.post('/units/pending/:userId(\\d+)', unitsController.link);
router.delete('/units/pending/:userId(\\d+)', unitsController.reject);

router.get('/polls', pollsController.index);
router.get('/polls/:id(\\d+)', pollsController.show);
router.post('/polls', pollsController.store);

router.get('/announcements', announcementsController.index);
router.post('/announcements', announcementsController.store);
router.patch('/announcements/:id(\\d+)', announcementsController.update);
router.delete('/announcements/:id(\\d+)', announcementsController.destroy);

router.get('/reports', reportsController.show);

router.get('/staff', staffController.index);

router.get('/live/:page', liveController.show);

router.get('/activity', activityController.show);

router.post('/chat', chatController.send);
router.post('/transcribe', voiceController.transcribe);


module.exports = router;
