/* ═══════════════════════════════════════════════════════════
   PostCraft — Brand Profile Routes
   CRUD operations for brand profiles (multi-profile support)
   Includes AI visual analysis and local file upload logic
   ═══════════════════════════════════════════════════════════ */

const express = require('express');
const Joi = require('joi');
const fs = require('fs');
const path = require('path');
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
    brand_name: Joi.string().min(1).max(100).required()
        .messages({ 'string.empty': 'Marka adı gerekli.' }),
    sector: Joi.string().required()
        .messages({ 'string.empty': 'Sektör seçimi gereklidir.' }),
    tone: Joi.string().allow('', null).default('samimi'),
    primary_color: Joi.string().pattern(/^#[0-9A-Fa-f]{6}$/).allow('', null)
        .messages({ 'string.pattern.base': 'Birincil renk kodu #RRGGBB formatında olmalı.' }),
    secondary_color: Joi.string().pattern(/^#[0-9A-Fa-f]{6}$/).allow('', null)
        .messages({ 'string.pattern.base': 'İkincil renk kodu #RRGGBB formatında olmalı.' }),
    accent_color: Joi.string().pattern(/^#[0-9A-Fa-f]{6}$/).allow('', null)
        .messages({ 'string.pattern.base': 'Vurgu renk kodu #RRGGBB formatında olmalı.' }),
    logo_url: Joi.string().allow('', null),
    screenshot_url: Joi.string().allow('', null),
    instagram_url: Joi.string().allow('', null),
    brand_analysis: Joi.object().allow(null),
    price_segment: Joi.string().allow('', null),
    target_audience: Joi.object().allow(null),
    brand_language: Joi.object().allow(null),
    competitor_accounts: Joi.array().items(Joi.string()).allow(null),
    content_language: Joi.string().allow('', null),
    typography_preference: Joi.string().allow('', null),
    profile_tier: Joi.string().allow('', null),
});

// ── Helper functions for visual analysis ───────────────────

async function getFileDataAndMime(url) {
    if (url.startsWith('/uploads/')) {
        const fileName = url.replace('/uploads/', '');
        const filePath = path.join(__dirname, '..', '..', 'uploads', fileName);
        if (fs.existsSync(filePath)) {
            const buffer = fs.readFileSync(filePath);
            const ext = path.extname(fileName).toLowerCase();
            const mimeType = ext === '.png' ? 'image/png' : ext === '.jpg' || ext === '.jpeg' ? 'image/jpeg' : 'image/png';
            return {
                base64: buffer.toString('base64'),
                mimeType
            };
        }
    }
    
    // Fallback: network fetch if absolute URL
    const response = await fetch(url);
    const buffer = await response.arrayBuffer();
    const mimeType = response.headers.get('content-type') || 'image/png';
    return {
        base64: Buffer.from(buffer).toString('base64'),
        mimeType
    };
}

// ── POST /api/profiles/upload — Local File Upload ───────────

router.post('/upload', (req, res) => {
    try {
        const { fileData, fileName } = req.body;
        if (!fileData || !fileName) {
            return res.status(400).json({ error: 'Dosya verisi (base64) ve adı gereklidir.' });
        }

        const base64Data = fileData.replace(/^data:image\/\w+;base64,/, "");
        const buffer = Buffer.from(base64Data, 'base64');

        const ext = path.extname(fileName) || '.png';
        const uniqueName = `${req.user.id}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}${ext}`;
        
        const uploadsDir = path.join(__dirname, '..', '..', 'uploads');
        if (!fs.existsSync(uploadsDir)) {
            fs.mkdirSync(uploadsDir, { recursive: true });
        }

        const filePath = path.join(uploadsDir, uniqueName);
        fs.writeFileSync(filePath, buffer);

        res.json({
            message: 'Dosya yükleme başarılı',
            url: `/uploads/${uniqueName}`
        });
    } catch (err) {
        console.error('File upload error:', err);
        res.status(500).json({ error: 'Dosya yüklenirken bir hata oluştu.' });
    }
});

// ── POST /api/profiles/analyze-brand — Gemini AI Analysis ───

router.post('/analyze-brand', async (req, res) => {
    try {
        const { logoUrl, screenshotUrl } = req.body;
        if (!logoUrl) {
            return res.status(400).json({ error: 'Analiz için logo gereklidir.' });
        }

        if (!config.geminiApiKey || config.geminiApiKey === 'AIzaSyBURAYA_GEMINI_KEYINI_YAZ') {
            return res.status(503).json({ error: 'Google Gemini API key ayarlanmamış.' });
        }

        const PROMPT = `Analyze this brand's visual identity. Return ONLY a raw JSON object — no markdown, no code fences, no explanation:
{"primary_color":"#hexcode","secondary_color":"#hexcode","accent_color":"#hexcode","tone":"one of: resmi/samimi/esprili/premium/sıcak","visual_style":"short description in Turkish","typography_feeling":"one of: bold/light/balanced","content_themes":["theme1","theme2","theme3"],"brand_description":"2-3 sentences in Turkish","suggested_price_segment":"one of: Ekonomik/Orta Segment/Premium","overall_aesthetic":"one sentence in Turkish"}`;

        const parts = [];
        
        // 1. Process Logo
        try {
            const logoData = await getFileDataAndMime(logoUrl);
            parts.push({
                inlineData: {
                    mimeType: logoData.mimeType,
                    data: logoData.base64
                }
            });
        } catch (e) {
            console.error('Failed to parse logo for analysis:', e);
            return res.status(400).json({ error: 'Logo görseli analiz için okunamadı.' });
        }

        // 2. Process Instagram Screenshot (optional)
        if (screenshotUrl) {
            try {
                const ssData = await getFileDataAndMime(screenshotUrl);
                parts.push({
                    inlineData: {
                        mimeType: ssData.mimeType,
                        data: ssData.base64
                    }
                });
            } catch (e) {
                console.warn('Failed to parse screenshot for analysis, continuing with logo only:', e);
            }
        }

        // 3. Append prompt text
        parts.push({ text: PROMPT });

        const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${config.geminiApiKey}`;
        
        console.log("🤖 Google Gemini (gemini-2.0-flash) ile görsel marka analizi yapılıyor...");

        const response = await fetch(endpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{ parts }],
                generationConfig: { temperature: 0.1 }
            })
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            const errMsg = errorData.error?.message || response.statusText;
            throw new Error(`Gemini API Hatası: ${errMsg}`);
        }

        const data = await response.json();
        const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text ?? '';
        
        if (!rawText) {
            throw new Error('Gemini boş yanıt döndürdü');
        }

        const cleaned = rawText.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim();
        const analysis = JSON.parse(cleaned);

        res.json(analysis);
    } catch (err) {
        console.error('Brand analysis error:', err);
        res.status(500).json({ error: `Marka analizi başarısız oldu: ${err.message}` });
    }
});

// ── GET /api/profiles — List all profiles ──────────────────

router.get('/', (req, res) => {
    try {
        const profiles = db.prepare(
            'SELECT * FROM brand_profiles WHERE user_id = ? ORDER BY is_default DESC, created_at DESC'
        ).all(req.user.id);

        // Parse JSON strings back to objects
        const parsedProfiles = profiles.map(p => ({
            ...p,
            target_audience: p.target_audience ? JSON.parse(p.target_audience) : null,
            brand_analysis: p.brand_analysis ? JSON.parse(p.brand_analysis) : null,
            brand_language: p.brand_language ? JSON.parse(p.brand_language) : null,
            competitor_accounts: p.competitor_accounts ? JSON.parse(p.competitor_accounts) : null,
        }));

        res.json({ profiles: parsedProfiles });
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

        // Parse JSON strings back to objects
        const parsed = {
            ...profile,
            target_audience: profile.target_audience ? JSON.parse(profile.target_audience) : null,
            brand_analysis: profile.brand_analysis ? JSON.parse(profile.brand_analysis) : null,
            brand_language: profile.brand_language ? JSON.parse(profile.brand_language) : null,
            competitor_accounts: profile.competitor_accounts ? JSON.parse(profile.competitor_accounts) : null,
        };

        res.json({ profile: parsed });
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
                (user_id, name, brand_name, sector, tone, primary_color, secondary_color, accent_color,
                 logo_url, screenshot_url, instagram_url, brand_analysis, price_segment, target_audience,
                 brand_language, competitor_accounts, content_language, typography_preference, profile_tier, is_default)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `);

        const info = stmt.run(
            req.user.id,
            value.name,
            value.brand_name || null,
            value.sector,
            value.tone || 'samimi',
            value.primary_color || null,
            value.secondary_color || null,
            value.accent_color || null,
            value.logo_url || null,
            value.screenshot_url || null,
            value.instagram_url || null,
            value.brand_analysis ? JSON.stringify(value.brand_analysis) : null,
            value.price_segment || null,
            value.target_audience ? JSON.stringify(value.target_audience) : null,
            value.brand_language ? JSON.stringify(value.brand_language) : null,
            value.competitor_accounts ? JSON.stringify(value.competitor_accounts) : null,
            value.content_language || null,
            value.typography_preference || null,
            value.profile_tier || null,
            isDefault
        );

        const profile = db.prepare('SELECT * FROM brand_profiles WHERE id = ?')
            .get(info.lastInsertRowid);

        res.status(201).json({
            message: 'Marka profili oluşturuldu!',
            profile: {
                ...profile,
                target_audience: profile.target_audience ? JSON.parse(profile.target_audience) : null,
                brand_analysis: profile.brand_analysis ? JSON.parse(profile.brand_analysis) : null,
                brand_language: profile.brand_language ? JSON.parse(profile.brand_language) : null,
                competitor_accounts: profile.competitor_accounts ? JSON.parse(profile.competitor_accounts) : null,
            },
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
            SET name = ?, brand_name = ?, sector = ?, tone = ?, primary_color = ?, secondary_color = ?, accent_color = ?,
                logo_url = ?, screenshot_url = ?, instagram_url = ?, brand_analysis = ?, price_segment = ?, target_audience = ?,
                brand_language = ?, competitor_accounts = ?, content_language = ?, typography_preference = ?, profile_tier = ?
            WHERE id = ? AND user_id = ?
        `).run(
            value.name,
            value.brand_name || null,
            value.sector,
            value.tone || 'samimi',
            value.primary_color || null,
            value.secondary_color || null,
            value.accent_color || null,
            value.logo_url || null,
            value.screenshot_url || null,
            value.instagram_url || null,
            value.brand_analysis ? JSON.stringify(value.brand_analysis) : null,
            value.price_segment || null,
            value.target_audience ? JSON.stringify(value.target_audience) : null,
            value.brand_language ? JSON.stringify(value.brand_language) : null,
            value.competitor_accounts ? JSON.stringify(value.competitor_accounts) : null,
            value.content_language || null,
            value.typography_preference || null,
            value.profile_tier || null,
            profileId, req.user.id
        );

        const profile = db.prepare('SELECT * FROM brand_profiles WHERE id = ?')
            .get(profileId);

        res.json({
            message: 'Profil güncellendi.',
            profile: {
                ...profile,
                target_audience: profile.target_audience ? JSON.parse(profile.target_audience) : null,
                brand_analysis: profile.brand_analysis ? JSON.parse(profile.brand_analysis) : null,
                brand_language: profile.brand_language ? JSON.parse(profile.brand_language) : null,
                competitor_accounts: profile.competitor_accounts ? JSON.parse(profile.competitor_accounts) : null,
            }
        });
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
