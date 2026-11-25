/**
 * Meetings - СӨХ-ийн хурал (meetings хүснэгт) ба хэлэлцэх асуудал (meeting_agenda хүснэгт)
 * Хэлэлцэх асуудал poll_id-аар хурал дээр хураах санал хураалттай холбогдоно
 *
 * base: all, find, where, create, update, remove
 * agendaOf(meetingId) - хурлын хэлэлцэх асуудлууд дарааллаар, холбогдсон санал хураалтын гарчигтай
 * next(entranceId) - одоо явагдаж буй эсвэл хамгийн ойрын удахгүй болох хурал (бүх байрных эсвэл тухайн орцных), хэлэлцэх асуудалтай нь (байхгүй бол null)
 */

var db = require('..');
var { now } = require('../sql');
var createModel = require('./base');

var base = createModel('meetings');

async function agendaOf(meetingId) {
  return db('meeting_agenda as a')
    .leftJoin('polls as p', 'p.id', 'a.poll_id')
    .select('a.id', 'a.position', 'a.title', 'a.description', 'a.poll_id', 'p.title as poll_title')
    .where('a.meeting_id', meetingId)
    .orderBy('a.position');
}

async function next(entranceId) {
  var meeting = await db('meetings')
    .where('ends_at', '>', now())
    .where(function () {
      this.whereNull('entrance_id');
      if (entranceId) this.orWhere('entrance_id', entranceId);
    })
    .orderBy('starts_at')
    .first();
  if (!meeting) return null;
  return { ...meeting, online: Boolean(meeting.online), agenda: await agendaOf(meeting.id) };
}

module.exports = { ...base, agendaOf, next };
