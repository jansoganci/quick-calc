import type { DetailedResolvedInput } from '../../core/detailed/index.ts'
import { formatCount } from '../../lib/number.ts'
import { GUARDRAIL_COPY, type SectionId } from './labels.ts'

/**
 * Guardrails are notes, not errors: they never block `Hesapla` and never use the
 * error token. Spec §4.5a, DF-79 and DF-80 place them in the UI deliberately, so
 * they are derived here from the resolved input and require nothing from the engine.
 *
 * The owner and aidat rules are static guidance, not detection — DF-79 forbids a
 * matching algorithm, and no one can tell whether a named OPEX line is really aidat.
 */

export type Guardrail = {
  id: string
  section: SectionId
  message: string
}

export function collectGuardrails(input: DetailedResolvedInput): Guardrail[] {
  const guardrails: Guardrail[] = []

  // G1 — payroll is usually the largest fixed cost, so a staffed position with no
  // employer cost silently removes the model's biggest expense. A position with
  // zero headcount is a deliberate not-yet-hiring entry and must not warn.
  for (const position of input.positions) {
    if (position.headcount > 0 && position.employerCostPerPerson === 0) {
      guardrails.push({
        id: `employer-cost-${position.id}`,
        section: 'positions',
        message: GUARDRAIL_COPY.employerCostMissing(
          position.name,
          formatCount(position.headcount),
        ),
      })
    }
  }

  // G2 — DF-79: do not count the owner twice.
  if (input.owner.monthlyAmount > 0 && input.positions.length > 0) {
    guardrails.push({
      id: 'owner-not-an-employee',
      section: 'positions',
      message: GUARDRAIL_COPY.ownerNotAnEmployee,
    })
  }

  // G3 — DF-80: aidat is entered under occupancy and never again under OPEX.
  if (input.occupancy.monthlyAidat > 0 && input.opexLines.length > 0) {
    guardrails.push({
      id: 'aidat-once',
      section: 'opex',
      message: GUARDRAIL_COPY.aidatOnce,
    })
  }

  return guardrails
}
