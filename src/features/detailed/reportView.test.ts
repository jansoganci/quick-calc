import { describe, expect, it } from 'vitest'
import { calculateDetailed, validateDetailedInput } from '../../core/detailed/index.ts'
import { formatTryExact } from '../../lib/money.ts'
import type { DetailedResolvedInput, DetailedResult } from '../../core/detailed/index.ts'
import { initialForm, type DetailedFormState } from './formState.ts'
import { SECTION_IDS, type SectionId } from './labels.ts'
import {
  buildReportInputGroups,
  formatReportDate,
  isValidBusinessName,
  reportDocumentTitle,
  sanitizeBusinessName,
  type ReportInputGroup,
} from './reportView.ts'
import { toDetailedInput } from './toInput.ts'

/** A populated form — every optional collection filled, delivery on. */
function reportForm(mutate: (draft: DetailedFormState) => void = () => {}): DetailedFormState {
  const form = initialForm()
  form.products = [
    {
      id: 'p1',
      name: 'Filtre kahve',
      normalPrice: '95',
      onlinePrice: '110',
      dailyQuantity: '140',
      unitProductCost: '28,50',
    },
    {
      id: 'p2',
      name: 'Şişli tostu',
      normalPrice: '165',
      onlinePrice: '190',
      dailyQuantity: '45',
      unitProductCost: '72',
    },
  ]
  form.channelMix = { salon: '50', takeaway: '20', delivery: '30' }
  form.packaging = { takeawayPerOrder: '4', deliveryPerOrder: '7' }
  form.delivery = { mode: 'platformCourier', platformFeeRate: '28', ownCourierCostPerDeliveryOrder: '' }
  form.positions = [
    {
      id: 'pos1',
      name: 'Barista',
      headcount: '3',
      employerCostPerPerson: '38.500',
      mealCostPerPerson: '3.200',
      transportCostPerPerson: '2.800',
      averageBonusPerPerson: '',
    },
  ]
  form.owner = { monthlyAmount: '90.000', bagKurMonthlyCost: '12.500' }
  form.occupancy = { monthlyRent: '300.000', rentInputBasis: 'net', monthlyAidat: '15.000' }
  form.opexLines = [{ id: 'o1', name: 'Elektrik', amount: '22.000' }]
  form.capexItems = [{ id: 'c1', name: 'Tadilat', amount: '600.000' }]
  form.assumptions.projectionHorizonMonths = 36
  mutate(form)
  return form
}

function resolve(form: DetailedFormState): {
  input: DetailedResolvedInput
  result: DetailedResult
  groups: ReportInputGroup[]
} {
  const validation = validateDetailedInput(toDetailedInput(form))
  if (!validation.ok) throw new Error('fixture does not validate')
  const result = calculateDetailed(validation.input)
  return { input: validation.input, result, groups: buildReportInputGroups(validation.input, result) }
}

function groupFor(groups: ReportInputGroup[], section: SectionId): ReportInputGroup | undefined {
  return groups.find((group) => group.section === section)
}

function cellsOf(group: ReportInputGroup): string[] {
  if (group.content.kind === 'table') {
    return [...group.content.table.columns, ...group.content.table.rows.flat()]
  }
  return group.content.rows.flatMap((row) => [row.label, row.value])
}

function everyValue(groups: ReportInputGroup[]): string[] {
  return groups.flatMap((group) => [
    group.title,
    ...cellsOf(group),
    ...(group.total === null ? [] : [group.total.label, group.total.value]),
  ])
}

describe('the appendix covers the engine input', () => {
  /**
   * The invariant that keeps the appendix honest as the engine grows: a field
   * added to `DetailedResolvedInput` must be rendered, or listed here as a
   * deliberate omission with a reason.
   */
  const OMITTED: Record<string, string> = {
    assumptions: 'rendered in full by the mandatory assumptions block (spec §4.7)',
  }

  it('renders every resolved input field, or names it as omitted', () => {
    const { input, groups } = resolve(reportForm())
    const rendered = new Set(groups.map((group) => group.section))

    const fieldSections: Record<keyof DetailedResolvedInput, SectionId | null> = {
      products: 'products',
      channelMix: 'channels',
      packaging: 'channels',
      paymentMix: 'payments',
      posCommissionRate: 'payments',
      mealCardCommissionRate: 'payments',
      delivery: 'delivery',
      positions: 'positions',
      owner: 'owner',
      occupancy: 'occupancy',
      rentWithholdingRate: 'occupancy',
      opexLines: 'opex',
      capexItems: 'capex',
      assumptions: null,
    }

    for (const key of Object.keys(input) as (keyof DetailedResolvedInput)[]) {
      const section = fieldSections[key]
      if (section === null) {
        expect(OMITTED[key], `${key} must be rendered or explicitly omitted`).toBeDefined()
        continue
      }
      expect(rendered.has(section), `${key} is missing from the appendix`).toBe(true)
    }
  })

  it('orders groups by the locked ten-section input IA', () => {
    const { groups } = resolve(reportForm())
    const order = groups.map((group) => group.section)
    const expected = SECTION_IDS.filter((section) => order.includes(section))
    expect(order).toEqual(expected)
    expect(groups.map((group) => group.index)).toEqual(groups.map((_, index) => index + 1))
  })

  it('omits section 10, which the assumptions block already renders in full', () => {
    const { groups } = resolve(reportForm())
    expect(groupFor(groups, 'assumptions')).toBeUndefined()
  })

  it('drops the delivery group when nothing is sold through delivery', () => {
    const withDelivery = resolve(reportForm())
    expect(groupFor(withDelivery.groups, 'delivery')).toBeDefined()

    const withoutDelivery = resolve(
      reportForm((draft) => {
        draft.channelMix = { salon: '70', takeaway: '30', delivery: '0' }
        draft.delivery = { mode: null, platformFeeRate: '', ownCourierCostPerDeliveryOrder: '' }
      }),
    )
    expect(groupFor(withoutDelivery.groups, 'delivery')).toBeUndefined()
  })

  it('drops a group whose collection is empty rather than printing an empty heading', () => {
    const { groups } = resolve(
      reportForm((draft) => {
        draft.opexLines = []
        draft.capexItems = []
      }),
    )
    expect(groupFor(groups, 'opex')).toBeUndefined()
    expect(groupFor(groups, 'capex')).toBeUndefined()
  })
})

describe('appendix totals are the engine’s, never summed here', () => {
  it('quotes the engine figure for every group total', () => {
    const { result, groups } = resolve(reportForm())
    const base = result.scenarios.base.stabilizedMonth
    const money = (value: number) => `${new Intl.NumberFormat('tr-TR', { maximumFractionDigits: 0 }).format(value)} TL`

    expect(groupFor(groups, 'positions')?.total?.value).toBe(money(base.monthlyPayroll))
    expect(groupFor(groups, 'owner')?.total?.value).toBe(money(base.monthlyOwnerCost))
    expect(groupFor(groups, 'occupancy')?.total?.value).toBe(money(base.monthlyOccupancyCost))
    expect(groupFor(groups, 'opex')?.total?.value).toBe(money(base.monthlyOpex))
    expect(groupFor(groups, 'capex')?.total?.value).toBe(money(result.totalInitialInvestment))
  })

  it('publishes no total for the groups the engine has none for', () => {
    const { groups } = resolve(reportForm())
    expect(groupFor(groups, 'products')?.total).toBeNull()
    expect(groupFor(groups, 'channels')?.total).toBeNull()
    expect(groupFor(groups, 'payments')?.total).toBeNull()
  })
})

describe('Turkish output', () => {
  it('groups thousands with a dot and separates decimals with a comma', () => {
    const { groups } = resolve(
      reportForm((draft) => {
        draft.occupancy.monthlyRent = '1000'
        draft.opexLines = [{ id: 'o1', name: 'Elektrik', amount: '10000' }]
        draft.capexItems = [{ id: 'c1', name: 'Tadilat', amount: '1000000' }]
        // The engine caps a unit price at 100.000, so this is the largest
        // kuruş-bearing figure the appendix itself can carry.
        draft.products[0]!.normalPrice = '95000,50'
      }),
    )
    const values = everyValue(groups)

    expect(values).toContain('1.000 TL')
    expect(values).toContain('10.000 TL')
    expect(values).toContain('1.000.000 TL')
    expect(values).toContain('95.000,50 TL')
  })

  it('renders a millions-with-kuruş amount the Turkish way', () => {
    // The helper the report formats every per-unit amount with. No field is
    // bounded high enough to reach this figure, so it is asserted directly.
    expect(`${formatTryExact(1_500_000.5, 2)} TL`).toBe('1.500.000,50 TL')
  })

  it('writes percentages the Turkish way, sign before the sign', () => {
    const { groups } = resolve(reportForm((draft) => (draft.posCommissionRate = '3,59')))
    expect(everyValue(groups)).toContain('%3,6')
  })

  it('carries Turkish characters through unchanged', () => {
    const { groups } = resolve(
      reportForm((draft) => {
        draft.products[0]!.name = 'Şişli Çiğköfte — Ağır İşletme ğĞşŞıİçÇöÖüÜ'
      }),
    )
    expect(everyValue(groups)).toContain('Şişli Çiğköfte — Ağır İşletme ğĞşŞıİçÇöÖüÜ')
  })
})

describe('report title and filename', () => {
  it('keeps Turkish characters and strips only what a file system refuses', () => {
    expect(sanitizeBusinessName('Şişli/Çiğköfte: Ağır*İşletme?')).toBe(
      'Şişli Çiğköfte Ağır İşletme',
    )
  })

  it('collapses whitespace and caps the length', () => {
    expect(sanitizeBusinessName('  Kadıköy   Kahve  ')).toBe('Kadıköy Kahve')
    expect(sanitizeBusinessName('a'.repeat(120))).toHaveLength(60)
  })

  it('names the document after the business and the day it was produced', () => {
    const title = reportDocumentTitle('Kadıköy Kahve Projesi', new Date(2026, 8, 5))
    expect(title).toBe('Fizibilite Raporu — Kadıköy Kahve Projesi — 05.09.2026')
  })

  it('writes the cover date in long Turkish form', () => {
    expect(formatReportDate(new Date(2026, 8, 5))).toBe('5 Eylül 2026')
  })

  it('treats a whitespace-only name as no name at all', () => {
    expect(isValidBusinessName('')).toBe(false)
    expect(isValidBusinessName('   ')).toBe(false)
    expect(isValidBusinessName('  K  ')).toBe(true)
  })
})
