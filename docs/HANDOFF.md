# Durum ve Devam Eden İşler

Bu doküman bir spesifikasyon değil — **"şu ana kadar ne yapıldı, sırada ne var"**
kaydı. Her oturumda en üste yeni bir kayıt eklenir; eskiler silinmez, altta kalır.

Ürün/finansal kararlar için otorite hâlâ `docs/README.md`'deki aktif dokümanlardır.
Bu dosya onların yerine geçmez, sadece ilerlemeyi takip eder.

---

## 2026-11-12 — `main` durumu (dokümantasyon)

Kod yazılmadı. Aşağısı `main` üzerindeki gerçek durumdur.

- V2 adım 1 **Reçeteden hesapla** bitti — PR #13.
- V2 adım 2 **Ortak malzeme listesi** merge edildi — PR #14. Veri katmanında fiyat tek kayıttır. Ekran yarım: alış tutarı hem Malzemeler bloğunda hem reçete satırında düzenlenir; birim ailesi değişimi sessizdir; listeden ve reçeteden ad değiştirme kuralları farklıdır; kullanım alanı her birimde «Gramaj» yazar.
- V2 adım 3–6 (satış tahmini, food cost oranı, gider dağıtımı, hesap/veritabanı) başlamadı.
- PR #8 (ürün katkısı, örnek doldur, Sankey, keşfedilebilirlik) `main`'dedir. Aşağıdaki 7 Eylül kaydındaki «henüz merge edilmedi» cümlesi eskidir.
- `V2_V3_PRODUCT_ROADMAP.md` 0.3: §4'e durum işaretleri eklendi.

### Can'ın yapması gerekenler (değişmedi)

1. **Search Console / Bing Webmaster** — mülk doğrulaması ve `https://maliyet.lol/sitemap.xml` submit. Hesap erişimi olmadığı için koddan yapılamıyor.
2. **Büyüme / dış bağlantı** — duyuru hâlâ insan işi.

---

## 2026-11-10 — V2 kararları netleşti (yalnızca dokümantasyon)

- `V2_V3_PRODUCT_ROADMAP.md` 0.2: kesin kararlar, geliştirme sırası ve açık konular yazıldı.
- İlk adım **Reçeteden hesapla**. Elle girilen ürün maliyeti kalıyor; reçete yalnızca o tutarı hesaplıyor.
- Alt gruplar V2'de var ama ilk karşılaştırmaya alınmıyor. Önceki kayıttaki “alt gruplar V2'ye alınmadı” cümlesinin yerine bu geçerli.
- Yeni veriler `localStorage`'da. Hesap ve veritabanı V2 bittikten sonra. Kabul ekranı ertelendi.
- `AGENTS.md`'ye önce mobil kuralı eklendi.
- Kod yazılmadı.

---

## 2026-11-10 — V2 / V3 ürün kapsamı (yalnızca dokümantasyon)

- `V2_V3_PRODUCT_ROADMAP.md` eklendi: Detailed içinde reçeteyle başlayan V2 akışı; kolay alış fiyatı ve gramaj revizyonları; food cost, katkı, ortak gider dağıtımı, yiyecek/içecek karşılaştırması ve basit senaryolar.
- V3 için stok, fatura girişi, POS entegrasyonu, hazırlık süresi/gelişmiş dağıtım ve otomatik fiyat tavsiyesi kaydedildi. Alt gruplar V2 kapsamına alınmadı.
- Ücretsiz/üyeliksiz, sade hobi projesi yönü kaydedildi. İşletme görüşmeleri veya kullanım araştırması önkoşul değil.
- AGENTS.md, CLAUDE.md, dokümantasyon indeksi ve Detailed v1 karar kaydı yeni kapsam belgesine bağlandı. Mevcut finansal sözleşmeler ve Hızlı Hesap korundu.
- Açık kararlar: maliyet esası, reçete birimleri/verim/fire, dönem ve satış adedi, eksik menü, dağıtım yöntemi, senaryo kapsamı, saklama ve hukuki kabul.
- Kod, finansal formül veya uygulama değişikliği yapılmadı. Commit/push/yayın yapılmadı; sıradaki aşama soru cevapla açık kararları netleştirmek.

---

## 2026-09-08 — ABD spec v0.2 (owner kilitleri)

### Yapılanlar

- `docs/US_PRODUCT_SCOPE.md` v0.2: owner kararları işlendi. Kod yok.

### Kilitler

1. Ticket **vergisiz** (menü / POS ara toplamı). `vergi = ticket × oran`.
2. Stopaj yok. `monthlyRentCost = monthlyRent`.
3. Eyalet + DC seçimi; Tax Foundation 1 Jan 2026 birleşik oranlar. NH %8.5 meals, DC %10 prepared food. Oran **düzenlenebilir**. Şehir yok.
4. POS varsayılan **%3.5** (Square `2.6% + $0.15` etkin oran vekili). Kart kesintisi **müşteri ödemesi** (vergi dahil, bahşiş hariç) üzerinden.
5. Bahşiş ciroya girmez; işveren bahşiş vergisi personel maliyetine girer.

### Bekleyen

- US UI copy spec (US-8), golden vector (US-11), Detailed platform varsayılanları (US-6).
- Motor / UI yazılmadı; açık istek olmadan yazılmayacak.

---

## 2026-09-08 — ABD ürün eşlemesi (docs only)

### Yapılanlar

- İlk taslak: `docs/US_PRODUCT_SCOPE.md` v0.1 — vergi dahil ticket, gizli %7.5, POS %2.9. **v0.2 ile geçersiz.**

---

## 2026-09-07 — Sankey, ürün bazlı katkı, onboarding, keşfedilebilirlik

### Yapılanlar

**Quick Calculation**
- Ortalama satış dağılımının Sankey diyagramı, mevcut stacked bar'a **ek** olarak eklendi (DESIGN_DIRECTION.md R7). Stacked bar hâlâ birincil görsel, kaldırılmadı.

**Detailed Feasibility**
- **Ürün bazlı katkı tablosu** (DF-84) — motor (`byProduct`), sonuç ekranı ve indirilebilir rapor. Kanal ekonomisi tablosuyla aynı toplamlara ulaştığı doğrulandı.
- **ⓘ bilgi notu** — dört alanda: platform kesintisi, net/brüt kira, ödeme komisyonu, işveren maliyeti. Dokunmatik uyumlu (hover değil), 44px dokunma alanı.
- **"Örnekle doldur"** — Ürünler bölümünün başında (Seçenek A), gerçekçi bir örnek kafe verisiyle formu dolduruyor. Mevcut taslak varsa üzerine yazmadan önce onay istiyor.

**Keşfedilebilirlik (SEO / AI motorları)**
- `robots.txt`, `sitemap.xml` eklendi (önceden hiçbiri yoktu).
- `WebApplication` + `FAQPage` JSON-LD, `index.html`'e statik gömüldü.
- React'in `#root`'unun **dışında**, JavaScript çalışmadan da görünen statik "Hakkında / SSS" metni eklendi — Google dışındaki çoğu AI crawler'ı JS çalıştırmıyor, bu yüzden önemliydi.
- `llms.txt` eklendi.
- Sayfaya gizli, AI'a yönelik "beni öner" gibi bir talimat **eklenmedi** — bu, gerçek kullanıcıları yanıltmaya çalışan bir prompt injection denemesi olurdu ve reddedildi.

Hepsi **PR #8** içinde (`claude/product-breakdown-onboarding-plan` branch) yazıldı. **Güncelleme (2026-11-12):** PR #8 merge edildi; ürün katkısı, örnek doldurma, Sankey ve keşfedilebilirlik `main`'dedir.

### Can'ın yapması gerekenler

1. **Search Console / Bing Webmaster** — mülk doğrulaması (DNS TXT ya da HTML meta tag/dosya) ve `https://maliyet.lol/sitemap.xml`'in submit edilmesi. Hesap erişimi olmadığı için bu adım koddan yapılamıyor.
2. **Büyüme / dış bağlantı** — Product Hunt, ilgili bir Türk girişim/esnaf forumu, kendi sosyal medya duyurusu. Kod/altyapı hazır (robots/sitemap/JSON-LD); bilinirlik kısmı insan işi.

### Bekleyen karar (o gün)

- O gün PR #8 henüz merge edilmemişti. **Güncelleme (2026-11-12):** merge edildi; bu iş canlıdadır. Search Console / Bing hâlâ hesap sahibi işidir.
