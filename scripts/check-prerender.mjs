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

const NAMED_BOTS = [
  'Googlebot',
  'Bingbot',
  'GPTBot',
  'OAI-SearchBot',
  'ChatGPT-User',
  'ClaudeBot',
  'Claude-SearchBot',
  'PerplexityBot',
  'Google-Extended',
]

const { SEO_PATHS, seoForPath, indexableCanonicalUrls, auditPrerenderedJsonLd } = await import(
  pathToFileURL(findSsrEntry()).href
)

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
    if (seo.ogType === 'article') {
      assert(root.includes('<article'), `${path} missing Rehber article`)
      assert(html.includes('Taslak'), `${path} missing placeholder notice`)
      assert(html.includes('BreadcrumbList'), `${path} missing BreadcrumbList JSON-LD`)
      assert(html.includes('FAQPage'), `${path} missing FAQ JSON-LD`)
      assert(!html.includes('WebApplication'), `${path} still has WebApplication JSON-LD`)
      assert(propertyMeta(html, 'og:type') === 'article', `${path} og:type is not article`)
      assert(!html.includes('İşyeri kira stopajı hesaba dahil mi?'), `${path} kept Hakkında FAQ`)
    } else {
      assert(root.includes('id="quick-calculation"'), `${path} missing Hızlı landmark`)
      assert(root.includes('id="detailed-feasibility"'), `${path} missing Detaylı landmark`)
      assert(root.includes('id="simulations"'), `${path} missing Simülasyonlar landmark`)
      assert(html.includes('Sık sorulanlar'), `${path} missing Hakkında footer`)
      assert(propertyMeta(html, 'og:type') === 'website', `${path} og:type is not website`)
    }
    assert(!canonical.includes('hizli-hesap') && !canonical.includes('detayli-hesap'), `${path} Turkish public path`)
    auditPrerenderedJsonLd(html, {
      kind: seo.ogType === 'article' ? 'guide' : 'calculator',
      canonicalUrl: seo.canonicalUrl,
      description: seo.description,
    })
    console.log(`ok ${path}${previewBase ? ` (${finalUrl})` : ''}`)
  } catch (error) {
    failures.push(error instanceof Error ? error.message : String(error))
  }
}

async function loadPublic(name) {
  if (previewBase) {
    const response = await fetch(`${previewBase}/${name}`)
    assert(response.ok, `/${name} → HTTP ${response.status}`)
    return response.text()
  }
  const file = join(distDir, name)
  assert(existsSync(file), `missing ${file}`)
  return readFileSync(file, 'utf8')
}

try {
  const template = readFileSync(join(root, 'index.html'), 'utf8')
  const home = seoForPath('/')
  auditPrerenderedJsonLd(template, {
    kind: 'calculator',
    canonicalUrl: home.canonicalUrl,
    description: home.description,
  })
  console.log('ok index.html template JSON-LD')
} catch (error) {
  failures.push(error instanceof Error ? error.message : String(error))
}

try {
  const urls = indexableCanonicalUrls()
  const robots = await loadPublic('robots.txt')
  const sitemap = await loadPublic('sitemap.xml')
  const llms = await loadPublic('llms.txt')

  for (const agent of NAMED_BOTS) {
    assert(robots.includes(`User-agent: ${agent}`), `robots.txt missing ${agent}`)
  }
  assert(robots.includes('User-agent: *'), 'robots.txt missing *')
  assert(robots.includes('Sitemap: https://maliyet.lol/sitemap.xml'), 'robots.txt missing Sitemap line')
  assert(!/^\s*Disallow:/m.test(robots), 'robots.txt must not Disallow')

  const locs = [...sitemap.matchAll(/<loc>([^<]*)<\/loc>/g)].map((match) => match[1])
  assert(JSON.stringify(locs) === JSON.stringify(urls), `sitemap loc drift: ${locs.join(' ')}`)
  assert(!sitemap.includes('/detailed/result'), 'sitemap.xml lists Sonuç')
  assert(!sitemap.includes('changefreq'), 'sitemap.xml invents changefreq')
  assert(!sitemap.includes('priority'), 'sitemap.xml invents priority')
  assert(!sitemap.includes('/quick<'), 'sitemap.xml lists /quick')
  assert(!sitemap.includes('/guides'), 'sitemap.xml lists TBD guides')
  assert(!sitemap.includes('404'), 'sitemap.xml lists 404')

  for (const url of urls) {
    assert(llms.includes(url), `llms.txt missing ${url}`)
  }
  assert(!llms.includes('/detailed/result'), 'llms.txt lists Sonuç')
  assert(!llms.includes('/guides'), 'llms.txt lists TBD guides')
  assert(!llms.includes('404.html'), 'llms.txt lists 404.html')
  assert(!llms.includes('https://maliyet.lol/quick'), 'llms.txt lists /quick')
  assert(!/quick calc/i.test(llms), 'llms.txt uses English product name')
  assert(llms.includes('Simülasyonlar üçüncü bir hesap motoru değildir'), 'llms.txt must not call Simülasyonlar an engine')
  console.log(`ok /robots.txt /sitemap.xml /llms.txt (${urls.length} indexable URLs)`)
} catch (error) {
  failures.push(error instanceof Error ? error.message : String(error))
}

try {
  const seo = seoForPath('/asdf')
  const file = join(distDir, '404.html')
  assert(existsSync(file), 'missing dist/404.html')
  assert(!existsSync(join(distDir, '404', 'index.html')), 'must not write dist/404/index.html')
  let html = readFileSync(file, 'utf8')
  if (previewBase) {
    const response = await fetch(`${previewBase}/asdf`, { redirect: 'manual' })
    assert(response.status === 404, `/asdf → HTTP ${response.status}, expected 404`)
    html = await response.text()
  }
  assert(documentTitle(html) === seo.title, `404 title: ${JSON.stringify(documentTitle(html))}`)
  assert(namedMeta(html, 'robots') === 'noindex', '404.html missing noindex')
  assert(html.includes('Bu sayfa yok'), '404.html missing heading')
  assert(html.includes('href="/"'), '404.html missing Hızlı link')
  assert(html.includes('href="/detailed"'), '404.html missing Detaylı link')
  assert(html.includes('href="/simulations"'), '404.html missing Simülasyonlar link')
  assert(!html.includes('WebApplication'), '404.html still has WebApplication JSON-LD')
  assert(!html.includes('id="quick-calculation"'), '404.html rendered Hızlı')
  assert(!html.includes('İşyeri kira stopajı hesaba dahil mi?'), '404.html kept Hakkında FAQ')
  console.log(`ok 404.html${previewBase ? ' (/asdf → 404)' : ''}`)
} catch (error) {
  failures.push(error instanceof Error ? error.message : String(error))
}

if (previewBase) {
  for (const alias of ['/quick', '/detailed/menu']) {
    const response = await fetch(`${previewBase}${alias}`, { redirect: 'manual' })
    console.log(`note ${alias} → HTTP ${response.status} (_redirects on Cloudflare / wrangler)`)
  }
}

if (failures.length > 0) {
  console.error(failures.join('\n'))
  process.exit(1)
}

console.log(`checked ${SEO_PATHS.length} path${SEO_PATHS.length === 1 ? '' : 's'}${previewBase ? ` via ${previewBase}` : ' in dist/'}`)
