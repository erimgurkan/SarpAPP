/* ═══════════════════════════════════════════════════════════
   PostCraft — Content Routes
   Content generation, history, favorites
   ═══════════════════════════════════════════════════════════ */

const express = require('express');
const Joi = require('joi');
const { dbWrapper: db } = require('../db/database');
const config = require('../config');
const auth = require('../middleware/auth');
const checkUsageLimit = require('../middleware/rateLimit');
const { createContent, getHistory } = require('../services/contentService');

const router = express.Router();

// All content routes require authentication
router.use(auth);

// ── Validation ─────────────────────────────────────────────

const generateSchema = Joi.object({
    profile_id: Joi.number().integer().positive().optional()
        .messages({ 'number.base': 'Bir marka profili seçmelisiniz.' }),
    content_type: Joi.string().valid(...config.contentTypes).required()
        .messages({ 'any.only': 'Geçerli bir içerik türü seçin.' }),
    user_input: Joi.string().min(5).max(1000).required()
        .messages({
            'string.min': 'En az 5 karakter yazın.',
            'string.max': 'Maximum 1000 karakter girebilirsiniz.',
            'string.empty': 'Ne paylaşmak istediğinizi yazın.',
        }),
});

router.post('/generate', checkUsageLimit, async (req, res) => {
    try {
        // Normalize request body to support camelCase from frontend
        if (req.body.contentType && !req.body.content_type) {
            req.body.content_type = req.body.contentType;
        }
        if (req.body.userInput && !req.body.user_input) {
            req.body.user_input = req.body.userInput;
        }
        if (req.body.profileId && !req.body.profile_id) {
            req.body.profile_id = req.body.profileId;
        }

        // If profile_id is not provided, fetch the user's first profile
        if (!req.body.profile_id) {
            let profile = db.prepare('SELECT id FROM brand_profiles WHERE user_id = ? ORDER BY id ASC LIMIT 1').get(req.user.id);
            if (!profile) {
                // If user has no profiles, create a default one on the fly
                const stmt = db.prepare(`
                    INSERT INTO brand_profiles (user_id, name, sector, tone, target_audience, is_default)
                    VALUES (?, ?, ?, ?, ?, 1)
                `);
                const info = stmt.run(req.user.id, 'Varsayılan İşletme', 'Genel', 'Samimi ve Profesyonel', 'Genel Müşteri');
                req.body.profile_id = info.lastInsertRowid;
            } else {
                req.body.profile_id = profile.id;
            }
        }

        const { error, value } = generateSchema.validate(req.body, { stripUnknown: true });
        if (error) {
            return res.status(400).json({ error: error.details[0].message });
        }

        const result = await createContent(
            req.user.id,
            value.profile_id,
            value.content_type,
            value.user_input
        );

        res.status(201).json({
            message: 'İçerik başarıyla oluşturuldu!',
            content: result,
        });
    } catch (err) {
        console.error('Generate error:', err);

        // Handle specific errors
        if (err.message.includes('API key')) {
            return res.status(503).json({
                error: 'AI servisi henüz yapılandırılmamış.',
                code: 'AI_NOT_CONFIGURED',
            });
        }
        if (err.message.includes('profil')) {
            return res.status(404).json({ error: err.message });
        }
        if (err.message.includes('rate limit') || err.message.includes('Rate limit')) {
            return res.status(429).json({
                error: 'Çok fazla istek gönderildi, lütfen birkaç saniye bekleyin.',
                code: 'RATE_LIMITED',
            });
        }
        if (err.message.includes('kredi') || err.message.includes('quota')) {
            return res.status(503).json({
                error: 'AI servisi bakiye sorunu yaşıyor.',
                code: 'QUOTA_EXCEEDED',
            });
        }

        res.status(500).json({ error: 'İçerik oluşturulurken bir hata oluştu. Lütfen tekrar deneyin.' });
    }
});

// ── GET /api/content/history — List past content ───────────

router.get('/history', (req, res) => {
    try {
        const result = getHistory(req.user.id, {
            page: parseInt(req.query.page) || 1,
            limit: Math.min(parseInt(req.query.limit) || 20, 100),
            type: req.query.type,
            profileId: req.query.profile_id,
        });

        res.json(result);
    } catch (err) {
        console.error('History error:', err);
        res.status(500).json({ error: 'Geçmiş içerikler yüklenirken hata oluştu.' });
    }
});

// ── GET /api/content/:id — Get single content ──────────────

router.get('/:id', (req, res) => {
    try {
        const content = db.prepare(`
            SELECT gc.*, bp.name as profile_name, bp.sector
            FROM generated_content gc
            JOIN brand_profiles bp ON gc.profile_id = bp.id
            WHERE gc.id = ? AND gc.user_id = ?
        `).get(parseInt(req.params.id), req.user.id);

        if (!content) {
            return res.status(404).json({ error: 'İçerik bulunamadı.' });
        }

        res.json({ content });
    } catch (err) {
        console.error('Get content error:', err);
        res.status(500).json({ error: 'İçerik yüklenirken hata oluştu.' });
    }
});

// ── PUT /api/content/:id/favorite — Toggle favorite ────────

router.put('/:id/favorite', (req, res) => {
    try {
        const content = db.prepare(
            'SELECT id, is_favorite FROM generated_content WHERE id = ? AND user_id = ?'
        ).get(parseInt(req.params.id), req.user.id);

        if (!content) {
            return res.status(404).json({ error: 'İçerik bulunamadı.' });
        }

        const newFav = content.is_favorite ? 0 : 1;
        db.prepare('UPDATE generated_content SET is_favorite = ? WHERE id = ?')
            .run(newFav, content.id);

        res.json({
            message: newFav ? 'Favorilere eklendi.' : 'Favorilerden çıkarıldı.',
            is_favorite: !!newFav,
        });
    } catch (err) {
        console.error('Favorite error:', err);
        res.status(500).json({ error: 'Favori güncellenirken hata oluştu.' });
    }
});

// ── DELETE /api/content/:id — Delete content ───────────────

router.delete('/:id', (req, res) => {
    try {
        const result = db.prepare(
            'DELETE FROM generated_content WHERE id = ? AND user_id = ?'
        ).run(parseInt(req.params.id), req.user.id);

        if (result.changes === 0) {
            return res.status(404).json({ error: 'İçerik bulunamadı.' });
        }

        res.json({ message: 'İçerik silindi.' });
    } catch (err) {
        console.error('Delete content error:', err);
        res.status(500).json({ error: 'İçerik silinirken hata oluştu.' });
    }
});

module.exports = router;
