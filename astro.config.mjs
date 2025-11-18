import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import tailwind from '@astrojs/tailwind';

// https://astro.build/config
export default defineConfig({
  integrations: [react(), tailwind()],
  vite: {
    define: {
      // Astro/Vite replacement to allow process.env.API_KEY to work in client-side code
      'process.env.API_KEY': JSON.stringify(process.env.API_KEY)
    }
  }
});