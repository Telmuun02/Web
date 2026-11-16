/**
 * Бүх model-ийг нэг дороос экспортлоно
 *   var { Units, Invoices } = require('../db/models');
 *
 * Units, Users, Invoices, Payments, Requests, Polls,
 * Announcements, Buildings, Entrances, Admins
 */

module.exports = {
  Units: require('./units'),
  Users: require('./users'),
  Invoices: require('./invoices'),
  Payments: require('./payments'),
  Requests: require('./requests'),
  Polls: require('./polls'),
  Announcements: require('./announcements'),
  Buildings: require('./buildings'),
  Entrances: require('./entrances'),
  Admins: require('./admins'),
};
