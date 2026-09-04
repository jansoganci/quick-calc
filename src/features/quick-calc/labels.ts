import { SHELL_COPY } from '../../app/shellCopy.ts'

export type FieldUnit = 'TL' | 'adet' | 'kişi' | 'gün' | 'ay' | '%'

export const FIELD_LABELS = {
  monthlyRent: 'Aylık kira',
  employeeCount: 'Çalışan sayısı',
  averageEmployeeMonthlyCost: 'Kişi başı aylık maliyet',
  otherMonthlyOpex: 'Diğer aylık giderler',
  initialCapex: 'Başlangıç yatırımı',
  averageTicket: 'Ortalama satış tutarı',
  dailySalesVolume: 'Günlük satış adedi',
  variableCostPerSale: 'Satış başına ürün maliyeti',
  operatingDaysPerMonth: 'Aylık çalışma günü',
  capexRecoveryPeriodMonths: 'Yatırım geri kazanım süresi',
  cardPaymentShare: 'Kartlı ödeme payı',
  posCommissionRate: 'POS komisyonu',
} as const

export const RENT_BASIS_LABELS = {
  net: 'Net kira',
  gross: 'Brüt kira',
} as const

export const FIELD_UNITS: Record<keyof typeof FIELD_LABELS, FieldUnit> = {
  monthlyRent: 'TL',
  employeeCount: 'kişi',
  averageEmployeeMonthlyCost: 'TL',
  otherMonthlyOpex: 'TL',
  initialCapex: 'TL',
  averageTicket: 'TL',
  dailySalesVolume: 'adet',
  variableCostPerSale: 'TL',
  operatingDaysPerMonth: 'gün',
  capexRecoveryPeriodMonths: 'ay',
  cardPaymentShare: '%',
  posCommissionRate: '%',
}

export const FIELD_HINTS: Partial<Record<keyof typeof FIELD_LABELS, string>> = {
  averageTicket: 'KDV dahil tutar',
}

export const BREAKDOWN_LABELS: Record<
  | 'vat'
  | 'variable'
  | 'payroll'
  | 'rent'
  | 'otherOpex'
  | 'pos'
  | 'investmentRecovery'
  | 'remaining',
  string
> = {
  vat: 'KDV',
  variable: 'Ürün maliyeti',
  payroll: 'Personel',
  rent: 'Kira',
  otherOpex: 'Diğer giderler',
  pos: 'POS komisyonu',
  investmentRecovery: 'Yatırım geri kazanımı',
  remaining: 'İşletmede kalan',
}

export const SIM_LABELS = {
  '-50%': '−%50',
  '-25%': '−%25',
  current: 'Mevcut',
  '+25%': '+%25',
  '+50%': '+%50',
} as const

/** A run of the summary sentence. `amount` renders in Mono 500, `accent` adds the ink accent. */
export type HeadlineTone = 'text' | 'amount' | 'accent'
export type HeadlineSegment = { text: string; tone: HeadlineTone }

export const COPY = {
  // Masthead and colophon copy is owned by the shell, which both modes render
  // inside. Re-exported here so this module keeps one import surface (U4).
  ...SHELL_COPY,
  // The eight primary inputs sit under three group headings; the old single
  // `formSection` eyebrow ("İşletme bilgileri") named all of them at once and
  // has been dropped, since the group headings now carry that job.
  salesGroup: 'Satış',
  monthlyCostsGroup: 'Aylık giderler',
  capexGroup: 'Başlangıç yatırımı',
  /** Shown beside a group heading when its subtotal cannot be derived yet. */
  noValue: '—',
  /**
   * The derived line under the two payroll inputs. It borrows the result
   * table's own `Personel` label rather than restating the word, so the form
   * line and the breakdown row it corresponds to can never drift apart.
   */
  payrollHint: (count: string, perEmployee: string, total: string) =>
    `${BREAKDOWN_LABELS.payroll}: ${count} × ${perEmployee} = ${total}`,
  assumptions: 'Varsayımlar',
  calculate: 'Hesapla',
  calculateDisabled: 'Sonucu görmek için tüm alanları doldurun',
  calculateInvalid: 'Girişleri kontrol edin',
  copySummary: 'Özeti Kopyala',
  copied: 'Kopyalandı',
  resultSection: 'Sonuç',
  headlineCost: 'Satış başına tahmini toplam maliyet',
  headlineTicket: 'Ortalama satış',
  monthlyEarnings: 'Aylık işletme kazancı',
  grossMargin: 'Brüt kâr marjı',
  operatingMargin: 'İşletme kâr marjı',
  payback: 'Yatırımın geri dönüşü',
  simTitle: 'Satış hacmi simülasyonu',
  simScenario: 'Senaryo',
  simVolume: 'Günlük satış',
  simCost: 'Satış başına maliyet',
  simEarnings: 'Aylık kazanç',
  earningsFootnote:
    'Aylık işletme kazancı basitleştirilmiş bir tahmindir; net kâr ya da işletme sahibinin eline geçen tutar değildir. Kurumlar vergisi, gelir vergisi, finansman giderleri ve kredi ödemeleri, işletme sahibinin maaşı ve ortaklara yapılan ödemeler ile diğer mali yükümlülükler hesaba katılmamıştır. Yatırım geri kazanım payı ise bir gider olarak bu tutarın içindedir.',
  simFootnote:
    'Simülasyonda kira, personel ve diğer sabit giderlerin değişmediği varsayılmıştır. Satış hacmi arttıkça satış başına maliyetin düşmesinin nedeni budur.',
  emptyResult:
    'Hesapla’dan önce sonuç alanında hiçbir sayı gösterilmez. Tüm alanları doldurup Hesapla’ya bastığınızda satış başına maliyet, işletmede kalan tutar ve aylık kazanç burada görünür.',
  total: 'Toplam',
  headlineSentence: (ticket: string, cost: string, remaining: string): HeadlineSegment[] => [
    { text: ticket, tone: 'amount' },
    { text: '’lik ortalama satışın ', tone: 'text' },
    { text: cost, tone: 'amount' },
    { text: '’si maliyete gidiyor, ', tone: 'text' },
    { text: remaining, tone: 'accent' },
    { text: '’si işletmede kalıyor.', tone: 'text' },
  ],
  // A deficit is not "the remaining amount", so it stays a plain Mono figure:
  // V3 keeps negative values free of colour treatment.
  headlineLossSentence: (ticket: string, deficit: string): HeadlineSegment[] => [
    { text: ticket, tone: 'amount' },
    { text: '’lik ortalama satışın tamamı maliyete gidiyor; her satışta ', tone: 'text' },
    { text: deficit, tone: 'amount' },
    { text: ' açık oluşuyor.', tone: 'text' },
  ],
  vatAssumption: (rate: string) => `KDV oranı: ${rate} (sistem varsayımı, değiştirilemez)`,
  rentWithholdingAssumption: (rate: string) =>
    `Kira stopaj oranı: ${rate} (işyeri, sistem varsayımı)`,
  rentBasisGroup: 'Girilen kira tutarı',
  rentCostHint: (net: string, tax: string, total: string) =>
    `Mülk sahibine ${net} TL · stopaj ${tax} TL · toplam ${total} TL`,
  simVolumeShort: 'Günlük',
  simCostShort: 'Birim maliyet',
  paybackUnavailable: 'Bu satış hızında yatırım geri dönüşü hesaplanamıyor.',
  paybackExceeds: (months: string) =>
    `Yatırımın geri dönüşü öngörülen ${months} aylık süreyi aşıyor.`,
  zeroVolume:
    'Günlük satış sıfır olduğu için satış başına maliyet gösterilemiyor.',
} as const

export const ERROR_COPY = {
  required: 'Bu alan gerekli.',
  notANumber: 'Lütfen bir sayı girin.',
  aboveMax: (formatted: string) => `En fazla ${formatted} girilebilir.`,
  belowMin: (formatted: string) => `En az ${formatted} girilebilir.`,
  exclusiveZero: '0’dan büyük bir değer girin.',
  invalidValue: 'Lütfen geçerli bir seçim yapın.',
} as const
