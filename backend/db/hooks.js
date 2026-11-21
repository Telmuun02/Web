/**
 * DB-д бичигдсэний дараах дохио — realtime-ийн "NOTIFY" (lib/realtime/)
 * D1 болон локал client INSERT/UPDATE/DELETE ажиллуулсны дараа wrote()-г дуудна.
 * Юу өөрчлөгдсөнийг trigger-ууд change_log-д бичсэн байгаа — энэ нь зөвхөн "одоо шалга" гэж сэрээнэ.
 *
 * onWrite(fn) - бичилт болох бүрт дуудагдах функц бүртгэнэ (worker.js, lib/realtime/node.js)
 * isWrite(sql) - SQL нь өгөгдөл өөрчлөх эсэх
 * wrote() - бүртгэсэн функцуудыг дуудна. Алдаа гарвал хүсэлтийг унагаахгүй
 */

var listeners = [];

function onWrite(fn) {
  listeners.push(fn);
}

function isWrite(sql) {
  return /^\s*(insert|update|delete|replace)\b/i.test(sql);
}

async function wrote() {
  for (var fn of listeners) {
    try {
      await fn();
    } catch (err) {
      console.error('realtime дохио илгээж чадсангүй: ' + err.message);
    }
  }
}

module.exports = { onWrite, isWrite, wrote };
