/**
 * Which result the Detaylı screen may show (DF-85 D6).
 *
 * Nothing before the first `Hesapla` (V6). After it, the result follows the
 * current draft: an invalid draft (for example a channel mix that is not 100%)
 * shows no result at all — not the last valid one — in both Klasik and Akış.
 * Once the draft is valid again, its result shows again.
 */
export function selectShownResult<V>(
  hasCalculated: boolean,
  evaluation: { ok: true; view: V } | { ok: false },
): V | null {
  if (!hasCalculated || !evaluation.ok) return null
  return evaluation.view
}
