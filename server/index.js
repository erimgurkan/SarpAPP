/* ═══════════════════════════════════════════════════════════
   PostCraft — Express Server
   Main entry point
   ═══════════════════════════════════════════════════════════ */

const express = require('express');
const cors = require('cors');
const path = require('path');
const config = require('./config');
const { initDatabase } = require('./db/database');
const { isConfigured } = require('./services/openaiService');

const app = express();

// ── Middleware ──────────────────────────────────────────────

app.use(cors());
app.use(express.json({ limit: '10mb' }));

// Serve static frontend files (landing page)
app.use(express.static(path.join(__dirname, '..')));
app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')));

// ── API Routes ─────────────────────────────────────────────

app.use('/api/auth', require('./routes/auth'));
app.use('/api/profiles', require('./routes/profiles'));
app.use('/api/content', require('./routes/content'));
app.use('/api/plans', require('./routes/plans'));

// ── Health Check ───────────────────────────────────────────

app.get('/api/health', (req, res) => {
    res.json({
        status: 'ok',
        version: '1.0.0',
        timestamp: new Date().toISOString(),
        services: {
            database: 'connected',
            openai: isConfigured() ? 'configured' : 'NOT_CONFIGURED — .env dosyasına API key ekleyin',
        },
    });
});

// ── 404 for API routes ─────────────────────────────────────

app.use('/api/*', (req, res) => {
    res.status(404).json({ error: 'Endpoint bulunamadı.' });
});

// ── SPA Fallback ───────────────────────────────────────────

app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'index.html'));
});

// ── Error Handler ──────────────────────────────────────────

app.use((err, req, res, next) => {
    console.error('Unhandled error:', err);
    res.status(500).json({ error: 'Sunucu hatası oluştu.' });
});

// ── Start Server (async for database init) ─────────────────

(async () => {
    try {
        // Ensure uploads directory exists
        const fs = require('fs');
        const uploadsDir = path.join(__dirname, '..', 'uploads');
        if (!fs.existsSync(uploadsDir)) {
            fs.mkdirSync(uploadsDir, { recursive: true });
        }

        // Initialize SQLite database
        await initDatabase();

        app.listen(config.port, () => {
            const aiStatus = isConfigured() ? '✅ Hazır' : '❌ API KEY GEREKLİ';

            console.log(`
╔══════════════════════════════════════════════════╗
║            PostCraft Backend v1.0                ║
╠══════════════════════════════════════════════════╣
║                                                  ║
║  🚀 Server:     http://localhost:${String(config.port).padEnd(5)}          ║
║  📊 Database:   SQLite (bağlı)                   ║
║  🤖 AI Model:   gemini-3.1-flash-lite & Imagen 4 ║
║  🔑 Gemini API: ${aiStatus.padEnd(30)} ║
║                                                  ║
╠══════════════════════════════════════════════════╣
║  API Endpoints:                                  ║
║  POST /api/auth/register    — Kayıt              ║
║  POST /api/auth/login       — Giriş              ║
║  GET  /api/auth/me          — Profil              ║
║  GET  /api/profiles         — Marka profilleri    ║
║  POST /api/profiles         — Profil oluştur      ║
║  POST /api/content/generate — İçerik üret         ║
║  GET  /api/content/history  — Geçmiş              ║
║  GET  /api/plans            — Plan bilgisi        ║
║  GET  /api/health           — Sağlık kontrolü     ║
╚══════════════════════════════════════════════════╝
            `);

            if (!isConfigured()) {
                console.log('⚠️  Google Gemini API key ayarlanmamış!');
                console.log('   .env dosyasındaki GEMINI_API_KEY değerini güncelleyin.');
                console.log('   Key almak için: https://aistudio.google.com/apikey');
                console.log('');
            }
        });
    } catch (err) {
        console.error('❌ Sunucu başlatılamadı:', err);
        process.exit(1);
    }
})();
