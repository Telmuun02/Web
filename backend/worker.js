/**
 * Cloudflare Workers-ийн эхлэлийн цэг — компьютер дээрх bin/www-ийн оронд ажиллана.
 * Express app-ыг өөрчлөлтгүйгээр node:http серверт залгаж, Cloudflare-ийн хүсэлтийг түүн рүү дамжуулна.
 *   /api/*        → энэ Worker (Express)
 *   бусад бүх зам → frontend/dist (wrangler.jsonc → assets), Worker ажиллахгүй
 *
 * DBwatcher, realtime (WebSocket) энд ажиллахгүй — дараа нь Durable Objects-оор хийнэ.
 */

import http from 'node:http';
import { httpServerHandler } from 'cloudflare:node';
import app from './app.js';

var PORT = 3000;

http.createServer(app).listen(PORT);

export default httpServerHandler({ port: PORT });
