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

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  return {
    plugins: [react(), tailwindcss(), authConfigPlugin(env)],
    base: '/Ntlo/',
  }
})
