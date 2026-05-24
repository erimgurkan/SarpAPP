/* ═══════════════════════════════════════════════════════════
   PostCraft — Plans Routes
   Plan information and usage tracking
   ═══════════════════════════════════════════════════════════ */

const express = require('express');
const { dbWrapper: db } = require('../db/database');
const config = require('../config');
const auth = require('../middleware/auth');

const router = express.Router();

// ── GET /api/plans — List all plans (public) ───────────────

router.get('/', (req, res) => {
    res.json({
        plans: [
            {
                id: 'free',
                name: 'Başlangıç',
                price: 0,
                currency: '₺',
                period: 'ay',
                popular: false,
                features: [
                    'Ayda 5 içerik üretimi',
                    '1 işletme profili',
                    'Temel içerik türleri',
                ],
                limits: {
                    monthlyLimit: config.plans.free.monthlyLimit,
                    maxProfiles: config.plans.free.maxProfiles,
                },
            },
            {
                id: 'pro',
                name: 'Profesyonel',
                price: 199,
                currency: '₺',
                period: 'ay',
                popular: true,
                features: [
                    'Sınırsız içerik üretimi',
                    '3 işletme profili',
                    'Tüm içerik türleri',
                    'Marka sesi kaydetme',
                    'Öncelikli destek',
                ],
                limits: {
                    monthlyLimit: config.plans.pro.monthlyLimit,
                    maxProfiles: config.plans.pro.maxProfiles,
                },
            },
            {
                id: 'business',
                name: 'İşletme',
                price: 399,
                currency: '₺',
                period: 'ay',
                popular: false,
                features: [
                    'Sınırsız içerik üretimi',
                    'Sınırsız işletme profili',
                    'API erişimi',
                    'Özel prompt şablonları',
                    'Birebir danışmanlık',
                ],
                limits: {
                    monthlyLimit: config.plans.business.monthlyLimit,
                    maxProfiles: config.plans.business.maxProfiles,
                },
            },
        ],
    });
});

// ── GET /api/plans/usage — Current usage (requires auth) ───

router.get('/usage', auth, (req, res) => {
    try {
        const user = db.prepare(
            'SELECT plan, monthly_usage, usage_reset_date FROM users WHERE id = ?'
        ).get(req.user.id);

        if (!user) {
            return res.status(404).json({ error: 'Kullanıcı bulunamadı.' });
        }

        const planConfig = config.plans[user.plan] || config.plans.free;

        res.json({
            plan: user.plan,
            plan_name: planConfig.name,
            monthly_usage: user.monthly_usage,
            monthly_limit: planConfig.monthlyLimit,
            remaining: Math.max(0, planConfig.monthlyLimit - user.monthly_usage),
            max_profiles: planConfig.maxProfiles,
            reset_date: user.usage_reset_date,
            is_unlimited: planConfig.monthlyLimit > 999,
        });
    } catch (err) {
        console.error('Usage error:', err);
        res.status(500).json({ error: 'Kullanım bilgileri alınırken hata oluştu.' });
    }
});

module.exports = router;
