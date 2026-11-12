import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import { siteUrl } from './scripts/site-url.ts'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    {
      // Fills the absolute URLs that Open Graph/Twitter/canonical tags require.
      name: 'site-url',
      transformIndexHtml: { order: 'pre', handler: (html) => html.replaceAll('__SITE_URL__', siteUrl()) },
    },
  ],
})
