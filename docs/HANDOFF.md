# Durum ve Devam Eden İşler

Bu doküman bir spesifikasyon değil — **"şu ana kadar ne yapıldı, sırada ne var"**
kaydı. Her oturumda en üste yeni bir kayıt eklenir; eskiler silinmez, altta kalır.

Ürün/finansal kararlar için otorite hâlâ `docs/README.md`'deki aktif dokümanlardır.
Bu dosya onların yerine geçmez, sadece ilerlemeyi takip eder.

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

Hepsi **PR #8** içinde (`claude/product-breakdown-onboarding-plan` branch), henüz `main`'e merge edilmedi.

### Can'ın yapması gerekenler

1. **Search Console / Bing Webmaster** — mülk doğrulaması (DNS TXT ya da HTML meta tag/dosya) ve `https://maliyet.lol/sitemap.xml`'in submit edilmesi. Hesap erişimi olmadığı için bu adım koddan yapılamıyor.
2. **Büyüme / dış bağlantı** — Product Hunt, ilgili bir Türk girişim/esnaf forumu, kendi sosyal medya duyurusu. Kod/altyapı hazır (robots/sitemap/JSON-LD); bilinirlik kısmı insan işi.

### Bekleyen karar

- **PR #8 henüz merge edilmedi.** İncelenip merge edilene kadar bu iş "canlıda" değil.
