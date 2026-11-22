/**
 * Cloudflare Workers-ийн эхлэлийн цэг — компьютер дээрх bin/www-ийн оронд ажиллана.
 * Express app-ыг өөрчлөлтгүйгээр node:http серверт залгаж, Cloudflare-ийн хүсэлтийг түүн рүү дамжуулна.
 *   /api/realtime → WebSocket: хүнийг таньж Durable Object (RealtimeHub) руу дамжуулна
 *   /api/*        → энэ Worker (Express)
 *   бусад бүх зам → frontend/dist (wrangler.jsonc → assets), Worker ажиллахгүй
 *
 * hub() - (дотоод) бүх хүнд ганц RealtimeHub ('hub' нэртэй)
 * connectRealtime(request) - (дотоод) token шалгаад холболтыг hub руу өгнө, буруу бол 4001-ээр хаана
 * fetch(request, env, ctx) - Cloudflare-ийн хүсэлт бүр эндээс эхэлнэ
 */

import http from 'node:http';
import { httpServerHandler } from 'cloudflare:node';
import { env } from 'cloudflare:workers';
import Client_D1 from './db/clients/d1.js';
import { tokenFrom, identify } from './lib/realtime/identify.js';
import app from './app.js';

export { RealtimeHub } from './lib/realtime/durable.js';

var PORT = 3000;

Client_D1.use(env.DB);

function hub() {
  return env.REALTIME.get(env.REALTIME.idFromName('hub'));
}

async function connectRealtime(request) {
  if (request.headers.get('Upgrade') !== 'websocket') {
    return new Response('WebSocket хүлээж байна', { status: 426 });
  }

  var client = await identify(tokenFrom(request.headers.get('Cookie'), request.url));
  if (!client) {
    var [browser, server] = Object.values(new WebSocketPair());
    server.accept();
    server.close(4001, 'unauthorized');
    return new Response(null, { status: 101, webSocket: browser });
  }

  var headers = new Headers(request.headers);
  headers.set('x-realtime-client', JSON.stringify(client));
  return hub().fetch(new Request(request.url, { headers: headers }));
}

http.createServer(app).listen(PORT);
var express = httpServerHandler({ port: PORT });

export default {
  async fetch(request, env, ctx) {
    if (new URL(request.url).pathname === '/api/realtime') return connectRealtime(request);
    return express.fetch(request, env, ctx);
  },
};
