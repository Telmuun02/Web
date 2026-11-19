/**
 * Нэвтрэлт - /api/auth/...
 * Хуудас: Login (/login), ForgotPassword (/forgot-password)
 *
 * login - имэйл/утас, нууц үгээр нэвтэрч JWT өгнө (cookie + хариунд)
 *   POST /api/auth/login - { login, password, as: 'admin' | 'user' }
 * logout - token cookie-г устгана
 *   POST /api/auth/logout
 * me - одоо нэвтэрсэн хэрэглэгчийн мэдээлэл, role-той
 *   GET /api/auth/me
 * forgotPassword - (хоосон, бичигдээгүй)
 * resetPassword - (хоосон, бичигдээгүй)
 */

var bcrypt = require('bcryptjs');
var jwt = require('jsonwebtoken');
var { Users, Admins } = require('../db/models');
var log = require('../lib/logger').child({ module: 'auth' });

async function login(req, res, next) {
    try {
        var login = (req.body.login || "").trim();
        var password = req.body.password;
        var as = req.body.as === 'admin' ? 'admin' : 'user';

        if(!login || !password) {
            return res.status(400).json({ error: 'login болон password хоёрыг заавал оруулна' });
        }

        var Model = as === 'admin' ? Admins : Users;
        var user = await Model.findForLogin(login);

        var ok = user && user.password_hash && (await bcrypt.compare(password, user.password_hash));

        if(!ok) {
            log.warn({ login: login, as: as, ip: req.ip }, 'Нэвтрэлт амжилтгүй');
            return res.status(401).json({ error: 'login эсвэл password буруу байна' });
        }

        if (as === 'admin' && !user.active) {
            log.warn({ id: user.id, as: as, ip: req.ip }, 'Хаагдсан ажилтан нэвтрэх оролдлого');
            return res.status(403).json({ error: 'Таны ажилтны эрх хаагдсан байна' });
        }
        if (as === 'user' && !user.unit_id) {
            log.warn({ id: user.id, as: as, ip: req.ip }, 'Тоотгүй оршин суугч нэвтрэх оролдлого');
            return res.status(403).json({ error: 'Та ямар нэг тоотод бүртгэлгүй байна' });
        }

        var token = jwt.sign({ id: user.id, role: as }, 
            process.env.JWT_SECRET, 
            { expiresIn: process.env.JWT_EXPIRES_IN || '7d' });

        res.cookie('token', token, {
            httpOnly: true, 
            sameSite: 'lax',
            secure: process.env.NODE_ENV === 'production',
            maxAge: 7 * 24 * 60 * 60 * 1000,
        });

        log.info({ id: user.id, as: as, ip: req.ip }, 'Нэвтэрлээ');
        res.json({ token });
    } catch (err) {
        next(err);
    }
}

async function logout(req, res, next) {
    log.info({ id: req.user && req.user.id, as: req.user && req.user.role, ip: req.ip }, 'Гарлаа');
    res.clearCookie('token', {
        httpOnly: true,
        sameSite: 'lax',
        secure: process.env.NODE_ENV === 'production',
    });
    res.json({ ok: true });
}

async function me(req, res, next) {
    try {
        var Model = req.user.role === 'admin' ? Admins : Users;
        var user = await Model.find(req.user.id);

        if (!user) {
            return res.status(401).json({ error: 'Хэрэглэгч олдсонгүй' });
        }

        res.json({ ...user, role: req.user.role });
    } catch (err) {
        next(err);
    }
}

async function forgotPassword(req, res, next) {
}

async function resetPassword(req, res, next) {
}

module.exports = { login, logout, me, forgotPassword, resetPassword };
