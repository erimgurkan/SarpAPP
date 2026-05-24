/* ═══════════════════════════════════════════════════════════
   PostCraft — Prompt Library Index
   Exports all prompt builders
   ═══════════════════════════════════════════════════════════ */

const buildBasePrompt = require('./base');
const buildCarouselPrompt = require('./carousel');
const buildDuyuruPrompt = require('./duyuru');
const buildTekKarePrompt = require('./tekKare');
const buildStoryPrompt = require('./story');
const buildCaptionPrompt = require('./caption');

module.exports = {
    base: buildBasePrompt,
    templates: {
        'carousel': buildCarouselPrompt,
        'duyuru': buildDuyuruPrompt,
        'tek-kare': buildTekKarePrompt,
        'story': buildStoryPrompt,
        'caption': buildCaptionPrompt,
    },
};
