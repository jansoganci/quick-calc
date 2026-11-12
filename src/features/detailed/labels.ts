/**
 * Every Turkish string the Detailed screen renders, and the order the UI shows the
 * engine's enumerations in. One home per label (U4).
 *
 * Terminology follows DETAILED_FINANCIAL_SPEC.md §3: the monthly figure is a
 * *sonuç*, never a *kâr*, because it is routinely negative and the engine calls it
 * `monthlyOperatingResult`. `amortisman` / `net kâr` appear nowhere.
 *
 * The `*_ORDER` arrays are display order, which is a UI decision, and they are
 * declared here rather than imported because the engine's public surface is
 * deliberately narrow — `core/detailed/contract.test.ts` locks it to six runtime
 * exports. `satisfies` keeps every entry checked against the engine's own union, so
 * a change to an enumeration fails the build here rather than drifting silently.
 */

import type {
  Channel,
  DeliveryMode,
  PaymentMethod,
  ProjectionHorizonMonths,
  RampUpPreset,
  RentInputBasis,
  ScenarioKey,
} from '../../core/detailed/index.ts'

export const CHANNEL_ORDER = ['salon', 'takeaway', 'delivery'] as const satisfies readonly Channel[]
export const PAYMENT_ORDER = ['cash', 'card', 'mealCard'] as const satisfies readonly PaymentMethod[]
export const SCENARIO_ORDER = ['bad', 'base', 'good'] as const satisfies readonly ScenarioKey[]
export const DELIVERY_MODE_ORDER = [
  'platformOnly',
  'platformCourier',
] as const satisfies readonly DeliveryMode[]
export const HORIZON_ORDER = [12, 24, 36] as const satisfies readonly ProjectionHorizonMonths[]
export const RAMP_UP_ORDER = ['slow', 'normal', 'fast'] as const satisfies readonly RampUpPreset[]
export const RENT_BASIS_ORDER = ['net', 'gross'] as const satisfies readonly RentInputBasis[]

export const SECTION_IDS = [
  'products',
  'channels',
  'payments',
  'delivery',
  'positions',
  'owner',
  'occupancy',
  'opex',
  'capex',
  'assumptions',
] as const

export type SectionId = (typeof SECTION_IDS)[number]

export const SECTION_LABELS: Record<SectionId, string> = {
  products: 'Ürünler ve satış',
  channels: 'Satış kanalları',
  payments: 'Ödeme yöntemleri',
  delivery: 'Paket servis',
  positions: 'Personel',
  owner: 'İşletme sahibi',
  occupancy: 'Kira ve aidat',
  opex: 'Diğer giderler',
  capex: 'İlk yatırım',
  assumptions: 'Varsayımlar',
}

export const SECTION_NOTES: Partial<Record<SectionId, string>> = {
  products:
    'Sattığın ürünleri ve her birinden günde ortalama kaç adet sattığını gir. Fiyatlar KDV dahil.',
  channels:
    'Satışların kanallara dağılımı ve sipariş başına ambalaj maliyeti. Dağılım tüm ürünler için ortaktır.',
  payments:
    'Yalnızca salon ve al götür satışları için. Paket serviste platform kesintisi geçerlidir.',
  delivery: 'Bu bölüm yalnızca paket servis payı %0’dan büyük olduğu için görünüyor.',
  positions:
    'Pozisyon bazlı. Kişi başı tutarlar işverene aylık maliyettir — brüt maaş değil.',
  owner:
    'İşletmeden kendine aylık ayırdığın tutar ve Bağ-Kur ödemen. İkisi de aylık işletme gideri sayılır; gelir vergisi hesaplanmaz.',
  opex:
    'Hepsi aylık ortalama tutardır. Yılda bir ödenen bir gideri 12’ye bölüp aylık karşılığını gir.',
  capex: 'Açılmadan önce bir kez harcayacağın tutarlar. Açılış stoğunu unutma.',
  assumptions: 'Hesaplamanın çerçevesi. Varsayılan değerlerle bırakabilirsin.',
}

/** The one engine figure a section header may echo, after the first calculation. */
export const SECTION_ECHO_LABELS: Partial<Record<SectionId, string>> = {
  products: 'Aylık brüt ciro',
  positions: 'Aylık personel gideri',
  owner: 'Aylık sahip gideri',
  occupancy: 'Aylık yer gideri',
  opex: 'Aylık diğer gider',
  capex: 'Toplam ilk yatırım',
}

export const PRODUCT_LABELS = {
  name: 'Ürün',
  normalPrice: 'Normal fiyat',
  onlinePrice: 'Online fiyat',
  dailyQuantity: 'Günlük adet',
  unitProductCost: 'Birim maliyet',
} as const

export const POSITION_LABELS = {
  name: 'Pozisyon',
  headcount: 'Kişi sayısı',
  employerCostPerPerson: 'İşveren maliyeti',
  mealCostPerPerson: 'Yemek',
  transportCostPerPerson: 'Yol',
  averageBonusPerPerson: 'Prim',
} as const

export const CHANNEL_LABELS = {
  salon: 'Salon',
  takeaway: 'Al götür',
  delivery: 'Paket servis',
} as const

export const PAYMENT_LABELS = {
  cash: 'Nakit',
  card: 'Kart',
  mealCard: 'Yemek kartı',
} as const

export const DELIVERY_MODE_LABELS = {
  platformOnly: 'Kendi kuryem',
  platformCourier: 'Platformun kuryesi',
} as const

export const RENT_BASIS_LABELS = {
  net: 'Net kira',
  gross: 'Brüt kira',
} as const

export const RAMP_UP_LABELS = {
  slow: 'Yavaş',
  normal: 'Normal',
  fast: 'Hızlı',
} as const

export const SCENARIO_LABELS = {
  bad: 'Kötü',
  base: 'Baz',
  good: 'İyi',
} as const

/**
 * DF-18/19/20 starter operating expenses. Security is one line; there is no
 * separate water-treatment line. Clicking one appends a row with an empty amount.
 */
export const OPEX_STARTERS = [
  'Elektrik',
  'Su',
  'Doğalgaz',
  'İnternet',
  'Güvenlik',
  'Yazılım abonelikleri',
  'Mali müşavir',
  'Temizlik',
  'Bakım / onarım',
  'Sigorta',
  'Sarf malzeme',
  'İlaçlama',
] as const

/** DF-32 / DF-33 starter investment items. Opening stock is explicitly included. */
export const CAPEX_STARTERS = [
  'Tadilat / dekorasyon',
  'Ekipman',
  'Mobilya',
  'Tabela',
  'Açılış stoğu',
  'Kuruluş / açılış giderleri',
] as const

export const BREAKDOWN_LABELS = {
  vat: 'KDV',
  productCogs: 'Ürün maliyeti',
  channelVariableCost: 'Kanal maliyetleri — ambalaj ve kurye',
  paymentPlatformFee: 'Ödeme ve platform kesintileri',
  payroll: 'Personel',
  owner: 'İşletme sahibi ve Bağ-Kur',
  occupancy: 'Kira ve aidat',
  opex: 'Diğer giderler',
  operatingResult: 'Aylık işletme sonucu',
} as const

export type BreakdownKey = keyof typeof BREAKDOWN_LABELS

export const COPY = {
  preparation: 'Hazırlık',
  baseScenario: 'Baz senaryo',
  detailedResults: 'Detaylı sonuçlar',
  calculate: 'Hesapla',
  calculateNoProducts: 'Sonucu görmek için en az bir ürün gir',
  calculateLive: 'Hesapladıktan sonra değişiklikler anında yansır',
  calculateInvalid: (count: number, sections: string) =>
    `${count} alanı kontrol et — ${sections}`,
  copySummary: 'Özeti kopyala',
  copied: 'Kopyalandı',

  draftSaved: 'Taslak bu cihaza kaydedildi',
  draftScope:
    'Yalnızca bu tarayıcıda saklanır; iPhone’da uzun süre girilmezse silinebilir.',
  draftReset: 'Baştan başla',
  draftResetConfirm: 'Girdiklerin tamamı silinecek.',
  draftResetYes: 'Evet, sil',
  draftResetCancel: 'Vazgeç',
  loadSample: 'Nereden başlayacağını bilmiyor musun? Örnek bir kafeyle doldur →',
  loadSampleConfirm: 'Girdiklerin tamamı örnek verilerle değiştirilecek.',
  loadSampleYes: 'Evet, doldur',
  loadSampleCancel: 'Vazgeç',
  allResults: 'Tüm sonuçlar ↓',
  backToInputs: 'Girdilere dön ↑',
  results: 'Sonuçlar ↓',

  emptyResult:
    'Hesapla’dan önce hiçbir sayı gösterilmez. En az bir ürün girip Hesapla’ya bastığında aylık işletme sonucu, başa baş noktası ve yatırımın geri dönüşü burada görünür.',
  optionalSectionsNote:
    'Boş bıraktığın bölümler 0 TL sayılır. Yalnızca ürünler zorunlu.',

  addProduct: '+ Ürün ekle',
  addPosition: '+ Pozisyon ekle',
  addOpex: '+ Diğer gider ekle',
  addCapex: '+ Yatırım kalemi ekle',
  remove: 'Kaldır',
  starterOpex: 'Sık kullanılan giderler',
  starterCapex: 'Sık kullanılan kalemler',
  productName: 'Ürün adı',
  positionName: 'Pozisyon adı',
  employerCostInfo:
    'İşverene aylık toplam maliyettir — çalışanın eline geçen net maaş değil. SGK işveren payı gibi kalemleri de içerir.',
  lineName: 'Gider adı',
  monthlyAmount: 'Aylık tutar',
  capexName: 'Kalem adı',
  capexAmount: 'Tutar',

  total: 'Toplam',
  mixShare: 'Pay',
  packagingPerOrder: 'Ambalaj / sipariş',
  commission: 'Komisyon',
  commissionInfo:
    'Bankanın veya yemek kartı şirketinin her işlemden aldığı yüzdedir. Paket serviste ayrıca uygulanan platform kesintisinden farklıdır — ikisi asla üst üste hesaplanmaz.',
  channelColumn: 'Kanal',
  paymentColumn: 'Yöntem',

  deliveryModeQuestion: 'Siparişi kim taşıyor?',
  deliveryModeHint:
    'Seçim, platform kesinti oranının başlangıç değerini belirler: kendi kuryen %15, platformun kuryesi %38.',
  platformFeeRate: 'Platform kesintisi',
  platformFeeHint: 'KDV dahil toplam kesinti oranı',
  platformFeeInfo:
    'Kendi kuryenle teslim ediyorsan bu, platformun sipariş başına aldığı komisyondur. Platformun kendi kuryesini seçtiysen aynı oran teslimatı da kapsar ve daha yüksektir.',
  ownCourierCost: 'Sipariş başına kurye maliyeti',
  ownCourierHint: 'Yalnızca kendi kuryenle çalışırken geçerli',
  ownCourierDisabledHint: 'Platformun kuryesinde bu tutar hesaba katılmaz.',

  ownerMonthlyAmount: 'Kendine ayırdığın aylık tutar',
  ownerBagKur: 'Aylık Bağ-Kur',
  monthlyRent: 'Aylık kira',
  monthlyRentInfo:
    '"Brüt kira" girdiğin tutarın tamamı işletme çıkışıdır; stopaj bu tutardan kesilip devlete ödenir. "Net kira" ise ev sahibinin eline geçecek tutardır — gerçek nakit çıkışı bundan daha yüksek hesaplanır.',
  monthlyAidat: 'Aylık aidat',
  rentBasisGroup: 'Girilen kira tutarı',
  aidatOnceHint: 'Aidatı yalnızca burada gir — “Diğer giderler”de tekrar ekleme.',

  vatRate: 'KDV oranı',
  operatingDays: 'Ayda çalışılan gün',
  projectionHorizon: 'Projeksiyon süresi',
  rampUp: 'Açılış hızı',
  scenarioVolumes: 'Senaryolarda satış hacmi',
  scenarioVolumesHint:
    'Tek değişken satış adedidir. Fiyatlar, maliyetler ve sabit giderler senaryolar arasında değişmez.',
  advancedAssumptions: 'Gelişmiş varsayımlar — yıllık artışlar',
  advancedAssumptionsNote:
    'Satış fiyatı, ürün maliyeti ve sabit gider yıllık artışları. Varsayılan %0 — girdiğin tutarlar projeksiyon boyunca aynı kalır. Sonuç ekranında her zaman görünür.',
  salesPriceAnnualIncrease: 'Satış fiyatı yıllık artışı',
  productCogsAnnualIncrease: 'Ürün maliyeti yıllık artışı',
  fixedCostAnnualIncrease: 'Sabit gider yıllık artışı',

  monthlyOperatingResult: 'Aylık işletme sonucu',
  breakEven: 'Başa baş noktası',
  payback: 'Yatırımın geri dönüşü',
  initialInvestment: 'İlk yatırım',
  scenariosMonthlyResult: 'Senaryolar · aylık sonuç',
  scenarioDeltaNote: 'Satış hacmi −%25 / +%25 gibi girilen farklara göre. Tutarlar TL.',

  moneyFlowTitle: 'Aylık işletme sonucu nasıl oluşuyor',
  moneyFlowTitleShort: 'Para nereye gidiyor',
  moneyFlowNote:
    'Müşterinin ödediği toplam tutarın nereye gittiği. Çubuk tam olarak brüt ciroya denk gelir.',
  grossCustomerSales: 'Aylık brüt ciro',
  remainingLabel: 'Kalan',

  scenariosTitle: 'Senaryolar',
  scenariosNote:
    'Tek değişken satış hacmidir. Fiyatlar, maliyetler, personel, kira ve giderler her senaryoda aynıdır.',
  scenariosInvariantNote:
    'Başa baş noktası ve ilk yatırım senaryolara göre değişmez; ürün ve kanal dağılımı sabit olduğu için üç senaryoda da aynıdır.',
  netRevenue: 'Aylık net ciro',
  contribution: 'Aylık katkı',

  projectionNote:
    'İlk aylarda satış hacmi henüz oturmadığı için sonuç düşüktür.',
  showMonthTable: 'Ay ay tabloyu göster',
  hideMonthTable: 'Ay ay tabloyu gizle',
  monthColumn: 'Ay',
  unitsColumn: 'Adet',
  fixedCostColumn: 'Sabit gider',

  paybackNote:
    'Aylık sonuçların toplamı ilk yatırımı geçtiğinde yatırım geri dönmüş sayılır. Finansman gideri hesaba katılmaz.',

  channelTitle: 'Kanal ekonomisi',
  channelNote:
    'Katkı, o kanalın kendi maliyetlerinden sonra işletmeye kalan tutardır. Sabit giderler kanallara dağıtılmaz.',
  productTitle: 'Ürün bazlı katkı',
  productNote:
    'Aynı katkı hesabı, kanal yerine ürüne göre toplanmış. Kanal ekonomisiyle aynı toplamlara ulaşır.',
  salonMenuTitle: 'Menü ürünleri',
  salonMenuNote:
    'Salon fiyatı ve malzemesi. Malzeme payı, KDV düşülmüş fiyata göredir. Ambalaj bu orana girmez.',
  salonSellingPrice: 'Satış fiyatı',
  salonCost: 'Malzeme',
  salonFoodCost: 'Malzeme payı',
  salonRemaining: 'Her birinden kalan',
  weakestProductNote: (name: string) => `${name} salon satışında en az kalanı bırakıyor.`,
  salonMenuCaption: 'Tutarlar TL. Salon satışı, KDV dahil fiyat.',

  fixedCostDaysTitle: 'Kira kaç günde çıkıyor',
  fixedCostDaysNote: (days: string) =>
    `Değişken giderlerden sonra kalan aylık tutar, ayda çalışılan ${days} güne bölünür. Sıra: kira, personel, diğer sabit giderler.`,
  fixedCostDaysUnavailable: 'Değişken giderlerden sonra bir şey kalmıyor; günlere çevrilemez.',
  fixedCostDaysFirst: (days: string, label: string) =>
    `Ayın ilk ${days} günü ${label} için çalışıyorsun`,
  fixedCostDaysNext: (days: string, label: string) => `Sonraki ${days} günü ${label} için`,
  fixedCostDaysRemainder: (days: string) => `Geri kalan ${days} gün senin`,
  fixedCostDaysRemainderNone: 'Geri kalan gün yok.',
  fixedCostDaysUncovered: 'Bu ay sabit giderleri karşılamıyor.',
  fixedCostDayRent: 'kira',
  fixedCostDayPayroll: 'personel',
  fixedCostDayOther: 'diğer sabit giderler',

  januaryTitle: 'Ocak testi',
  januaryNote:
    'Asgari ücret ve kira artınca aylık sonuç ve kira-gün satırları nasıl değişir. Yalnızca personel giderine ve kiraya uygulanır; aidat ve kendine ayırdığın tutar durur.',
  januaryWage: 'Asgari ücret artışı',
  januaryRent: 'Kira artışı',
  januaryInvalid: 'Sayı değil; %0 sayılıyor.',
  januaryBefore: 'Şimdi',
  januaryAfter: 'Sonra',
  januaryResult: 'Aylık işletme sonucu',
  januaryBreakEven: 'Başa baş (günde)',

  channelUnits: 'Adet',
  channelGross: 'Brüt satış',
  channelNet: 'Net ciro',
  channelCogs: 'Ürün maliyeti',
  channelVariable: 'Kanal maliyeti',
  channelFee: 'Ödeme / platform',
  channelContribution: 'Katkı',

  breakEvenTitle: 'Başa baş noktası',
  breakEvenNote:
    'Sabit giderleri karşılamak için gereken satış adedi. İlk yatırım bu hesaba dahil değildir; üç senaryoda da aynıdır.',
  breakEvenPerDay: 'Günde',
  breakEvenPerMonth: 'Ayda',
  plannedVolume: 'Planladığın satış',

  assumptionsTitle: 'Hesaplamada kullanılan varsayımlar',
  assumptionsNote:
    'Sonucu etkileyen her varsayım burada listelenir — değeri %0 olanlar dahil.',
  rentWithholdingRate: 'Kira stopaj oranı',
  deliveryModeLabel: 'Paket servis modeli',
  posCommission: 'POS komisyonu',
  mealCardCommission: 'Yemek kartı komisyonu',
  scenarioDeltas: 'Senaryo hacim farkları',
  engineVersion: 'Hesap motoru',

  warningsTitle: 'Dikkat edilecekler',
  warningCount: (count: number) => `${count} not`,
  goToSection: (label: string) => `${label} bölümüne git`,

  resultLimitation:
    'Aylık işletme sonucu basitleştirilmiş bir tahmindir; kurumlar vergisi, gelir vergisi, finansman giderleri ve kredi ödemeleri hesaba katılmamıştır. İşletme sahibine ayrılan tutar ve Bağ-Kur ise bir gider olarak yukarıda yer alır.',

  nextSection: (label: string) => `Sonraki bölüm: ${label} →`,
  productCount: (count: number) => `${count} ürün`,
  positionCount: (count: number) => `${count} pozisyon`,
  lineCount: (count: number) => `${count} kalem`,
  assumptionRowCount: (count: number) => `${count} satır`,
  dailyUnits: (units: string) => `günde ${units} adet`,
  defaultsUnchanged: 'varsayılan',
  none: '—',
} as const

/**
 * The report's own copy — the download action, the business-name dialog, the
 * cover, the appendix and the limitation statement.
 *
 * It sits beside the screen's copy rather than inside a component for the same
 * reason everything else here does (U4: one home per label), and the limitation
 * text is authored as prose a reader would accept in a feasibility document:
 * it states what the document is and is not, without disclaiming the analysis
 * itself. See docs/archive/DETAILED_REPORT_IMPLEMENTATION_PLAN.md §9.3.
 */
export const REPORT_COPY = {
  documentTitle: 'Fizibilite Raporu',

  action: 'Fizibilite raporunu indir',
  actionHintDesktop: 'Yazdırma penceresi açılır; hedef olarak “PDF olarak kaydet” seçilir.',
  actionHintMobile: 'Yazdırma ekranı açılır; oradan “PDF” veya “Dosyalar’a Kaydet” seçebilirsin.',
  printUnavailable:
    'Bu tarayıcı yazdırmayı desteklemiyor. Sayfayı Safari veya Chrome’da açıp tekrar dene.',

  dialogTitle: 'Fizibilite raporunu indir',
  dialogLede: 'Rapor bu adla başlıklandırılır ve kaydedilen dosyanın adında kullanılır.',
  businessName: 'İşletme adı',
  businessNamePlaceholder: 'Örn. Kadıköy Kahve Projesi',
  businessNameHint: 'Rapor oluşturmak için gereklidir.',
  submit: 'Raporu indir',
  cancel: 'Vazgeç',

  coverHeadline: 'Aylık işletme sonucu · baz senaryo',
  coverWarnings: 'Dikkat edilmesi gereken noktalar',

  appendixTitle: 'Ek A — Girdiler',
  appendixNote:
    'Rapordaki bütün sonuçlar aşağıdaki girdilerle hesaplanmıştır. Sıralama, hesaplama formundaki bölüm sırasını izler.',
  limitsTitle: 'Ek B — Kapsam ve sorumluluk sınırları',

  /** Cover foot. The full text is in `disclaimerFull`; this one points at it. */
  disclaimerShort:
    'Bu rapor, girilen verilere ve raporda listelenen varsayımlara dayanan bir ön fizibilite değerlendirmesidir. İçerdiği projeksiyonlar tahmindir ve gerçekleşme garantisi taşımaz; muhasebe, vergi, yatırım veya hukuk danışmanlığı yerine geçmez. Kapsamın tamamı için bkz. Ek B — Kapsam ve sorumluluk sınırları.',

  disclaimerFull: [
    'Bu belge bir ön fizibilite çalışmasıdır; denetlenmiş bir mali tablo, değerleme raporu veya bağımsız denetim raporu değildir.',
    'Bütün hesaplamalar, kullanıcının girdiği veriler ile raporun “Hesaplamada kullanılan varsayımlar” bölümünde listelenen varsayımlara dayanır. Girdiler değiştiğinde sonuçlar da değişir.',
    'Projeksiyonlar, senaryolar ve grafikler tahmindir; gerçekleşme taahhüdü içermez.',
    'Fiili ticari, vergisel, operasyonel ve finansal sonuçlar; talep, maliyet, mevzuat ve piyasa koşullarına bağlı olarak bu raporda gösterilenlerden farklılaşabilir.',
    'Bu rapor muhasebe, vergi, yatırım, hukuk veya finansal danışmanlık hizmeti değildir ve bu hizmetlerin yerine geçmez. Karar öncesinde ilgili alanların uzmanlarına danışılması önerilir.',
    'Maliyet, yalnızca bu rapora dayanılarak alınan kararların sonuçlarından sorumlu tutulamaz.',
  ],

  meta: (engineVersion: string, date: string) =>
    `Hesap motoru ${engineVersion} · Rapor tarihi ${date} · TRY · Türkiye`,
  runningHead: (businessName: string) => `Fizibilite Raporu · ${businessName}`,
} as const

/** A run of the verdict sentence. `amount` renders in Mono 500, `accent` adds the ink accent. */
export type VerdictTone = 'text' | 'amount' | 'accent'
export type VerdictSegment = { text: string; tone: VerdictTone }

/**
 * The one-sentence answer, above every figure. The operating result carries the
 * accent; a deficit stays a plain Mono figure, because V3 keeps negative values free
 * of colour treatment.
 */
export const VERDICT = {
  profitWithPayback: (result: string, investment: string, month: string): VerdictSegment[] => [
    { text: 'Baz senaryoda işletme ayda ', tone: 'text' },
    { text: result, tone: 'accent' },
    { text: ' kazanıyor; ', tone: 'text' },
    { text: investment, tone: 'amount' },
    { text: '’lik yatırım ', tone: 'text' },
    { text: month, tone: 'amount' },
    { text: '. ayda geri dönüyor.', tone: 'text' },
  ],
  profitNoInvestment: (result: string): VerdictSegment[] => [
    { text: 'Baz senaryoda işletme ayda ', tone: 'text' },
    { text: result, tone: 'accent' },
    { text: ' kazanıyor. Yatırım tutarı girilmedi.', tone: 'text' },
  ],
  profitNoPayback: (result: string, months: string): VerdictSegment[] => [
    { text: 'Baz senaryoda işletme ayda ', tone: 'text' },
    { text: result, tone: 'accent' },
    { text: ' kazanıyor; yatırım ', tone: 'text' },
    { text: months, tone: 'amount' },
    { text: ' ay içinde geri dönmüyor.', tone: 'text' },
  ],
  breakEvenResult: (): VerdictSegment[] => [
    { text: 'Baz senaryoda işletme ne kazanıyor ne kaybediyor.', tone: 'text' },
  ],
  deficit: (deficit: string): VerdictSegment[] => [
    { text: 'Baz senaryoda işletme ayda ', tone: 'text' },
    { text: deficit, tone: 'amount' },
    { text: ' açık veriyor; bu haliyle yatırım geri dönmüyor.', tone: 'text' },
  ],
  zeroVolume: (fixedCost: string): VerdictSegment[] => [
    { text: 'Satış girilmediği için işletme ayda ', tone: 'text' },
    { text: fixedCost, tone: 'amount' },
    { text: ' gider yazıyor.', tone: 'text' },
  ],
} as const

export const ERROR_COPY = {
  required: 'Bu alan gerekli.',
  not_a_number: 'Lütfen bir sayı gir.',
  below_min: (limit: string) => `En az ${limit} girilebilir.`,
  above_max: (limit: string) => `En fazla ${limit} girilebilir.`,
  invalid_value: 'Geçerli bir seçim yap.',
  empty_products: 'En az bir ürün gir.',
  channelMixShort: (missing: string) => `Kanal dağılımı %100 olmalı. ${missing} eksik.`,
  channelMixOver: (excess: string) => `Kanal dağılımı %100 olmalı. ${excess} fazla.`,
  paymentMixShort: (missing: string) => `Ödeme dağılımı %100 olmalı. ${missing} eksik.`,
  paymentMixOver: (excess: string) => `Ödeme dağılımı %100 olmalı. ${excess} fazla.`,
  deliveryModeRequired: 'Paket servis satışın olduğu için bu seçim zorunlu.',
  recipeIncomplete: 'Reçeteyi tamamla.',
} as const

export const RECIPE_COPY = {
  menuHeading: 'Menü',
  menuRowDaily: (count: string) => `günde ${count} adet`,
  menuRowCost: (amount: string, source: string) => `maliyet ${amount} TL · ${source}`,
  sourceManual: 'elle',
  sourceRecipe: 'reçeteden',
  costTypedNote: 'Tutarı sen yazdın.',
  openRecipeNew: 'İçine ne koyuyorsun?',
  openRecipeNewDesktop: 'Reçete yaz',
  costFromRecipeNote: (count: string) => `Reçeteden · ${count} malzeme`,
  openRecipe: 'Reçeteyi aç',
  listHeading: 'Malzemeler',
  ingredientCount: (count: number) => `${count} malzeme`,
  listHint:
    'Alış fiyatını yalnızca burada yazarsın. Değiştirince bu malzemeyi kullanan bütün ürünler değişir.',
  listEmpty: 'Henüz malzeme yok.',
  listEmptyHint:
    'Bir ürüne «İçine ne koyuyorsun?» ile reçete yazınca, yazdığın malzemeler buraya düşer. Faturan elindeyse fiyatları şimdiden de girebilirsin.',
  listEmptyHintDesktop:
    'Bir ürüne «Reçete yaz» ile malzeme eklediğinde buraya düşer. Faturan elindeyse fiyatları şimdiden de girebilirsin.',
  addIngredient: '+ Malzeme ekle',
  usedIn: (count: string) => `${count} üründe`,
  usedInNone: 'henüz üründe değil',
  unitPriceColumn: 'Birim fiyatı',
  usedInColumn: 'Kullanıldığı',
  ingredientName: 'Malzeme',
  purchaseQuantity: 'Kaç aldın',
  purchasePrice: 'Kaça geldi',
  purchaseUnit: 'Birim',
  unitPriceWord: { adet: 'Tanesi', g: 'Gramı', ml: 'Ml’si' } as const,
  unitPriceLine: (word: string, value: string, count: string, names: string) =>
    `${word} ${value} TL. Bu fiyat ${count} üründe: ${names}.`,
  invoiceHint: 'Faturada yazdığı gibi gir: «2 kg, 640 TL» gibi. Henüz hiçbir üründe değil.',
  unitFamilyLock: (name: string, used: string, blocked: string) =>
    `${name} reçetelerde ${used} yazılı. ${blocked} geçemez.`,
  unitFamilyUsed: { g: 'gramla', ml: 'mililitreyle', adet: 'adetle' } as const,
  unitFamilyBlocked: {
    g: 'Adet ya da litreye',
    ml: 'Adet ya da kiloya',
    adet: 'Gram ya da litreye',
  } as const,
  done: 'Tamam',
  cancel: 'Vazgeç',
  deleteIngredient: 'Malzemeyi sil',
  deleteShort: 'Sil',
  deleteConfirm: (name: string, count: string, productNames: string) =>
    `${name} silinsin mi? ${count} üründe kullanılıyor: ${productNames}.`,
  deleteConfirmUnused: (name: string) => `${name} silinsin mi? Hiçbir üründe kullanılmıyor.`,
  recipeEyebrow: 'Reçete',
  backToMenu: 'Menüye dön',
  finish: 'Bitti',
  closeBlock: 'Kapat',
  recipeIntro: 'İçine ne koyuyorsun? Her malzemeye, bir tanesine giden miktarı yaz.',
  recipeEmpty:
    'Henüz malzeme yok. Adını yaz; listede varsa fiyatıyla gelir, yoksa bir kez nasıl aldığını sorarız.',
  searchLabel: 'Malzeme ekle',
  suggestExisting: (qty: string, unit: string, price: string) =>
    `listede · ${qty} ${unit} ${price} TL`,
  suggestAdd: 'Ekle',
  suggestNew: (typed: string) => `«${typed}» adında yeni malzeme`,
  suggestNewAction: 'Yeni',
  newIngredientTag: 'listede yok, yeni',
  newIngredientAsk: 'Nasıl alıyorsun? Bir kez sorulur, sonra listede durur.',
  newIngredientAskDesktop: 'Listede yok. Nasıl alıyorsun? Bir kez sorulur, listeye düşer.',
  addToList: 'Listeye ekle',
  usageLabel: { adet: 'Kaç adet?', g: 'Kaç gram?', ml: 'Kaç ml?' } as const,
  usageColumn: 'Bir tanesine',
  purchaseColumn: 'Nasıl alınıyor',
  lineCostColumn: 'Tutar',
  removeLine: 'Çıkar',
  editPriceInList: 'Fiyatı listede değiştir',
  recipeTotal: 'Bir tanesinin maliyeti',
  backToManual: 'Tutarı kendim yazacağım',
  backToManualNote: 'Reçete silinmez, kenarda durur.',
  usageEmpty: (name: string) => `${name} için miktar yaz. Bütün satırlar dolunca maliyet çıkar.`,
  hesaplaRecipeIncomplete: (names: string) => `Reçeteyi tamamla: ${names}`,
  emptyRecipe: 'Reçeteye en az bir malzeme ekle.',
  ingredientMissing: 'Malzemeyi listeden seç ya da yeni ekle.',
  notANumber: 'Lütfen bir sayı gir.',
  purchaseQuantityEmpty: 'Kaç aldığını yaz.',
  purchaseQuantityZero: 'Alış miktarı 0 olamaz.',
  purchasePriceEmpty: 'Kaça geldiğini yaz.',
  priceRiseHeading: (name: string) => `${name} zamlandı`,
  priceDropHeading: (name: string) => `${name} ucuzladı`,
  priceRiseSummary: (purchase: string, from: string, to: string, count: string) =>
    `${purchase} ${from} TL’den ${to} TL’ye çıktı. Bu fiyat ${count} üründe.`,
  priceDropSummary: (purchase: string, from: string, to: string, count: string) =>
    `${purchase} ${from} TL’den ${to} TL’ye indi. Bu fiyat ${count} üründe.`,
  purchaseAsTyped: {
    kg: 'Kilosu',
    g: 'Gramı',
    L: 'Litresi',
    ml: 'Ml’si',
    adet: 'Tanesi',
  } as const,
  priceRiseUsage: (usage: string, name: string) => `${usage} ${name}`,
  priceRiseCost: (from: string, to: string) => `Maliyet ${from} → ${to} TL`,
  priceRiseRemainingDown: (amount: string) => `Her birinden kalan ${amount} TL azaldı.`,
  priceRiseRemainingUp: (amount: string) => `Her birinden kalan ${amount} TL arttı.`,
  priceRiseRestore: (restore: string, current: string) =>
    `Eski kalan için salon fiyatı ${restore} TL olmalı. Şimdi ${current} TL.`,
  priceRiseFoot: (rate: string) =>
    `Salon fiyatı KDV %${rate} dahil. Kart ve yemek kartı kesintisi bu hesaba girmedi. Paket servis ve online fiyat sonra.`,
  priceRiseColumns: {
    product: 'Ürün',
    cost: 'Maliyet',
    remaining: 'Her birinden kalan',
    restore: 'Eski kalan için salon fiyatı',
  },
  unnamedProduct: (index: number) => `Ürün ${index}`,
} as const

/** Guardrail copy — notes, never errors. They never block `Hesapla`. */
export const GUARDRAIL_COPY = {
  employerCostMissing: (position: string, headcount: string) =>
    `“${position}” pozisyonunda ${headcount} kişi var ama işveren maliyeti girilmedi. Hesaplama 0 TL ile devam ediyor.`,
  ownerNotAnEmployee:
    'İşletme sahibini personel listesine ekleme. Kendine ayırdığın tutar “İşletme sahibi” bölümünde girilir.',
  aidatOnce:
    'Aidat “Kira ve aidat” bölümünde girildi. Diğer giderlere tekrar ekleme.',
  productCostScope:
    'Birim maliyet yalnızca ürünün kendi malzeme maliyetidir. Ambalaj ve kurye bedelini buraya ekleme.',
} as const

export const UNAVAILABLE_COPY = {
  breakEven: {
    no_sales_volume: 'Satış hacmi girilmediği için başa baş noktası hesaplanamıyor.',
    non_positive_contribution:
      'Ürün başına katkı sıfır ya da altında; bu fiyatlarla başa baş noktasına ulaşılmıyor.',
  },
  payback: {
    not_reached_within_horizon: (months: string) =>
      `Yatırım ${months} ay içinde geri dönmüyor.`,
    non_positive_operating_result:
      'İşletme aylık zarar ettiği için yatırım geri dönmüyor.',
  },
  paybackNoInvestment: 'Yatırım tutarı girilmedi.',
} as const
