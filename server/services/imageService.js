/* ═══════════════════════════════════════════════════════════
   PostMax — Image Service (Google Gemini Imagen 4.0 API)
   ═══════════════════════════════════════════════════════════ */

const config = require('../config');
const { dbWrapper: db } = require('../db/database');

// Google Gemini Imagen 4.0 Models
const IMAGEN_MODELS = [
    'imagen-4.0-generate-001',
    'imagen-4.0-ultra-generate-001',
    'imagen-4.0-fast-generate-001'
];

/**
 * Get daily usage count for a model
 */
function getModelRpdCount(model) {
    try {
        const today = new Date().toISOString().split('T')[0];
        const row = db.prepare('SELECT count, last_reset FROM model_rpd_usage WHERE model = ?').get(model);
        if (row && row.last_reset === today) {
            return row.count;
        }
        return 0;
    } catch (e) {
        console.error('Error fetching model RPD count:', e.message);
        return 0;
    }
}

/**
 * Increment daily usage count for a model
 */
function incrementModelRpdCount(model) {
    try {
        const today = new Date().toISOString().split('T')[0];
        db.prepare(`
            INSERT INTO model_rpd_usage (model, count, last_reset)
            VALUES (?, 1, ?)
            ON CONFLICT(model) DO UPDATE SET
                count = CASE WHEN last_reset = ? THEN count + 1 ELSE 1 END,
                last_reset = ?
        `).run(model, today, today, today);
    } catch (e) {
        console.error('Error incrementing model RPD count:', e.message);
    }
}

/**
 * Set model RPD to limit (25) to trigger immediate failover
 */
function setModelLimitReached(model) {
    try {
        const today = new Date().toISOString().split('T')[0];
        db.prepare(`
            INSERT INTO model_rpd_usage (model, count, last_reset)
            VALUES (?, 25, ?)
            ON CONFLICT(model) DO UPDATE SET count = 25, last_reset = ?
        `).run(model, today, today);
    } catch (e) {
        console.error('Error setting model RPD limit:', e.message);
    }
}

/**
 * Generate an image using Google Gemini Imagen 4.0 REST API
 * Auto failover/fallback chain when RPD (Requests Per Day) limit is reached.
 * 
 * @param {string} prompt - The image prompt
 * @param {number} width - Output image width
 * @param {number} height - Output image height
 * @param {number} retries - Not used, kept for signature compatibility
 * @param {string} modelOverride - Specific model to try first
 * @returns {Promise<Object>} - { imageUrl, modelUsed } or null
 */
async function generateImage(prompt, width = 1024, height = 1024, retries = 2, modelOverride = null) {
    if (!config.geminiApiKey || config.geminiApiKey === 'AIzaSyBURAYA_GEMINI_KEYINI_YAZ') {
        console.warn('⚠️ GEMINI_API_KEY ayarlanmamış veya varsayılan değerde kalmış.');
        return null;
    }

    // Determine the aspect ratio string Gemini Imagen expects: "1:1", "3:4", "4:3", "9:16", "16:9"
    let aspectRatio = "1:1";
    const ratio = width / height;

    if (Math.abs(ratio - 9/16) < 0.1) {
        aspectRatio = "9:16";
    } else if (Math.abs(ratio - 16/9) < 0.1) {
        aspectRatio = "16:9";
    }

    // Set up failover chain. If modelOverride is passed, try it first.
    let modelsToTry = [...IMAGEN_MODELS];
    if (modelOverride && IMAGEN_MODELS.includes(modelOverride)) {
        modelsToTry = modelsToTry.filter(m => m !== modelOverride);
        modelsToTry.unshift(modelOverride);
    }

    // Fail-fast logic: filter out models that have hit their RPD quota of 25.
    let modelsWithQuota = modelsToTry.filter(model => getModelRpdCount(model) < 25);
    
    // If all models are exhausted, try them all anyway as a final fallback.
    if (modelsWithQuota.length === 0) {
        console.log('⚠️ Tüm modellerin günlük limitleri dolmuş görünüyor. Yine de deneme yapılıyor...');
        modelsWithQuota = modelsToTry;
    }

    for (const model of modelsWithQuota) {
        try {
            console.log(`🤖 Google Gemini API ile görsel üretiliyor. Model: ${model}, Oran: ${aspectRatio}`);
            
            const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:predict?key=${config.geminiApiKey}`;
            
            const response = await fetch(endpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    instances: [
                        {
                            prompt: prompt
                        }
                    ],
                    parameters: {
                        sampleCount: 1,
                        aspectRatio: aspectRatio,
                        imageFormat: "image/jpeg"
                    }
                })
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                const errMsg = errorData.error?.message || response.statusText;
                console.warn(`⚠️ Model ${model} hata verdi: ${response.status} - ${errMsg}`);
                
                // If it is a quota / limit / 429 / 503 error, mark it as limit-reached in DB and failover
                if (response.status === 429 || response.status === 503 || errMsg.toLowerCase().includes('quota') || errMsg.toLowerCase().includes('limit')) {
                    console.log(`🔄 Quota doldu veya RPD limiti aşıldı. Bu model limit-dışı işaretleniyor ve diğerine geçiliyor...`);
                    setModelLimitReached(model);
                    continue; 
                }
                
                throw new Error(`Gemini API: ${errMsg}`);
            }

            const data = await response.json();
            
            // Extract the base64 encoded bytes from predictions
            if (data.predictions && data.predictions.length > 0 && data.predictions[0].bytesBase64Encoded) {
                const base64Data = data.predictions[0].bytesBase64Encoded;
                const mimeType = data.predictions[0].mimeType || 'image/jpeg';
                console.log(`✅ Görsel başarıyla üretildi! Model: ${model}`);
                
                // Increment RPD count in DB
                incrementModelRpdCount(model);
                
                return {
                    imageUrl: `data:${mimeType};base64,${base64Data}`,
                    modelUsed: model
                };
            }

            throw new Error('Görsel verisi predictions içinde bulunamadı.');

        } catch (err) {
            console.error(`❌ Model ${model} ile görsel üretimi başarısız:`, err.message);
            // Loop continues to next model...
        }
    }

    console.error('❌ Tüm Imagen modelleri başarısız oldu (Tüm RPD limitleri aşılmış olabilir).');
    return null;
}

// Dummy ping function for backward compatibility
async function pingSpace() {
    return true;
}

module.exports = {
    generateImage,
    pingSpace
};
