/**
 * Realtime — Cloudflare дээр. Durable Object: бүх WebSocket холболтыг нэг газар барьдаг жижиг "сервер".
 * Компьютер дээр үүний оронд lib/realtime/node.js ажиллана. Логик нь нэг (changes.js).
 *
 * Урсгал: worker.js хүнийг таньж (identify) → fetch() холболтыг хүлээн авна.
 *   Холболт байгаа үед 2 сек тутам alarm → run() change_log-ийн шинэ мөрүүдийг хүн бүрт тохируулж илгээнэ.
 * Hibernation: идэвхгүй үед Cloudflare DO-г унтраадаг, холболт тасрахгүй. Хэн бэ гэдэг нь
 *   холболт бүрт serializeAttachment-аар хадгалагдана. 'ping' → 'pong'-ийг DO сэрээлгүй хариулна.
 *
 * fetch(request) - шинэ WebSocket холболт (x-realtime-client толгойд { role, unitId })
 * alarm() - 2 сек тутмын шалгалт
 * webSocketClose(ws, code) - client хаахад хариу хаалт (1005/1006 шиг хориотой кодыг 1000 болгоно)
 * run() - (дотоод) шинэ өөрчлөлтүүдийг уншиж client бүрт өөрт нь харагдах хүснэгтүүдийг илгээнэ
 * schedule() - (дотоод) холболт байвал дараагийн alarm-ыг тавина
 */

import { DurableObject } from 'cloudflare:workers';
import changes from './changes.js';

var POLL_MS = 2000;

export class RealtimeHub extends DurableObject {
  constructor(ctx, env) {
    super(ctx, env);
    ctx.setWebSocketAutoResponse(new WebSocketRequestResponsePair('ping', 'pong'));
  }

  async fetch(request) {
    var client = JSON.parse(request.headers.get('x-realtime-client'));
    if (!this.ctx.getWebSockets().length) {
      await this.ctx.storage.put('lastId', await changes.latestId());
    }

    var [browser, server] = Object.values(new WebSocketPair());
    this.ctx.acceptWebSocket(server);
    server.serializeAttachment(client);

    await this.schedule();
    return new Response(null, { status: 101, webSocket: browser });
  }

  async alarm() {
    try {
      await this.run();
    } catch (err) {
      console.error('Realtime шалгалт амжилтгүй: ' + err.message);
    }
    await this.schedule();
  }

  webSocketClose(ws, code) {
    try {
      ws.close(code >= 3000 || code === 1000 ? code : 1000);
    } catch (err) {
      // аль хэдийн хаагдсан
    }
  }

  async run() {
    var sockets = this.ctx.getWebSockets();
    if (!sockets.length) return;

    var lastId = await this.ctx.storage.get('lastId');
    var list = await changes.read(lastId);
    if (!list.length) return;
    await this.ctx.storage.put('lastId', list[list.length - 1].id);

    sockets.forEach(function (ws) {
      var tables = changes.tablesFor(ws.deserializeAttachment(), list);
      if (!tables.length) return;
      try {
        ws.send(JSON.stringify({ type: 'change', tables: tables }));
      } catch (err) {
        ws.close(1011, 'send failed');
      }
    });
  }

  async schedule() {
    if (!this.ctx.getWebSockets().length) return;
    if (!(await this.ctx.storage.getAlarm())) await this.ctx.storage.setAlarm(Date.now() + POLL_MS);
  }
}
