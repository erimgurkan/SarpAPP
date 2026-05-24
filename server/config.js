/* ═══════════════════════════════════════════════════════════
   PostCraft — Configuration
   Loads environment variables and exports app-wide settings
   ═══════════════════════════════════════════════════════════ */

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env'), override: true });

module.exports = {
    port: parseInt(process.env.PORT, 10) || 3001,

    jwtSecret: process.env.JWT_SECRET || 'default_secret_change_in_production',
    jwtExpiry: '30d',

    hfToken: process.env.HF_TOKEN,
    geminiApiKey: process.env.GEMINI_API_KEY || 'AIzaSyAsDmDFcmPu5RTQ6uKW9bfDnygZ5ZlMdV4',

    openai: {
        apiKey: process.env.OPENAI_API_KEY,
        model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
    },

    db: {
        path: path.join(__dirname, 'db', 'postcraft.db'),
    },

    // Plan limitleri
    plans: {
        free: {
            name: 'Başlangıç',
            monthlyLimit: 5,
            maxProfiles: 1,
        },
        pro: {
            name: 'Profesyonel',
            monthlyLimit: 999999, // sınırsız
            maxProfiles: 3,
        },
        business: {
            name: 'İşletme',
            monthlyLimit: 999999,
            maxProfiles: 999999,
        },
    },

    // İçerik türleri
    contentTypes: ['carousel', 'duyuru', 'tek-kare', 'story', 'caption'],

    // Sektörler
    sectors: ['kafe', 'restoran', 'butik', 'kuafor', 'eczane', 'fitness', 'diger'],

    // Tonlar
    tones: ['samimi', 'profesyonel', 'enerjik', 'minimal', 'premium', 'sicak', 'esprili'],
};
