var chimegeService = require('../../services/chimegeService');
var log = require('../../lib/logger').fileOnly.child({ module: 'user/voice' });

var MAX_BYTES = 5 * 1024 * 1024; // 5MB — 16kHz WAV-д ~2.5 минут

// Хүсэлтийн body-г Buffer болгож уншина (Express 4.16-д express.raw байхгүй).
// MAX_BYTES-ээс том бол null
function readBody(req) {
  return new Promise(function (resolve, reject) {
    var chunks = [];
    var size = 0;
    req.on('data', function (chunk) {
      size += chunk.length;
      if (size > MAX_BYTES) {
        req.removeAllListeners('data');
        req.resume(); // үлдсэнийг хаяж уншина — холболт гацахгүй
        return resolve(null);
      }
      chunks.push(chunk);
    });
    req.on('end', function () {
      if (size <= MAX_BYTES) resolve(Buffer.concat(chunks));
    });
    req.on('error', reject);
  });
}

/**
 * transcribe -- Дууг текст болгох (чатботын микрофон)
 *   POST /api/resident/transcribe
 *   body: WAV файл (Content-Type: audio/wav), 5MB хүртэл
 *   → { text }
 */
async function transcribe(req, res, next) {
  try {
    if (!(req.headers['content-type'] || '').startsWith('audio/wav')) {
      return res.status(415).json({ error: 'Зөвхөн WAV дуу хүлээж авна' });
    }

    var wav = await readBody(req);
    if (!wav) return res.status(413).json({ error: 'Бичлэг хэт урт байна' });
    // WAV толгой (44 байт)-оос богино бол дуу байхгүй
    if (wav.length <= 44) return res.status(400).json({ error: 'Дуу ирсэнгүй' });

    var text;
    try {
      text = await chimegeService.transcribe(wav);
    } catch (err) {
      log.error({ id: req.user.id, err: err }, 'Дууг текст болгож чадсангүй');
      return res.status(503).json({ error: 'Дуу таних үйлчилгээ түр ажиллахгүй байна' });
    }

    if (!text) return res.status(422).json({ error: 'Яриа танигдсангүй. Дахин тод хэлнэ үү' });

    log.debug({ id: req.user.id, bytes: wav.length, chars: text.length }, 'Дуу → текст');
    res.json({ text: text });
  } catch (err) {
    next(err);
  }
}

module.exports = { transcribe };
