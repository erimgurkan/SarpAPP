/* ═══════════════════════════════════════════════════════════
   PostCraft — Carousel Prompt Template
   5-7 slaytlık bilgilendirici/eğitici carousel paylaşımı
   ═══════════════════════════════════════════════════════════ */

module.exports = function buildCarouselPrompt(userInput, profile) {
    return `
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
İÇERİK TÜRÜ: CAROUSEL PAYLAŞIMI (5-7 Slayt)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

GÖREV: Aşağıdaki kullanıcı girdisine dayanarak, ${profile.sector} sektöründeki bir işletme için 5-7 slaytlık profesyonel bir Instagram carousel paylaşımı oluştur.

KULLANICI GİRDİSİ:
"${userInput}"

CAROUSEL YAPISI — Her slaytı bu formatta yaz:

▸ Slayt 1 — KAPAK SLAYTI
  • Dikkat çekici, merak uyandıran bir başlık (max 8-10 kelime)
  • Kısa alt başlık veya tanım cümlesi
  • Amacı: Kullanıcıyı kaydırmaya teşvik etmek
  • Etkili formatlar: "X şeyin sırrı", "Bunu biliyor muydun?", "X adımda Y rehberi"
  • Klişe ve genel başlıklar YASAK — spesifik ve merak uyandırıcı ol

▸ Slayt 2-5/6 — İÇERİK SLAYTLARI
  • Her slayt TEK bir fikir, bilgi veya adıma odaklanmalı
  • Başlık: kısa, güçlü (max 6-8 kelime)
  • Gövde metin: 2-3 cümle açıklama
  • Slaytlar arası mantıksal akış ve bağlantı olmalı
  • Her slayt kendi başına da değer sunmalı (tek slayt paylaşılsa bile anlamlı)
  • Bilgiyi sindirilebilir parçalara böl — akademik değil, pratik ol

▸ Son Slayt — CTA (Harekete Geçirme)
  • İşletmeye yönlendirme: ziyaret, sipariş, iletişim
  • "Bio'daki link", "DM at", "Yorum yaz", "Kaydet" gibi aksiyonlar
  • İletişim bilgisi yeri (📍 ve 📞 placeholder'ı)
  • Takipçiye paylaşımı kaydetmesini veya göndermesini söyle

GÖRSEL DİREKTİFLER:
  • Format: 1080x1080px (1:1) veya 1080x1350px (4:5)
  • Her slayta tutarlı arka plan rengi/gradyanı
${profile.primary_color ? `  • Ana renk: ${profile.primary_color}` : '  • Sektöre uygun profesyonel renk tonu'}
${profile.secondary_color ? `  • Vurgu renk: ${profile.secondary_color}` : ''}
${profile.heading_font ? `  • Başlık fontu: ${profile.heading_font} (büyük, bold)` : '  • Başlık: büyük, bold, okunaklı font'}
  • Minimalist tasarım — bir slaytta max 40-50 kelime
  • Slayt numaralama öner (1/5, 2/5 vb.)
  • Son slaytta logo/marka adı placeholder'ı

CAPTION (carousel altına yazılacak):
  • 3-5 cümle, carousel'ın özetini ver
  • "Kaydet ve ihtiyacın olduğunda bak" gibi doğal CTA
  • 12-18 ilgili hashtag (popüler + niş + sektörel mix)

ÖNEMLİ: ${profile.tone} tonda yaz. ${profile.sector} sektörüne uygun terminoloji, örnekler ve referanslar kullan.`;
};
