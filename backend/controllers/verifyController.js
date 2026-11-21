/**
 * Утсаар бүртгүүлэх / нууц үг сэргээх - /api/auth/verify (нэвтрээгүй хэрэглэгч)
 * Хуудас: Register (/register), ForgotPassword (/forgot-password) — нэг урсгал
 *
 * Урсгал (verify.mn reverse SMS, lib/verify.js):
 *   1. start — код үүсгэж verify.mn-д session нээнэ (ямар ч Монгол дугаар)
 *   2. Хэрэглэгч өөрийн утаснаас 144773 руу кодоо SMS-ээр илгээнэ
 *   3. status — frontend 3 сек тутам асууна, verify.mn VERIFIED болговол verified
 *   4. complete — нууц үг тохируулна (баталгаажснаас хойш 15 минутын дотор):
 *      - ажилтан тоотод бүртгэсэн утас → нууц үг тавиад шууд нэвтэрнэ
 *      - шинэ дугаар → тоотгүй хэрэглэгч үүснэ, ажилтан тоотод холбох хүртэл нэвтрэхгүй ({ pending: true })
 *      - өмнө нь бүртгүүлсэн → нууц үг солигдоно (нууц үг сэргээх)
 *
 * start - { phone } → { id, shortcode, code, smsUri, instruction, expiresAt }
 *   Бүртгэлтэй эсэхийг хариунд хэлэхгүй (дугаар таах боломжгүй). Утсаар цагт 5, IP-ээр цагт 20 оролдлого
 *   POST /api/auth/verify
 * status - { status: 'pending' | 'verified' | 'used' | 'expired', activated? } — activated зөвхөн баталгаажсаны дараа
 *   GET /api/auth/verify/:id
 * complete - { password } → { token } + cookie, тоотгүй бол { pending: true }
 *   POST /api/auth/verify/:id/complete
 *
 * load(id) - (дотоод) баталгаажуулалтын мөр
 */

var bcrypt = require('bcryptjs');
var db = require('../db');
var verify = require('../lib/verify');
var time = require('../lib/time');
var { startSession } = require('./authController');
var { isDuplicate } = require('../db/errors');
var log = require('../lib/logger').child({ module: 'verify' });

var MAX_PER_HOUR = 5;
var MAX_PER_IP_HOUR = 20;
var COMPLETE_WITHIN_MS = 15 * 60 * 1000;
var MIN_PASSWORD = 8;

async function load(id) {
  return db('phone_verifications').where({ id: String(id || '') }).first();
}

async function start(req, res, next) {
  try {
    var phone = verify.normalizePhone(req.body.phone);
    if (!phone) return res.status(400).json({ error: 'Утасны дугаараа зөв оруулна уу (8 оронтой)' });

    var user = await db('users').select('id', 'unit_id', 'password_hash').where({ phone: phone }).first();

    var hourAgo = time.toDb(new Date(Date.now() - 3600000));
    var [recent, fromIp] = await Promise.all([
      db('phone_verifications').where({ phone: phone }).where('created_at', '>', hourAgo).count({ n: '*' }).first(),
      db('phone_verifications').where({ ip: req.ip || '' }).where('created_at', '>', hourAgo).count({ n: '*' }).first(),
    ]);
    if (Number(recent.n) >= MAX_PER_HOUR || Number(fromIp.n) >= MAX_PER_IP_HOUR) {
      return res.status(429).json({ error: 'Хэт олон оролдлого. Нэг цагийн дараа дахин оролдоно уу' });
    }

    await db('phone_verifications').where({ phone: phone, status: 'pending' }).update({ status: 'expired' });

    var code = verify.newCode();
    var session = await verify.createSession(phone, code);
    var id = globalThis.crypto.randomUUID();
    await db('phone_verifications').insert({
      id: id,
      user_id: user ? user.id : null,
      phone: phone,
      ip: req.ip || '',
      session_id: session.sessionId,
      code: code,
      expires_at: new Date(session.expiresAt),
    });

    log.info({ userId: user ? user.id : null, activated: Boolean(user && user.password_hash) }, 'Утас баталгаажуулалт эхэллээ');
    res.status(201).json({
      id: id,
      shortcode: session.shortcode,
      code: code,
      smsUri: session.smsUri,
      instruction: session.displayInstruction,
      expiresAt: session.expiresAt,
    });
  } catch (err) {
    if (err.status) {
      log.error({ err: err }, 'verify.mn алдаа');
      return res.status(503).json({ error: 'Баталгаажуулах үйлчилгээ түр ажиллахгүй байна. Дараа дахин оролдоно уу' });
    }
    next(err);
  }
}

async function status(req, res, next) {
  try {
    var row = await load(req.params.id);
    if (!row) return res.status(404).json({ error: 'Баталгаажуулалт олдсонгүй' });

    if (row.status === 'pending') {
      var expired = new Date(row.expires_at) <= new Date();
      var remote = expired ? 'EXPIRED' : await verify.sessionStatus(row.session_id);
      if (remote === 'VERIFIED') {
        await db('phone_verifications').where({ id: row.id, status: 'pending' }).update({ status: 'verified', verified_at: new Date() });
        log.info({ userId: row.user_id, phone: row.phone.slice(0, 4) + '****' }, 'Утас баталгаажлаа');
        row.status = 'verified';
      }
      if (remote === 'EXPIRED') {
        await db('phone_verifications').where({ id: row.id }).update({ status: 'expired' });
        return res.json({ status: 'expired' });
      }
    }
    if (row.status === 'verified') {
      var owner = await db('users').select('password_hash').where({ phone: row.phone }).first();
      return res.json({ status: 'verified', activated: Boolean(owner && owner.password_hash) });
    }
    res.json({ status: row.status });
  } catch (err) {
    if (err.status) return res.status(503).json({ error: 'Баталгаажуулах үйлчилгээ түр ажиллахгүй байна' });
    next(err);
  }
}

async function complete(req, res, next) {
  try {
    var row = await load(req.params.id);
    if (!row || row.status !== 'verified') return res.status(400).json({ error: 'Утас баталгаажаагүй байна' });
    if (Date.now() - new Date(row.verified_at).getTime() > COMPLETE_WITHIN_MS) {
      return res.status(400).json({ error: 'Хугацаа дууссан. Дахин эхнээс нь баталгаажуулна уу' });
    }

    var password = typeof req.body.password === 'string' ? req.body.password : '';
    if (password.length < MIN_PASSWORD) {
      return res.status(400).json({ error: 'Нууц үг дор хаяж ' + MIN_PASSWORD + ' тэмдэгт байна' });
    }

    // Баталгаажуулалтыг эхлээд "used" болгож эзэмшинэ — давхар дарвал хоёр дахь нь энд зогсоно
    var claimed = await db('phone_verifications').where({ id: row.id, status: 'verified' }).update({ status: 'used' });
    if (!claimed) return res.status(400).json({ error: 'Энэ баталгаажуулалт аль хэдийн ашиглагдсан' });

    var hash = await bcrypt.hash(password, 10);
    var user = await db('users').select('id', 'unit_id', 'password_hash').where({ phone: row.phone }).first();

    if (!user) {
      try {
        await db('users').insert({ phone: row.phone, name: row.phone, password_hash: hash, unit_id: null });
      } catch (err) {
        if (isDuplicate(err)) return res.status(409).json({ error: 'Энэ утас аль хэдийн бүртгэгдсэн байна. Нэвтэрнэ үү' });
        throw err;
      }
      log.info({ phone: row.phone.slice(0, 4) + '****' }, 'Шинэ бүртгэл — тоотод холбохыг хүлээж байна');
      return res.status(201).json({ pending: true });
    }

    await db('users').where({ id: user.id }).update({ password_hash: hash });

    if (!user.unit_id) {
      log.info({ userId: user.id }, 'Холбогдоогүй бүртгэлийн нууц үг солигдлоо');
      return res.json({ pending: true });
    }

    var token = startSession(res, user.id, 'user');
    log.info({ userId: user.id, first: !user.password_hash }, user.password_hash ? 'Нууц үг сэргээлээ' : 'Бүртгэл идэвхжлээ');
    res.json({ token: token });
  } catch (err) {
    next(err);
  }
}

module.exports = { start, status, complete };
