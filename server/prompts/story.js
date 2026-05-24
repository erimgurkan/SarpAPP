/* ═══════════════════════════════════════════════════════════
   PostCraft — Story Prompt Template
   Instagram Stories — kısa, dinamik, etkileşimli
   ═══════════════════════════════════════════════════════════ */

module.exports = function buildStoryPrompt(userInput, profile) {
    return `
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
İÇERİK TÜRÜ: STORY METNİ (Instagram Stories)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

GÖREV: Aşağıdaki kullanıcı girdisine dayanarak, ${profile.sector} sektöründeki bir işletme için 3-4 ardışık Instagram story metni oluştur.

KULLANICI GİRDİSİ:
"${userInput}"

STORY YAPISI — Her story'yi [Story X] formatında yaz:

[Story 1] — DİKKAT YAKALA
  • Kısa, vurucu bir açılış (max 2-3 satır)
  • İlk 2 saniyede dikkat yakala — story hızlı geçilir
  • Emoji ile görsel vurgu (1-2 emoji yeterli)
  • Merak uyandır veya direkt bilgi ver

[Story 2] — ETKİLEŞİM
  • Instagram sticker önerisi: anket, soru kutusu veya quiz
  • Anket formatı: tam 2 seçenekli, net ve eğlenceli
    Örnek: "Bugün ne tercih edersin? ☕ Filtre kahve / 🧊 Soğuk kahve"
  • Veya soru sticker'ı: "Favorin hangisi?" gibi
  • Amaç: takipçiyi etkileşime sokmak

[Story 3] — DETAY / BİLGİ
  • Ana mesajın detayları
  • Fiyat, tarih, yer, koşullar gibi pratik bilgiler
  • Kısa ve taranabilir — uzun paragraf YASAK
  • Görseli destekleyen metin

[Story 4] — CTA (Harekete Geçirme)
  • Net bir aksiyon: "DM at", "Link'e tıkla", "Bio'daki linkten ulaş"
  • Aciliyet hissi (varsa): "Bugün son gün", "Son 5 adet"
  • Yönlendirme: mağaza, web, DM, telefon

STORY KURALLARI:
  • Her story MAX 3-4 satır metin — daha fazla YASAK
  • Büyük, okunabilir punto öner (24px+)
  • Her story'de arka plan önerisi: düz renk, fotoğraf veya video
${profile.primary_color ? `  • Marka rengi: ${profile.primary_color} ile uyumlu arka planlar` : ''}
  • Etkileşim sticker'larını akıllıca kullan — her story'de sticker gerekmez
  • Story serisi bir hikaye anlatmalı: merak → bilgi → aksiyon

ÖNEMLİ: Story'ler hızlı tüketilen içerik. ${profile.tone} ama dinamik ve kısa ol. Mobil ekranda, 5 saniyede okunabilecek uzunlukta yaz.`;
};
