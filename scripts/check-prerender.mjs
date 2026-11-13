import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

const root = join(fileURLToPath(new URL('.', import.meta.url)), '..')
const distDir = join(root, 'dist')
const ssrDir = join(root, 'dist-ssr')

const urlFlag = process.argv.indexOf('--url')
const previewBase = urlFlag >= 0 ? process.argv[urlFlag + 1]?.replace(/\/$/, '') : null

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

function namedMeta(html, name) {
  const block = html.match(new RegExp(`<meta\\b[^>]*name="${name}"[^>]*>`, 'i'))
    ?? html.match(new RegExp(`<meta\\b[^>]*name="${name}"[\\s\\S]*?/>`, 'i'))
  return block?.[0].match(/content="([^"]*)"/)?.[1] ?? null
}

function propertyMeta(html, property) {
  const block = html.match(new RegExp(`<meta\\b[^>]*property="${property}"[^>]*>`, 'i'))
    ?? html.match(new RegExp(`<meta\\b[^>]*property="${property}"[\\s\\S]*?/>`, 'i'))
  return block?.[0].match(/content="([^"]*)"/)?.[1] ?? null
}

function canonicalHref(html) {
  return html.match(/<link\s+rel="canonical"\s+href="([^"]*)"\s*\/>/)?.[1] ?? null
}

function documentTitle(html) {
  return html.match(/<title>([^<]*)<\/title>/)?.[1] ?? null
}

function rootInner(html) {
  const start = html.indexOf('<div id="root">')
  if (start === -1) return ''
  return html.slice(start + '<div id="root">'.length)
}

function assert(condition, message) {
  if (!condition) throw new Error(message)
}

const { SEO_PATHS, seoForPath } = await import(pathToFileURL(findSsrEntry()).href)

async function loadHtml(path) {
  if (previewBase) {
    const response = await fetch(`${previewBase}${path}`)
    assert(response.ok, `${path} → HTTP ${response.status}`)
    return { html: await response.text(), finalUrl: response.url, status: response.status }
  }
  const file = join(distDir, distRelative(path))
  assert(existsSync(file), `missing ${file}`)
  return { html: readFileSync(file, 'utf8'), finalUrl: file, status: 200 }
}

const failures = []

for (const path of SEO_PATHS) {
  const seo = seoForPath(path)
  try {
    const { html, finalUrl } = await loadHtml(path)
    const title = documentTitle(html)
    const description = namedMeta(html, 'description')
    const canonical = canonicalHref(html)
    const robots = namedMeta(html, 'robots')
    const root = rootInner(html)

    assert(title === seo.title, `${path} title: ${JSON.stringify(title)}`)
    assert(description === seo.description, `${path} description mismatch`)
    assert(canonical === seo.canonicalUrl, `${path} canonical: ${canonical}`)
    assert(propertyMeta(html, 'og:title') === seo.title, `${path} og:title mismatch`)
    assert(propertyMeta(html, 'og:description') === seo.description, `${path} og:description mismatch`)
    assert(propertyMeta(html, 'og:url') === seo.canonicalUrl, `${path} og:url mismatch`)
    if (seo.noindex) {
      assert(robots === 'noindex', `${path} expected noindex, got ${robots}`)
    } else {
      assert(robots === null, `${path} must not have robots, got ${robots}`)
    }
    assert(!root.startsWith('</div>'), `${path} #root is empty`)
    assert(root.includes('id="quick-calculation"'), `${path} missing Hızlı landmark`)
    assert(root.includes('id="detailed-feasibility"'), `${path} missing Detaylı landmark`)
    assert(root.includes('id="simulations"'), `${path} missing Simülasyonlar landmark`)
    assert(html.includes('Sık sorulanlar'), `${path} missing Hakkında footer`)
    assert(!canonical.includes('hizli-hesap') && !canonical.includes('detayli-hesap'), `${path} Turkish public path`)
    console.log(`ok ${path}${previewBase ? ` (${finalUrl})` : ''}`)
  } catch (error) {
    failures.push(error instanceof Error ? error.message : String(error))
  }
}

if (previewBase) {
  for (const alias of ['/quick', '/detailed/menu']) {
    const response = await fetch(`${previewBase}${alias}`, { redirect: 'manual' })
    // Vite preview does not apply Cloudflare `_redirects`. The built files must
    // still exist as the SPA fallback (home) or 404 — Cloudflare owns the 301.
    console.log(`note ${alias} → HTTP ${response.status} (Cloudflare _redirects, not vite preview)`)
  }
}

if (failures.length > 0) {
  console.error(failures.join('\n'))
  process.exit(1)
}

console.log(`checked ${SEO_PATHS.length} path${SEO_PATHS.length === 1 ? '' : 's'}${previewBase ? ` via ${previewBase}` : ' in dist/'}`)
