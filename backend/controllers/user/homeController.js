var { Invoices, Announcements, Requests } = require('../../db/models');
var { currentResident, noUnit } = require('./helpers');
var log = require('../../lib/logger').child({ module: 'user/home' });

/**
 * show -- Нүүр хуудасны бүх өгөгдөл нэг дор
 *   GET /api/resident/home →
 *   {
 *     unit:     { id, code, entrance, floor },
 *     entrance: { units: [{ id, code, floor, paid }] },   — орцны цонхнууд, энэ сард төлсөн эсэх
 *     bill:     { amount, paid, due_date, status } | null — энэ сарын нэхэмжлэл
 *     news:     [ сүүлийн 2 зарлал ],
 *     request:  { latest, done_count }                    — миний хүсэлт
 *   }
 */
async function show(req, res, next) {
  try {
    var me = await currentResident(req);
    if (!me || !me.unit) return noUnit(req, res);

    var [windows, bill, news, requests] = await Promise.all([
      Invoices.entranceMonth(me.unit.entrance_id),
      Invoices.currentForUnit(me.unit.id),
      Announcements.forEntrance(me.unit.entrance_id, 2),
      Requests.forUser(me.user.id, 20),
    ]);

    // Шийдээгүй хамгийн сүүлийн хүсэлт, бүгд шийдэгдсэн бол хамгийн сүүлийнх
    var latest = requests.find(function (r) { return r.stage !== 'done'; }) || requests[0] || null;

    // Нэхэмжлэл үүсээгүй бол СӨХ-ийн тал дээр алдаа байж магадгүй
    if (!bill) log.warn({ id: me.user.id, unit: me.unit.code }, 'Энэ сарын нэхэмжлэл үүсээгүй байна');
    log.debug({ id: me.user.id, unit: me.unit.code }, 'Нүүр хуудас');

    res.json({
      unit: { id: me.unit.id, code: me.unit.code, entrance: me.unit.entrance, floor: me.unit.floor },
      entrance: { units: windows },
      bill: bill ? { amount: bill.amount, paid: bill.paid, due_date: bill.due_date, status: bill.status } : null,
      news: news,
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
