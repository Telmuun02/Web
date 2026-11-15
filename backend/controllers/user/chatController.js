var { currentResident, noUnit } = require('./helpers');
var chatService = require('../../services/chatService');
var log = require('../../lib/logger').fileOnly.child({ module: 'user/chat' });

var MAX_LEN = 1000; // нэг мессежийн дээд урт (тэмдэгт)

// Ботод өгөх оршин суугчийн үндсэн мэдээлэл — зөвхөн ӨӨРИЙНХ (token-оос олсон хэрэглэгч).
// Төлбөр, хүсэлт гэх мэтийг бот хэрэгтэй үедээ функцээр (chatTools) авна
function residentContext(me) {
  return [
    'Нэр: ' + me.user.name,
    'Тоот: ' + me.unit.code + ', ' + me.unit.entrance + '-р орц, ' + me.unit.floor + '-р давхар',
    'Өнөөдөр: ' + new Date().toISOString().slice(0, 10),
  ].join('\n');
}

/**
 * send -- Чатбот руу мессеж илгээх
 *   POST /api/resident/chat
 *   body: { text } — зөвхөн одоогийн мессеж (түүх илгээхгүй — зардал хэмнэнэ)
 *   → { reply }
 */
async function send(req, res, next) {
  try {
    var text = typeof req.body.text === 'string' ? req.body.text.trim().slice(0, MAX_LEN) : '';
    if (!text) return res.status(400).json({ error: 'Мессеж хоосон байна' });

    var me = await currentResident(req);
    if (!me || !me.unit) return noUnit(req, res);

    var context = residentContext(me);

    // Claude API унасан бол бусад алдаанаас ялгаж, ойлгомжтой хариу өгнө
    var reply;
    try {
      reply = await chatService.reply(text, context, me);
    } catch (err) {
      log.error({ id: me.user.id, err: err }, 'Чатбот хариулж чадсангүй');
      return res.status(503).json({ error: 'Туслах түр ажиллахгүй байна. Дараа дахин оролдоно уу' });
    }

    log.debug({ id: me.user.id, unit: me.unit.code, length: text.length }, 'Чатбот');
    res.json({ reply: reply });
  } catch (err) {
    next(err);
  }
}

module.exports = { send };
