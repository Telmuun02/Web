/**
 * DB Watcher - N секунд тутам DB-ээс асууж, өөрчлөлт илэрвэл admin хуудсууд руу WebSocket-оор дохио илгээнэ
 * Холбох газар: bin/www (start), lib/realtime.js (broadcast)
 * Хуудас: admin Requests, Invoices, Polls, Announcements
 *
 * WATCH - type → { хүснэгт: харьцуулах огнооны багана }
 *   type нь frontend руу явах дохионы нэр. Нэг type хэд хэдэн хүснэгтээс хамаарч болно.
 *   Хүснэгтийн "хурууны хээ" = мөрийн тоо + тухайн баганын хамгийн сүүлийн утга.
 *   Мөр нэмэгдэх, устах, апп-аар засагдахыг барина. updated_at-ийг өөрчлөөгүй гар засварыг (Workbench) барихгүй.
 *
 * start() - давталтыг эхлүүлнэ (хоёр дахь удаа дуудвал юу ч хийхгүй)
 * fingerprint(table, column) - (дотоод) нэг хүснэгтийн хурууны хээ → '42|1763370000000'
 * typeFingerprint(type) - (дотоод) type-ийн бүх хүснэгтийн хээг нийлүүлнэ
 * check() - (дотоод) type бүрийг өмнөх хээтэй нь харьцуулж, өөрчлөгдсөнд broadcast хийнэ
 * loop() - (дотоод) check дууссаны ДАРАА дараагийнхаа ажиллалтыг товлоно (query давхцахгүй)
 */

var db = require('../db');
var realtime = require('./realtime');
var log = require('./logger').child({ module: 'dbWatcher' });

var INTERVAL_MS = 3000;

var WATCH = {
  requests: { requests: 'updated_at' },
  invoices: { invoices: 'updated_at', payments: 'updated_at' },
  polls: { polls: 'updated_at', poll_votes: 'created_at' },
  announcements: { announcements: 'updated_at' },
};

var last = {};
var started = false;

async function fingerprint(table, column) {
  var row = await db(table).count({ n: '*' }).max({ last: column }).first();
  return row.n + '|' + (row.last ? new Date(row.last).getTime() : '');
}

async function typeFingerprint(type) {
  var tables = Object.keys(WATCH[type]);
  var parts = await Promise.all(tables.map(function (table) {
    return fingerprint(table, WATCH[type][table]);
  }));
  return parts.join(',');
}

async function check() {
  for (var type of Object.keys(WATCH)) {
    var current = await typeFingerprint(type);
    var changed = last[type] !== undefined && last[type] !== current;
    last[type] = current;

    if (changed) {
      log.debug({ type: type }, 'Өөрчлөлт илэрлээ');
      realtime.broadcast(type);
    }
  }
}

function loop() {
  check()
    .catch(function (err) {
      log.error({ err: err }, 'DB шалгахад алдаа');
    })
    .finally(function () {
      setTimeout(loop, INTERVAL_MS).unref();
    });
}

function start() {
  if (started) return;
  started = true;
  log.info({ every: INTERVAL_MS }, 'DB watcher эхэллээ');
  loop();
}

module.exports = { start };
