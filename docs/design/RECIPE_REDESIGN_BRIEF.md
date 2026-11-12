# Reçete + ortak malzeme listesi — Claude Design brifi

**Ürün:** maliyet.lol · Detaylı Fizibilite
**Tarih:** 12 Kasım 2026
**Kapsam:** Yalnızca reçete ve ortak malzeme listesi deneyimi. Hızlı Hesap’a, Detaylı’nın diğer bölümlerine, formüllere ve motorlara dokunma.
**Önce mobil.** Her kare 390px’de okunur; sonra 1280px’e genişler.

Sahip bu metni Claude Design’a olduğu gibi yapıştıracaktır. Çıktı: mobil ve masaüstü kareler. Kod yazılmaz.

---

## 1. Ne tasarlıyorsun

Detaylı Fizibilite içinde bir ürünün maliyetini **reçeteden** hesaplama ve malzemelerin **ortak alış listesini** yönetme deneyimi.

Bugün bu iki şey aynı ürün tablosunun içine sıkışmış durumda: reçete, ürün satırının altında alt satır gibi açılıyor; alış fiyatı hem listede hem reçete satırında duruyor; kullanım miktarının etiketi her birimde «Gramaj».

Bu brifin işi: aynı veri modelini koruyarak bu deneyimi sade, telefon-öncelikli ve esnaf Türkçesiyle yeniden çizmek.

---

## 2. Kime

Kafe açmayı planlayanlar ve küçük yiyecek-içecek işletmesi sahipleri.

- **Önce telefon.** Çoğu kişi bunu 390px genişlikte, tek elle, otobüste veya mutfakta doldurur.
- **Dört işlem.** Finans bilgisi temel aritmetik düzeyindedir. Tablo, marj, katkı, amortisman, food cost cümlesi okunmaz.
- **Az girdi.** Çok alan görünce bırakır. Bir hamburger için «ekmek 1, kıyma 120 g, domates 30 g» yazabilmeli; paket alışını her satırda yeniden anlatmak zorunda kalmamalı.
- **Yalnızca Türkçe, yalnızca Türkiye.**

Hedef cümle: «Bu hamburgerin içine ne koyuyorum, kilosunu kaça alıyorum, bir tanesine ne kadar gidiyor?»

---

## 3. Bugün neden karışıyor (mevcut ekrandan)

Mevcut uygulama `main`’dedir. Yeniden çiz, mevcut ızgarayı cilalama.

1. **Reçete, ürün satırının altında aynı tabloda alt satır gibi açılıyor.** Ürün adı / fiyat / adet / maliyet ile malzeme / alış / birim / tutar / gramaj aynı dikey ritimde. Hangi satırın ürüne, hangisinin malzemeye ait olduğu okunmuyor. «Elle gir» ve «Kaldır» hem üründe hem malzeme satırında var.
2. **«Gramaj» etiketi her birimde duruyor.** Hamburger ekmeği `adet`. Kullanıcı 1 yazmak istiyor; etiket gram soruyor gibi duruyor. `ml` için de aynı. Etiket birime uymalı: `g` / `ml` / `adet`.
3. **Alış tutarı iki yerden değişiyor.** Üstte «Malzemeler» listesi (Ekmek 10 adet = 80 TL), altta aynı sayılar reçete satırında tekrar. Veride fiyat tektir; ekran iki editör gösteriyor. Hangisinin asıl olduğu belirsiz.
4. **Çok alan.** Tek bir hamburger reçetesi (4 malzeme) ürünler bölümünü 15 alandan 56 alana çıkarıyor: ürün satırları + reçete satırları + listenin kopyası. Kullanıcı bir kullanım miktarı yazmak isterken alış paketi, birim ve tutarı her satırda yeniden görüyor.
5. **Liste, ürünlerin üstünde.** Telefonda reçeteyi doldurunca fiyatı değiştirmek için yukarı kaydırmak, sonra tekrar ürüne inmek gerekiyor. Malzeme henüz adlandırılmadan liste görünmüyor; önce reçeteden «doğuyor».
6. **Alış birimi ile kullanım birimi konuşmuyor.** Kıyma «1 kg, 380 TL» alınıyor, kullanım «120 g». Dönüşüm doğru; ama neden gram yazıldığı, 120’nin 1 kg’den düşülüp düşülmediği ekranda anlatılmıyor.

Bunları düzelt. Detaylı’nın kira / personel / varsayım bölümlerini bu işte yeniden çizme.

---

## 4. Korunacak görsel dil

Kaynak: `docs/DESIGN_DIRECTION.md` (kilitli). Yeni bir görsel sistem icat etme.

| Kural | Uygula |
| --- | --- |
| Karakter | Sessiz, analitik alet. Rakamlar sayfayı taşır. Gösterge panosu yok. |
| Renk | Nötr griler + tek mürekkep vurgu `#1D3A5F`. Vurgu başlık rakamı ve odak halkasında. |
| Negatif | Kırmızı yok. Eksi işareti yeter. Alarm bloğu yok. |
| Yazı | IBM Plex Sans metin, IBM Plex Mono her rakam. Türkçe karakterler. Tabular figures. |
| Yüzey | Kart yok. Bölümler kıl payı çizgi ve boşlukla ayrılır. Gölge, gradient, cam, hap, rozet yok. |
| Yoğunluk | Rahat. Mobilde dokunma alanı en az **44px**. Yan kaydırma yok. |
| Dil | Yalnızca Türkçe. EN/TR anahtarı yok. |
| Hesap | İlk sonuç **Hesapla**’dan sonra gelir (V6). Bu karelerde «Hesapla’dan önce boş sonuç» kuralını bozma; reçete maliyeti ürün satırında küçük bir toplam olarak durabilir. |

Tokenler (mevcut uygulama): zemin `#EDEEF0`, yüzey `#FFFFFF`, mürekkep `#16181C`, ikincil `#5B6169`, soluk `#8A9199`, çizgiler `#E3E5E8` / `#D6D9DD`, vurgu `#1D3A5F`. Köşe ~4px. Odak: `#1D3A5F` kenar + `0 0 0 3px rgba(29,58,95,0.13)`.

---

## 5. Veri modeli — çizimi buna uydur, modeli değiştirme

Kod ve spec’in sözleşmesi. Ekran bunu yansıtır.

**Malzeme (ortak):**

- `name` — örn. Ekmek, Kıyma
- `purchaseQuantity` + `purchaseUnit` + `purchasePrice` — «10 adet ekmek 80 TL», «1 kg kıyma 380 TL»
- Alış fiyatı **malzemeye aittir**, ürüne değil. Aynı kıyma hem hamburgerde hem köftede kullanılırsa fiyat **bir kez** durur.

**Ürün reçete satırı:**

- `ingredientId` — ortak malzemeye işaret
- `usageQuantity` — **bu üründen bir tanesine** giden miktar (1 adet ekmek, 120 g kıyma)
- Kullanım miktarı ürüne özgüdür. Bir reçeteyi değiştirmek diğerini değiştirmez.

**Birimler:**

- Alış: `kg`, `g`, `L`, `ml`, `adet`
- Kullanım, alış ailesine göre: kg→g, L→ml, adet→adet
- Aileler karışmaz: gram adet olmaz, litre gram olmaz
- Kullanıcı aldığı gibi yazar («5 kg, 450 TL»). Uygulama gram / mililitre / adet fiyatına çevirir

**Maliyet kaynağı:**

- Her ürünün tek kaynağı vardır: ya elle birim maliyet, ya reçete toplamı
- Reçete seçilince elle maliyet alanı kapanır; reçete toplamı o alanı doldurur
- Bütün menüye reçete yazmak zorunlu değildir. Amerikano 25 TL elle, hamburger reçeteden — ikisi bir arada kalır
- Aylık fizibilite motoru reçeteyi görmez; yalnızca ürünün birim maliyet tutarını alır

---

## 6. Sahip kuralları (kilitli)

- Alış fiyatı **tek yerden** düzenlenir. İkinci fiyat kutusu yok.
- Etiketler düz esnaf Türkçesi. **marj / katkı / amortisman** yazılmaz. «Bu üründen kalan» gibi herkesin anlayacağı cümleler.
- Kullanım etiketı birime uyar: hamburger ekmeği için `1` yazılır, etiket `adet` (veya «bu ürüne kaç adet») der — «Gramaj» demez.
- Reçete, ürün satırının altındaki tablo-içi alt satır gibi açılmaz. Ayrı, sade bir düzen.
- Fiyatı kullanıcı yazar. Hal, kasap, rakip, fatura entegrasyonu yok.
- Az girdi. Alış paketi (kaç kilo, kaç lira) malzeme listesine aittir. Reçetede mümkünse yalnızca «bu ürüne ne kadar gidiyor» sorulur.
- Yeni malzeme adı yazılınca ortak listeye düşer; aynı ad ikinci kez doğmaz, paylaşılır.

---

## 7. Yol haritası bağlamı (bu işte çizmene, sonra kodlamana)

V2 sırası (`docs/V2_V3_PRODUCT_ROADMAP.md` 0.4):

1. **Bu brif — reçeteyi sadeleştir** (adım 1).
2. **Sonra:** ortak liste tamamlanır ve **«Zam geldi»** gelir. Kullanıcı malzemeye yeni fiyatı kendisi yazar. Ekran hangi ürünlerin etkilendiğini, «bu üründen kalan»ın ne kadar düştüğünü ve eski kalanı geri getiren satış fiyatını gösterir. **Bu brifte «Zam geldi» anını bir kare olarak çiz**; tam food-cost tablosunu, senaryo motorunu veya otomatik fiyat tavsiyesini çizme.
3. Daha sonra food cost, «Kira kaç günde çıkıyor», «Ocak testi».
4. Satış tahmini ayrı bölüm.
5. Detaylı ileride ekranlara bölünebilir: **Menü / Malzemeler / Satış / Giderler / Sonuç**. Üçüncü bir hesap modu yok. Bugünkü kareler bu bölünmeyi kolaylaştırmalı (malzemeler menüden zihnen ayrı durmalı) ama beş ekranlı bilgi mimarisini bu işte teslim etme.
6. Otomatik fiyat tavsiyesi daha sonra.

Hızlı Hesap’a dokunulmaz.

---

## 8. Teslim etmen gereken kareler

Her kare **390px mobil** ve **masaüstü** (içerik ~1152px sayfa, 1280px çerçeve). Açık, kapalı, bir de dolu hali. Gerçekçi kafe / hamburger sayıları kullan. Kart, gölge, kırmızı, İngilizce, «marj» yok.

### A. Ortak malzeme listesi

- 3–6 malzeme: Ekmek (adet), Kıyma (kg), Domates (kg), Marul (kg) gibi
- Her satırda: ad, alış miktarı, birim, alış tutarı
- Fiyatın **yalnızca burada** düzenlendiği net
- Bir malzeme birden fazla üründe kullanılıyorsa bunu sade Türkçe ile göster («2 üründe») — rozet / hap değil
- Boş liste: henüz malzeme yokken ne görünür? Kullanıcı malzemeyi listeden mi ekler, reçeteden mi doğurur? Bir yol seç, ikisini birden dayatma
- Telefonda tek sütun; başparmakla doldurulur

### B. Bir ürüne reçete ekleme

- Başlangıç: üründe elle maliyet (ör. Poğaça 12 TL) duruyor; yanında / altında «Reçeteden hesapla»ya denk sade bir giriş
- Akış: Hamburger seçilir → malzemeler bağlanır → kullanım yazılır → ürün maliyeti reçete toplamına döner (ör. 55,50 TL) ve elle kutu kapanır
- Reçete **ürün satırının iç ızgarasında alt satır olarak açılmaz**. Ayrı bir yüzey: tam ekran katman, ikinci adım, veya ürünün altında net ayrılmış bir blok — hangisi telefon-önce daha az alan soruyorsa onu seç. Masaüstünde ürün tablosunu parçalama.
- Zorunlu olmayan ürünler reçetesiz kalabilir. Amerikano elle, hamburger reçeteli, aynı menüde.

### C. Kullanım miktarını düzenleme

- Hamburger: ekmek **1 adet**, kıyma **120 g**, domates **30 g**, marul **20 g**
- Etiket birime uyar. Ekmekte «Gramaj» yok.
- Kullanıcı alış paketini burada yeniden yazmaz. «10 adet / 80 TL» malzeme listesindedir; burada yalnızca «bu hamburgerde 1 adet».
- Reçete maliyeti anında küçük toplam olarak görünür (ürün maliyeti). Aylık fizibilite sonucu bu karede zorunlu değil.

### D. Fiyat değişimi anı («Zam geldi» önizlemesi)

- Kıyma 380 TL’den 450 TL’ye çıkar; kullanıcı fiyatı **listede** yazar
- Etkilenen ürünler (ör. Hamburger) görünür
- «Bu üründen kalan»ın düştüğü ve eski kalanı geri getiren satış fiyatı sade Türkçe ile durur
- Bu kare adım 2’nin ev sahibidir. Yeni formül uydurma; yerleşimi, hiyerarşiyi ve cümleleri çiz. Otomatik tedarikçi fiyatı yok.

İstersen bir de **«yanlış birim»** hali: gram ile adet karışmaz, bunu kırmızısız, kısa bir notla göster.

---

## 9. Metin önerileri (esnaf Türkçesi — kilitleme değil, yön)

Kullan, iyileştir, ama finans jargonuna kayma.

- Reçeteyi aç: «İçine ne koyuyorsun?»
- Elle maliyete dön: «Tutarı kendim yazacağım»
- Liste başlığı: «Malzemeler» veya «Alış listesi»
- Alış: «Kaç aldın», «Birim», «Kaça geldi»
- Kullanım: birime göre «Bu ürüne kaç adet» / «Bu ürüne kaç gram» / «Bu ürüne kaç ml»
- Paylaşım: «Bu fiyat 2 üründe»
- Zam: «Kıyma zamlandı» · «Hamburger’den kalan 12 TL düştü» · «Eski kalan için satış 207 TL»

Yazma: Gramaj (adet/ml için), marj, katkı, amortisman, food cost, COGS, SKU, BOM, varyans, net kâr.

---

## 10. Açıkça yapma

- Hızlı Hesap’ı, kira / personel / kanal / varsayım bölümlerini, sonuç grafiğini yeniden tasarlama
- Detaylı’yı bu işte beş ekrana bölme (Menü / Malzemeler / … adım 5’te gelecek; şimdilik malzeme ile menüyü **zihnen** ayır)
- Kart, gölge, renkli hap, kırmızı zarar, ikon seti, illüstrasyon, onboarding karuseli
- İngilizce etiket, i18n, ABD birimleri
- Alış fiyatını iki yerde gösterme / iki yerde düzenletme
- Reçeteyi mevcut ürün ızgarasının alt satırı olarak bırakma
- Her reçete satırında alış miktarı + birim + tutar + kullanım dörtlüsünü tekrarlama
- Kullanıcıya stok, fire, alt reçete, parti, FIFO sorma
- Dış fiyat, hal hali, kasap API’si
- Yeni finansal formül, yeni motor alanı, «net kâr»
- Bütün menüye reçeteyi zorunlu kılma
- 44px altı dokunma alanı, yatay kaydırılan tablo
- «Tasarımı mevcut koda uydurayım» diye bugünkü 5 sütunlu reçete ızgarasını tekrar çizme — sorun o ızgara

---

## 11. Başarı ölçütü

Bir kafe sahibi telefonunda, açıklama okumadan:

1. Hamburger’e reçete ekler,
2. Ekmek için **1** yazar ve bunun adet olduğunu anlar,
3. Kıyma fiyatını **tek bir kutudan** 380 → 450 yapar,
4. Hamburger’in etkilendiğini görür,

ve «bu kadar alan mı var» diye uygulamayı kapatmaz.
