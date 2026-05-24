Tamam, Türkçe yazıyorum.

Proje Brifing — Türk KOBİ'ler için Instagram İçerik Üretici
Çözdüğümüz problem
Türkiye'deki küçük işletme sahipleri — kafe, butik, kuaför, eczane, restoran — Instagram'da aktif olmak zorundalar ama bunu yapacak ne zamanları ne bütçeleri var. Grafiker tutmak pahalı, Canva ile uğraşmak yorucu, sonuç her zaman amatör görünüyor. Ya hiç paylaşım yapılmıyor ya da marka imajına zarar veren içerikler çıkıyor ortaya.

Çözüm
Kullanıcının ne paylaşmak istediğini birkaç basit soruyla anlayan, arkasında çok detaylı bir prompt mühendisliği olan ve sonunda hazır Instagram içeriği üreten bir web uygulaması. Artlist.io mantığı — abonelik bazlı, sürekli kullanılan bir araç.

Nasıl çalışacak (kullanıcı tarafı)
Kullanıcı giriş yapar, işletme profilini oluşturur (sektör, ton, marka renkleri, logo)
Ne üretmek istediğini seçer — carousel, duyuru, kampanya, motivasyon postu, ürün tanıtımı vb.
Kısa bir form doldurur — "Bu hafta %20 indirim var, şarap bardağı koleksiyonumuz için" gibi birkaç cümle
Sistem bunu otomatik olarak çok katmanlı, detaylı bir prompt'a dönüştürür
ChatGPT API bu prompt'u alır, içeriği üretir
Kullanıcıya hazır metin + yapı çıkar — doğrudan kopyalayıp paylaşabilir
Teknik altyapı (özet)
Frontend: kullanıcı arayüzü, form sistemi, içerik önizleme
Backend: prompt şablonları, kullanıcı girdisini prompt'a dönüştüren motor
API: OpenAI GPT-4o (veya GPT-4 Turbo) entegrasyonu
Veritabanı: kullanıcı profili, işletme bilgileri, geçmiş içerikler
Auth: email/şifre veya Google ile giriş
En kritik nokta — Prompt Mühendisliği
Bu projenin rakiplerden farkını yaratan kısım burası. Kullanıcı "indirim duyurusu yap" diyecek ama arkada çalışan prompt çok daha derin olacak:

İşletmenin sektörü, tonu, hedef kitlesi
Paylaşım türünün yapısı (carousel'de kaç slayt, her slaytta ne var)
Türkiye Instagram diline özel yazım stili — ne çok resmi ne çok samimi
AI gibi görünmemesi için özel direktifler — klişe girişler yok, emoji bombardımanı yok, "Harika haber!" tarzı açılışlar yok
Marka sesine uyum — kullanıcı profilde belirlediği ton sisteme bağlı
Yani kullanıcı 3 cümle girer, sistem bundan 800 kelimelik bir prompt üretir, o prompt'tan da kaliteli içerik çıkar.

İçerik türleri (ilk faz)
5-7 slaytlık carousel (bilgilendirme, "bunu biliyor muydun" tipi)
Duyuru postu (kampanya, indirim, yeni ürün)
Tek kare post (alıntı, motivasyon, ürün spotlight)
Story metni
Caption + hashtag paketi
Hedef kullanıcı
Türkiye'de küçük/orta ölçekli işletme sahibi, 25-50 yaş arası, Instagram'ı aktif kullanan ama içerik üretmeye vakti olmayan ya da kendine güvenmeyen kişi. Sektöre göre öncelik: F&B, güzellik/bakım, giyim, hizmet sektörü.

İş modeli
Abonelik bazlı SaaS. Muhtemelen:

Ücretsiz plan — ayda 5 içerik, fikiryi test etmek için
Temel plan — ayda ~150-200₺, sınırsız veya yüksek limitli içerik
Pro plan — öncelik destek, marka sesi kalıbı kaydetme, geçmiş içerik arşivi
Ne değiliz
Canva değiliz — biz görsel değil, metin ve yapı üretiyoruz (en azından ilk fazda)
Genel amaçlı AI chatbot değiliz — her şey Instagram ve Türk KOBİ için optimize edilmiş
Scheduller değiliz — içerik üretiyoruz, yayınlamıyoruz (ilerleyen fazda entegre edilebilir)
Kısa vadeli yol haritası
Prompt şablonlarını yaz ve test et — en önemli adım
MVP: tek içerik türüyle çalışan basit arayüz
10-20 beta kullanıcıyla test et, geri bildirim al
Ödeme sistemini entegre et
İçerik türlerini genişlet
Arkadaşına bunu verdiğinde ne anlaması gerekiyor sorarsan: teknik tarafı güçlü biri lazım (frontend + backend), sen de prompt mühendisliği ve kullanıcı deneyimi tarafını götürüyorsun.


Sistemin Gerçek İşleyişi
Prompt Kütüphanesi — Projenin Kalbi
Sistemin tamamı bir prompt kütüphanesi üzerine inşa edilmiş. Bu kütüphane kullanıcıya görünmüyor, arka planda çalışıyor. İçinde ne var:

Her içerik türü için ayrı, çok katmanlı prompt şablonları
Instagram formatına özel görsel yapı direktifleri (carousel slayt oranları, tipografi hiyerarşisi, boşluk kullanımı)
Marka kimliği değişkenlerini alan slotlar — renk, font, ton, sektör
"AI gibi görünme" direktifleri — klişe açılışlar yasak, jenerik kompozisyonlar yasak
Platform uyumu kuralları — Instagram'ın görsel diline uygun çıktı

Kullanıcı normal ChatGPT'de aynı sonucu alamaz çünkü bu kütüphaneye erişimi yok. Biz arayüz satmıyoruz aslında — prompt altyapısı satıyoruz.

Marka Profili Sistemi
Kullanıcı bir kez profil oluşturur, sistem bu profili her içerik üretiminde referans alır.
Profilde ne var:

Birincil ve ikincil marka renkleri (hex kodu veya renk seçici)
Font tercihi — başlık fontu, gövde fontu
Marka tonu — resmi / samimi / esprili / premium / sıcak vb.
Sektör ve hedef kitle tanımı
Logo yükleme (ilerleyen fazda görsele işlenecek)
Örnek paylaşımlar — "bunu beğeniyorum" referansı

Kullanıcı birden fazla profil oluşturabilir. Örneğin aynı kişi hem kafe hem butik işletiyorsa iki ayrı profil tutar, her profil kendi kimliğini koruyor.

Üretim Akışı — Adım Adım
Kullanıcı profil seçer
        ↓
İçerik türünü seçer (carousel / duyuru / tek kare vb.)
        ↓
Kısa bir form doldurur ("bu hafta %20 indirim, kış koleksiyonu")
        ↓
Sistem, formdaki veriyi + profil verisini alır
        ↓
Prompt kütüphanesinden ilgili şablonu çeker
        ↓
Tüm veriyi şablona işler → tam teşekküllü, detaylı prompt oluşur
        ↓
Bu prompt OpenAI API'ye gider
        ↓
Çıktı kullanıcıya döner — hazır içerik yapısı

Tutarlılık Meselesi
Bu sistemin en değerli özelliği. Kullanıcı farklı günlerde, farklı içerik türleri üretse de çıktılar birbirine benziyor çünkü her seferinde aynı profil verisi prompt'a enjekte ediliyor. Rakamlarla söylersek:

Aynı renk paleti
Aynı tipografi hiyerarşisi
Aynı ton ve yazım stili
Aynı görsel kompozisyon mantığı

Bunu normal ChatGPT'de sağlamak için kullanıcının her seferinde marka bilgilerini yeniden yazması, aynı direktifleri tekrar vermesi lazım. Biz bunu otomatikleştiriyoruz ve her seferinde tutarlı şekilde uyguluyoruz.

Rakiplerden Fark — Özet
Normal ChatGPTCanvaBizim sistemPrompt altyapısıKullanıcıya bağlıYokHazır, optimize edilmişMarka tutarlılığıManuelKısmiOtomatik, profil bazlıInstagram uyumuGenelŞablon bazlıPlatform-native direktiflerÇoklu profilYokVar ama içerik üretmiyorVar, içerikle bütünleşikÇıktı kalitesiDeğişkenGörsel odaklıMetin + yapı, AI kokusu yok