/**
 * Knex CLI-ийн тохиргоо — зөвхөн seed-д (npm run seed) хэрэглэнэ, компьютер дээрх .data/dev.sqlite руу бичнэ.
 * Хүснэгтүүдийг migrations/*.sql үүсгэнэ (npm run migrate), knex migration ашиглахаа больсон.
 *
 * Seed - өгөгдлийн сангийн хүснэгтүүдэд анхны өгөгдлийг оруулах
 */

var path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env'), quiet: true });

var Client = require('./clients/local');

module.exports = {
  development: {
    client: Client,
    connection: { filename: Client.FILE },
    useNullAsDefault: true,
    seeds: { directory: path.join(__dirname, 'seeds') },
  },
};
