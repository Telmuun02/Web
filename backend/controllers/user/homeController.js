/**
 * Нүүр - /api/resident/home
 * Хуудас: resident Home (/)
 *
 * show - нүүр хуудасны бүх өгөгдөл нэг дор (төлбөр, орц, зарлал, хүсэлт, удахгүй болох хурал)
 *   GET /api/resident/home
 */

var { Invoices, Announcements, Requests, Meetings } = require('../../db/models');
var { currentResident, noUnit } = require('./helpers');
var log = require('../../lib/logger').child({ module: 'user/home' });

async function show(req, res, next) {
  try {
    var me = await currentResident(req);
    if (!me || !me.unit) return noUnit(req, res);

    var [windows, bill, news, requests, meeting] = await Promise.all([
      Invoices.entranceMonth(me.unit.entrance_id),
      Invoices.currentForUnit(me.unit.id),
      Announcements.forEntrance(me.unit.entrance_id, 2),
      Requests.forUser(me.user.id, 20),
      Meetings.next(me.unit.entrance_id),
    ]);

    var latest = requests.find(function (r) { return r.stage !== 'done'; }) || requests[0] || null;

    if (!bill) log.warn({ id: me.user.id, unit: me.unit.code }, 'Энэ сарын нэхэмжлэл үүсээгүй байна');
    log.debug({ id: me.user.id, unit: me.unit.code }, 'Нүүр хуудас');

    res.json({
      unit: { id: me.unit.id, code: me.unit.code, entrance: me.unit.entrance, floor: me.unit.floor },
      entrance: { units: windows },
      bill: bill ? { period: bill.period, amount: bill.amount, paid: bill.paid, due_date: bill.due_date, status: bill.status } : null,
      news: news,
      meeting: meeting && {
        id: meeting.id,
        title: meeting.title,
        description: meeting.description,
        starts_at: meeting.starts_at,
        location: meeting.location,
        online: meeting.online,
      },
      request: {
        latest: latest,
        done_count: requests.filter(function (r) { return r.stage === 'done'; }).length,
      },
    });
  } catch (err) {
    next(err);
  }
}

module.exports = { show };
