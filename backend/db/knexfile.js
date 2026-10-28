// Knex-ийн тохиргоо — db/index.js болон `npm run migrate` командууд хоёулаа үүнийг уншина
var path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env'), quiet: true });

module.exports = {
  development: {
    client: 'mysql2',
    connection: {
      host: process.env.DB_HOST || '127.0.0.1',
      port: Number(process.env.DB_PORT) || 3306,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      charset: 'utf8mb4', // кирилл үсэг зөв хадгалагдана
      dateStrings: ['DATE'], // '2026-11-01' хэвээр ирнэ — цагийн бүсээр өдөр шилжихгүй
    },
    pool: { min: 0, max: 10 },
    migrations: { directory: path.join(__dirname, 'migrations') },
    seeds: { directory: path.join(__dirname, 'seeds') },
  },
};
