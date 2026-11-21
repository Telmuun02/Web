/**
 * Realtime — Cloudflare дээр. Durable Object: бүх WebSocket холболтыг нэг газар барьдаг жижиг "сервер".
 * Компьютер дээр үүний оронд lib/realtime/node.js ажиллана. Логик нь нэг (changes.js).
 *
 * Урсгал: worker.js хүнийг таньж (identify) → энд дамжуулна → acceptWebSocket.
 *   DB-д бичих бүрт worker poke() дуудна → check() change_log-ийн шинэ мөрүүдийг тараана.
 *   Гаднаас (dashboard-ын SQL) орсон өөрчлөлтөд 30 сек тутмын alarm. Хэн ч холбогдоогүй бол юу ч хийхгүй.
 * Hibernation: идэвхгүй үед Cloudflare DO-г унтраадаг, холболт тасрахгүй. Хэн бэ гэдэг мэдээлэл
 *   холболт бүрт serializeAttachment-аар хадгалагдана. 'ping' → 'pong'-ийг DO сэрээлгүй хариулна.
 *
 * fetch(request) - шинэ WebSocket холболт (x-realtime-client толгойд хэн бэ гэдэг нь)
 * poke() - "DB өөрчлөгдлөө, шалга" (worker.js → db/hooks.js-ээс). Шалгалтыг хүлээлгүй буцна — API хариу удаашрахгүй
 * alarm() - 30 сек тутмын нөөц шалгалт
 * webSocketMessage(ws, text) - client-ээс ирсэн мессеж (чатын typing, presence) → changes.incoming
 * webSocketClose(ws, code) - client хаахад хариу хаалт (1005/1006 шиг хориотой кодыг 1000 болгоно), бусдад presence_changed
 * check() - (дотоод) нэг зэрэг хоёр шалгалт явуулахгүйн тулд дараалалд оруулна
 * run() - (дотоод) шинэ өөрчлөлтүүдийг уншиж client бүрт тохирох мессежийг илгээнэ
 * schedule() - (дотоод) холболт байвал alarm тавина
 * sockets() - (дотоод) нээлттэй холболтууд, хэн бэ гэдэг мэдээлэлтэй нь
 * presenceChanged(except) - (дотоод) бусад холболтуудад онлайн жагсаалт өөрчлөгдсөнийг мэдэгдэнэ
 */

import { DurableObject } from 'cloudflare:workers';
import changes from './changes.js';

var FALLBACK_MS = 30000;

export class RealtimeHub extends DurableObject {
  constructor(ctx, env) {
    super(ctx, env);
    this.running = Promise.resolve();
    ctx.setWebSocketAutoResponse(new WebSocketRequestResponsePair('ping', 'pong'));
  }

  async fetch(request) {
    var client = JSON.parse(request.headers.get('x-realtime-client'));
    client.conn = crypto.randomUUID();

    if (!this.ctx.getWebSockets().length) {
      await this.ctx.storage.put('lastId', await changes.latestId());
    }

    var pair = new WebSocketPair();
    var [browser, server] = Object.values(pair);
    this.ctx.acceptWebSocket(server);
    server.serializeAttachment(client);

    this.presenceChanged(client.conn);
    await this.schedule();
    return new Response(null, { status: 101, webSocket: browser });
  }

  poke() {
    if (this.ctx.getWebSockets().length) this.check();
  }

  async alarm() {
    await this.check();
    await this.schedule();
  }

  sockets() {
    return this.ctx.getWebSockets().map(function (ws) {
      return { ws: ws, client: ws.deserializeAttachment() };
    });
  }

  presenceChanged(except) {
    this.sockets().forEach(function (s) {
      if (s.client.conn === except) return;
      try {
        s.ws.send(JSON.stringify({ type: 'presence_changed' }));
      } catch (err) {
        // хаагдаж байгаа холболт
      }
    });
  }

  webSocketMessage(ws, text) {
    if (typeof text !== 'string') return;
    var me = ws.deserializeAttachment();
    var all = this.sockets();
    changes.incoming(me, text, all.map(function (s) { return s.client; })).forEach(function (item) {
      var target = all.find(function (s) { return s.client.conn === item.conn; });
      if (!target) return;
      try {
        target.ws.send(JSON.stringify(item.msg));
      } catch (err) {
        // хаагдаж байгаа холболт
      }
    });
  }

  webSocketClose(ws, code) {
    this.presenceChanged(ws.deserializeAttachment().conn);
    try {
      ws.close(code >= 3000 || code === 1000 ? code : 1000);
    } catch (err) {
      // аль хэдийн хаагдсан
    }
  }

  check() {
    this.running = this.running.then(() => this.run()).catch(function (err) {
      console.error('Realtime шалгалт амжилтгүй: ' + err.message);
    });
    return this.running;
  }

  async run() {
    var sockets = this.ctx.getWebSockets();
    if (!sockets.length) return;

    var lastId = (await this.ctx.storage.get('lastId')) ?? (await changes.latestId());
    var list = await changes.read(lastId);
    if (!list.length) return;
    await this.ctx.storage.put('lastId', list[list.length - 1].id);

    var plan = await changes.plan(list);
    sockets.forEach(function (ws) {
      var client = ws.deserializeAttachment();
      plan.forEach(function (item) {
        var msg = changes.messageFor(client, item);
        if (!msg) return;
        try {
          ws.send(JSON.stringify(msg));
        } catch (err) {
          ws.close(1011, 'send failed');
        }
      });
    });
  }

  async schedule() {
    if (!this.ctx.getWebSockets().length) return;
    if (!(await this.ctx.storage.getAlarm())) await this.ctx.storage.setAlarm(Date.now() + FALLBACK_MS);
  }
}
