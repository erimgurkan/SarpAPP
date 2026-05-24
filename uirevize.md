# PostCraft — UI Revize Prompt (Antigravity AI için)

> Bu promptu Antigravity AI'a direkt yapıştır. Kendi sitenin tüm sayfalarını kapsıyor.

---

## GENEL BAĞLAM

Sen bir senior product designer + frontend geliştiricisin. Sana bir SaaS landing page'inin mevcut tasarımını revize etmen için görev veriliyor.

**Ürün:** PostCraft — Türk KOBİ'ler (kafe, kuaför, butik, restoran) için Instagram içerik üretici. Kullanıcı birkaç cümle girer, sistem arkada çok katmanlı bir prompt mühendisliği çalıştırır, hazır Instagram içeriği çıkar.

**Hedef kitle:** Türkiye'de 25–50 yaş arası küçük işletme sahibi. Instagram'ı aktif kullanan, ama içerik üretmeye vakti veya teknik becerisi olmayan kişiler.

---

## MEVCUT TASARIMIN SORUNLARI — BUNLARIN HEPSİNİ DEĞİŞTİR

Mevcut site tam anlamıyla "AI slop" estetiği sergiliyete. Şu unsurların HEPSİ değişmeli:

- ❌ Siyah/koyu arka plan + mor gradient (her AI SaaS sitesinde var)
- ❌ Her bölümde aynı pattern: büyük bold başlık ortada, altta küçük açıklama, altında buton
- ❌ Mor accent rengi (overused, generic)
- ❌ Rounded glassmorphism kartlar (3'lü grid, hep aynı yükseklikte, hep aynı ikonlar üstte)
- ❌ "En Popüler" etiketli pricing kartı (klişe)
- ❌ Inter veya benzer system font
- ❌ Hero'da istatistik row'u (1000+ işletme, 50.000+ içerik, %95 memnuniyet) — her site yapıyor
- ❌ Testimonial slider (yuvarlak avatar, 5 yıldız, alıntı)
- ❌ Merkezi hizalı her şey — layout monoton

---

## YENİ TASARIM YÖNELİMİ

### Estetik Yön
**"Türk Basını Meets Digital Tool"** — Eski Türk gazete ve dergi estetiğini modern SaaS ile harmanlayan, editorial ama sıcak, ciddi ama erişilebilir bir tasarım dili. Bir kuaförün ya da kafe sahibinin "bu araç beni anlıyor" hissi vermeli. Aşırı tech değil, aşırı folklorik de değil — ikisinin arasında özgün bir yerde durmalı.

### Renk Paleti — SADECE BUNLAR
```
--bg-primary:    #F5F0E8;   /* Krem / eski gazete kağıdı */
--bg-secondary:  #EDEAE0;   /* Biraz daha koyu krem */
--text-primary:  #1C1C1C;   /* Neredeyse siyah */
--text-secondary:#4A4A4A;   /* Koyu gri */
--accent:        #D4450C;   /* Tuğla kırmızısı — Türk çayı rengi */
--accent-light:  #F2E8D5;   /* Çok açık turuncu/krem */
--border:        #C8C0B0;   /* Eskimiş kağıt kenar rengi */
```

Mor renk yok. Gradient yok. Glassmorphism yok.

### Tipografi
- **Başlıklar:** `Playfair Display` veya `Cormorant Garamond` — serif, editorial, ağırlıklı
- **Gövde/UI:** `DM Sans` veya `Instrument Sans` — geometric, temiz ama Inter değil
- **Vurgu/etiketler:** `Space Mono` — monospace, teknik his için küçük dozda

### Layout Mantığı
- Asimetrik grid kullan — sol ağır / sağ hafif veya tersi
- Her section farklı layout yapısı olsun — aynı 3-kolon grid'i tekrarlama
- Köşe radius max 6px — yuvarlaklık azalt, keskinleştir
- Divider olarak ince yatay çizgiler kullan (border-bottom), kartlar yerine
- Başlıklar bazen sola yaslanmalı, bazen kırılmalı, bazen büyük boyutlu

---

## SAYFA SAYFA REVİZE TALİMATLARI

### 1. HERO SECTION

**Mevcut:** Ortada dev bold başlık, mor gradient vurgu, 2 buton, altta istatistik kartı.

**Yeni yapı:**
- Layout asimetrik: Sol taraf büyük editorial başlık (serif, siyah), sağ taraf ürün önizlemesi veya kısa UI mockup
- Başlık kırık satırlı, büyük punto, sola yaslanmış
- Tuğla kırmızısı accent sadece bir kelimede veya küçük etikette kullan — her yerde değil
- Hero arka planı: krem (#F5F0E8) + çok hafif grain texture overlay (CSS noise)
- İstatistikler: istatistik kartı değil, başlığın altında tek satır metin gibi: "1.000'den fazla Türk işletmesi kullanıyor" — minimal
- CTA butonu: tuğla kırmızısı, köşeli (border-radius: 4px), hover'da arka plan koyulaşır
- İkinci buton: sadece alt çizgili text link gibi

**Kaçın:** Gradient, glassmorphism, mor, merkezi hizalama

---

### 2. NASIL ÇALIŞIR (3 Adım)

**Mevcut:** 3 eşit kolon kart, numara + ikon + başlık + metin.

**Yeni yapı:**
- Dikey liste formatı, tam genişlik
- Her adım yatay bir şerit — solda büyük numeral (serif, çok büyük, gri), ortada içerik, sağda küçük bir UI parçacığı (opsiyonel)
- Adımlar arasında ince border-bottom çizgisi
- Kart yok, shadow yok, ikon yok (ikonlar generic görünüyor)
- Numaralar dekoratif ama işlevsel: `01`, `02`, `03` — büyük, soluk, arka planda

---

### 3. İÇERİK TÜRLERİ

**Mevcut:** 3+2 grid, eşit kartlar, emoji ikonlar.

**Yeni yapı:**
- Masonry veya editorial grid — eşit olmayan yükseklikler
- Her içerik türü için farklı boyut kart
- İkonlar yerine içerik türünü gösteren küçük metin önizlemesi (örn. carousel için küçük slayt taslağı, caption için küçük metin bloğu)
- Etiketler (5-7 Slayt, Kampanya vb.) krem arka plan + tuğla kırmızısı border, monospace font

---

### 4. DEMO / FORM SECTION

**Mevcut:** Siyah arka plan, dropdown form, mor buton.

**Yeni yapı:**
- Arka plan krem, sol tarafta form, sağ tarafta gerçekçi output önizlemesi (statik da olabilir)
- Form elemanları: border-only input (fill yok), ince border, köşeli
- "İçerik Oluştur" butonu: tam genişlik, tuğla kırmızısı, büyük, bold DM Sans
- Sağ panel: bir Instagram post mockup çerçevesi içinde örnek output metni — kullanıcıya ne çıkacağını göster

---

### 5. FİYATLANDIRMA

**Mevcut:** 3 eşit kart, ortadaki öne çıkan (glassmorphism), "En Popüler" etiketi.

**Yeni yapı:**
- Yatay tablo formatı — kartlar yerine satırlar
- Veya: Minimal 3 kolon ama kart değil, ince bordered sütunlar (table-like)
- "En Popüler" etiketi yerine: orta sütun başlığı kalın, küçük bir yıldız (*) veya farklı renk border-top
- Fiyat font: büyük serif (Playfair), sayı güzel görünsün
- Check ikonları yerine küçük em-dash (—) veya nokta
- Arka plan: hepsi krem, öne çıkan plan biraz daha koyu krem sütun

---

### 6. MÜŞTERİ YORUMLARI

**Mevcut:** Yuvarlak avatar + 5 yıldız + alıntı slider.

**Yeni yapı:**
- Slider yok — statik, editorial alıntılar
- Büyük tırnak işareti (serif, tuğla kırmızısı, çok büyük, dekoratif)
- İsim ve işletme türü: küçük, monospace, alt çizgi yok
- 2'li grid veya tek geniş alıntı — ama yatay kart değil
- Avatar yok — isim yeterli, sektör etiketi yanında

---

### 7. FOOTER CTA + FOOTER

**Mevcut:** Siyah arka plan, merkezi başlık, mor buton.

**Yeni CTA section:**
- Krem değil, koyu (ama mor/siyah değil) — `#2C2416` çok koyu kahve/toprak tonu
- Başlık: büyük serif, açık krem rengi
- Buton: krem renkli, koyu metin — ters kontrast

**Footer:**
- Bölümler arasında ince çizgiler
- Logo sol, linkler sağda grid
- Zemin aynı koyu kahve tonu
- Minimal — fazla whitespace, az element

---

## GENEL UI KURALLARI — HER SAYFADA UYGULA

```
Border radius: max 6px (tercihan 4px veya 0)
Box shadow: sadece çok hafif (0 1px 3px rgba(0,0,0,0.08)) — dramatic shadow yok
Padding: section'lar için 80–120px dikey
Font size başlık: 48–72px desktop
Animasyon: scroll reveal, fade+translateY, sadece ilk görünümde — parallax yok
Hover state: renk geçişi değil, border veya underline değişimi tercih
Gradient: HİÇ KULLANMA
```

---

## KAÇINILACAKLAR — MUTLAK YASAKLAR

Bu listedeki hiçbir şeyi tasarımda kullanma:

- ❌ Mor veya mavi gradient (hiç)
- ❌ Glassmorphism (backdrop-filter: blur olan her şey)
- ❌ Inter, Roboto, Arial, system-ui font
- ❌ Merkezi hizalanmış her section (en az 3 section sola yaslanmalı)
- ❌ Eşit yükseklikte 3'lü grid kartlar (her section'da)
- ❌ Yuvarlak avatar + yıldız + alıntı testimonial pattern
- ❌ "En Popüler" veya "Çok Satan" pill badge (klişe)
- ❌ Emoji ikon (🎨 📱 ✨ gibi şeyler)
- ❌ Büyük başlıkta ortadaki bir kelime farklı renk (özellikle mor)
- ❌ Scroll down mouse animasyonu (hero'da)
- ❌ Infinite logo marquee / "güven logolar" şeridi

---

## TON & KOPİ NOTU

Tasarım yaparken placeholder metin yazacaksan şu tona uyu:
- Direkt, kısa, Türkçe
- "Profesyonel içerikler saniyeler içinde" değil → "3 cümle yaz. Instagram postu hazır."
- Abartılı vaatler değil, somut eylemler
- Emoji yok, ünlem az

---

## ÇIKTI BEKLENTİSİ

Yukarıdaki tüm sayfa revizyonlarını uygulayarak tam bir landing page üret:
1. Hero
2. Nasıl Çalışır
3. İçerik Türleri
4. Demo/Form
5. Fiyatlandırma
6. Müşteri Yorumları
7. CTA + Footer

Her section için ayrı component olarak çıkar. Renk, font ve layout kurallarına tam uy. Tek bir piksel mor gradient görmek istemiyorum.