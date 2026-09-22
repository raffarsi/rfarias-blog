import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import fs from 'node:fs';
import path from 'node:path';
import { jaPublicado } from './src/lib/agenda.mjs';

// slugs que ainda nao chegaram na data/hora: ficam fora do sitemap
const dirPosts = 'src/pages/posts';
const agendados = fs.readdirSync(dirPosts)
  .filter(f => f.endsWith('.md'))
  .filter(f => {
    const txt = fs.readFileSync(path.join(dirPosts, f), 'utf8');
    const data = /^date:\s*"?([^"\n]+?)"?\s*$/m.exec(txt)?.[1];
    const hora = /^hora:\s*"?([^"\n]+?)"?\s*$/m.exec(txt)?.[1];
    return !jaPublicado(data, hora);
  })
  .map(f => `/posts/${f.replace(/\.md$/, '')}`);

export default defineConfig({
  site: 'https://rfarias.com',
  output: 'static',
  integrations: [sitemap({
    filter: (url) => !agendados.some(slug => new URL(url).pathname.replace(/\/$/, '') === slug),
  })],
  markdown: { shikiConfig: { theme: 'catppuccin-mocha' } },
});
