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
    'Sattığınız ürünleri ve her birinden günde ortalama kaç adet sattığınızı girin. Fiyatlar KDV dahildir.',
  channels:
    'Satışlarınızın kanallara dağılımı ve sipariş başına ambalaj maliyeti. Dağılım tüm ürünler için ortaktır.',
  payments:
    'Yalnızca salon ve al götür satışları için. Paket serviste platform kesintisi geçerlidir.',
  delivery: 'Bu bölüm yalnızca paket servis payı %0’dan büyük olduğu için görünüyor.',
  positions:
    'Pozisyon bazlı. Kişi başı tutarlar işverene aylık maliyettir — brüt maaş değil.',
  owner:
    'İşletmeden kendinize aylık ayırdığınız tutar ve Bağ-Kur ödemeniz. İkisi de aylık işletme gideri sayılır; gelir vergisi hesaplanmaz.',
  opex:
    'Hepsi aylık ortalama tutardır. Yılda bir ödenen bir gideri 12’ye bölüp aylık karşılığını girin.',
  capex: 'Açılmadan önce bir kez harcayacağınız tutarlar. Açılış stoğunu unutmayın.',
  assumptions: 'Hesaplamanın çerçevesi. Varsayılan değerlerle bırakabilirsiniz.',
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
  calculateNoProducts: 'Sonucu görmek için en az bir ürün girin',
  calculateLive: 'Hesapladıktan sonra değişiklikler anında yansır',
  calculateInvalid: (count: number, sections: string) =>
    `${count} alanı kontrol edin — ${sections}`,
  copySummary: 'Özeti kopyala',
  copied: 'Kopyalandı',
  allResults: 'Tüm sonuçlar ↓',
  backToInputs: 'Girdilere dön ↑',
  results: 'Sonuçlar ↓',

  emptyResult:
    'Hesapla’dan önce hiçbir sayı gösterilmez. En az bir ürün girip Hesapla’ya bastığınızda aylık işletme sonucu, başa baş noktası ve yatırımın geri dönüşü burada görünür.',
  optionalSectionsNote:
    'Boş bırakılan bölümler 0 TL olarak hesaplanır. Yalnızca ürünler zorunludur.',

  addProduct: '+ Ürün ekle',
  addPosition: '+ Pozisyon ekle',
  addOpex: '+ Diğer gider ekle',
  addCapex: '+ Yatırım kalemi ekle',
  remove: 'Kaldır',
  starterOpex: 'Sık kullanılan giderler',
  starterCapex: 'Sık kullanılan kalemler',
  productName: 'Ürün adı',
  positionName: 'Pozisyon adı',
  lineName: 'Gider adı',
  monthlyAmount: 'Aylık tutar',
  capexName: 'Kalem adı',
  capexAmount: 'Tutar',

  total: 'Toplam',
  mixShare: 'Pay',
  packagingPerOrder: 'Ambalaj / sipariş',
  commission: 'Komisyon',
  channelColumn: 'Kanal',
  paymentColumn: 'Yöntem',

  deliveryModeQuestion: 'Siparişi kim taşıyor?',
  deliveryModeHint:
    'Seçim, platform kesinti oranının başlangıç değerini belirler: kendi kuryeniz %15, platformun kuryesi %38.',
  platformFeeRate: 'Platform kesintisi',
  platformFeeHint: 'KDV dahil toplam kesinti oranı',
  ownCourierCost: 'Sipariş başına kurye maliyeti',
  ownCourierHint: 'Yalnızca kendi kuryenizle çalışırken geçerli',
  ownCourierDisabledHint: 'Platformun kuryesinde bu tutar hesaba katılmaz.',

  ownerMonthlyAmount: 'Kendinize ayırdığınız aylık tutar',
  ownerBagKur: 'Aylık Bağ-Kur',
  monthlyRent: 'Aylık kira',
  monthlyAidat: 'Aylık aidat',
  rentBasisGroup: 'Girilen kira tutarı',
  aidatOnceHint: 'Aidatı yalnızca burada girin — “Diğer giderler”de tekrar eklemeyin.',

  vatRate: 'KDV oranı',
  operatingDays: 'Ayda çalışılan gün',
  projectionHorizon: 'Projeksiyon süresi',
  rampUp: 'Açılış hızı',
  scenarioVolumes: 'Senaryolarda satış hacmi',
  scenarioVolumesHint:
    'Tek değişken satış adedidir. Fiyatlar, maliyetler ve sabit giderler senaryolar arasında değişmez.',
  advancedAssumptions: 'Gelişmiş varsayımlar — yıllık artışlar',
  advancedAssumptionsNote:
    'Satış fiyatı, ürün maliyeti ve sabit gider yıllık artışları. Varsayılan %0 — girdiğiniz tutarlar projeksiyon boyunca aynı kalır. Sonuç ekranında her zaman görünür.',
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
  plannedVolume: 'Planladığınız satış',

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
  not_a_number: 'Lütfen bir sayı girin.',
  below_min: (limit: string) => `En az ${limit} girilebilir.`,
  above_max: (limit: string) => `En fazla ${limit} girilebilir.`,
  invalid_value: 'Geçerli bir seçim yapın.',
  empty_products: 'En az bir ürün girin.',
  channelMixShort: (missing: string) => `Kanal dağılımı %100 olmalı. ${missing} eksik.`,
  channelMixOver: (excess: string) => `Kanal dağılımı %100 olmalı. ${excess} fazla.`,
  paymentMixShort: (missing: string) => `Ödeme dağılımı %100 olmalı. ${missing} eksik.`,
  paymentMixOver: (excess: string) => `Ödeme dağılımı %100 olmalı. ${excess} fazla.`,
  deliveryModeRequired: 'Paket servis satışınız olduğu için bu seçim zorunlu.',
} as const

/** Guardrail copy — notes, never errors. They never block `Hesapla`. */
export const GUARDRAIL_COPY = {
  employerCostMissing: (position: string, headcount: string) =>
    `“${position}” pozisyonunda ${headcount} kişi var ama işveren maliyeti girilmedi. Hesaplama 0 TL ile devam ediyor.`,
  ownerNotAnEmployee:
    'İşletme sahibini personel listesine eklemeyin. Kendinize ayırdığınız tutar “İşletme sahibi” bölümünde girilir.',
  aidatOnce:
    'Aidat “Kira ve aidat” bölümünde girildi. Diğer giderlere tekrar eklemeyin.',
  productCostScope:
    'Birim maliyet yalnızca ürünün kendi malzeme maliyetidir. Ambalaj ve kurye bedelini buraya eklemeyin.',
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
