/* ═══════════════════════════════════════════════════════════
   PostCraft — Rate Limit Middleware
   Plan-based monthly content generation limits
   ═══════════════════════════════════════════════════════════ */

const { dbWrapper: db } = require('../db/database');
const config = require('../config');

function checkUsageLimit(req, res, next) {
    const userId = req.user.id;

    const user = db.prepare(
        'SELECT plan, monthly_usage, usage_reset_date FROM users WHERE id = ?'
    ).get(userId);

    if (!user) {
        return res.status(404).json({ error: 'Kullanıcı bulunamadı.' });
    }

    // Check if monthly counter needs reset
    const now = new Date();
    const resetDate = new Date(user.usage_reset_date);

    if (now >= resetDate) {
        const nextReset = new Date(now.getFullYear(), now.getMonth() + 1, 1)
            .toISOString().split('T')[0];

        db.prepare(
            'UPDATE users SET monthly_usage = 0, usage_reset_date = ? WHERE id = ?'
        ).run(nextReset, userId);

        user.monthly_usage = 0;
    }

    // Check limit
    const planConfig = config.plans[user.plan] || config.plans.free;

    if (user.monthly_usage >= planConfig.monthlyLimit) {
        return res.status(429).json({
            error: 'Aylık içerik üretim limitinize ulaştınız.',
            code: 'LIMIT_REACHED',
            plan: user.plan,
            usage: user.monthly_usage,
            limit: planConfig.monthlyLimit,
            upgrade: user.plan === 'free'
                ? 'Profesyonel plana geçerek sınırsız içerik üretin.'
                : null,
        });
    }

    req.planConfig = planConfig;
    req.currentUsage = user.monthly_usage;
    next();
}

module.exports = checkUsageLimit;
