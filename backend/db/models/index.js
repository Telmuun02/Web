// Бүх model-ийг нэг дороос: var { Units, Invoices } = require('../db/models');
module.exports = {
  Units: require('./units'),
  Users: require('./users'),
  Invoices: require('./invoices'),
  Payments: require('./payments'),
  Requests: require('./requests'),
  Polls: require('./polls'),
};
