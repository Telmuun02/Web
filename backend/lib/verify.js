/**
 * verify.mn — утасны дугаар баталгаажуулах (reverse SMS / MO)
 * Хэрэглэгч өөрийн утаснаас 144773 руу бидний өгсөн кодыг SMS-ээр илгээнэ (оператор 150₮ авна).
 * verify.mn тэр дугаараас зөв код ирснийг шалгаж session-ийг VERIFIED болгоно. Бид 3 сек тутам асууна.
 * Түлхүүр: VERIFY_API_KEY (.env / Cloudflare Secrets). Session 5 минут хүчинтэй.
 *
 * normalizePhone(text) - '+976 9911-2233' → '99112233', буруу бол null (8 оронтой Монгол дугаар)
 * maskPhone(phone) - '99112233' → '9911-••33' (даргаас бусад ажилтанд)
 * newCode() - санамсаргүй 6 оронтой код
 * createSession(phone, code) - { sessionId, shortcode, text, smsUri, displayInstruction, expiresAt }
 * sessionStatus(sessionId) - 'PENDING' | 'VERIFIED' | 'EXPIRED'
 */

var API = 'https://api.verify.mn';

function normalizePhone(text) {
  var digits = String(text || '').replace(/\D/g, '');
  if (digits.length === 11 && digits.startsWith('976')) digits = digits.slice(3);
  return /^[5-9]\d{7}$/.test(digits) ? digits : null;
}

function maskPhone(phone) {
  if (!phone) return phone;
  return phone.length < 6 ? phone : phone.slice(0, 4) + '-••' + phone.slice(-2);
}

function newCode() {
  var n = globalThis.crypto.getRandomValues(new Uint32Array(1))[0];
  return String(100000 + (n % 900000));
}

async function createSession(phone, code) {
  if (!process.env.VERIFY_API_KEY) throw new Error('VERIFY_API_KEY тохируулаагүй байна');
  var res = await fetch(API + '/sessions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + process.env.VERIFY_API_KEY },
    body: JSON.stringify({ phone: phone, text: code, responseSms: 'SOKH Hub: Utas batalgaajlaa.' }),
  });
  var body = await res.json().catch(function () { return null; });
  if (!res.ok) {
    var err = new Error('verify.mn: ' + res.status + ' ' + ((body && body.message) || ''));
    err.status = res.status;
    throw err;
  }
  return body;
}

async function sessionStatus(sessionId) {
  var res = await fetch(API + '/sessions/' + encodeURIComponent(sessionId), {
    headers: { Authorization: 'Bearer ' + process.env.VERIFY_API_KEY },
  });
  if (!res.ok) {
    var err = new Error('verify.mn: ' + res.status);
    err.status = res.status;
    throw err;
  }
  var body = await res.json();
  return body.sessionStatus;
}

module.exports = { normalizePhone, maskPhone, newCode, createSession, sessionStatus };
