import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import tailwind from '@astrojs/tailwind';

export default defineConfig({
  output: process.env.NODE_ENV === 'production' ? 'static' : 'server',
  integrations: [react(), tailwind()],
  vite: {
    ssr: {
      // Ensure these modules are bundled into SSR output (avoid runtime "Cannot find module 'tslib'" errors)
      noExternal: ['tslib', '@google/genai'],
    },
  },
});