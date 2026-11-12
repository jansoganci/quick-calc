# maliyet.lol — V2 / V3 Ürün Yönü ve Kapsam

**Tarih:** 12 Kasım 2026 · **Sürüm:** 0.4
**Durum:** Kullanıcının onayladığı ürün kararları, geliştirme sırası, kullanıcı kuralları ve açık konular. Finansal formül sözleşmesi değildir. Her adımın formül ve ekran ayrıntısı, o adıma gelindiğinde kısaca netleştirilir. Ürün henüz üretime hazır V2 değildir.

## 1. Ne yapıyoruz

- maliyet.lol ücretsiz bir hobi projesidir. İşletme görüşmesi, anket veya kullanım verisi geliştirme ön koşulu değildir.
- Kullanıcı: kafe açmayı planlayanlar ve küçük yiyecek-içecek işletmesi sahipleri.
- V2'nin hedefi, bu kişilerin ürün maliyetini, fiyatını ve menü kararlarını kolaylaştırmaktır.
- V2, **Detaylı Fizibilite** içinde geliştirilir. **Hızlı Hesap**'ın sekiz girdisine, motoruna, varsayılanlarına ve ekranına dokunulmaz.
- Hızlı Hesap ve Detaylı Fizibilite ayrı hesap motorları olarak kalır.
- Mevcut yatırım, başa baş, kanal ekonomisi, ürün katkısı ve projeksiyon korunur. V2 adına sessizce yeniden tanımlanmaz.
- Muhasebe, ERP, stok ya da kasa uygulamasına dönüşmeyiz. Kullanıcının yerine karar veren bir sistem kurmayız.

## 2. Kullanıcı ve kurallar

Sahibin 12 Kasım 2026 kararları. Yeni ürün kararı uydurulmaz.

- **Kim.** Kafe açmayı düşünenler ve küçük yiyecek-içecek işletmesi sahipleri.
- **Önce telefon.** Her yeni ekran önce telefonda okunur, sonra masaüstüne genişler.
- **Dört işlem.** Finans bilgisi temel aritmetik düzeyindedir. Az girdi. Ekranda esnaf dili: **marj**, **katkı**, **amortisman** yazılmaz. «Bu üründen kalan» gibi herkesin anlayacağı Türkçe kullanılır.
- **Yalnızca Türkçe, yalnızca Türkiye.** `DESIGN_DIRECTION.md` V11 kilitli durur. i18n kütüphanesi, ikinci dil veya ABD ekranı bu belgeden çıkmaz.
- **Bulut faturası yok.** Cloudflare ücretsiz plan. Veritabanı, KV, D1, R2 veya ücretli dış API, sahip onayı olmadan eklenmez.
- **Sır yok.** Anahtar, token veya gizli bilgi commit edilmez ve yayınlanmaz.
- **Bu belgedeki sıra yazılabilir.** Kararlı maddeler adım adım kodlanır. Bu yol haritasında olmayan her şey önce sahibine önerilir; sessizce eklenmez.
- **V2 henüz hazır değil.** Reçete ve malzeme listesi `main`'dedir; sadeleştirme, tek fiyat yeri ve sonraki adımlar duruyor.

## 3. Nasıl çalışıyoruz

- **Küçük adım.** Bir seferde tek bir özellik yapılır, bitirilir, görülür, sonra sıradakine geçilir.
- **Sonradan düzeltmek serbest.** Bir şeyin sonradan fark edilmesi sorun değildir; küçük adımda düzeltmesi de kolaydır.
- **Kısa kararlar.** Küçük ayrıntılarda makul bir varsayılan önerilir ve açıkça yazılır. Kullanıcı beğenmezse değiştirilir.
- **Spec adım adım.** Bütün V2'nin finansal spec'i baştan yazılmaz. Her adımın kendi kısa kuralları ve testi, o adıma gelindiğinde yazılır. Mevcut motorların golden vector'ları korunur.
- **Önce mobil.** Her yeni ekran önce telefon için tasarlanır, sonra masaüstüne genişletilir.
- **Sade dil.** Finans jargonu yerine herkesin anlayacağı Türkçe etiketler kullanılır.

## 4. Kesinleşen kararlar

| Konu | Karar |
| --- | --- |
| Ürün maliyeti | Ürünün bugünkü tek tutarlık maliyet alanı kalır. Kullanıcı istediği ürün için **Reçeteden hesapla**'yı seçebilir. Reçete girilince maliyet reçeteden gelir ve elle girilen tutar devre dışı kalır. Her ürünün tek bir maliyet kaynağı olur. Bütün menüye reçete yazmak zorunlu değildir |
| Reçete ve motor | Reçete yalnızca ürünün maliyet tutarını hesaplar. Detaylı motorunun mevcut formülleri değişmez |
| Reçete ekranı | Bitti ama sadeleşecek. Kullanım miktarının etiketi birime uymalı (`g` / `ml` / `adet`); hamburger ekmeği için `1` yazılır. Reçetenin ürün satırının altında aynı tabloda alt satır gibi açılması kafa karıştırır; ayrı, sade bir düzen gerekir |
| Eski taslaklar | Bugünkü taslaklar, maliyeti elle girilmiş ürünler olarak aynen açılır |
| Malzeme fiyatı | Alış fiyatı **tek yerden** güncellenir. Kullanıcı fiyatı kendisi yazar. Dış kaynak, hal, kasap veya rakip entegrasyonu yoktur |
| Zam geldi | Ortak malzeme adımının parçasıdır. Fiyatı kullanıcı girer. Uygulama hangi ürünlerin etkilendiğini, «bu üründen kalan»ın ne kadar düştüğünü ve eski kalanı geri getiren satış fiyatını gösterir |
| Kullanım miktarı | Miktar ürünün kendi reçetesinde değişir. Bir reçetenin miktarı diğer reçeteleri etkilemez |
| Birimler | Kullanıcı malzemeyi aldığı gibi girer: kg, g, L, ml veya adet. Örneğin “5 kg, 450 TL”. Uygulama bunu gram, mililitre veya adet fiyatına çevirir. Aileler karışmaz: gram adet olmaz |
| Food cost | KDV hariç satış fiyatına göre hesaplanır. Ambalaj bu orana girmez; ayrı bir maliyet olarak sonradan eklenir |
| Kira kaç günde çıkıyor | Food cost adımında. Mevcut aylık sonucu esnaf diline çevirir: örneğin «ayın ilk 7 günü kiraya, 5 günü faturalara, 3 günü personele çalışıyorsun, kalan günler senin». Mevcut motor sayılarının sunumudur. Onaysız yeni formül yoktur |
| Ocak testi | Food cost adımında. «Ne olur» bakışı: örneğin asgari ücret +%30 veya kira yenileme +%50 → aylık kalan nasıl değişir, bunu dengelemek için fiyat mı yoksa günlük adet mi ne kadar artmalı. Mevcut Kötü / Baz / İyi senaryolarının yerine geçmez |
| Satış tahmini | Ayrı bir bölümdür. Menüdeki ürünler orada listelenir; ürün yeniden oluşturulmaz. Mevcut **tahmini günlük adet** ve çalışma günü modeli kullanılır. Gerçekleşen satış takibi yoktur |
| Menü grupları | İlk karşılaştırmada yalnızca **Yiyecek** ve **İçecek** kullanılır |
| Alt gruplar | V2'de var, isteğe bağlı ve sınırlıdır. Yiyecek: ana yemek, başlangıç/ara sıcak, tatlı, diğer. İçecek: sıcak, soğuk, diğer. İlk karşılaştırmaya alınmaz. Kategori yönetim sistemi yoktur |
| Senaryolar | Mevcut Kötü / Baz / İyi yapısı aynen kalır ve yalnızca satış adedini değiştirir. Ocak testi ayrı bir bakıştır; yeni senaryo sistemi kurulmaz |
| Detaylı ekranlar | Üçüncü mod açılmaz. Detaylı tek uzun sayfa olmaktan çıkıp şu ekranlara bölünür: Menü, Malzemeler, Satış, Giderler, Sonuç. İlk değer Menü'de gelir |
| Kayıt | Veriler şimdilik tarayıcıdaki `localStorage`'dadır. iPhone'da bir hafta ziyaret edilmeyen sitenin verisinin silinebileceği bilinerek kabul edildi. JSON dışa/içe aktarma **düşürüldü**: hedef kullanıcı dosya yönetmez. Bu, `TECH_STACK_AND_CONSTRAINTS.md` §4.2'deki JSON yedek maddesinin yerine geçer |
| Hesap ve veritabanı | Takvimde yok. Maliyet ve kişisel veri kurallarına dokunur; soru işaretidir |
| Kabul ekranı | Şimdilik ertelendi. Hukuki metin ve inceleme sonra ele alınacak |
| Diğer sektörler | Önce Restoran ve Kafe biter. Market, e-ticaret ve hizmet işletmeleri sonra tek tek ele alınır |

## 5. Geliştirme sırası

Durum sütunu, 12 Kasım 2026 itibarıyla `main` dalındaki koddur. Sıra, sahibin 0.4 kararıdır.

| # | Adım | Durum |
| --- | --- | --- |
| 1 | **Reçeteden hesapla (sadeleştir).** Yardımcı duruyor: malzeme, alış miktarı ve birimi, alış tutarı, ürüne özgü kullanım miktarı. Etiket birime uymalı (`g` / `ml` / `adet`); «Gramaj» her birimde yanıltır (hamburger ekmeği = 1 adet). Reçete, ürün satırının altındaki tablo içi alt satır gibi açılmamalıdır. | **Bitti, sadeleşecek.** PR #13. Elle maliyet alanı duruyor; reçete seçilince o tutarı doldurur. Aylık motor reçeteyi görmez. Etiket ve açılış düzeni henüz sade değil. |
| 2 | **Ortak malzeme listesi (tamamla).** Alış fiyatı tek yerden. Gramaj/kullanım ürüne özgü kalır. **Zam geldi:** kullanıcı malzemeye yeni fiyatı kendisi yazar (dış kaynak yok). Etkilenen ürünler, «bu üründen kalan»ın düşüşü ve eski kalanı geri getiren satış fiyatı gösterilir. | **Merge edildi, tamamlanacak.** PR #14. Veride fiyat tektir. Ekranda alış tutarı hem listede hem reçete satırında düzenlenir; bu adımda tek yere inecektir. |
| 3 | **Food cost ve ürün katkısı.** Ürün başına food cost oranı, birim «bu üründen kalan» ve tahmini adetle toplam. Yiyecek / İçecek karşılaştırması. Mevcut senaryoların yeni maliyetle çalışması. **Kira kaç günde çıkıyor** ve **Ocak testi** bu adımdadır. | **Başlanmadı.** (Detaylı v1'deki ürün katkısı tablosu DF-84'tür; food cost oranı değildir.) |
| 4 | **Ayrı satış tahmini bölümü.** Menüdeki ürünler için tahmini günlük adet. | **Başlanmadı.** |
| 5 | **Detaylı'yı ekranlara bölme.** Menü, Malzemeler, Satış, Giderler, Sonuç. Üçüncü mod yok. | **Başlanmadı.** (Önceden §6 açık konuydu; takvime alındı.) |
| 6 | **Otomatik fiyat tavsiyesi.** | **Başlanmadı.** (V3-05'tan V2 sırasına alındı. Formül bu adıma gelince yazılır.) |

Her adım bitip görüldükten sonra sıradakine geçilir. Sıra, kullanıcı kararıyla değişebilir.

## 6. Park / açık — takvimde yok

Bunlar geliştirmeyi durdurmaz. Yanındaki not karar değildir; ilgili adıma gelindiğinde netleşir. Takvime alınmış sayılmazlar.

| Konu | Not |
| --- | --- |
| Gider dağıtımı | Park. V2'de giderler bugünkü gibi işletmenin toplamından bir kez düşülür: ürünlerden kalanların toplamı, eksi kira, personel ve diğer giderler, eşittir aylık işletme sonucu |
| Hesap ve veritabanı | Park, **soru işareti**. Maliyet ve kişisel veri kurallarına dokunur. Cloudflare ücretli ürün veya hesap sistemi, ayrı sahip onayı ister |
| Stok takibi | Açık, belki |
| Fatura girişi | Açık, belki |
| Eksik menü | Az ürün girilip bütün giderler girilirse aylık sonuç zararda görünür. Kısa bir not: “Girdiğin ürünler işletmenin bütün satışı değilse bu sonuç gerçeği göstermez.” |
| Verim, fire, alt reçete | V3'e kalsın |
| Malzeme fiyat esası | Tek güncel fiyat, elle güncellenir. Fiyat geçmişi tutulmaz. Son alış fiyatı alış kaydı gerektirdiği için durur |
| Alış fiyatında KDV | Kullanıcıya sorulmasın. Faturada ödenen tutar, girildiği gibi maliyet sayılsın. Bugünkü Detaylı motor da maliyetleri böyle kullanıyor |
| Food cost'ta “KDV eklenecek” ifadesi | Anlamı netleşecek: KDV sonuç tablosunda ayrı bir satır olarak mı gösterilecek? |
| Paket servis fiyatı | Satış fiyatı zorunlu; paket servis fiyatı isteğe bağlı olsun. Boşsa satış fiyatıyla aynı sayılsın. Alan yalnızca paket servis payı sıfırdan büyükse görünsün |
| Birim dönüşümü sınırı | Yalnızca aynı tür birimler arasında dönüşüm: kilodan grama, litreden mililitreye, adetten adede. Gramdan adede geçiş olmasın |
| “Fiyatı artırırsam ne olur?” | Son hesaplanan sonuç, yeni sonucun yanında küçük bir “önceki” satırı olarak dursun. Senaryo sistemi değildir. Ocak testi ve Zam geldi bunun yerine geçmez |
| Sonuç notu | Her sonuç alanında kısa bir not: “Bu hesap yaklaşıktır; kendi rakamlarınla kontrol et.” Kabul ekranının yerine mi geçeceği, yoksa ara çözüm mü olacağı açık |
| Menü karşılaştırmasının sunumu | Sıralama ve “beklentiye göre” satırı için ayrı hedef girişi gerekip gerekmediği açık |
| Hazırlık süresi | Açıktır. Gelişmiş gider dağıtımı ile karıştırılmaz; dağıtım park |

## 7. Düşürülenler

Sahip kararı. Geri alınmadıkça yazılmaz.

| Kimlik | Ne düştü | Not |
| --- | --- | --- |
| V3-03 | POS, Yemeksepeti ve benzeri platform entegrasyonu | Otomatik satış çekme yok |
| — | JSON dışa / içe aktarma yedeği | Hedef kullanıcı dosya yönetmez. `TECH_STACK_AND_CONSTRAINTS.md` §4.2'deki JSON yedek maddesinin yerine bu geçer. `localStorage` taslağı durur |

Onaylanmayanlar durur: Star/Dog etiketleri, %70 gibi eşikler, otomatik “menüden çıkar” önerisi, alım partileri, FIFO ve stok değerleme.

## 8. V3'te duranlar (takvim yok)

Ayrıntıları, sırası ve sağlayıcıları açıktır. V3 de genel muhasebe, ERP veya kasa ürünü kurma izni değildir.

| Kimlik | Durum |
| --- | --- |
| V3-01 Stok takibi | Açık, belki — §6 |
| V3-02 Fatura girişi | Açık, belki — §6 |
| V3-04 Hazırlık süresi | Açık. Gelişmiş gider dağıtımı park |
| V3-05 Otomatik fiyat tavsiyesi | **V2 adım 6'ya alındı** |

## 9. Mevcut belgelerle ilişki

- `DETAILED_FEASIBILITY_DECISIONS.md` Detaylı v1'in karar kaydı olarak kalır. Reçete (X1) ve kategori (X21) v1 dışlamalarıdır; bu belge onları yalnızca V2 için genişletir.
- `TECH_STACK_AND_CONSTRAINTS.md` bugün veritabanı ve hesap olmadığını söyler. Bu doğrudur. JSON export/import §4.2'de hâlâ yazılıdır; **bu belgenin 0.4 düşürmesi geçerlidir.** Hesap/veritabanı park ve soru işaretidir; o spec maddesi hesap adımı onaylanınca güncellenir.
- **Dokümantasyon uyumu:** Detaylı motor `byProduct` ürün katkısını üretiyor (DF-84). `DETAILED_FINANCIAL_SPEC.md` v1.4 §16.3 bu alanı kaydetti. Appendix A.5 ile frontend spec arasındaki «malzeme ekranı» cümlesi v1.5'te, formül değiştirilmeden, mevcut UI bloğuna bağlandı.
- Bu belge ürün yönüdür. Yeni formüller, varsayılanlar, veri şeması ve ekranlar ilgili adımda ayrıca onaylanır. Bu sırada olmayan özellik önce sahibine önerilir.
