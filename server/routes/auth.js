/* ═══════════════════════════════════════════════════════════
   PostCraft — Auth Routes
   Kayıt, giriş, kullanıcı bilgisi
   ═══════════════════════════════════════════════════════════ */

const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const Joi = require('joi');
const { dbWrapper: db } = require('../db/database');
const config = require('../config');
const auth = require('../middleware/auth');

const router = express.Router();

// ── Validation Schemas ─────────────────────────────────────

const registerSchema = Joi.object({
    name: Joi.string().min(2).max(100).required()
        .messages({ 'string.min': 'İsim en az 2 karakter olmalı.' }),
    email: Joi.string().email().required()
        .messages({ 'string.email': 'Geçerli bir email adresi girin.' }),
    password: Joi.string().min(6).max(128).required()
        .messages({ 'string.min': 'Şifre en az 6 karakter olmalı.' }),
});

const loginSchema = Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().required(),
});

// ── POST /api/auth/register ────────────────────────────────

router.post('/register', (req, res) => {
    try {
        const { error, value } = registerSchema.validate(req.body);
        if (error) {
            return res.status(400).json({ error: error.details[0].message });
        }

        const { name, email, password } = value;

        // Check if email already exists
        const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(email);
        if (existing) {
            return res.status(409).json({ error: 'Bu email adresi zaten kayıtlı.' });
        }

        // Hash password
        const passwordHash = bcrypt.hashSync(password, 12);

        // Create user
        const stmt = db.prepare(
            'INSERT INTO users (name, email, password_hash) VALUES (?, ?, ?)'
        );
        const info = stmt.run(name, email, passwordHash);

        // Generate JWT
        const token = jwt.sign(
            { id: info.lastInsertRowid, email },
            config.jwtSecret,
            { expiresIn: config.jwtExpiry }
        );

        res.status(201).json({
            message: 'Kayıt başarılı! Hoş geldiniz.',
            token,
            user: {
                id: info.lastInsertRowid,
                name,
                email,
                plan: 'free',
                monthly_usage: 0,
            },
        });
    } catch (err) {
        console.error('Register error:', err);
        res.status(500).json({ error: 'Kayıt sırasında bir hata oluştu.' });
    }
});

// ── POST /api/auth/login ───────────────────────────────────

router.post('/login', (req, res) => {
    try {
        const { error, value } = loginSchema.validate(req.body);
        if (error) {
            return res.status(400).json({ error: error.details[0].message });
        }

        const { email, password } = value;

        // Find user
        const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email);
        if (!user) {
            return res.status(401).json({ error: 'Email veya şifre hatalı.' });
        }

        // Verify password
        const validPassword = bcrypt.compareSync(password, user.password_hash);
        if (!validPassword) {
            return res.status(401).json({ error: 'Email veya şifre hatalı.' });
        }

        // Generate JWT
        const token = jwt.sign(
            { id: user.id, email: user.email },
            config.jwtSecret,
            { expiresIn: config.jwtExpiry }
        );

        res.json({
            message: 'Giriş başarılı!',
            token,
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                plan: user.plan,
                monthly_usage: user.monthly_usage,
            },
        });
    } catch (err) {
        console.error('Login error:', err);
        res.status(500).json({ error: 'Giriş sırasında bir hata oluştu.' });
    }
});

// ── GET /api/auth/me ───────────────────────────────────────

router.get('/me', auth, (req, res) => {
    try {
        const user = db.prepare(
            'SELECT id, name, email, plan, monthly_usage, usage_reset_date, created_at FROM users WHERE id = ?'
        ).get(req.user.id);

        if (!user) {
            return res.status(404).json({ error: 'Kullanıcı bulunamadı.' });
        }

        // Get profile count
        const profileCount = db.prepare(
            'SELECT COUNT(*) as count FROM brand_profiles WHERE user_id = ?'
        ).get(req.user.id).count;

        // Get content count
        const contentCount = db.prepare(
            'SELECT COUNT(*) as count FROM generated_content WHERE user_id = ?'
        ).get(req.user.id).count;

        const planConfig = config.plans[user.plan] || config.plans.free;

        res.json({
            user: {
                ...user,
                profile_count: profileCount,
                content_count: contentCount,
                plan_name: planConfig.name,
                monthly_limit: planConfig.monthlyLimit,
                remaining: Math.max(0, planConfig.monthlyLimit - user.monthly_usage),
            },
        });
    } catch (err) {
        console.error('Me error:', err);
        res.status(500).json({ error: 'Bilgiler alınırken bir hata oluştu.' });
    }
});

module.exports = router;
