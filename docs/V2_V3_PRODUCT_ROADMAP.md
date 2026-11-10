# maliyet.lol — V2 / V3 Ürün Yönü ve Kapsam

**Tarih:** 10 Kasım 2026 · **Sürüm:** 0.1
**Durum:** Kullanıcının onayladığı ürün yönü ve sürüm sınırları. Açık kararlar ayrıca listelenmiştir. Finansal formül sözleşmesi veya uygulama izni değildir.

## 1. Hedef ve çalışma biçimi

- İlk hedef mevcut Türkiye kafe ve restoran sahiplerinin ürün maliyeti, fiyat, ortak gider ve menü kararlarını kolaylaştırmak.
- Ürün ücretsiz, üyeliksiz, anlaşılır ve düşük veri giriş yüküyle kullanılabilir kalacak. Bir hobi projesidir; işletme görüşmeleri, anket veya kullanım verisi toplamak geliştirme önkoşulu değildir.
- V2 geliştirmeleri **Detaylı Fizibilite** kapsamında yapılacak. Hızlı Hesap'ın sekiz ana girdisine, motoruna, varsayılanlarına ve sonuç yüzeyine dokunulmayacak.
- Mevcut yatırım, başabaş, kanal ekonomisi ve projeksiyon yetenekleri korunacak; V2 adına sessizce yeniden tanımlanmayacak.
- Önce ürün kapsamı ve özellik eşlemesi, ardından finansal kararlar, UX/teknik tasarım ve açık uygulama isteğiyle geliştirme yapılacak.
- Araştırma raporu tasarım girdisidir. Rakip özellikleri, sektör oranları ve rapordaki MVP önerileri kendiliğinden onaylı gereksinim değildir.

## 2. V2 — reçeteden menü değerlendirmesine

Ürünün kullanım akışı:

**Reçete ve malzeme maliyetleri → food cost ve ürün katkısı → ortak gider dağıtımı → menü karşılaştırması → basit değişiklik karşılaştırması.**

Bu sıra bir kullanım yönüdür; zorunlu sihirbaz veya ekran sayısı kararı değildir. Katkının hesaplanması satış fiyatı ve ilgili değişken maliyetleri; toplam katkı, dağıtım ve menü değerlendirmesi satış adetlerini de gerektirir. Reçete tek başına kârlılık üretmez.

| Kimlik | V2 kapsamı | Kullanıcıya sağlanacak davranış |
| --- | --- | --- |
| V2-01 | Basit reçete maliyeti | Malzeme, kullanım miktarı/gramajı, alış miktarı/birimi ve bedelinden ürün/porsiyon maliyeti. Birim dönüşümleri ve porsiyon/verim kuralları finansal spec'te belirlenecek. |
| V2-02 | Kolay alış fiyatı güncelleme | Ay içinde birden fazla fiyat değişikliği olağan kullanım kabul edilecek. Bir malzemenin fiyatını her reçetede tekrar yazmak gerekmeyecek; onu kullanan reçeteler aynı güncel maliyet kaynağına bağlanacak. Bu bir stok veya alım hareketi sistemi değildir. |
| V2-03 | Kolay gramaj güncelleme | Kullanıcı reçete miktarını yeniden reçete kurmadan değiştirebilecek. Malzeme alış fiyatı değişikliği ile ürüne özgü gramaj değişikliği ayrı işlemler olacak; bir reçetenin gramajı değişince diğer reçetelerin miktarı değişmeyecek. |
| V2-04 | Food cost ve ürün katkısı | Kullanıcının girdiği satış fiyatından malzeme oranı, birim ve satış adediyle toplam katkı. Ürün maliyeti, ambalaj/kanal maliyetleri ve ödeme/platform kesintileri ayrı kalacak. |
| V2-05 | Ortak gider dağıtımı | Kira, personel ve diğer ortak giderlerin ürünlere paylaştırılması. Katkı ile dağıtım sonrası maliyet/sonuç ayrı gösterilecek; ortak gider ikinci kez düşülmeyecek. İlk yöntem henüz seçilmedi. |
| V2-06 | Sade menü karşılaştırması | Yiyecekler kendi aralarında, içecekler kendi aralarında karşılaştırılacak. Birim katkı, toplam katkı ve satış adedi birlikte okunabilecek. İşletmenin genel gider karşılaması ise tüm ürünlerin toplamından değerlendirilecek. |
| V2-07 | Basit değişiklik karşılaştırması | Fiyat, malzeme maliyeti, gramaj, adet veya gider değişikliğinin etkisini anlaşılır biçimde değerlendirmek. İlk karşılaştırmada hangi değişkenlerin sunulacağı açık; gelişmiş senaryo editörü kurulmayacak. Talep değişimi otomatik tahmin edilmeyecek. |
| V2-08 | Açıklama ve örnek | Sonucun ne söylediği, ne anlama geldiği ve isteğe bağlı formül/örnek/rehber olmak üzere üç açıklama seviyesi. Örnek veri, kısa Türkçe etiketler ve ihtiyaç anında açılan ayrıntılar kullanılacak. |
| V2-09 | Kullanım öncesi bilgilendirme | Hesaplayıcı kullanımından önce bilgilendirme ve açık kabul; ayrı sorumluluk sınırlandırma metni. Metin yayımlanmadan önce hukuki inceleme gerekli. Kabulün süresi ve saklanması açık karar. |

### Maliyet revizyonunun anlamı

- Örnek ihtiyaç: aynı malzeme ayın başında ve ortasında farklı fiyatlarla alınabilir; kullanıcı bedeli kolayca yenileyip etkilenen ürünlerin sonuçlarını görebilmeli.
- Son alış fiyatı, elle belirlenen güncel fiyat veya ağırlıklı ortalamadan hangisinin esas alınacağı **henüz kararlaştırılmadı**. V2'de alım partileri, FIFO veya stok değerleme varsayılmayacak.
- Güncel maliyetle eski dönemin satış adetlerini değerlendirmek ile o dönemin gerçekleşen sonucunu hesaplamak aynı şey değildir. Arayüzde dönem/maliyet esası açık olacak; geçmiş fiyat geçmişi veya gerçekleşen kâr takibi bu belgeyle taahhüt edilmez.
- Fiyat ve gramaj revizyonları mevcut hesaplamanın ilk hesaplama/sonrasında canlı güncelleme kurallarını sessizce değiştirmez. Ayrıntılı davranış UX sözleşmesinde belirlenecek.

### Menü grupları

- V2'de karşılaştırma için iki basit grup: **Yiyecek / İçecek**.
- Sıcak/soğuk içecek, ana yemek, ara sıcak gibi alt gruplar gelecekte değerlendirilecek; V2'de kategori ağacı, kategori yönetim ekranı veya kapsamlı menü mühendisliği matrisi gerekmiyor.
- Araştırmadaki Star/Dog etiketleri, %70 eşiği veya otomatik ürün çıkarma önerileri onaylanmadı.

### V2 dışında

Stok takibi, fatura girişi, POS entegrasyonu, zorunlu hazırlık süresi, gelişmiş dağıtım sistemi ve otomatik fiyat tavsiyesi V3'e aittir. V2'de satış fiyatını işletme sahibi girer. Hazırlık süresi V2 kullanımını engelleyen zorunlu bir alan olmayacak.

## 3. V3 — planlanan kapsam

Kullanıcı aşağıdakileri V3'te yapılacak ürün yönü olarak belirledi. Bunlar yalnızca araştırma fikri değildir; ancak ayrıntılı gereksinimleri, finansal sözleşmeleri ve uygulama sırası henüz onaylanmadı.

| Kimlik | V3 kapsamı | Ayrıntılandırılacak sınır |
| --- | --- | --- |
| V3-01 | Stok takibi | Giriş/çıkış, tüketim, sayım, fire ve değerlemeden hangilerinin kapsanacağı. |
| V3-02 | Fatura girişi | Manuel giriş, dosya içe aktarma, OCR veya e-fatura bağlantısının kapsamı; alış fiyatı güncellemeleriyle ilişkisi. |
| V3-03 | POS entegrasyonu | Desteklenecek sağlayıcılar, erişim izinleri, ürün eşleme ve satış/kanal aktarımı. |
| V3-04 | Hazırlık süresi ve gelişmiş gider dağıtımı | Sürenin hangi akışta zorunlu olacağı, personel ve diğer gider havuzları, dağıtım anahtarları, ölçüm/tahmin ayrımı. V2'deki basit gider dağıtımı burada geliştirilecek. |
| V3-05 | Otomatik fiyat tavsiyesi | Kullanıcının hedefi, maliyet/KDV/komisyon esası ve sınırlar. Tavsiye talebi veya kârı garanti etmeyecek; hedefler otomatik piyasa gerçeği sayılmayacak. |

Bu yön, önceki stok/takip işlerini yalnızca güçlü kullanım verisiyle değerlendirme koşulunu bu adlandırılmış V3 özellikleri için değiştirir. Kullanıcı görüşmesi veya kullanım verisi bir geçiş şartı değildir.

V3 kapsamı genel muhasebe, ERP, kasa veya tam işletme takip ürününe dönüşme izni değildir. Ücretsiz/üyeliksiz ürün ilkesi korunur. Backend, veritabanı, bulut saklama, kimlik doğrulama ve entegrasyon maliyetleri teknik olarak ayrıca kararlaştırılacak; yol haritası mevcut teknik kilitleri otomatik kaldırmaz.

## 4. Mevcut motorlarla eşleme ve karar sınırları

| Konu | Mevcut durum | Bu belgenin etkisi |
| --- | --- | --- |
| Hızlı Hesap | Sekiz ana girdi, bağımsız motor | Değişiklik yok. |
| Ürün/kanal katkısı | Detailed'da uygulanmış; DF-84 | Yeniden formül yazmak yerine mevcut sonuçların üzerine kurulacak. Finansal spec'in `byProduct` çıktı şeması eksikliği ayrıca giderilmeli. |
| Reçete | Detailed v1'de DF-02 / X1 ile kapsam dışı | V2 için ürün kapsamına alındı. v1 geriye dönük değiştirilmez; yeni finansal sözleşme gerekir. |
| Food cost | TL ürün maliyeti var; yüzde yardımcısı X28 ile v1 dışında | V2 food cost çıktısı kapsamda. KDV/maliyet esası ve formül ayrıca onaylanacak. |
| Yiyecek/içecek grubu | DF-72 / X21 v1'de gruplamayı dışlıyor | V2 karşılaştırması için iki grup onaylandı. Gelişmiş kategori yönetimi onaylanmadı. |
| Gider dağıtımı | İşletme sabit giderleri var; ürünlere dağıtılmıyor | Yeni dağıtım sözleşmesi gerekir. Katkının mevcut anlamı korunur. |
| Senaryolar | DF-37 / X14: yalnızca hacim | V2 basit değişiklik karşılaştırması yönü kapsamda; mevcut Kötü/Baz/İyi hacim senaryoları sessizce yeniden tanımlanmaz. |
| Fire, verim, alt reçeteler | DF-62 dahil mevcut sınırlamalar | Reçete isteği bunların tamamını otomatik onaylamaz; ilk reçete spec'inde açıkça sınırlandırılacak. |
| Kanal fiyatı, KDV, komisyon varsayılanları | Mevcut Detailed kararları geçerli | Araştırma önerileri bunları değiştirmez. |
| Saklama | Tek yerel Detailed taslağı mevcut | Malzeme/reçete verisinin kalıcılığı, eski taslakların taşınması ve yedekleme ayrıca tasarlanacak. |

**Yetki:** Bu belge yalnızca açıkça adlandırılmış V2/V3 ürün kapsamı için eski v1 kapsam dışı kararlarına sürüm bazlı ek getirir. Mevcut motorların uygulanmış finansal davranışı için mevcut spec'ler geçerlidir. Yeni formüller, varsayılanlar, sınırlar, veri şemaları, test vektörleri ve UX henüz tanımlanmış değildir. Ürün yönünün onayı kodlama veya yayınlama izni değildir.

## 5. Açık kararlar — soru cevap sırası

1. Reçete maliyetinde hangi fiyat esası kullanılacak? Fiyat değişince hangi kayıt güncellenecek; eski değerleri saklamak gerekecek mi?
2. İlk reçete sürümünün birimleri, porsiyon/verim ve fire kapsamı ne olacak? Alt reçete gerekli mi? Maliyeti bilinen ürün için doğrudan TL girişi korunacak mı?
3. Ürün adedi dönemsel gerçekleşen mi, günlük tahmin mi? Mevcut günlük stabilize adet modeliyle ilişki nasıl kurulacak?
4. Seçilmiş birkaç ürün mü, tüm menü mü girilecek? Eksik menüye tüm işletme giderini yüklemeyi nasıl önleyeceğiz?
5. İlk ortak gider dağıtım yöntemi ne olacak? Personel ve kira aynı anahtarla mı dağıtılacak? Sıfır satış ve sıfır katkı nasıl ele alınacak?
6. İlk basit karşılaştırma hangi değişkenleri kapsayacak; mevcut değer ile alternatif nasıl korunacak?
7. Malzeme/reçete taslağı ve eski Detailed verileri nasıl korunacak? Yerel yedekleme kapsamı ne olacak?
8. Hukuki kabul hangi kullanım alanlarını engelleyecek, ne kadar süre geçerli olacak ve metin sürümü değişince ne olacak?

Bu sorular, kapsam dışı özellikleri geri ekleme gerekçesi değildir. Tek tek kararlaştırılacak; belirsiz noktalar uygulama sırasında uydurulmayacak.

## 6. Geliştirmeye geçmeden önce hazırlanacaklar

- V2 finansal spec: reçete ve fiyat esası, birimler, food cost, katkı, dağıtım, karşılaştırma ve edge durumları.
- Veri sözleşmesi: malzeme kimliği, reçete referansları, veri saklama/taşıma ve modül sahipliği.
- UX sözleşmesi: düşük veri yükü, fiyat/gramaj düzenleme, iki menü grubu, sonuç açıklamaları ve mobil kullanım.
- Doğrulama örnekleri: bir malzemenin birden çok reçeteyi etkilemesi; ürüne özgü gramaj; iki fiyat revizyonu; dağıtım toplamlarının uzlaşması; eksik menü ve sıfır satış. Mevcut motorların golden vector'ları korunacak.

Modülerlik için `AGENTS.md` V2 kuralları geçerlidir: ortak hesaplar ancak finansal anlamı aynı ve gerçek tüketicileri varsa paylaşılır; Quick–Detailed iş mantığı ayrımı korunur. Sonraki sektörler için peşinen genel bir motor kurulmaz.
