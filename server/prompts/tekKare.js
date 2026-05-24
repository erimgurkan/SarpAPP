/* ═══════════════════════════════════════════════════════════
   PostCraft — Tek Kare Prompt Template
   Alıntı, motivasyon, ürün spotlight — tek görsel post
   ═══════════════════════════════════════════════════════════ */

module.exports = function buildTekKarePrompt(userInput, profile) {
    return `
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
İÇERİK TÜRÜ: TEK KARE POST (Alıntı / Motivasyon / Ürün Spotlight)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

GÖREV: Aşağıdaki kullanıcı girdisine dayanarak, ${profile.sector} sektöründeki bir işletme için etkileyici bir tek kare Instagram postu oluştur.

KULLANICI GİRDİSİ:
"${userInput}"

TEK KARE YAPISI:

1. GÖRSEL ÜZERİNDEKİ METİN:
   • Güçlü, akılda kalıcı bir cümle veya alıntı
   • Maximum 15-20 kelime — tek bakışta okunabilmeli
   • Alıntı ise tırnak içinde yaz, kaynak belirt (kişi veya marka)
   • Kendi sözünse motivasyonel/ilham verici/düşündürücü olsun
   • Sektöre ve markaya uygun — genel klişe alıntılar YASAK
   • Özgün, sektöre özel, hedef kitleyle rezonans kuran bir mesaj

2. DESTEKLEYICI ALT METİN (opsiyonel, görsel üzerinde küçük):
   • 1 cümle, ana mesajı tamamlayan bilgi
   • Veya işletme adı / slogan placeholder'ı
   • Görseli kalabalıklaştırmadan

3. CAPTION (paylaşım açıklaması):
   • 3-6 cümle
   • Post'un bağlamını ver — neden bu mesajı paylaşıyorsun?
   • Kişisel dokunuş: marka hikayesi, deneyim, değer
   • Hedef kitleyle bağ kur — "siz de böyle hissediyor musunuz?" tarzı
   • CTA: "Yorumlarda düşüncelerinizi yazın", "Katılan varsa ❤️ bıraksın", "Arkadaşını etiketle"
   • 10-15 hashtag

GÖRSEL DİREKTİF:
  • Minimal tasarım — az element, güçlü tipografi
  • Büyük punto, okunabilir font
  • Arka plan: düz renk, soft gradient veya bulanık fotoğraf
${profile.primary_color ? `  • Marka rengi: ${profile.primary_color} dominant` : ''}
  • Format: 1080x1080px (1:1)
  • Logo veya marka adı köşede küçük

ÖNEMLİ: ${profile.tone} tonda yaz. Tek kare post'un gücü sadede dayanır — az söyle, çok anlat. Mesaj vurucu ve paylaşılabilir olmalı.`;
};
