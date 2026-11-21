/**
 * Код хаана ажиллаж байгааг тодорхойлно
 *   Cloudflare Workers — production (D1)
 *   Node.js            — компьютер дээрх хөгжүүлэлт (npm run dev, локал SQLite файл)
 *
 * isWorker - Cloudflare Workers дээр ажиллаж байвал true
 */

var isWorker = typeof navigator !== 'undefined' && navigator.userAgent === 'Cloudflare-Workers';

module.exports = { isWorker };
