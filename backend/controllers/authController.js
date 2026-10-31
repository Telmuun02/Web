var bcrypt = require('bcryptjs');
var jwt = require('jsonwebtoken');
var { Users } = require('../db/models');

// POST /api/auth/login — { login, password }, login нь имэйл эсвэл утас
async function login(req, res, next) {
    try {
        var login = (req.body.login || "").trim();
        var password = req.body.password;

        if(!login || !password) {
            return res.status(400).json({ error: 'login болон password хоёрыг заавал оруулна' });
        }

        var user = await Users.findForLogin(login);

        var ok = user && user.password_hash && (await bcrypt.compare(password, user.password_hash));

        if(!ok) {
            return res.status(401).json({ error: 'login эсвэл password буруу байна' });
        }

        var token = jwt.sign({ id: user.id, role: user.role }, 
            process.env.JWT_SECRET, 
            { expiresIn: process.env.JWT_EXPIRES_IN || '7d' });

        res.cookie('token', token, {
            httpOnly: true, // JS-ээс уншигдахгүй (XSS-ээс хамгаална)
            sameSite: 'lax',
            secure: process.env.NODE_ENV === 'production', // production-д зөвхөн https
            maxAge: 7 * 24 * 60 * 60 * 1000, // 7 хоног, JWT_EXPIRES_IN-тэй ижил
        });

        res.json({ token });
    } catch (err) {
        next(err);
    }
}

// POST /api/auth/logout
// Cookie-ийн тохиргоо login-тай ижил байх ёстой, эс бөгөөс browser устгахгүй
async function logout(req, res, next) {
    res.clearCookie('token', {
        httpOnly: true,
        sameSite: 'lax',
        secure: process.env.NODE_ENV === 'production',
    });
    res.json({ ok: true });
}

// GET /api/auth/me — одоо нэвтэрсэн хэрэглэгч
// req.user-ийг auth middleware тавьсан. Users.find нь password_hash-гүй буцаана
async function me(req, res, next) {
    try {
        var user = await Users.find(req.user.id);

        // Token хүчинтэй ч хэрэглэгч устгагдсан байж болно
        if (!user) {
            return res.status(401).json({ error: 'Хэрэглэгч олдсонгүй' });
        }

        res.json(user);
    } catch (err) {
        next(err);
    }
}

// POST /api/auth/forgot-password — { login }, баталгаажуулах код илгээнэ
async function forgotPassword(req, res, next) {
}

// POST /api/auth/reset-password — { login, code, password }
async function resetPassword(req, res, next) {
}

module.exports = { login, logout, me, forgotPassword, resetPassword };
