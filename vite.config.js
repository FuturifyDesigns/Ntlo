import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import fs from 'node:fs'
import path from 'node:path'

function authConfigPlugin(env) {
  const writeConfig = () => {
    const out = path.resolve('public/auth/config.js')
    const content = `window.__NTLO_SUPABASE__ = ${JSON.stringify({
      url: env.VITE_SUPABASE_URL || '',
      key: env.VITE_SUPABASE_ANON_KEY || '',
    })};\n`
    fs.mkdirSync(path.dirname(out), { recursive: true })
    fs.writeFileSync(out, content)
  }
  return {
    name: 'auth-config',
    buildStart: writeConfig,
    configureServer() {
      writeConfig()
    },
  }
}

/** Keep auth pages on a self-hosted Supabase bundle (no third-party script CDN). */
function authVendorPlugin() {
  return {
    name: 'auth-vendor-supabase',
    async buildStart() {
      const entry = path.resolve('node_modules/@supabase/supabase-js/dist/index.mjs')
      const outfile = path.resolve('public/auth/vendor/supabase.js')
      if (!fs.existsSync(entry)) return
      try {
        const esbuild = await import('esbuild')
        fs.mkdirSync(path.dirname(outfile), { recursive: true })
        await esbuild.build({
          entryPoints: [entry],
          bundle: true,
          format: 'esm',
          platform: 'browser',
          outfile,
          minify: true,
          logLevel: 'silent',
        })
      } catch {
        // Fall back to the committed vendor file if esbuild is unavailable.
      }
    },
  }
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  return {
    plugins: [react(), tailwindcss(), authConfigPlugin(env), authVendorPlugin()],
    base: '/',
    build: {
      sourcemap: false,
      // Avoid embedding absolute local paths in production chunks.
      minify: 'esbuild',
    },
  }
})
