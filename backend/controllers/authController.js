var bcrypt = require('bcryptjs');
var jwt = require('jsonwebtoken');
var { Users } = require('../db/models');

/**
 * login - имейл болон нууц үгээр нэвтрэх
 * logout - cookie устгах
 * me - одоо нэвтэрсэн хэрэглэгчийн мэдээлэл
 */

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
            httpOnly: true, 
            sameSite: 'lax',
            secure: process.env.NODE_ENV === 'production',
            maxAge: 7 * 24 * 60 * 60 * 1000, // 7 хоног, JWT_EXPIRES_IN-тэй ижил
        });

        res.json({ token });
    } catch (err) {
        next(err);
    }
}

// cookie устгах 
async function logout(req, res, next) {
    res.clearCookie('token', {
        httpOnly: true,
        sameSite: 'lax',
        secure: process.env.NODE_ENV === 'production',
    });
    res.json({ ok: true });
}

// мэдээлэл өгөх 
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

async function forgotPassword(req, res, next) {
}

async function resetPassword(req, res, next) {
}

module.exports = { login, logout, me, forgotPassword, resetPassword };
