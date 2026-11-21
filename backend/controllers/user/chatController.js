/**
 * Чатбот - /api/resident/chat
 * Хуудас: оршин суугчийн бүх хуудсан дээрх чатбот цонх (ChatWidget)
 *
 * send - мессеж илгээж ботын хариу авна (services/chatService)
 *   POST /api/resident/chat - { text } → { reply }
 *
 * residentContext(me) - (дотоод) ботод өгөх оршин суугчийн үндсэн мэдээлэл
 */

var { currentResident, noUnit } = require('./helpers');
var chatService = require('../../services/chatService');
var time = require('../../lib/time');
var log = require('../../lib/logger').fileOnly.child({ module: 'user/chat' });

var MAX_LEN = 1000;

function residentContext(me) {
  return [
    'Нэр: ' + me.user.name,
    'Тоот: ' + me.unit.code + ', ' + me.unit.entrance + '-р орц, ' + me.unit.floor + '-р давхар',
    'Өнөөдөр: ' + time.ymd(),
  ].join('\n');
}

async function send(req, res, next) {
  try {
    var text = typeof req.body.text === 'string' ? req.body.text.trim().slice(0, MAX_LEN) : '';
    if (!text) return res.status(400).json({ error: 'Мессеж хоосон байна' });

    var me = await currentResident(req);
    if (!me || !me.unit) return noUnit(req, res);

    var context = residentContext(me);

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
