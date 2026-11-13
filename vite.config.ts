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
 * Matches wrangler `html_handling: "drop-trailing-slash"`: `/detailed` serves
 * `detailed/index.html` with 200, `/detailed/` 307s to `/detailed`. Dev is unchanged.
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
        if (pathOnly.length > 1 && pathOnly.endsWith('/')) {
          const noSlash = pathOnly.slice(0, -1)
          if (existsSync(join(dist, noSlash.slice(1), 'index.html'))) {
            res.statusCode = 307
            res.setHeader('Location', `${noSlash}${search}`)
            res.end()
            return
          }
          next()
          return
        }
        if (pathOnly.length > 1 && existsSync(join(dist, pathOnly.slice(1), 'index.html'))) {
          req.url = `${pathOnly}/index.html${search}`
          next()
          return
        }
        next()
      })
    },
  }
}

export default defineConfig({
  plugins: [stripTsExtensions(), react(), previewDirectoryIndex()],
})
