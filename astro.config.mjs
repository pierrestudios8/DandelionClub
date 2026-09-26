// @ts-check
import { defineConfig } from 'astro/config';
import vercel from '@astrojs/vercel';
import sitemap from '@astrojs/sitemap';

// Static output by default; individual routes opt into on-demand rendering
// (`export const prerender = false`) for forms and payments.
export default defineConfig({
  site: process.env.PUBLIC_SITE_URL || 'https://dandelionclub.co.za',
  output: 'static',
  adapter: vercel(),
  integrations: [sitemap()],
});
