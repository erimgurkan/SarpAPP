/* ═══════════════════════════════════════════════════════════
   PostCraft — Auth Middleware
   JWT token verification
   ═══════════════════════════════════════════════════════════ */

const jwt = require('jsonwebtoken');
const config = require('../config');

function auth(req, res, next) {
    const header = req.header('Authorization');
    const token = header?.startsWith('Bearer ') ? header.slice(7) : null;

    if (!token) {
        return res.status(401).json({
            error: 'Giriş yapmanız gerekiyor.',
            code: 'AUTH_REQUIRED',
        });
    }

    try {
        const decoded = jwt.verify(token, config.jwtSecret);
        req.user = decoded; // { id, email, iat, exp }
        next();
    } catch (err) {
        if (err.name === 'TokenExpiredError') {
            return res.status(401).json({
                error: 'Oturum süreniz doldu. Lütfen tekrar giriş yapın.',
                code: 'TOKEN_EXPIRED',
            });
        }
        return res.status(401).json({
            error: 'Geçersiz token.',
            code: 'INVALID_TOKEN',
        });
    }
}

module.exports = auth;
