var log = require('../lib/logger').fileOnly.child({ module: 'chimege' });

// Chimege STT — ярианаас текст. Токен .env-ийн CHIMEGE_TOKEN-оос
var URL = 'https://api.chimege.com/v1.2/transcribe';

/**
 * transcribe -- WAV дууг Chimege-ээр монгол текст болгоно
 *   wav: Buffer — 16kHz, mono, 16-bit WAV
 *   → string (текст)
 */
async function transcribe(wav) {
  var res = await fetch(URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/octet-stream',
      Token: process.env.CHIMEGE_TOKEN,
    },
    body: wav,
  });

  var text = await res.text();

  if (!res.ok) {
    // Chimege алдааны кодоо header-т буцаадаг — log-д хамт бичнэ
    log.error({ status: res.status, code: res.headers.get('error-code'), body: text.slice(0, 200) }, 'Chimege алдаа');
    throw new Error('Chimege: ' + res.status);
  }

  log.debug({ bytes: wav.length, chars: text.length }, 'Дуу → текст');
  return text.trim();
}

module.exports = { transcribe };
