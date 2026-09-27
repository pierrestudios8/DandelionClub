// @ts-check
import { defineConfig } from 'astro/config';
import vercel from '@astrojs/vercel';
import sitemap from '@astrojs/sitemap';
import rehypeTodo from './src/lib/rehype-todo.ts';

/** The styleguide is for dev and Vercel previews; production never gets the route. */
const includeStyleguide = process.env.VERCEL_ENV !== 'production';

/** @type {import('astro').AstroIntegration} */
const styleguide = {
  name: 'dc-styleguide',
  hooks: {
    'astro:config:setup': ({ injectRoute }) => {
      if (includeStyleguide) {
        injectRoute({ pattern: '/styleguide', entrypoint: './src/styleguide/index.astro' });
      }
    },
  },
};

// Static output by default; individual routes opt into on-demand rendering
// (`export const prerender = false`) for forms and payments.
export default defineConfig({
  site: process.env.PUBLIC_SITE_URL || 'https://dandelionclub.co.za',
  output: 'static',
  // The dev toolbar adds its own headings, which the e2e and axe checks would see.
  devToolbar: { enabled: !process.env.DC_E2E },
  adapter: vercel(),
  markdown: { rehypePlugins: [rehypeTodo] },
  integrations: [
    styleguide,
    sitemap({ filter: (page) => !/\/(styleguide|thank-you)\//.test(page) }),
  ],
});
