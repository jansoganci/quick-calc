import { formatDecimal, parseTurkishNumber } from '../../lib/number.ts'
import { initialForm, type DetailedFormState } from './formState.ts'
import { COPY, SECTION_IDS, type SectionId } from './labels.ts'

/**
 * The stand-in a section header shows before the first calculation: a count, a mix
 * total, or `—`. It is never a money figure — money comes from the engine, and
 * before `Hesapla` there is no engine output (V6).
 */

function mixTotal(parts: readonly string[]): string {
  let total = 0
  for (const part of parts) {
    const parsed = parseTurkishNumber(part)
    if (parsed.status !== 'ok') return COPY.none
    total += parsed.value
  }
  return `%${formatDecimal(total, 2)}`
}

function filledOrNone(values: readonly string[]): string {
  return values.some((value) => value.trim() !== '') ? 'girildi' : COPY.none
}

function countOrNone(count: number): string {
  return count === 0 ? COPY.none : COPY.lineCount(count)
}

export function sectionSummary(form: DetailedFormState, section: SectionId): string {
  switch (section) {
    case 'products':
      return COPY.productCount(form.products.length)
    case 'channels':
      return mixTotal([form.channelMix.salon, form.channelMix.takeaway, form.channelMix.delivery])
    case 'payments':
      return mixTotal([form.paymentMix.cash, form.paymentMix.card, form.paymentMix.mealCard])
    case 'delivery':
      return form.delivery.mode === null ? COPY.none : `%${form.delivery.platformFeeRate}`
    case 'positions':
      return form.positions.length === 0
        ? COPY.none
        : COPY.positionCount(form.positions.length)
    case 'owner':
      return filledOrNone([form.owner.monthlyAmount, form.owner.bagKurMonthlyCost])
    case 'occupancy':
      return filledOrNone([form.occupancy.monthlyRent, form.occupancy.monthlyAidat])
    case 'opex':
      return countOrNone(form.opexLines.length)
    case 'capex':
      return countOrNone(form.capexItems.length)
    case 'assumptions':
      return assumptionsChanged(form) ? 'değiştirildi' : COPY.defaultsUnchanged
  }
}

function assumptionsChanged(form: DetailedFormState): boolean {
  return JSON.stringify(form.assumptions) !== JSON.stringify(initialForm().assumptions)
}

/** The ordered sections actually shown: section 04 exists only when there is delivery. */
export function visibleSections(form: DetailedFormState): SectionId[] {
  const deliveryShare = parseTurkishNumber(form.channelMix.delivery)
  const hasDelivery = deliveryShare.status === 'ok' && deliveryShare.value > 0
  return SECTION_IDS.filter((section) => section !== 'delivery' || hasDelivery)
}

/** Sum of the daily quantities the user typed — a count of their own entries, not a result. */
export function typedDailyUnits(form: DetailedFormState): number {
  return form.products.reduce((total, product) => {
    const parsed = parseTurkishNumber(product.dailyQuantity)
    return parsed.status === 'ok' ? total + parsed.value : total
  }, 0)
}
