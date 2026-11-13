import { StrictMode } from 'react'
import { createRoot, hydrateRoot } from 'react-dom/client'
import { App, applyCanonicalLocation, applyDocumentSeo } from './app/App.tsx'
import './app/index.css'

// Hash bookmarks (`#detailed-feasibility/satis`) become real paths before React
// mounts. `index.html` also runs this map inline so a slow bundle still lands
// on `/detailed/sales`.
applyCanonicalLocation()

// Tab title and share tags follow the path. Prerender already wrote them into
// each HTML file; this keeps in-app navigations aligned with `seoCopy.ts`.
applyDocumentSeo()

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
