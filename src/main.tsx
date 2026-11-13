import { StrictMode } from 'react'
import { createRoot, hydrateRoot } from 'react-dom/client'
import { App, applyCanonicalLocation } from './app/App.tsx'
import { DOCUMENT_TITLE } from './app/shellCopy.ts'
import './app/index.css'

// Hash bookmarks (`#detailed-feasibility/satis`) become real paths before React
// mounts. `index.html` also runs this map inline so a slow bundle still lands
// on `/detailed/sales`.
applyCanonicalLocation()

// `index.html` carries a matching static title for the first paint and for crawlers
// that do not run scripts; this makes `shellCopy.ts` the source of truth afterwards,
// so the brand copy is stated once for the UI and once for the document, not thrice.
document.title = DOCUMENT_TITLE

const root = document.getElementById('root')
if (!root) throw new Error('Root element missing')

const tree = (
  <StrictMode>
    <App />
  </StrictMode>
)

// Prerendered HTML (SEO step 4) must hydrate. `npm run dev` and today's empty
// `#root` still CSR — hydrateRoot on an empty container throws in React 18.
if (root.hasChildNodes()) {
  hydrateRoot(root, tree)
} else {
  createRoot(root).render(tree)
}
