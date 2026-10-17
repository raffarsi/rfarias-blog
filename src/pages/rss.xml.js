// Feed RSS com os artigos já publicados (os agendados entram quando chega a data e o site é refeito).
import rss from '@astrojs/rss';
import { listarPublicados } from '../lib/areas.mjs';

export async function GET(context) {
  const modulos = import.meta.glob('./posts/*.md', { eager: true });
  const posts = listarPublicados(modulos).sort((a, b) => b.quando - a.quando);
  return rss({
    title: 'rfarias',
    description: 'Arquitetura, rede, compute e segurança no Azure, a partir de problemas reais. Por Rafael Farias da Silva.',
    site: context.site,
    items: posts.map((p) => ({
      title: p.title,
      link: `/posts/${p.slug}/`,
      pubDate: new Date(p.quando),
      description: p.excerpt,
      categories: p.category ? [p.category] : [],
    })),
    customData: '<language>pt-br</language>',
  });
}
