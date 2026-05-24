/* ═══════════════════════════════════════════════════════════
   PostCraft — Caption + Hashtag Prompt Template
   Hazır caption metni ve sektöre özel hashtag paketi
   ═══════════════════════════════════════════════════════════ */

module.exports = function buildCaptionPrompt(userInput, profile) {
    return `
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
İÇERİK TÜRÜ: CAPTION + HASHTAG PAKETİ
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

GÖREV: Aşağıdaki kullanıcı girdisine dayanarak, ${profile.sector} sektöründeki bir işletme için hazır bir Instagram caption ve hashtag paketi oluştur.

KULLANICI GİRDİSİ:
"${userInput}"

CAPTION YAPISI:

1. AÇILIŞ (1 cümle):
   • Dikkat çekici, merak uyandıran veya duygusal bir giriş
   • Soru sorabilir, cesur bir ifade kullanabilir, kişisel bir gözlemle başlayabilir
   • Klişe açılışlar YASAK ("Herkese merhaba!", "Günaydın takipçiler!")
   • İlk 125 karakter kritik — "devamını oku" tıklatmalı

2. GELİŞTİRME (2-4 cümle):
   • Ana mesajı açıkla ve derinleştir
   • Kısa hikaye, bilgi, deneyim veya değer paylaş
   • Markanın farkını hissettir
   • Paragraflar arası satır boşluğu bırak (okunabilirlik)

3. CTA — Harekete Geçirme (1-2 cümle):
   • Takipçiye ne yapmasını istiyorsan doğal bir dille belirt
   • Seçenekler: "Yorumlarda paylaş", "Arkadaşını etiketle", "Kaydet",
     "DM at", "Bio'daki linke tıkla"
   • Doğal akışla, zoraki olmasın — sanki sohbet eder gibi

4. HASHTAG PAKETİ (15-20 hashtag):
   Aşağıdaki kategorilerde dengeli dağıt:
   
   a) Popüler / Genel (3-4 hashtag):
      Geniş kitlelere ulaşmak için — #keşfet #günlük #instaturkey gibi
   
   b) Sektörel (5-6 hashtag):
      ${profile.sector} sektörüne özel — sektörün kendi diliyle
   
   c) Niş / Spesifik (4-5 hashtag):
      Bu spesifik içeriğe özel — detaylı, hedefli hashtagler
   
   d) Lokasyon (2-3 hashtag):
      Şehir/bölge bazlı — #istanbul #ankara #izmir vb.
      (Genel bırak, kullanıcı kendi şehrini ekleyecek)
   
   e) Marka (1-2 hashtag):
      Marka adı hashtag'i (varsa) — tutarlılık için

   HASHTAG KURALLARI:
   - Yasaklı/spam etiketli hashtaglerden kaçın
   - Türkçe ve İngilizce mix kullan
   - Her biri içerikle DOĞRUDAN alakalı olmalı
   - Çok genel (#love #happy) veya çok niş (#sadece5kişibilir) olmasın

CAPTION KURALLARI:
  • Toplam 150-300 kelime arası
  • Paragraflar arası boş satır bırak
  • Emoji kontrollü kullan — vurgu noktalarında, her cümlede değil
  • 2200 karakter limitinin altında kal
  • Kopyala-yapıştır hazır olmalı — düzenleme gerektirmemeli

ÇIKTI FORMATI:
Önce caption'ı yaz, sonra "---" ayracıyla hashtag paketini ekle.

ÖNEMLİ: ${profile.tone} tonda yaz. Caption okunduğunda doğal, samimi ve profesyonel hissettirmeli. Bu bir reklam metni değil, bir işletme sahibinin kendi takipçilerine konuşması.`;
};
