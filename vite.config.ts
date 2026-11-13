import { existsSync } from 'node:fs'
import { join } from 'node:path'
import { defineConfig, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'

function stripTsExtensions() {
  return {
    name: 'strip-ts-extensions',
    enforce: 'pre' as const,
    resolveId(source: string, importer?: string) {
      if (source.endsWith('.ts') && !source.endsWith('.d.ts') && !source.includes('node_modules')) {
        return this.resolve(source.replace(/\.ts$/, ''), importer, { skipSelf: true })
      }
      return null
    },
  }
}

/**
 * Vite preview's SPA fallback would otherwise 200 the home HTML at `/detailed`.
 * Cloudflare's default `auto-trailing-slash` 307s `/detailed` → `/detailed/`
 * when `detailed/index.html` exists; this preview-only middleware matches that
 * so `curl` / `check-prerender --url` hit the prerendered file. Dev is unchanged.
 */
function previewDirectoryIndex(): Plugin {
  return {
    name: 'preview-directory-index',
    configurePreviewServer(server) {
      const dist = join(server.config.root, server.config.build.outDir)
      server.middlewares.use((req, res, next) => {
        if (req.method !== 'GET' && req.method !== 'HEAD') {
          next()
          return
        }
        const raw = req.url ?? ''
        const q = raw.indexOf('?')
        const pathOnly = q === -1 ? raw : raw.slice(0, q)
        const search = q === -1 ? '' : raw.slice(q)
        if (pathOnly.length <= 1 || pathOnly.endsWith('/')) {
          next()
          return
        }
        if (!existsSync(join(dist, pathOnly.slice(1), 'index.html'))) {
          next()
          return
        }
        res.statusCode = 307
        res.setHeader('Location', `${pathOnly}/${search}`)
        res.end()
      })
    },
  }
}

export default defineConfig({
  plugins: [stripTsExtensions(), react(), previewDirectoryIndex()],
})
