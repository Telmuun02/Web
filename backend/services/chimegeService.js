/**
 * Chimege STT - ярианаас монгол текст. Токен .env-ийн CHIMEGE_TOKEN-оос
 * Хэн дууддаг: controllers/user/voiceController.js (POST /api/resident/transcribe)
 * Хуудас: чатбот цонхны микрофон (ChatWidget)
 *
 * transcribe(wav) - WAV (16kHz, mono, 16-bit) Buffer-ийг текст болгоно → string
 */

var log = require('../lib/logger').fileOnly.child({ module: 'chimege' });

var URL = 'https://api.chimege.com/v1.2/transcribe';

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
    log.error({ status: res.status, code: res.headers.get('error-code'), body: text.slice(0, 200) }, 'Chimege алдаа');
    throw new Error('Chimege: ' + res.status);
  }

  log.debug({ bytes: wav.length, chars: text.length }, 'Дуу → текст');
  return text.trim();
}

module.exports = { transcribe };
