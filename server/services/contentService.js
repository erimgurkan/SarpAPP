/* ═══════════════════════════════════════════════════════════
   PostCraft — Content Service
   Orchestrator: Profile → Prompt → AI → Database
   ═══════════════════════════════════════════════════════════ */

const { dbWrapper: db } = require('../db/database');
const { buildFullPrompt } = require('./promptEngine');
const { generateContent } = require('./openaiService');
const { generateImage } = require('./imageService');

/**
 * İçerik üretim pipeline'ı
 * 1. Profili getir
 * 2. Prompt'u oluştur (4 katmanlı)
 * 3. OpenAI API'ye gönder
 * 3.5. HuggingFace Z-Image-Turbo ile görsel üret
 * 4. Sonucu veritabanına kaydet
 * 5. Kullanım sayacını artır
 *
 * @param {number} userId - Kullanıcı ID
 * @param {number} profileId - Marka profil ID
 * @param {string} contentType - İçerik türü
 * @param {string} userInput - Kullanıcı girdisi
 * @returns {Object} Üretilen içerik verisi
 */
async function createContent(userId, profileId, contentType, userInput, aspectRatio = '1:1') {
    // 1. Profili getir ve doğrula
    const profile = db.prepare(
        'SELECT * FROM brand_profiles WHERE id = ? AND user_id = ?'
    ).get(profileId, userId);

    if (!profile) {
        throw new Error('Marka profili bulunamadı veya size ait değil.');
    }

    // 2. 4 katmanlı prompt oluştur
    const fullPrompt = buildFullPrompt(contentType, userInput, profile);

    // 3. OpenAI API'ye gönder
    let result;
    try {
        result = await generateContent(fullPrompt);
    } catch (e) {
        console.warn("OpenAI Hatası (Mock üretiliyor):", e.message);
        result = {
            content: "*(Metin üretimi pas geçildi: OpenAI API anahtarı bulunamadı)*\n\nSadece HuggingFace görseli test ediliyor...",
            model: "mock-model",
            tokens: 0
        };
    }

    // 3.5 HuggingFace ile Görsel Üret (Eğer API key varsa)
    let formatModifier = 'square composition, centered shot';

    if (aspectRatio === '9:16') {
        formatModifier = 'vertical orientation, vertical portrait, instagram story style, mobile wallpaper layout';
    } else if (aspectRatio === '16:9') {
        formatModifier = 'horizontal orientation, wide angle view, cinematic landscape view';
    }

    const imagePrompt = `A high quality, professional photography for a ${profile.sector || 'business'}, capturing the concept of: ${userInput}. ${formatModifier}. vibrant, stunning, highly detailed`;
    const imageUrl = await generateImage(imagePrompt, 1024, 1024);
    
    if (imageUrl) {
        let imgStyle = 'max-width: 100%; max-height: 380px; border-radius: 12px; box-shadow: 0 4px 12px rgba(0,0,0,0.3);';
        
        if (aspectRatio === '9:16') {
            imgStyle += ' aspect-ratio: 9 / 16; width: 250px; object-fit: cover;';
        } else if (aspectRatio === '16:9') {
            imgStyle += ' aspect-ratio: 16 / 9; width: 100%; object-fit: cover;';
        } else {
            imgStyle += ' aspect-ratio: 1 / 1; width: 350px; object-fit: cover;';
        }

        // Prepend the image to the content as HTML, with max-height limit to fit beautifully in the modal
        result.content = `<div style="text-align: center; margin-bottom: 20px;">
                            <img src="${imageUrl}" style="${imgStyle}" alt="Generated visual" />
                          </div>\n\n` + result.content;
    }

    // 4. Sonucu veritabanına kaydet
    const stmt = db.prepare(`
        INSERT INTO generated_content
            (user_id, profile_id, content_type, user_input, generated_content, full_prompt, model_used, tokens_used)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const info = stmt.run(
        userId,
        profileId,
        contentType,
        userInput,
        result.content,
        fullPrompt,
        result.model,
        result.tokens
    );

    // 5. Kullanım sayacını artır
    db.prepare(
        'UPDATE users SET monthly_usage = monthly_usage + 1 WHERE id = ?'
    ).run(userId);

    return {
        id: info.lastInsertRowid,
        profile_id: profileId,
        profile_name: profile.name,
        content_type: contentType,
        user_input: userInput,
        generated_content: result.content,
        model_used: result.model,
        tokens_used: result.tokens,
        created_at: new Date().toISOString(),
    };
}

/**
 * Kullanıcının geçmiş içeriklerini getir
 */
function getHistory(userId, { page = 1, limit = 20, type, profileId } = {}) {
    const offset = (page - 1) * limit;
    const params = [userId];
    let where = 'gc.user_id = ?';

    if (type) {
        where += ' AND gc.content_type = ?';
        params.push(type);
    }
    if (profileId) {
        where += ' AND gc.profile_id = ?';
        params.push(parseInt(profileId));
    }

    const total = db.prepare(
        `SELECT COUNT(*) as count FROM generated_content gc WHERE ${where}`
    ).get(...params).count;

    const contents = db.prepare(`
        SELECT gc.*, bp.name as profile_name, bp.sector
        FROM generated_content gc
        JOIN brand_profiles bp ON gc.profile_id = bp.id
        WHERE ${where}
        ORDER BY gc.created_at DESC
        LIMIT ? OFFSET ?
    `).all(...params, limit, offset);

    return {
        contents,
        pagination: {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit),
        },
    };
}

module.exports = { createContent, getHistory };
