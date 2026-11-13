import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

const root = join(fileURLToPath(new URL('.', import.meta.url)), '..')
const distDir = join(root, 'dist')
const ssrDir = join(root, 'dist-ssr')

function findSsrEntry() {
  const candidates = [
    join(ssrDir, 'entry-server.js'),
    join(ssrDir, 'entry-server.mjs'),
    join(ssrDir, 'src/entry-server.js'),
  ]
  for (const file of candidates) {
    if (existsSync(file)) return file
  }
  throw new Error(`SSR bundle not found in ${ssrDir}`)
}

function distRelative(path) {
  if (path === '/') return 'index.html'
  return `${path.replace(/^\//, '')}/index.html`
}

const ssrPath = findSsrEntry()
const { render, seoForPath, SEO_PATHS, applySeoToHtml, injectRoot, buildSitemapXml, indexableCanonicalUrls } =
  await import(pathToFileURL(ssrPath).href)

if (!Array.isArray(SEO_PATHS) || SEO_PATHS.length === 0) {
  throw new Error('SSR bundle did not export SEO_PATHS')
}

const template = readFileSync(join(distDir, 'index.html'), 'utf8')
if (!template.includes('<div id="root"></div>')) {
  throw new Error(
    'dist/index.html already has prerendered #root. Run the client vite build first.',
  )
}

for (const path of SEO_PATHS) {
  if (path.includes('rehber')) {
    throw new Error(`Must not prerender a Turkish /rehber path: ${path}`)
  }
  const seo = seoForPath(path)
  const markup = render(path)
  if (seo.ogType === 'article') {
    if (!markup.includes('<article') || !markup.includes('Taslak')) {
      throw new Error(`SSR markup for ${path} is missing the Rehber article`)
    }
  } else if (!markup.includes('id="quick-calculation"') || !markup.includes('id="detailed-feasibility"')) {
    throw new Error(`SSR markup for ${path} is missing calculator landmarks`)
  }
  const html = applySeoToHtml(injectRoot(template, markup), seo)
  const relative = distRelative(path)
  const outfile = join(distDir, relative)
  mkdirSync(dirname(outfile), { recursive: true })
  writeFileSync(outfile, html)
  console.log(`prerender ${path} → ${relative}`)
}

const notFoundSeo = seoForPath('/asdf')
const notFoundMarkup = render('/asdf')
if (!notFoundMarkup.includes('Bu sayfa yok')) {
  throw new Error('SSR markup for 404.html is missing the not-found heading')
}
if (notFoundMarkup.includes('id="quick-calculation"')) {
  throw new Error('404.html must not render calculator landmarks')
}
writeFileSync(join(distDir, '404.html'), applySeoToHtml(injectRoot(template, notFoundMarkup), notFoundSeo))
console.log('prerender 404 → 404.html')

for (const forbidden of ['quick', 'hizli-hesap', 'detayli-hesap', 'simulasyonlar', 'rehber']) {
  if (existsSync(join(distDir, forbidden))) {
    throw new Error(`Must not write dist/${forbidden}/`)
  }
}

const lastmod = new Date().toISOString().slice(0, 10)
const sitemap = buildSitemapXml(lastmod)
writeFileSync(join(distDir, 'sitemap.xml'), sitemap)
console.log(`sitemap.xml ${indexableCanonicalUrls().join(' ')}`)
