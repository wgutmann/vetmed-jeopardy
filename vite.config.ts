import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig(({ mode }) => {
  // Load env file based on `mode` in the current working directory.
  // Set the third parameter to '' to load all env regardless of the `VITE_` prefix.
  const env = loadEnv(mode, process.cwd(), '');
  return {
    plugins: [react()],
    define: {
      // Vite replaces `process.env.API_KEY` in your code with the value of `env.VITE_API_KEY`
      // This is the standard way to expose environment variables to client-side code in Vite.
      'process.env.API_KEY': JSON.stringify(env.VITE_API_KEY)
    }
  }
})