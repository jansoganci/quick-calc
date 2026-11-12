# Nerede karışıyor — UI/UX denetimi

**Tarih:** 12 Kasım 2026 · `main` @ bu PR’nin tabanı
**Yöntem:** Uygulama yerelde açıldı (`npm ci`, `npm run dev`). Playwright, 390×844 ve 1280×800. Hızlı Hesap örnek değerlerle; Detaylı boş, örnek kafe, hamburger reçetesi (ekmek 1 adet, kıyma 120 g, domates 30 g, marul 20 g), sonra Hesapla.
**Kod değişmedi.** Ekran görüntüleri `/opt/cursor/artifacts/`. Claude Design brifi: [`RECIPE_REDESIGN_BRIEF.md`](./RECIPE_REDESIGN_BRIEF.md).

Bu belge bir ürün kararı değildir. Şikayetleri ekrana bağlar.

---

## Girdi sayıları (Detaylı)

Sayım: her bölümdeki `input` + `select` (gizli type hariç). Segment (Net/Brüt, teslimat modu, ufuk, ramp) ayrı sütunda. Gelişmiş varsayımlar `<details>` içinde DOM’da durduğu için 3 alan Varsayımlar’a dahildir.

### Boş form

| # | Bölüm | Alan | Segment |
| --- | --- | ---: | ---: |
| 01 | Ürünler ve satış | 5 | 0 |
| 02 | Satış kanalları | 5 | 0 |
| 03 | Ödeme yöntemleri | 5 | 0 |
| 04 | Paket servis | 2 | 1 |
| 05 | Personel | 0 | 0 |
| 06 | İşletme sahibi | 2 | 0 |
| 07 | Kira ve aidat | 2 | 1 |
| 08 | Diğer giderler | 0 | 0 |
| 09 | İlk yatırım | 0 | 0 |
| 10 | Varsayımlar | 8 | 2 |
| | **Toplam** | **29** | **4** |

Boş ürün satırı: ad + normal fiyat + online fiyat + günlük adet + birim maliyet = 5. Paket servis, kanal payı varsayılan %30 olduğu için boş formda da zorunlu (mod seçilmeden Hesapla açılmaz).

### Örnek kafe (Amerikano, Poğaça, Cold Brew)

| # | Bölüm | Alan | Segment |
| --- | --- | ---: | ---: |
| 01 | Ürünler ve satış | 15 | 0 |
| 02 | Satış kanalları | 5 | 0 |
| 03 | Ödeme yöntemleri | 5 | 0 |
| 04 | Paket servis | 2 | 1 |
| 05 | Personel (1 pozisyon × 6) | 6 | 0 |
| 06 | İşletme sahibi | 2 | 0 |
| 07 | Kira ve aidat | 2 | 1 |
| 08 | Diğer giderler (2 kalem) | 4 | 0 |
| 09 | İlk yatırım (2 kalem) | 4 | 0 |
| 10 | Varsayımlar | 8 | 2 |
| | **Toplam** | **53** | **4** |

### Örnek + Hamburger reçetesi (4 malzeme)

Ürünler bölümü **56 alan** (20 ürün alanı + 20 reçete alanı + 16 liste kopyası). Sayfa toplamı **94 doldurulabilir alan** + 4 segment.

Tek hamburger, ürünler bölümünü 15 → 56 yapıyor. Çünkü her malzeme hem listede (ad, alış, birim, tutar) hem reçetede (aynısı + «Gramaj») duruyor.

Ham veri: `/opt/cursor/artifacts/field-counts.json`.

---

## Sorun listesi (şiddete göre)

### P0 — Bıraktırır

**1. Tek sayfada çok alan**
Ekran: `mobile-03-detailed-empty.png`, `desktop-03-detailed-empty.png`, `desktop-04-detailed-sample.png`, `desktop-15-assumptions.png`, `desktop-13-channels.png`.
Boşken 10 akordeon + 29 alan + paket servis engeli; örnek kafede 53 alan; bir reçeteyle 94. Hedef kullanıcı dört işlem bilir ve telefonla gelir. Kira, personel, kanal, KDV, senaryo ve gelişmiş yıllık artışlar aynı kaydırmada. V2 adım 5 (Menü / Malzemeler / Satış / Giderler / Sonuç) bunu bölecek; bugün tek duvar.

**2. Reçete, ürün satırının altında aynı tabloda açılıyor**
Ekran: `mobile-07-hamburger-recipe-nested.png`, `desktop-07-hamburger-recipe-nested.png`, `desktop-05-detailed-recipe-viewport.png`, `desktop-17-dual-price-viewport.png`.
Sahip şikayeti. Hamburger satırı (ad, 195, 230, 25, 55,50) ile hemen altında Ekmek / Kıyma ızgarası aynı ritim. «Elle gir» ürün kaynağını, her malzeme satırındaki «Kaldır» o satırı siliyor. Masaüstünde ürün tablosu ile malzeme tablosu birbirine yapışık; telefonda 4 malzeme ~ bir buçuk ekran.

**3. «Gramaj» etiketi adet/ml için yanıltıcı**
Ekran: `mobile-08-gramaj-ekmek.png`, `desktop-07-hamburger-recipe-nested.png`.
Sahip şikayeti. Ekmek kullanım kutusu «Gramaj» + `1 adet`. Kıyma «Gramaj» + `120 g`. Kullanıcı hamburger ekmeğine 1 yazmak istiyor; etiket gram soruyor. Hata metni de «Gramajı girin.»

**4. Alış tutarı iki yerde**
Ekran: `mobile-06-ingredient-list.png` + `mobile-07-hamburger-recipe-nested.png`; `desktop-06-ingredient-list.png` + `desktop-05-detailed-recipe-products.png`; `desktop-17-dual-price-viewport.png`.
Sahip şikayeti. Veride fiyat tektir. Ekranda Ekmek 80 TL hem «Malzemeler» listesinde hem reçete satırında. Liste ipucu doğru («Fiyatı buradan değiştirince…») ama reçete satırı aynı kutuları tekrar ediyor. Hangisini düzelteceği belirsiz. «Zam geldi» (adım 2) bu haliyle evsiz.

### P1 — Akışı bozar

**5. Telefonda sabit Hesapla çubuğu alanların üstünü örtüyor**
Ekran: `mobile-03-detailed-empty-viewport.png`, `mobile-06-ingredient-list.png`, `mobile-07-hamburger-recipe-nested.png`.
Altta ~92px çubuk. Marul’un alış tutarı, «Reçeteden hesapla», ipuçları çubuğun altında kalıyor. `pb-[92px]` var; yine de odaklanan satır çubuğun içine giriyor.

**6. Örnek doldurunca ürün satırları kapalı kalıyor (mobil)**
Ekran: kod + `mobile-04-detailed-sample-viewport.png` (Amerikano bu denetimde elle açıldı).
`loadSample` bölümü «Ürünler»de bırakıyor; `useNewestRowOpen` eski boş satırın id’sinde kalıyor. Üç ürün isim + özet olarak duruyor, içerik gizli. İlk ziyaretçi örnekten sonra boşmuş gibi görür.

**7. Reçetede alış paketi + kullanım aynı satırda**
Ekran: `desktop-07-hamburger-recipe-nested.png`.
Kullanıcı «bu hamburgerde 120 g kıyma» demek istiyor. Satır soruyor: malzeme, alış miktarı, birim, alış tutarı, gramaj. Alış «1 kg = 380 TL» liste işi. Telefonda 2×2 ızgara; «Kaldır» her bloğun altında.

**8. Çift akordeon (mobil)**
Ekran: `mobile-03-detailed-empty-viewport.png`, `mobile-04-detailed-sample-viewport.png`.
Bölüm (01 Ürünler) ve ürün satırı (Ürün 1 / Amerikano) ayrı açılıyor. İki kıl payı ok. Reçete üçüncü bir katman.

**9. Boş formda paket servis Hesapla’yı kilitliyor**
Ekran: `mobile-03-detailed-empty-viewport.png` — «2 alanı kontrol edin — Ürünler ve satış, Paket servis».
Kullanıcı henüz kanal düşünmemiş. Varsayılan mix %30 paket servis olduğu için teslimat modu zorunlu. Ürün 1 boşken ikinci hata görünmez bir bölümde.

### P2 — Sürtünme

**10. Malzeme listesi ürünlerin üstünde, reçeteden «doğuyor»**
Ekran: `desktop-05-detailed-recipe-products.png`, `mobile-05-detailed-recipe-products.png`.
Liste, örnek linki ile ürün tablosu arasında. Reçeteyi aşağıda doldurup fiyatı yukarıda aramak telefon için ters. Ad yazılmadan liste yok; malzemeyi önce toplayıp sonra ürüne bağlamak yok.

**11. «Reçeteden hesapla» / «Elle gir» metin seviyesi, kolay kaçıyor**
Ekran: `desktop-04-detailed-sample-products.png`, `desktop-17-dual-price-viewport.png`.
Ürün satırının altında 13px link. Dört sayı kutusunun yanında ikincil. Elle maliyet ile reçete aynı anda durduğu için (Amerikano 25 TL, Hamburger 55,50) fark yalnızca Hamburger’de gri kutu.

**12. Alış kg, kullanım g — dönüşüm sessiz**
Ekran: `desktop-07-hamburger-recipe-nested.png` (Kıyma 1 kg / Gramaj 120 g).
Doğru davranış. Ekran 120 g’nin 1 kg’den pay olduğunu, 380 TL’nin grama bölündüğünü söylemiyor. «1 kg aldım, bir tanesine 120 g» cümlesi yok.

**13. Her yerde «Kaldır»**
Ekran: `desktop-07-hamburger-recipe-nested.png`, `desktop-04-detailed-sample-products.png`.
Ürün, reçete satırı, opex, capex. Reçete açıkken altı «Kaldır» üst üste. Hangisinin hamburgeri sileceği belli değil.

**14. Online fiyat her üründe zorunlu görünüyor**
Ekran: `desktop-04-detailed-sample-products.png`.
Paket payı sıfır olsa da kolon duruyor (yol haritası §6: boşsa satış fiyatına eşit, alan pay > 0 iken). Dört kolon + maliyet + kaldır = dar telefon ızgarası.

**15. Örnek linki doldurulmuş menüde duruyor**
Ekran: `mobile-04-detailed-sample-viewport.png`, `desktop-05-detailed-recipe-products.png`.
«Nereden başlayacağını bilmiyor musun?» üç ürün varken de orada. Taslak varsa onay istiyor; yoksa her an ezer.

**16. Hızlı Hesap sonuç cümlesi (masaüstü) kesilebiliyor**
Ekran: `desktop-02-quick-after-viewport.png`.
Yapışkan sonuç sütunu «30,09 TL’si işletmede kalıyor» ile başlıyor; R1 cümlesinin başı kare dışında. Mobilde cümle tam (`mobile-02-quick-after-viewport.png`) ama uzun ve kalın rakam yığını.

**17. Mobil Detaylı’da özet hem alt çubukta hem sayfa sonunda**
Ekran: `mobile-03-detailed-empty.png` (HAZIRLIK bloğu akordeonların altında), `mobile-11-detailed-results-viewport.png` (alt çubukta aylık sonuç + Sonuçlar).
Masaüstü sağ sütun, telefonda forma ekleniyor. Hesapla’dan önce uzun «hiçbir sayı gösterilmez» metni bir kez daha.

### P3 — İkincil

**18. Varsayımlar: 8 alan + 2 segment, üçü «gelişmiş»te**
Ekran: `desktop-15-assumptions.png`.
KDV ve gün gerekli; kötü/baz/iyi ve yıllık artışlar aynı bölümde. Hedef kullanıcı için erken.

**19. Personel: pozisyon başı 6 alan**
Ekran: `desktop-16-positions.png`.
Ad, kişi, işveren maliyeti, yemek, yol, prim. Doğru model; ilk bakışta maaş formu.

**20. Gider / yatırım «sık kullanılan» paleti**
Ekran: `desktop-04-detailed-sample-viewport.png`.
Elektrik + Su doluyken hâlâ Doğalgaz, İnternet, … satırı. Az girdi vaadine ters görsel gürültü.

**21. Sonuç alanı bilgiyi taşıyor, ilk bakışta ağır**
Ekran: `mobile-11-detailed-results-viewport.png`, `desktop-11-detailed-results-viewport.png`, `desktop-12-summary-pane.png`.
Çubuk + tablo + Sankey aynı kırılımı üç kez. Karar cümlesi sağ sütunda iyi (`desktop-12-summary-pane.png`); telefonda asıl sonuç alt çubuktaki tek rakam, ayrıntı kaydırmada.

---

## Ekran özeti (bu denetimde ne görüldü)

- **Hızlı Hesap** 8 asıl girdiyle okunuyor; sonuç cümlesi ve çubuk Dil V1–R2’ye uyuyor. Sorun ölçek değil, Detaylı’ya geçince kırılma.
- **Detaylı boş** ürün + 9 kapalı bölüm + kilitli Hesapla + paket servis hatası.
- **Örnek kafe** üç elle maliyetli ürün; reçete kapalı; 53 alan.
- **Hamburger reçetesi** 55,50 TL; liste 4 malzeme; fiyat çift; Gramaj + 1 adet.
- **Hesapla sonrası** aylık sonuç 225.921 TL, ciro 684.225 TL (örnek + hamburger). Karar cümlesi masaüstü sağ sütunda net.

---

## Bu brifte olmayanlar

Kanal / personel / varsayım sadeleştirmesi, ekranlara bölme, Zam geldi formülü, food cost, Hızlı Hesap. Sahip sırası: önce reçete UI (adım 1), sonra tek fiyat yeri + Zam geldi (adım 2).
