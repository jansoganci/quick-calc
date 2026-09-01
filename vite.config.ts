import { defineConfig } from 'vite'
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

export default defineConfig({
  plugins: [stripTsExtensions(), react()],
})
