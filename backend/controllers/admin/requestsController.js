/**
 * Засварын хүсэлт - /api/admin/requests
 * Хуудас: admin Requests (/admin/requests), Navbar дээрх тоо
 *
 * index - хүсэлтийн жагсаалт, таб (stage) бүрээр, хуудаслалттай
 *   GET /api/admin/requests?stage=&limit=&offset=
 * counts - табуудын дээрх тоо
 *   GET /api/admin/requests/counts
 * openCount - шийдээгүй хүсэлтийн тоо (Navbar)
 *   GET /api/admin/requests/open-count
 * update - төлөв солих, засварчин томилох
 *   PATCH /api/admin/requests/:id
 *
 * viewer(req) - (дотоод) хүсэлт үзэж буй ажилтан дарга эсэх
 * mask(row, chairman) - (дотоод) "Нэрээ нууцлах" хүсэлтийн илгээгчийг даргаас бусдад нууна
 */

var { Requests, Admins } = require('../../db/models');
var log = require('../../lib/logger').child({ module: 'admin/requests' });

async function viewer(req) {
  var admin = await Admins.find(req.user.id);
  return Boolean(admin && admin.position === 'chairman');
}

function mask(row, chairman) {
  if (!row.anonymous || chairman) return { ...row, anonymous: Boolean(row.anonymous) };
  return { ...row, anonymous: true, created_by: null, created_by_name: null };
}

async function index(req, res, next) {
  try {
    var stage = Requests.stages.includes(req.query.stage) ? req.query.stage : 'open';

    var limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 20, 1), 100);
    var offset = Math.max(parseInt(req.query.offset, 10) || 0, 0);

    var [rows, chairman] = await Promise.all([Requests.list({ stage: stage, limit: limit + 1, offset: offset }), viewer(req)]);
    var hasMore = rows.length > limit;

    res.json({
      rows: rows.slice(0, limit).map(function (r) { return mask(r, chairman); }),
      has_more: hasMore,
      next_offset: hasMore ? offset + limit : null,
    });
  } catch (err) {
    next(err);
  }
}

async function counts(req, res, next) {
  try {
    res.json(await Requests.stageCounts());
  } catch (err) {
    next(err);
  }
}

async function openCount(req, res, next) {
  try {
    res.json({ count: await Requests.openCount() });
  } catch (err) {
    next(err);
  }
}

var statuses = ['open', 'in_progress', 'resolved', 'rejected'];

async function update(req, res, next) {
  try {
    var request = await Requests.find(req.params.id);
    if (!request) return res.status(404).json({ error: 'Хүсэлт олдсонгүй' });

    var hasStatus = req.body.status !== undefined;
    var hasAssignee = req.body.assigned_to !== undefined;
    if (!hasStatus && !hasAssignee) {
      return res.status(400).json({ error: 'status эсвэл assigned_to-ийн аль нэгийг өгнө үү' });
    }
    if (hasStatus && !statuses.includes(req.body.status)) {
      return res.status(400).json({ error: 'Төлөв буруу байна' });
    }

    if (hasAssignee && req.body.assigned_to !== null) {
      var worker = await Admins.find(req.body.assigned_to);
      if (!worker || !worker.active) {
        return res.status(400).json({ error: 'Ийм ажилтан олдсонгүй' });
      }
      await Requests.update(request.id, { assigned_to: worker.id });
    } else if (hasAssignee) {
      await Requests.update(request.id, { assigned_to: null });
    }

    if (hasStatus) await Requests.setStatus(request.id, req.body.status);

    var updated = await Requests.find(request.id);

    log.info({
      by: req.user.id,
      requestId: request.id,
      status: hasStatus ? { from: request.status, to: updated.status } : undefined,
      assignedTo: hasAssignee ? { from: request.assigned_to, to: updated.assigned_to } : undefined,
    }, 'Засварын хүсэлт шинэчиллээ');

    res.json(mask({ ...updated, stage: Requests.stageOf(updated) }, await viewer(req)));
  } catch (err) {
    next(err);
  }
}

module.exports = { index, counts, openCount, update };
