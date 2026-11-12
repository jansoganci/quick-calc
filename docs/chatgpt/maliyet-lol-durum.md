# maliyet.lol — bugün ne bitti, ne bitmedi

**Tarih:** 12 Kasım 2026  
**Dal:** `main` üzerindeki kod. Bu dosya bir finansal spec değildir. Formül, varsayılan ve kilitli sayı için spec geçerlidir. “Bu bugün çalışıyor mu?” sorusu için bu dosya geçerlidir.

Ürün adı **maliyet.lol**. Görünen kısa ad Maliyet. İki mod vardır: **Hızlı Hesap** ve **Detaylı Fizibilite**. İkisi ayrı motor, ayrı formül. Biri diğerinin içine katılmış değildir.

## Bu dosyayı nasıl oku

| Soru | Bakılacak yer |
| --- | --- |
| Bugün ekranda var mı? | Bu dosya |
| Formül, girdi, varsayılan ne? | `docs/quick-calculation-scope-v1.md` ve `docs/DETAILED_FINANCIAL_SPEC.md` |
| Bilerek v1 dışında mı? | `docs/DETAILED_FEASIBILITY_DECISIONS.md` §6 ve bu dosyanın “bilerek yok” bölümü |
| Sıradaki ürün yönü ne? | `docs/chatgpt/maliyet-lol-proje-talimati.md` içindeki strateji |

Üç durum vardır. Bunları karıştırma:

1. **Bitti** — kod `main` dalında var.
2. **Bilerek yok** — v1 kararıyla dışarıda. Eksik iş değildir. “Bunu da ekleyelim” demeden önce ayrı ürün kararı gerekir.
3. **Henüz başlanmadı** — 2026 sonbaharındaki sektör stratejisi. Konuşuldu, kodu yok.

## Bitti — Hızlı Hesap

Kod: `src/core/quick/` ve `src/features/quick-calc/`.

Kullanıcı sekiz alanı doldurur: aylık kira, çalışan sayısı, çalışan başı aylık maliyet, diğer aylık gider, başlangıç yatırımı, KDV dahil ortalama satış tutarı, günlük satış adedi, satış başı değişken maliyet.

Ekranda gördüğü cevaplar:

- Satış başı tahmini toplam maliyet ve dağılımı
- Aylık işletme kazancı
- Brüt kâr marjı ve faaliyet kâr marjı
- Yaklaşık yatırım geri ödemesi
- Günlük satış adedini −50 / −25 / şu an / +25 / +50 oynatan tablo
- Aynı dağılımın ek Sankey çizimi. Çubuk duruyor; Sankey onun yerine geçmedi
- Özeti kopyala

Türkiye, TRY. Başabaş bu ekranda gösterilmez. Taslak kaydı yoktur; sayfa yenilenince Hızlı Hesap formu boşalır. Reçete, fire, kanal ve fiyat senaryosu yoktur.

## Bitti — Detaylı Fizibilite v1

Kod: `src/core/detailed/` ve `src/features/detailed/`. Ekran spec’i `docs/DETAILED_FRONTEND_IMPLEMENTATION_SPEC.md`. İlk satırı: tasarlandı ve implement edildi.

Uçtan uca süreç duruyor:

| Parça | Ne işe yarar |
| --- | --- |
| On bölümlük form | Ürün, kanal, ödeme, paket servis, personel, işletme sahibi, kira ve aidat, diğer gider, ilk yatırım, varsayımlar |
| Paket servis bölümü | Kanal payı sıfırken gizlenir. Eksik ekran değildir |
| Sonuç | Aylık işletme sonucu, para dağılımı, senaryolar, projeksiyon, geri dönüş, kanal ekonomisi, ürün katkısı, başa baş, varsayımlar |
| Çizim | Dağılım çubuğu, ek Sankey, projeksiyon ve geri dönüş grafikleri |
| Taslak | Yalnızca bu tarayıcının `localStorage` kaydı. Sunucuda hesap yok |
| Rapor | Yazdırılabilir çıktı: kapak, sonuç, girdi eki |
| İlk kullanım | Örnek kafe verisi ve dört alanda ⓘ notu |

Senaryo satış adedini ölçekler. Fiyatı, birim maliyeti ve gideri tek tek oynatmaz. Başa baş birim/gün ve birim/aydır. Ürün katkısı, kanal tablosuyla aynı toplama varır. Ürün başı kanal karması yoktur.

İki mod aynı sayfada, üstteki satırdan değişir. Hızlı Hesap sonucunun altında Detaylı Fizibilite’ye geçiş vardır. `#detailed-feasibility` yüklemede Detaylı’yı açar; diğer hash’ler Hızlı Hesap’ı açar. Form durumu URL’de kodlanmaz.

## Bitti — V2 reçete ve ortak malzeme (Detaylı içinde)

Kod: `src/core/detailed/recipeCost.ts`, `src/features/detailed/recipeForm.ts`, `src/features/detailed/components/RecipePanel.tsx`, `src/features/detailed/components/IngredientList.tsx`. Karar: `docs/V2_V3_PRODUCT_ROADMAP.md` §4. Formül: `docs/DETAILED_FINANCIAL_SPEC.md` Appendix A.

| Parça | Durum |
| --- | --- |
| Reçeteden hesapla (adım 1) | **Bitti** — PR #13. Ürünün elle maliyet alanı durur. «Reçeteden hesapla» seçilince maliyet reçeteden gelir; aylık motor hâlâ tek `unitProductCost` görür |
| Ortak malzeme listesi (adım 2) | **Merge edildi, ekran yarım** — PR #14. Adı yazılmış malzemeler, Ürünler bölümünün üstünde durur. Alış fiyatı veri olarak tektir. Alış tutarı hem bu listede hem reçete satırında düzenlenir. Listeden ad değiştirmek bütün ürünleri etkiler; reçete satırından ortak adı değiştirmek yeni malzeme ayırır. `kg` → `g` miktarı çevirmez. Kullanım alanı her birimde «Gramaj» yazar |
| Eski taslaklar | Reçetesiz taslak, maliyeti elle girilmiş ürün olarak açılır. Taslak sürümü 1’dir |

Hızlı Hesap’a reçete eklenmedi.

## Bitti — ortak kabuk

- Ürün adı Maliyet, alan adı maliyet.lol, canlı slogan “Bir satıştan geriye ne kalıyor?”
- Üyelik, veritabanı ve sunucu hesabı yok. Hesap tarayıcıda yapılır
- `robots.txt`, `sitemap.xml`, `llms.txt` ve JavaScript’siz görünen Hakkında / SSS metni var
- Search Console ve Bing mülk doğrulaması kod işi değildir. Hesap sahibi tarafında duruyor

## Bilerek yok — eksik iş sayma

Bunlar yarım kalmış geliştirme değildir. Spec onları v1 dışına koymuştur.

Hızlı Hesap’ta yok: reçete, fire, kanal, teslimat komisyonu, kullanıcıya görünen başabaş, fiyat senaryosu, çoklu para birimi, hesap kaydı.

Detaylı Fizibilite v1’de yok (V2 reçetesi ayrı; yukarıdaki «Bitti — V2» bölümüne bak):

- Food cost oranı. Ürünün motora giden maliyeti hâlâ tek tutardır; reçete yalnızca o tutarı doldurabilir
- Fire, stok devir hızı, kategori yönetimi
- Koltuk, masa devri, saatlik kapasite
- Sezonluk katsayı, AVM ciro kirası
- Kredi, faiz, açılış için gereken nakit, tedarikçi vadesi
- Gelir vergisi, kurumlar vergisi, şahıs / limited seçimi, tam KDV beyannamesi
- Brüt maaştan işveren maliyetine bordro motoru
- Muhasebe amortismanı. İlk yatırım bir tutardır
- Reklam, Joker, ilan reklamı kârlılığı
- Fiyatı veya gideri ayrı ayrı değiştiren senaryo
- Ay ay elle satış tablosu. Artış temposu hazır seçeneklerdedir: yavaş, normal, hızlı
- Sepet büyüklüğü, müşteri adediyle başa baş
- Platform ile kendi kanalı arasında paket hacmi bölmek
- Ürün başı ayrı kanal karışımı
- E-ticaret kargo, iade ve pazaryeri modeli
- Market raf fiyatı, hizmet işletmesi saat ücreti
- Kasa, POS, çok şube, ERP

ABD varyantı yalnızca `docs/US_PRODUCT_SCOPE.md` v0.2 içindedir. Motoru ve ekranı yoktur. Bu projenin konusu Türkiye’dir.

## Henüz başlanmadı — sektör stratejisi

Aşağısı yön kararıdır. 12 Kasım 2026 itibarıyla bu listedekilerin kodu yoktur. Hızlı Hesap veya Detaylı Fizibilite’nin içine sessizce eklenmiş sayma. Detaylı içindeki isteğe bağlı reçete yardımcısı bu listenin «ayrı reçete maliyeti aracı» maddesi değildir; o V2 adım 1’dir ve yukarıda bitti.

- Sektör seçimli ana sayfa: Restoran ve Kafe, Market ve Perakende, E-Ticaret, Hizmet İşletmeleri
- Restoran için ayrı food cost oranı, menü fiyatı ve günlük başabaş aracı (Detaylı’daki reçete yardımcısı bunun yerine geçmez)
- E-ticaret komisyon + kargo + iade hesabı
- Market raf fiyatı, indirim sonrası kâr, fire, stok devri
- Hizmette saatlik maliyet ve kapasite başabaşı
- Fiyat, maliyet ve gideri birlikte değiştiren simülatör
- Ortak gideri ürünlere, süreye veya seçilen anahtara dağıtmak
- Hesaplayıcının içindeki üç seviyeli eğitim
- Kasa takibi ve POS. Bu, kullanım verisi olmadan başlanmayacak iştir

İlk konuşulacak sektör Restoran ve Kafe’dir. İş, kod yazmak değil: bu listedekilerin hangisi bugünkü iki motorda duruyor, hangisi yeni hesap.

## Eski cümleler — bunlara uyma

Şu satırlar plan döneminden kalmadır. “Ekran yok” veya “henüz yazılmadı” diye okunmaz.

| Yer | Eski cümle | Bugün |
| --- | --- | --- |
| `AGENTS.md` | Detaylı ekran implement edilmedi | Ekran `src/features/detailed/` içindedir |
| `DETAILED_FEASIBILITY_DECISIONS.md` §8 | Bu dosyadan motor ve ekran yazma | Karar kaydıdır. Motor ve ekran sonradan yazıldı |
| `TECH_STACK_AND_CONSTRAINTS.md` başlığı | Planning, not implementation | Yığın kararı duruyor. Uygulama da duruyor |
| `docs/HANDOFF.md` 7 Eylül 2026 | PR #8 merge edilmedi | Ürün katkısı, örnek doldurma ve Sankey `main` dalındadır. 12 Kasım kaydı bunu düzeltir |
| Bu dosyanın 9 Kasım 2026 hali | Detaylı’da reçete yok | Reçete PR #13, ortak malzeme listesi PR #14 ile `main`’dedir |

Formül çelişkisinde spec kazanır. “Ekran var mı?” çelişkisinde bu dosya kazanır.
