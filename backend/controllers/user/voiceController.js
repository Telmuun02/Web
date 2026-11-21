/**
 * Дуу → текст - /api/resident/transcribe, /api/admin/transcribe
 * Хуудас: чатбот цонхны микрофон (ChatWidget) — оршин суугч, ажилтан хоёулаа
 *
 * transcribe - WAV дууг Chimege-ээр текст болгоно (services/chimegeService)
 *   POST /api/resident/transcribe - WAV body → { text }
 *
 * readBody(req) - (дотоод) body-г Buffer болгож уншина, 5MB хүртэл
 */

var chimegeService = require('../../services/chimegeService');
var log = require('../../lib/logger').fileOnly.child({ module: 'user/voice' });

var MAX_BYTES = 5 * 1024 * 1024;

function readBody(req) {
  return new Promise(function (resolve, reject) {
    var chunks = [];
    var size = 0;
    req.on('data', function (chunk) {
      size += chunk.length;
      if (size > MAX_BYTES) {
        req.removeAllListeners('data');
        req.resume();
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

async function transcribe(req, res, next) {
  try {
    if (!(req.headers['content-type'] || '').startsWith('audio/wav')) {
      return res.status(415).json({ error: 'Зөвхөн WAV дуу хүлээж авна' });
    }

    var wav = await readBody(req);
    if (!wav) return res.status(413).json({ error: 'Бичлэг хэт урт байна' });
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
