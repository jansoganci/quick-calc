import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { App } from './app/App.tsx'
import { DOCUMENT_TITLE } from './app/shellCopy.ts'
import './app/index.css'

// `index.html` carries a matching static title for the first paint and for crawlers
// that do not run scripts; this makes `shellCopy.ts` the source of truth afterwards,
// so the brand copy is stated once for the UI and once for the document, not thrice.
document.title = DOCUMENT_TITLE

const root = document.getElementById('root')
if (!root) throw new Error('Root element missing')

createRoot(root).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
