/* ═══════════════════════════════════════════════════════════
   PostCraft — Brand Profile Routes
   CRUD operations for brand profiles (multi-profile support)
   ═══════════════════════════════════════════════════════════ */

const express = require('express');
const Joi = require('joi');
const { dbWrapper: db } = require('../db/database');
const config = require('../config');
const auth = require('../middleware/auth');

const router = express.Router();

// All profile routes require authentication
router.use(auth);

// ── Validation Schema ──────────────────────────────────────

const profileSchema = Joi.object({
    name: Joi.string().min(1).max(100).required()
        .messages({ 'string.empty': 'Profil adı gerekli.' }),
    sector: Joi.string().valid(...config.sectors).required()
        .messages({ 'any.only': 'Geçerli bir sektör seçin.' }),
    tone: Joi.string().valid(...config.tones).default('samimi'),
    target_audience: Joi.string().max(500).allow('', null),
    primary_color: Joi.string().pattern(/^#[0-9A-Fa-f]{6}$/).allow('', null)
        .messages({ 'string.pattern.base': 'Renk kodu #RRGGBB formatında olmalı.' }),
    secondary_color: Joi.string().pattern(/^#[0-9A-Fa-f]{6}$/).allow('', null),
    heading_font: Joi.string().max(100).allow('', null),
    body_font: Joi.string().max(100).allow('', null),
    brand_description: Joi.string().max(1000).allow('', null),
    sample_posts: Joi.string().max(2000).allow('', null),
});

// ── GET /api/profiles — List all profiles ──────────────────

router.get('/', (req, res) => {
    try {
        const profiles = db.prepare(
            'SELECT * FROM brand_profiles WHERE user_id = ? ORDER BY is_default DESC, created_at DESC'
        ).all(req.user.id);

        res.json({ profiles });
    } catch (err) {
        console.error('List profiles error:', err);
        res.status(500).json({ error: 'Profiller yüklenirken hata oluştu.' });
    }
});

// ── GET /api/profiles/:id — Get single profile ─────────────

router.get('/:id', (req, res) => {
    try {
        const profile = db.prepare(
            'SELECT * FROM brand_profiles WHERE id = ? AND user_id = ?'
        ).get(parseInt(req.params.id), req.user.id);

        if (!profile) {
            return res.status(404).json({ error: 'Profil bulunamadı.' });
        }

        res.json({ profile });
    } catch (err) {
        console.error('Get profile error:', err);
        res.status(500).json({ error: 'Profil yüklenirken hata oluştu.' });
    }
});

// ── POST /api/profiles — Create new profile ────────────────

router.post('/', (req, res) => {
    try {
        const { error, value } = profileSchema.validate(req.body);
        if (error) {
            return res.status(400).json({ error: error.details[0].message });
        }

        // Check profile limit based on plan
        const user = db.prepare('SELECT plan FROM users WHERE id = ?').get(req.user.id);
        const planConfig = config.plans[user.plan] || config.plans.free;
        const count = db.prepare(
            'SELECT COUNT(*) as count FROM brand_profiles WHERE user_id = ?'
        ).get(req.user.id).count;

        if (count >= planConfig.maxProfiles) {
            return res.status(403).json({
                error: `Planınız maksimum ${planConfig.maxProfiles} profil destekliyor.`,
                code: 'PROFILE_LIMIT',
                upgrade: user.plan === 'free'
                    ? 'Profesyonel plana geçerek 3 profil oluşturabilirsiniz.'
                    : null,
            });
        }

        // First profile is automatically default
        const isDefault = count === 0 ? 1 : 0;

        const stmt = db.prepare(`
            INSERT INTO brand_profiles
                (user_id, name, sector, tone, target_audience, primary_color,
                 secondary_color, heading_font, body_font, brand_description,
                 sample_posts, is_default)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `);

        const info = stmt.run(
            req.user.id,
            value.name,
            value.sector,
            value.tone,
            value.target_audience || null,
            value.primary_color || null,
            value.secondary_color || null,
            value.heading_font || null,
            value.body_font || null,
            value.brand_description || null,
            value.sample_posts || null,
            isDefault
        );

        const profile = db.prepare('SELECT * FROM brand_profiles WHERE id = ?')
            .get(info.lastInsertRowid);

        res.status(201).json({
            message: 'Marka profili oluşturuldu!',
            profile,
        });
    } catch (err) {
        console.error('Create profile error:', err);
        res.status(500).json({ error: 'Profil oluşturulurken hata oluştu.' });
    }
});

// ── PUT /api/profiles/:id — Update profile ─────────────────

router.put('/:id', (req, res) => {
    try {
        const profileId = parseInt(req.params.id);

        const existing = db.prepare(
            'SELECT * FROM brand_profiles WHERE id = ? AND user_id = ?'
        ).get(profileId, req.user.id);

        if (!existing) {
            return res.status(404).json({ error: 'Profil bulunamadı.' });
        }

        const { error, value } = profileSchema.validate(req.body);
        if (error) {
            return res.status(400).json({ error: error.details[0].message });
        }

        db.prepare(`
            UPDATE brand_profiles
            SET name = ?, sector = ?, tone = ?, target_audience = ?,
                primary_color = ?, secondary_color = ?, heading_font = ?,
                body_font = ?, brand_description = ?, sample_posts = ?
            WHERE id = ? AND user_id = ?
        `).run(
            value.name, value.sector, value.tone,
            value.target_audience || null,
            value.primary_color || null,
            value.secondary_color || null,
            value.heading_font || null,
            value.body_font || null,
            value.brand_description || null,
            value.sample_posts || null,
            profileId, req.user.id
        );

        const profile = db.prepare('SELECT * FROM brand_profiles WHERE id = ?')
            .get(profileId);

        res.json({ message: 'Profil güncellendi.', profile });
    } catch (err) {
        console.error('Update profile error:', err);
        res.status(500).json({ error: 'Profil güncellenirken hata oluştu.' });
    }
});

// ── DELETE /api/profiles/:id — Delete profile ──────────────

router.delete('/:id', (req, res) => {
    try {
        const profileId = parseInt(req.params.id);

        const existing = db.prepare(
            'SELECT * FROM brand_profiles WHERE id = ? AND user_id = ?'
        ).get(profileId, req.user.id);

        if (!existing) {
            return res.status(404).json({ error: 'Profil bulunamadı.' });
        }

        db.prepare('DELETE FROM brand_profiles WHERE id = ? AND user_id = ?')
            .run(profileId, req.user.id);

        // If deleted profile was default, make another one default
        if (existing.is_default) {
            const another = db.prepare(
                'SELECT id FROM brand_profiles WHERE user_id = ? LIMIT 1'
            ).get(req.user.id);

            if (another) {
                db.prepare('UPDATE brand_profiles SET is_default = 1 WHERE id = ?')
                    .run(another.id);
            }
        }

        res.json({ message: 'Profil silindi.' });
    } catch (err) {
        console.error('Delete profile error:', err);
        res.status(500).json({ error: 'Profil silinirken hata oluştu.' });
    }
});

// ── PUT /api/profiles/:id/default — Set as default ─────────

router.put('/:id/default', (req, res) => {
    try {
        const profileId = parseInt(req.params.id);

        const existing = db.prepare(
            'SELECT * FROM brand_profiles WHERE id = ? AND user_id = ?'
        ).get(profileId, req.user.id);

        if (!existing) {
            return res.status(404).json({ error: 'Profil bulunamadı.' });
        }

        // Remove current default
        db.prepare('UPDATE brand_profiles SET is_default = 0 WHERE user_id = ?')
            .run(req.user.id);

        // Set new default
        db.prepare('UPDATE brand_profiles SET is_default = 1 WHERE id = ?')
            .run(profileId);

        res.json({ message: 'Varsayılan profil güncellendi.' });
    } catch (err) {
        console.error('Set default error:', err);
        res.status(500).json({ error: 'Varsayılan profil ayarlanırken hata oluştu.' });
    }
});

module.exports = router;
