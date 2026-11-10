# maliyet.lol — V2 / V3 Ürün Yönü ve Kapsam

**Tarih:** 10 Kasım 2026 · **Sürüm:** 0.2
**Durum:** Kullanıcının onayladığı ürün kararları, geliştirme sırası ve açık konular. Finansal formül sözleşmesi veya uygulama izni değildir. Her adımın ayrıntısı, o adıma gelindiğinde kısaca netleştirilir.

## 1. Ne yapıyoruz

- maliyet.lol ücretsiz bir hobi projesidir. İşletme görüşmesi, anket veya kullanım verisi geliştirme ön koşulu değildir.
- V2'nin hedefi, mevcut Türkiye kafe ve restoran sahiplerinin ürün maliyetini, fiyatını ve menü kararlarını kolaylaştırmaktır.
- V2, **Detaylı Fizibilite** içinde geliştirilir. **Hızlı Hesap**'ın sekiz girdisine, motoruna, varsayılanlarına ve ekranına dokunulmaz.
- Hızlı Hesap ve Detaylı Fizibilite ayrı hesap motorları olarak kalır.
- Mevcut yatırım, başa baş, kanal ekonomisi, ürün katkısı ve projeksiyon korunur. V2 adına sessizce yeniden tanımlanmaz.
- Muhasebe, ERP, stok ya da kasa uygulamasına dönüşmeyiz. Kullanıcının yerine karar veren bir sistem kurmayız.

## 2. Nasıl çalışıyoruz

- **Küçük adım.** Bir seferde tek bir özellik yapılır, bitirilir, görülür, sonra sıradakine geçilir.
- **Sonradan düzeltmek serbest.** Bir şeyin sonradan fark edilmesi sorun değildir; küçük adımda düzeltmesi de kolaydır.
- **Kısa kararlar.** Küçük ayrıntılarda makul bir varsayılan önerilir ve açıkça yazılır. Kullanıcı beğenmezse değiştirilir.
- **Spec adım adım.** Bütün V2'nin finansal spec'i baştan yazılmaz. Her adımın kendi kısa kuralları ve testi, o adıma gelindiğinde yazılır. Mevcut motorların golden vector'ları korunur.
- **Önce mobil.** Her yeni ekran önce telefon için tasarlanır, sonra masaüstüne genişletilir.
- **Sade dil.** Finans jargonu yerine herkesin anlayacağı Türkçe etiketler kullanılır. Örneğin “katkı” yerine “bu üründen kalan” gibi.

## 3. Kesinleşen kararlar

| Konu | Karar |
| --- | --- |
| Ürün maliyeti | Ürünün bugünkü tek tutarlık maliyet alanı kalır. Kullanıcı istediği ürün için **Reçeteden hesapla**'yı seçebilir. Reçete girilince maliyet reçeteden gelir ve elle girilen tutar devre dışı kalır. Her ürünün tek bir maliyet kaynağı olur. Bütün menüye reçete yazmak zorunlu değildir |
| Reçete ve motor | Reçete yalnızca ürünün maliyet tutarını hesaplar. Detaylı motorunun mevcut formülleri değişmez |
| Eski taslaklar | Bugünkü taslaklar, maliyeti elle girilmiş ürünler olarak aynen açılır |
| Malzeme fiyatı | Malzemenin alış fiyatı tek bir yerden güncellenir. O malzemeyi kullanan bütün reçeteler bu fiyattan etkilenir |
| Gramaj | Gramaj ürünün kendi reçetesinde değişir. Bir reçetenin gramajı diğer reçeteleri etkilemez |
| Birimler | Kullanıcı malzemeyi aldığı gibi girer: kg, g, L, ml veya adet. Örneğin “5 kg, 450 TL”. Uygulama bunu gram, mililitre veya adet fiyatına çevirir |
| Food cost | KDV hariç satış fiyatına göre hesaplanır. Ambalaj bu orana girmez; ayrı bir maliyet olarak sonradan eklenir |
| Satış tahmini | Ayrı bir bölümdür. Menüdeki ürünler orada listelenir; ürün yeniden oluşturulmaz. Mevcut **tahmini günlük adet** ve çalışma günü modeli kullanılır. Gerçekleşen satış takibi yoktur |
| Menü grupları | İlk karşılaştırmada yalnızca **Yiyecek** ve **İçecek** kullanılır |
| Alt gruplar | V2'de var, isteğe bağlı ve sınırlıdır. Yiyecek: ana yemek, başlangıç/ara sıcak, tatlı, diğer. İçecek: sıcak, soğuk, diğer. İlk karşılaştırmaya alınmaz. Kategori yönetim sistemi yoktur |
| Senaryolar | Mevcut Kötü / Baz / İyi yapısı aynen kalır ve yalnızca satış adedini değiştirir. Yeni bir karşılaştırma veya senaryo sistemi kurulmaz |
| Kayıt | Yeni veriler de şimdilik tarayıcıdaki `localStorage`'da tutulur. iPhone'da bir hafta ziyaret edilmeyen sitenin verisinin silinebileceği bilinerek kabul edildi |
| Hesap ve veritabanı | V2 özellikleri ve testleri bittikten sonra eklenir. Hesapsız deneme korunur; kalıcı kayıt için giriş yapılır; herkes yalnızca kendi verisini görür. Sağlayıcı ve yerel veriyi taşıma yöntemi o zaman seçilir |
| Kabul ekranı | Şimdilik ertelendi. Hukuki metin ve inceleme sonra ele alınacak |
| Diğer sektörler | Önce Restoran ve Kafe biter. Market, e-ticaret ve hizmet işletmeleri sonra tek tek ele alınır |

## 4. Geliştirme sırası

1. **Reçeteden hesapla.** Ürünün maliyetini reçeteden hesaplayan yardımcı: malzeme, alış miktarı ve birimi, alış tutarı, gramaj.
2. **Ortak malzeme listesi.** Fiyatın tek yerden güncellenmesi; gramajın ürüne özgü kalması.
3. **Ayrı satış tahmini bölümü.** Menüdeki ürünler için tahmini günlük adet.
4. **Food cost ve ürün katkısı.** Ürün başına food cost oranı, birim katkı ve tahmini adetle toplam katkı. Yiyecek / İçecek karşılaştırması. Mevcut senaryoların yeni maliyetle çalışması.
5. **Gider dağıtımı.** V2'de mi V3'te mi olacağı açık; bkz. §5.
6. **Hesap ve veritabanı.**

Her adım bitip görüldükten sonra sıradakine geçilir. Sıra, kullanıcı kararıyla değişebilir.

## 5. Açık konular

Bunlar geliştirmeyi durdurmaz. İlgili adıma gelindiğinde tek tek kararlaştırılır. Yanındaki öneri karar değildir.

| Konu | Öneri |
| --- | --- |
| Gider dağıtımı V2'de mi, V3'te mi? | V3'e bırakılsın. V2'de giderler bugünkü gibi işletmenin toplamından bir kez düşülsün: ürünlerden kalanların toplamı, eksi kira, personel ve diğer giderler, eşittir aylık işletme sonucu. Böylece dağıtım anahtarı ve eksik menü sorusu V2'de ortadan kalkar |
| Eksik menü | Az ürün girilip bütün giderler girilirse aylık sonuç zararda görünür. Kısa bir not: “Girdiğin ürünler işletmenin bütün satışı değilse bu sonuç gerçeği göstermez.” |
| Verim, fire, alt reçete | V3'e kalsın |
| Malzeme fiyat esası | Tek güncel fiyat, elle güncellenir. Fiyat geçmişi tutulmaz. Son alış fiyatı alış kaydı gerektirdiği için V3'e kalır |
| Alış fiyatında KDV | Kullanıcıya sorulmasın. Faturada ödenen tutar, girildiği gibi maliyet sayılsın. Bugünkü Detaylı motor da maliyetleri böyle kullanıyor |
| Food cost'ta “KDV eklenecek” ifadesi | Anlamı netleşecek: KDV sonuç tablosunda ayrı bir satır olarak mı gösterilecek? |
| Paket servis fiyatı | Satış fiyatı zorunlu; paket servis fiyatı isteğe bağlı olsun. Boşsa satış fiyatıyla aynı sayılsın. Alan yalnızca paket servis payı sıfırdan büyükse görünsün |
| Birim dönüşümü sınırı | Yalnızca aynı tür birimler arasında dönüşüm: kilodan grama, litreden mililitreye, adetten adede. Gramdan adede geçiş olmasın |
| Detaylı ekran yapısı | Üçüncü bir mod açılmasın. Detaylı tek uzun sayfa olmaktan çıkıp birkaç ekrana bölünsün: Menü, Malzemeler, Satış, Giderler, Sonuç. İlk değer Menü ekranında gelsin |
| “Fiyatı artırırsam ne olur?” | Son hesaplanan sonuç, yeni sonucun yanında küçük bir “önceki” satırı olarak dursun. Senaryo sistemi değildir |
| Sonuç notu | Her sonuç alanında kısa bir not: “Bu hesap yaklaşıktır; kendi rakamlarınla kontrol et.” Kabul ekranının yerine mi geçeceği, yoksa ara çözüm mü olacağı açık |
| Menü karşılaştırmasının sunumu | Sıralama ve “beklentiye göre” satırı için ayrı hedef girişi gerekip gerekmediği açık |

## 6. V3'e kalanlar

| Kimlik | V3 kapsamı |
| --- | --- |
| V3-01 | Stok takibi |
| V3-02 | Fatura girişi |
| V3-03 | POS entegrasyonu, Yemeksepeti gibi platformlardan otomatik satış çekme |
| V3-04 | Hazırlık süresi ve gelişmiş gider dağıtımı |
| V3-05 | Otomatik fiyat tavsiyesi |

Ayrıntıları, sırası ve sağlayıcıları açıktır. V3 de genel muhasebe, ERP veya kasa ürünü kurma izni değildir.

Onaylanmayanlar: Star/Dog etiketleri, %70 gibi eşikler, otomatik “menüden çıkar” önerisi, alım partileri, FIFO ve stok değerleme.

## 7. Mevcut belgelerle ilişki

- `DETAILED_FEASIBILITY_DECISIONS.md` Detaylı v1'in karar kaydı olarak kalır. Reçete (X1) ve kategori (X21) v1 dışlamalarıdır; bu belge onları yalnızca V2 için genişletir.
- `TECH_STACK_AND_CONSTRAINTS.md` bugün veritabanı ve hesap olmadığını söyler. Bu doğrudur. Hesap adımına gelindiğinde güncellenir.
- **Dokümantasyon uyumu:** Detaylı motor `byProduct` ürün katkısını üretiyor (DF-84). `DETAILED_FINANCIAL_SPEC.md` §16.3'teki `MonthResult` şemasında bu alan yazılı değil. Bu bir formül değişikliği değildir; spec, kodla eşitlenmelidir.
- Bu belge ürün yönüdür. Yeni formüller, varsayılanlar, veri şeması ve ekranlar ilgili adımda ayrıca onaylanır.
