import { describe, expect, it } from 'vitest'
import {
  COPY,
  ERROR_COPY,
  GUARDRAIL_COPY,
  RECIPE_COPY,
  REPORT_COPY,
  SECTION_LABELS,
  SECTION_NOTES,
  UNAVAILABLE_COPY,
  VERDICT,
} from './labels.ts'
import { DETAILED_SCREEN_LABELS } from './screens.ts'

const COPY_TREES = [
  COPY,
  DETAILED_SCREEN_LABELS,
  ERROR_COPY,
  GUARDRAIL_COPY,
  RECIPE_COPY,
  REPORT_COPY,
  SECTION_LABELS,
  SECTION_NOTES,
  UNAVAILABLE_COPY,
  VERDICT,
] as const

/** Common siz / formal-plural forms. Not substrings of sen or impersonal copy. */
const SIZ_FORMS = [
  'girin',
  'yapın',
  'kontrol edin',
  'eklemeyin',
  'unutmayın',
  'bırakabilirsiniz',
  'bastığınız',
  'girdiğiniz',
  'satışınız',
  'satışlarınız',
  'kuryeniz',
  'kendinize',
  'ayırdığınız',
  'ödemeniz',
  'harcayacağınız',
  'girdiklerinizin',
  'girdiklerinin',
  'satışlarınızın',
  'satışlarının',
  'seçtiyseniz',
  'ediyorsanız',
  'seçebilirsiniz',
  'deneyin',
  'planladığınız',
] as const

function collectStrings(value: unknown, into: string[]): void {
  if (typeof value === 'string') {
    into.push(value)
    return
  }
  if (typeof value === 'function') {
    const args = Array.from({ length: Math.max(value.length, 1) }, (_, index) =>
      index === 0 ? 'XXXNAME' : '2',
    )
    collectStrings(value(...args), into)
    return
  }
  if (Array.isArray(value)) {
    for (const item of value) collectStrings(item, into)
    return
  }
  if (value && typeof value === 'object') {
    for (const item of Object.values(value)) collectStrings(item, into)
  }
}

describe('detailed copy (RECIPE_REDESIGN_SPEC §3.2 O4)', () => {
  const strings: string[] = []
  for (const tree of COPY_TREES) collectStrings(tree, strings)
  const blob = strings.join('\n')

  it('contains no common siz forms', () => {
    for (const form of SIZ_FORMS) {
      expect(blob, `Detailed copy still contains siz form "${form}"`).not.toContain(form)
    }
  })

  it('does not attach a suffix to a name the owner typed', () => {
    const name = 'Hamburger'
    const suffix = new RegExp(`${name}(?:['’]?(?:ın|in|un|ün)|(?:nın|nin|nun|nün))`)
    const samples = [
      RECIPE_COPY.hesaplaRecipeIncomplete(name),
      RECIPE_COPY.priceRiseHeading(name),
      RECIPE_COPY.priceDropHeading(name),
      RECIPE_COPY.deleteConfirm(name, '2', 'Köfte ekmek'),
      RECIPE_COPY.deleteConfirmUnused(name),
      RECIPE_COPY.usageEmpty(name),
      RECIPE_COPY.unitFamilyLock(name, 'gramla', 'Adet ya da litreye'),
      RECIPE_COPY.suggestNew(name),
      RECIPE_COPY.priceRiseUsage('120 g', name),
      GUARDRAIL_COPY.employerCostMissing(name, '2'),
      REPORT_COPY.runningHead(name),
      COPY.weakestProductNote(name),
    ]
    for (const sample of samples) {
      expect(sample, sample).not.toMatch(suffix)
    }
  })

  it('keeps the new results-area copy free of marj, katkı and food cost', () => {
    const insight = [
      COPY.salonMenuTitle,
      COPY.salonMenuNote,
      COPY.salonSellingPrice,
      COPY.salonCost,
      COPY.salonFoodCost,
      COPY.salonRemaining,
      COPY.weakestProductNote('Poğaça'),
      COPY.salonMenuCaption,
      COPY.fixedCostDaysTitle,
      COPY.fixedCostDaysNote('30'),
      COPY.fixedCostDaysUnavailable,
      COPY.fixedCostDaysFirst('7', 'kira'),
      COPY.fixedCostDaysNext('4', 'personel'),
      COPY.fixedCostDaysRemainder('16'),
      COPY.fixedCostDaysRemainderNone,
      COPY.fixedCostDaysUncovered,
      COPY.januaryTitle,
      COPY.januaryNote,
      COPY.januaryWage,
      COPY.januaryRent,
      COPY.januaryInvalid,
      COPY.januaryBefore,
      COPY.januaryAfter,
      COPY.januaryResult,
      COPY.januaryBreakEven,
    ].join('\n').toLocaleLowerCase('tr-TR')
    for (const banned of ['marj', 'katkı', 'food cost', 'amortisman']) {
      expect(insight, `new results copy contains "${banned}"`).not.toContain(banned)
    }
  })

  it('uses the sen empty-state and error strings', () => {
    expect(COPY.emptyResult).toBe(
      'Hesapla’dan önce hiçbir sayı gösterilmez. En az bir ürün girip Hesapla’ya bastığında aylık işletme sonucu, başa baş noktası ve yatırımın geri dönüşü burada görünür.',
    )
    expect(COPY.optionalSectionsNote).toBe('Boş bıraktığın bölümler 0 TL sayılır. Yalnızca ürünler zorunlu.')
    expect(COPY.calculateNoProducts).toBe('Sonucu görmek için en az bir ürün gir')
    expect(SECTION_LABELS.products).toBe('Ürünler')
    expect(SECTION_LABELS.sales).toBe('Satış tahmini')
    expect(SECTION_NOTES.sales).toContain('Ürün burada eklenmez')
    expect(COPY.nextScreen('Malzemeler')).toBe('Sonraki: Malzemeler →')
    expect(COPY.backScreen('Menü')).toBe('Geri: Menü')
    expect(ERROR_COPY.not_a_number).toBe('Lütfen bir sayı gir.')
    expect(ERROR_COPY.empty_products).toBe('En az bir ürün gir.')
    expect(ERROR_COPY.deliveryModeRequired).toBe('Paket servis satışın olduğu için bu seçim zorunlu.')
  })
})
