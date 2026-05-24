/* ═══════════════════════════════════════════════════════════
   PostCraft — OpenAI Service
   GPT-4o / GPT-4o-mini API communication
   ═══════════════════════════════════════════════════════════ */

const OpenAI = require('openai');
const config = require('../config');

let client = null;

/**
 * OpenAI client'ı lazy-initialize et
 */
function getClient() {
    if (!client) {
        if (!config.openai.apiKey || config.openai.apiKey === 'sk-BURAYA_API_KEYINI_YAZ') {
            throw new Error(
                'OpenAI API key ayarlanmamış. ' +
                '.env dosyasında OPENAI_API_KEY değerini gerçek API key\'iniz ile değiştirin. ' +
                'Key almak için: https://platform.openai.com/api-keys'
            );
        }
        client = new OpenAI({ apiKey: config.openai.apiKey });
    }
    return client;
}

/**
 * OpenAI API ile içerik üret
 * @param {string} prompt - Tam prompt metni
 * @returns {Object} { content, model, tokens }
 */
async function generateContent(prompt) {
    const openai = getClient();

    try {
        const response = await openai.chat.completions.create({
            model: config.openai.model,
            messages: [
                {
                    role: 'system',
                    content: 'Sen, Türkiye\'deki küçük işletmeler için Instagram içerikleri üreten profesyonel bir içerik uzmanısın. Verilen direktiflere harfiyen uyarsın. Çıktıların her zaman kullanıma hazır, doğal ve profesyonel olur.'
                },
                {
                    role: 'user',
                    content: prompt
                }
            ],
            temperature: 0.7,
            max_tokens: 2500,
            presence_penalty: 0.1,
            frequency_penalty: 0.1,
        });

        const choice = response.choices[0];

        return {
            content: choice.message.content,
            model: response.model,
            tokens: response.usage?.total_tokens || 0,
            promptTokens: response.usage?.prompt_tokens || 0,
            completionTokens: response.usage?.completion_tokens || 0,
            finishReason: choice.finish_reason,
        };
    } catch (error) {
        // Specific error handling
        if (error.status === 401) {
            throw new Error('OpenAI API key geçersiz. Lütfen .env dosyasındaki OPENAI_API_KEY değerini kontrol edin.');
        }
        if (error.status === 429) {
            throw new Error('OpenAI API rate limit aşıldı. Lütfen birkaç saniye bekleyip tekrar deneyin.');
        }
        if (error.status === 500 || error.status === 503) {
            throw new Error('OpenAI servisi şu an yanıt vermiyor. Lütfen birkaç dakika sonra tekrar deneyin.');
        }
        if (error.code === 'insufficient_quota') {
            throw new Error('OpenAI hesabınızda yeterli kredi yok. Lütfen hesabınıza bakiye yükleyin: https://platform.openai.com/account/billing');
        }

        console.error('OpenAI API error:', error.message);
        throw new Error(`AI servisi hatası: ${error.message}`);
    }
}

/**
 * API key'in ayarlanıp ayarlanmadığını kontrol et
 */
function isConfigured() {
    return config.openai.apiKey &&
           config.openai.apiKey !== 'sk-BURAYA_API_KEYINI_YAZ' &&
           config.openai.apiKey.startsWith('sk-');
}

module.exports = { generateContent, isConfigured };
