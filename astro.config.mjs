import { defineConfig } from 'astro/config';
import cloudflare from '@astrojs/cloudflare';
import react from '@astrojs/react';
import tailwind from '@astrojs/tailwind';

export default defineConfig({
  output: 'server',
  adapter: cloudflare({
    platformProxy: {
      enabled: process.env.CF_PAGES !== '1',
    },
  }),
  integrations: [react(), tailwind()],
  vite: {
    ssr: {
      // Ensure tslib is bundled into the server output for Cloudflare
      noExternal: ['tslib'],
    },
  },
});