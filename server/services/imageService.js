/* ═══════════════════════════════════════════════════════════
   PostMax — Image Service (Z-Image-Turbo Gradio API)
   ═══════════════════════════════════════════════════════════ */

const config = require('../config');

// The Gradio App Endpoint
const GRADIO_API_BASE = 'https://mrfakename-z-image-turbo.hf.space/gradio_api/call/generate_image_1';

/**
 * Generate an image using HuggingFace Z-Image-Turbo
 * @param {string} prompt - The image prompt
 * @param {number} width - Output image width
 * @param {number} height - Output image height
 * @param {number} retries - Number of retries on failure
 * @returns {Promise<string>} - URL or base64 of the generated image
 */
async function generateImage(prompt, width = 1024, height = 1024, retries = 2) {
    if (!config.hfToken) {
        console.warn('⚠️ HF_TOKEN ayarlanmamış, resim üretilemeyecek.');
        return null; // Return null if no token is configured
    }

    try {
        // Step 1: Initialize the request and get EVENT_ID
        const postRes = await fetch(GRADIO_API_BASE, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${config.hfToken}`
            },
            body: JSON.stringify({
                data: [
                    prompt,   // [0] Prompt
                    height,   // [1] Height (Gradio expects height first)
                    width,    // [2] Width (Gradio expects width second)
                    9,        // [3] Inference steps
                    42,       // [4] Seed (doesn't matter if randomize is true)
                    true      // [5] Randomize seed
                ]
            })
        });

        if (!postRes.ok) {
            throw new Error(`Gradio POST Error: ${postRes.status} ${postRes.statusText}`);
        }

        const postData = await postRes.json();
        const eventId = postData.event_id;

        if (!eventId) {
            throw new Error('EVENT_ID alınamadı.');
        }

        // Step 2: Listen to the SSE stream to get the final image
        const getRes = await fetch(`${GRADIO_API_BASE}/${eventId}`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${config.hfToken}`
            }
        });

        if (!getRes.ok) {
            throw new Error(`Gradio GET Error: ${getRes.status} ${getRes.statusText}`);
        }

        const textStream = await getRes.text();
        const lines = textStream.split('\n');

        let isComplete = false;
        let resultData = null;

        for (let i = 0; i < lines.length; i++) {
            const line = lines[i].trim();
            
            if (line.startsWith('event: complete')) {
                isComplete = true;
                // The next line should be the 'data: ' line
                const dataLine = lines[i + 1];
                if (dataLine && dataLine.startsWith('data: ')) {
                    const jsonData = JSON.parse(dataLine.substring(6));
                    resultData = jsonData;
                }
                break;
            }
            
            if (line.startsWith('event: error')) {
                throw new Error('Gradio API döndürdüğü hata akışı.');
            }
        }

        if (isComplete && resultData && resultData.length > 0) {
            // resultData[0] is typically the image object from Gradio which contains 'url' or 'path'
            // Since Gradio spaces often return a dict with a URL to the generated image:
            const imgData = resultData[0]; 
            if (typeof imgData === 'string') {
                return imgData; // Base64 or direct URL
            } else if (imgData && imgData.url) {
                return imgData.url;
            } else if (imgData && imgData.path) {
                // If it's a relative path, we prefix it with the space domain
                return `https://mrfakename-z-image-turbo.hf.space/file=${imgData.path}`;
            }
        }

        throw new Error('Görsel üretildi ancak veri anlaşılamadı.');

    } catch (err) {
        console.error(`Image Generation Error (kalan deneme: ${retries}):`, err);
        if (retries > 0) {
            console.log(`3 saniye sonra görsel üretimi yeniden denenecek...`);
            await new Promise(resolve => setTimeout(resolve, 3000));
            // Trigger a ping request to make sure the space is warm
            await pingSpace();
            return generateImage(prompt, width, height, retries - 1);
        }
        return null;
    }
}

/**
 * Keep-alive Hugging Face space function
 */
function startKeepAlive() {
    console.log("ℹ️ Hugging Face Space Keep-Alive başlatıldı.");
    // Run immediately
    pingSpace();
    // Run every 5 minutes (300000 ms)
    setInterval(pingSpace, 300000);
}

async function pingSpace() {
    try {
        const res = await fetch("https://mrfakename-z-image-turbo.hf.space/", {
            method: 'GET',
            headers: {
                'User-Agent': 'PostCraftKeepAlive/1.0'
            }
        });
        if (res.ok) {
            console.log(`✅ Hugging Face Space aktif. Status: ${res.status}`);
        } else {
            console.warn(`⚠️ Hugging Face Space durum kodu: ${res.status}`);
        }
    } catch (err) {
        console.error("❌ Hugging Face Space ping hatası:", err.message);
    }
}

// Start keep alive automatically on load
startKeepAlive();

module.exports = {
    generateImage,
    pingSpace
};
