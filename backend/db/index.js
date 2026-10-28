// MySQL холболт — route-ууд дотроос require('../db') гэж ашиглана
var knex = require('knex');
var config = require('./knexfile');

var env = process.env.NODE_ENV || 'development';
var db = knex(config[env]);

module.exports = db;
