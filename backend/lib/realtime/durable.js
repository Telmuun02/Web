/**
 * Realtime — Cloudflare дээр. Durable Object: бүх WebSocket холболтыг нэг газар барьдаг жижиг "сервер".
 * Компьютер дээр үүний оронд lib/realtime/node.js ажиллана. Логик нь нэг (changes.js).
 *
 * Урсгал: worker.js хүнийг таньж (identify) → fetch() холболтыг хүлээн авна.
 *   API өгөгдөл өөрчилсний дараа worker.js → kick() → alarm шууд ажиллана → run() change_log-ийн
 *   шинэ мөрүүдийг хүн бүрт тохируулж илгээнэ. API-аар ороогүй өөрчлөлтөд 30 сек тутмын alarm нөөц болно.
 *   Alarm нэг зэрэг хоёр ажиллахгүй тул нэг өөрчлөлт давхар илгээгдэхгүй.
 * Hibernation: идэвхгүй үед Cloudflare DO-г унтраадаг, холболт тасрахгүй. Хэн бэ гэдэг нь
 *   холболт бүрт serializeAttachment-аар хадгалагдана. 'ping' → 'pong'-ийг DO сэрээлгүй хариулна.
 *
 * fetch(request) - шинэ WebSocket холболт (x-realtime-client толгойд { role, unitId })
 * kick() - өгөгдөл өөрчлөгдлөө: холболт байвал alarm-ыг одоо ажиллуулна
 * alarm() - шалгалт (kick-ээр эсвэл 30 сек тутам)
 * webSocketClose(ws, code) - client хаахад хариу хаалт (1005/1006 шиг хориотой кодыг 1000 болгоно)
 * run() - (дотоод) шинэ өөрчлөлтүүдийг уншиж client бүрт өөрт нь харагдах хүснэгтүүдийг илгээнэ
 * schedule() - (дотоод) холболт байвал дараагийн alarm-ыг тавина
 */

import { DurableObject } from 'cloudflare:workers';
import changes from './changes.js';
import logger from '../logger.js';

var POLL_MS = 30000;
var log = logger.child({ module: 'realtime' });

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
    log.info({ role: client.role, unitId: client.unitId, online: this.ctx.getWebSockets().length }, 'Realtime холбогдлоо');

    await this.schedule();
    return new Response(null, { status: 101, webSocket: browser });
  }

  async kick() {
    if (this.ctx.getWebSockets().length) await this.ctx.storage.setAlarm(Date.now());
  }

  async alarm() {
    try {
      await this.run();
    } catch (err) {
      log.error({ err: err }, 'Realtime шалгалт амжилтгүй');
    }
    await this.schedule();
  }

  webSocketClose(ws, code) {
    var client = ws.deserializeAttachment();
    log.info({ role: client.role, unitId: client.unitId, code: code }, 'Realtime саллаа');
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

    var sent = 0;
    sockets.forEach(function (ws) {
      var tables = changes.tablesFor(ws.deserializeAttachment(), list);
      if (!tables.length) return;
      try {
        ws.send(JSON.stringify({ type: 'change', tables: tables }));
        sent++;
      } catch (err) {
        ws.close(1011, 'send failed');
      }
    });
    log.info({ changes: list.length, lastId: list[list.length - 1].id, sent: sent, online: sockets.length }, 'Realtime илгээлээ');
  }

  async schedule() {
    if (!this.ctx.getWebSockets().length) return;
    if (!(await this.ctx.storage.getAlarm())) await this.ctx.storage.setAlarm(Date.now() + POLL_MS);
  }
}
