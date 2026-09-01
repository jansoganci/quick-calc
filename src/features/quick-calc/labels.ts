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

export const BREAKDOWN_SWATCH: Record<keyof typeof BREAKDOWN_LABELS, string> = {
  vat: '#C3C8CE',
  variable: '#3F4650',
  payroll: '#545C68',
  rent: '#6B7280',
  otherOpex: '#8A9199',
  pos: '#A8AEB6',
  investmentRecovery: '#CFD3D8',
  remaining: '#1D3A5F',
}

export const SIM_LABELS = {
  '-50%': '−%50',
  '-25%': '−%25',
  current: 'Mevcut',
  '+25%': '+%25',
  '+50%': '+%50',
} as const

export const COPY = {
  formSection: 'İşletme bilgileri',
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
    'Aylık işletme kazancı vergi öncesi bir tutardır. Kurumlar vergisi, finansman giderleri ve amortisman hesaba katılmamıştır.',
  simFootnote:
    'Simülasyonda kira, personel ve diğer sabit giderlerin değişmediği varsayılmıştır. Satış hacmi arttıkça satış başına maliyetin düşmesinin nedeni budur.',
  emptyResult:
    'Hesapla’dan önce sonuç alanında hiçbir sayı gösterilmez. Yalnızca kısa bir açıklama ve boş bir çubuk yer tutar.',
  zeroVolume:
    'Günlük satış sıfır olduğu için satış başına maliyet gösterilemiyor.',
} as const

export const ERROR_COPY = {
  required: 'Bu alanı doldurun.',
  notANumber: 'Geçerli bir sayı girin.',
  aboveMax: (formatted: string) => `En fazla ${formatted} girilebilir.`,
  belowMin: (formatted: string) => `${formatted} değerinden küçük olamaz.`,
  exclusiveZero: '0’dan büyük bir değer girin.',
} as const
