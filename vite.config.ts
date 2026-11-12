import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import { siteUrl } from './scripts/site-url.ts'

// https://vite.dev/config/
export default defineConfig({
  build: {
    // Never inline assets as data: URIs. Vite would otherwise inline the small font
    // subsets, which the Content-Security-Policy (font-src 'self') does not allow.
    assetsInlineLimit: 0,
  },
  plugins: [
    react(),
    {
      // Fills the absolute URLs that Open Graph/Twitter/canonical tags require.
      name: 'site-url',
      transformIndexHtml: { order: 'pre', handler: (html) => html.replaceAll('__SITE_URL__', siteUrl()) },
    },
  ],
})
