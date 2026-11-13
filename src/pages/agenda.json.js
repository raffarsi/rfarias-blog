// Lista dos artigos agendados (data e hora no futuro no momento do build).
// Lida pelo worker "rebuild-diario-rfarias-blog" no Cloudflare: a cada 15 minutos ele confere
// se algum horário desta lista chegou e, se sim, reconstrói o site para o artigo entrar no ar na hora.
// Contém só o endereço do artigo e o horário; o título e o texto não saem antes da data.
import { instante } from '../lib/agenda.mjs';

export async function GET() {
  const modulos = import.meta.glob('./posts/*.md', { eager: true });
  const agora = Date.now();
  const agendados = Object.entries(modulos)
    .map(([caminho, m]) => ({
      slug: caminho.split('/').pop().replace(/\.md$/, ''),
      ms: instante(m.frontmatter?.date, m.frontmatter?.hora),
    }))
    .filter((p) => Number.isFinite(p.ms) && p.ms > agora)
    .sort((a, b) => a.ms - b.ms)
    .map((p) => ({ slug: p.slug, quando: new Date(p.ms).toISOString() }));

  return new Response(JSON.stringify({ gerado: new Date(agora).toISOString(), agendados }, null, 2), {
    headers: { 'content-type': 'application/json; charset=utf-8' },
  });
}
