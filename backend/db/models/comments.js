/**
 * Comments - зарлалын сэтгэгдэл (announcement_comments хүснэгт)
 * Бичсэн хүн: author_type 'user' (оршин суугч, тоотой) эсвэл 'admin' (ажилтан, албан тушаалтай)
 *
 * list(announcementId) - зарлалын сэтгэгдлүүд хуучнаас шинэ рүү, бичсэн хүний нэртэй
 * create(announcementId, authorType, authorId, body) - сэтгэгдэл нэмээд frontend-ийн хэлбэрээр буцаана
 *
 * withAuthor() - (дотоод) сэтгэгдэл + бичсэн хүний нэр, тоот / албан тушаал
 * toComment(row) - (дотоод) мөрийг frontend-ийн хэлбэрт
 */

var db = require('..');

var positionLabel = { chairman: 'СӨХ-ийн дарга', accountant: 'Нягтлан', technician: 'Засварчин', staff: 'Ажилтан' };

function withAuthor() {
  return db('announcement_comments as c')
    .leftJoin('users as s', function () {
      this.on('s.id', 'c.author_id').andOn('c.author_type', db.raw("'user'"));
    })
    .leftJoin('units as u', 'u.id', 's.unit_id')
    .leftJoin('admins as a', function () {
      this.on('a.id', 'c.author_id').andOn('c.author_type', db.raw("'admin'"));
    })
    .select('c.*', 's.name as user_name', 'u.code as unit_code', 'a.name as admin_name', 'a.position');
}

function toComment(row) {
  var admin = row.author_type === 'admin';
  return {
    id: row.id,
    body: row.body,
    created_at: row.created_at,
    author: {
      type: row.author_type,
      id: row.author_id,
      name: (admin ? row.admin_name : row.user_name) || 'Хэрэглэгч',
      sub: admin ? positionLabel[row.position] || 'Ажилтан' : row.unit_code ? row.unit_code + ' тоот' : '',
    },
  };
}

async function list(announcementId) {
  var rows = await withAuthor().where('c.announcement_id', announcementId).orderBy('c.id');
  return rows.map(toComment);
}

async function create(announcementId, authorType, authorId, body) {
  var [id] = await db('announcement_comments')
    .insert({ announcement_id: announcementId, author_type: authorType, author_id: authorId, body: body });
  return toComment(await withAuthor().where('c.id', id).first());
}

module.exports = { list, create };
