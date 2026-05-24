/* ═══════════════════════════════════════════════════════════
   PostCraft — Prompt Engine
   4 katmanlı prompt birleştirme motoru
   Base Rules + Brand Profile + Content Template + User Input
   ═══════════════════════════════════════════════════════════ */

const prompts = require('../prompts');

/**
 * 4 katmanlı tam prompt oluşturur
 * @param {string} contentType - İçerik türü (carousel, duyuru, vb.)
 * @param {string} userInput - Kullanıcının girdiği metin
 * @param {Object} profile - Marka profil verisi
 * @returns {string} Tam prompt metni (OpenAI'ye gönderilecek)
 */
function buildFullPrompt(contentType, userInput, profile) {
    // Katman 1: Temel kurallar (AI kokusu yasakları, platform kuralları)
    const basePrompt = prompts.base(profile);

    // Katman 2 + 3: İçerik türü şablonu (profil verisi zaten içinde)
    const templateBuilder = prompts.templates[contentType];
    if (!templateBuilder) {
        throw new Error(`Bilinmeyen içerik türü: ${contentType}. Geçerli türler: ${Object.keys(prompts.templates).join(', ')}`);
    }
    const templatePrompt = templateBuilder(userInput, profile);

    // Katman 4: Birleştirme
    const fullPrompt = `${basePrompt}

════════════════════════════════════════════════════════════

${templatePrompt}

════════════════════════════════════════════════════════════

SON KONTROL:
- İçerik ${profile?.tone || 'samimi'} tonda mı? ✓
- AI kokusu var mı? (varsa düzelt) ✓
- Türkçe yazım hataları var mı? ✓
- Instagram formatına uygun mu? ✓
- Marka kimliğiyle tutarlı mı? ✓

Şimdi içeriği oluştur.`;

    return fullPrompt;
}

/**
 * Prompt'un token tahmini (yaklaşık)
 * @param {string} prompt
 * @returns {number} Tahmini token sayısı
 */
function estimateTokens(prompt) {
    // Rough estimation: ~1 token per 4 characters for Turkish
    return Math.ceil(prompt.length / 3.5);
}

module.exports = { buildFullPrompt, estimateTokens };
