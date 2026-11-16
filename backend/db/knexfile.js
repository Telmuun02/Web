// knexfile.js ийг ашиглан Knex.js-ийн тохиргоог тодорхойлдог. 
// Энэ нь хөгжүүлэлтийн орчинд MySQL сервертэй холбогдох тохиргоог агуулдаг.

/**
 * Migrations - өгөгдлийн сангийн SQL өгөгдлийн сангийн хүснэгтүүдийг үүсгэх 
 * Seed - өгөгдлийн сангийн хүснэгтүүдэд анхны өгөгдлийг оруулах
 * Model - өгөгдлийн сангийн хүснэгтүүдтэй ажиллахад ашиглагдах Knex.js-ийн объектуудыг тодорхойлдог
 */

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
      charset: 'utf8mb4', 
      dateStrings: ['DATE'], 
    },
    pool: { min: 0, max: 10 },
    migrations: { directory: path.join(__dirname, 'migrations') },
    seeds: { directory: path.join(__dirname, 'seeds') },
  },
};
