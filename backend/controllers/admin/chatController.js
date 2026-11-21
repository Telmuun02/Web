/**
 * Ажилтны чатбот - /api/admin/chat
 * Хуудас: ажилтны бүх хуудсан дээрх чатбот цонх (ChatWidget)
 *
 * send - мессеж илгээж ботын хариу авна (services/adminChatService)
 *   POST /api/admin/chat - { text, history? } → { reply }
 *   history: сүүлийн мессежүүд [{ from: 'user' | 'bot', text }] — "тэр тоот" гэх мэт үргэлжлүүлсэн асуултад
 *
 * adminContext(admin) - (дотоод) ботод өгөх ажилтны үндсэн мэдээлэл
 */

var { Admins } = require('../../db/models');
var adminChatService = require('../../services/adminChatService');
var time = require('../../lib/time');
var log = require('../../lib/logger').fileOnly.child({ module: 'admin/chat' });

var MAX_LEN = 1000;
var positionLabel = { chairman: 'Дарга', accountant: 'Нягтлан', technician: 'Засварчин', staff: 'Ажилтан' };

function adminContext(admin) {
  return [
    'Одоо ярьж буй ажилтан: ' + admin.name + ' (' + (positionLabel[admin.position] || admin.position) + ')',
    'Өнөөдөр: ' + time.ymd(),
  ].join('\n');
}

async function send(req, res, next) {
  try {
    var text = typeof req.body.text === 'string' ? req.body.text.trim().slice(0, MAX_LEN) : '';
    if (!text) return res.status(400).json({ error: 'Мессеж хоосон байна' });
    var history = Array.isArray(req.body.history) ? req.body.history : [];

    var admin = await Admins.find(req.user.id);
    if (!admin) return res.status(401).json({ error: 'Нэвтрээгүй байна' });

    var reply;
    try {
      reply = await adminChatService.reply(text, history, adminContext(admin));
    } catch (err) {
      log.error({ id: admin.id, err: err }, 'Ажилтны чатбот хариулж чадсангүй');
      return res.status(503).json({ error: 'Туслах түр ажиллахгүй байна. Дараа дахин оролдоно уу' });
    }

    log.debug({ id: admin.id, length: text.length, history: history.length }, 'Ажилтны чатбот');
    res.json({ reply: reply });
  } catch (err) {
    next(err);
  }
}

module.exports = { send };
