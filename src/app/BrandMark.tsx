/**
 * The Maliyet mark: an ink square, the `M` in IBM Plex Sans SemiBold proportions,
 * and the accent rule under it.
 *
 * The letter is a path rather than live text on purpose. In the favicon it has to
 * be — no webfont loads there — and drawing it the same way here keeps the two
 * from drifting: `public/favicon.svg` carries this exact geometry, so the mark in
 * the masthead and the mark in the browser tab are one drawing, not two.
 *
 * The rule under the letter is the app's own active-tab underline, quoted rather
 * than invented, and it is the only place the accent appears in the shell —
 * DESIGN_DIRECTION V2 keeps it away from everything but the headline figure and
 * focus states.
 */
export function BrandMark({ size = 20 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      className="block shrink-0"
      role="img"
      aria-label="Maliyet"
    >
      <rect width="32" height="32" fill="#16181C" />
      <path fill="#FFFFFF" d="M7.6 23V9h4l4.4 8.2L20.4 9h4v14h-3.4v-8.8l-4 7.4h-2l-4-7.4V23z" />
      <rect x="6" y="25" width="20" height="2.5" fill="#1D3A5F" />
    </svg>
  )
}
