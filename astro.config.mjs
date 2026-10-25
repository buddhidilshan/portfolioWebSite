import { defineConfig } from 'astro/config';

export default defineConfig({
  // Static output — Vercel serves the files in dist/ directly.
  output: 'static',
  site: 'https://beroxvtomorrow.vercel.app',
  trailingSlash: 'always',
  devToolbar: { enabled: false },
});
