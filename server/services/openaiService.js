/* ═══════════════════════════════════════════════════════════
   PostCraft — Google Gemini Text Service
   Gemini 2.5 Flash API communication
   ═══════════════════════════════════════════════════════════ */

const config = require('../config');

/**
 * Gemini API ile içerik üret
 * @param {string} prompt - Tam prompt metni
 * @returns {Object} { content, model, tokens }
 */
async function generateContent(prompt) {
    if (!config.geminiApiKey || config.geminiApiKey === 'AIzaSyBURAYA_GEMINI_KEYINI_YAZ') {
        throw new Error(
            'Google Gemini API key ayarlanmamış. ' +
            '.env dosyasında GEMINI_API_KEY değerini gerçek API key\'iniz ile değiştirin.'
        );
    }

    try {
        const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${config.geminiApiKey}`;
        
        console.log("🤖 Google Gemini API (gemini-2.5-flash) ile metin üretiliyor...");
        
        const response = await fetch(endpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                contents: [
                    {
                        parts: [
                            {
                                text: "Sen, Türkiye'deki küçük işletmeler için Instagram içerikleri üreten profesyonel bir içerik uzmanısın. Verilen direktiflere harfiyen uyarsın. Çıktıların her zaman kullanıma hazır, doğal ve profesyonel olur. Sadece istenen sosyal medya gönderisini ve başlığı/yazıyı üret."
                            },
                            {
                                text: prompt
                            }
                        ]
                    }
                ],
                generationConfig: {
                    temperature: 0.7,
                    maxOutputTokens: 2500
                }
            })
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            const errMsg = errorData.error?.message || response.statusText;
            throw new Error(`Gemini API Hatası: ${errMsg}`);
        }

        const data = await response.json();
        
        if (data.candidates && data.candidates.length > 0 && data.candidates[0].content?.parts?.[0]?.text) {
            const generatedText = data.candidates[0].content.parts[0].text;
            const promptTokens = data.usageMetadata?.promptTokenCount || 0;
            const completionTokens = data.usageMetadata?.candidatesTokenCount || 0;
            const totalTokens = data.usageMetadata?.totalTokenCount || 0;
            
            console.log(`✅ Metin başarıyla üretildi! Model: gemini-2.5-flash`);
            
            return {
                content: generatedText,
                model: 'gemini-2.5-flash',
                tokens: totalTokens,
                promptTokens: promptTokens,
                completionTokens: completionTokens,
                finishReason: data.candidates[0].finishReason || 'STOP'
            };
        }

        throw new Error('İçerik verisi candidates içinde bulunamadı.');
    } catch (error) {
        console.error('Gemini generateContent error:', error.message);
        throw new Error(`AI servisi hatası: ${error.message}`);
    }
}

/**
 * API key'in ayarlanıp ayarlanmadığını kontrol et
 */
function isConfigured() {
    return config.geminiApiKey &&
           config.geminiApiKey !== 'AIzaSyBURAYA_GEMINI_KEYINI_YAZ';
}

module.exports = { generateContent, isConfigured };
