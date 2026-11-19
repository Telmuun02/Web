/**
 * Хурал - /api/resident/meeting
 * Хуудас: resident Meeting (/meeting)
 *
 * show - одоо явагдаж буй эсвэл удахгүй болох хурал, хэлэлцэх асуудалтай нь (хурал байхгүй бол { meeting: null })
 *   GET /api/resident/meeting
 */

var { Meetings } = require('../../db/models');
var log = require('../../lib/logger').child({ module: 'user/meeting' });

async function show(req, res, next) {
  try {
    var meeting = await Meetings.next();
    log.debug({ id: req.user.id, meetingId: meeting ? meeting.id : null }, 'Хурал хуудас');
    res.json({ meeting: meeting });
  } catch (err) {
    next(err);
  }
}

module.exports = { show };
