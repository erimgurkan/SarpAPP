/* ═══════════════════════════════════════════════════════════
   PostCraft — Duyuru Prompt Template
   Kampanya, indirim, yeni ürün duyuru postu
   ═══════════════════════════════════════════════════════════ */

module.exports = function buildDuyuruPrompt(userInput, profile) {
    return `
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
İÇERİK TÜRÜ: DUYURU POSTU (Kampanya / İndirim / Yeni Ürün)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

GÖREV: Aşağıdaki kullanıcı girdisine dayanarak, ${profile.sector} sektöründeki bir işletme için etkili bir duyuru postu oluştur.

KULLANICI GİRDİSİ:
"${userInput}"

DUYURU YAPISI:

1. DİKKAT ÇEKİCİ AÇILIŞ (1-2 cümle):
   • Merak uyandıran veya ilgi çekici bir giriş
   • Klişe "Harika haber!", "Müjde!" tarzı açılışlar YASAK
   • Alternatifler: soru sor, doğrudan konuya gir, ilginç bir bilgiyle başla
   • İlk 125 karakterde dikkat yakala (Instagram'da "devamını oku" öncesi)

2. ANA MESAJ (2-4 cümle):
   • Ne duyuruluyorsa net ve açık belirt
   • Tarih, süre, koşul gibi detayları ekle
   • Neden müşteri için önemli/değerli olduğunu hissettir
   • Abartma, gerçekçi ol

3. DETAYLAR (madde listesi):
   • Ürünler, hizmetler veya kampanya detayları
   • Kısa, taranabilir maddeler (her biri 1 satır)
   • Uygun yerlerde emoji ile görsel ayrım (ama abartmadan)
   • Fiyat veya indirim oranı varsa net belirt

4. ACILIYET / KITLIK (1 cümle, opsiyonel):
   • Gerçekçi bir aciliyet: "Bu pazar sonuna kadar", "İlk 30 kişiye özel"
   • Yapay baskı YASAK — "HEMEN KOŞUN!" tarzı ifadeler yasak
   • Yoksa bu bölümü atla — her duyurunun acil olması gerekmez

5. CTA — Harekete Geçirme (1-2 cümle):
   • Müşteriye somut bir adım söyle: "DM at", "Bio'daki linkten ulaş"
   • Konum bilgisi placeholder'ı: 📍 [Adres]
   • İletişim: 📞 [Telefon] veya "DM'den ulaşabilirsiniz"

6. HASHTAG PAKETİ:
   • 12-18 hashtag
   • Mix: popüler (3-4) + sektörel (5-6) + niş (3-4) + lokasyon (2-3)

GÖRSEL ÖNERİSİ (1-2 cümle):
  • Bu duyuru için nasıl bir görsel hazırlanması gerektiğini öner
${profile.primary_color ? `  • Marka rengi ${profile.primary_color} ile uyumlu olsun` : ''}
  • Format: 1:1 veya 4:5

ÖNEMLİ: ${profile.tone} tonda yaz. Duyuru heyecan verici olsun ama yapay, reklam kokan bir dil KULLANMA. Bir işletme sahibinin kendi takipçilerine samimiyetle haber vermesi gibi olmalı.`;
};
