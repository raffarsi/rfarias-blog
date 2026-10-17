// Gera /og-artigos/<slug>.png para cada artigo (imagem de prévia ao compartilhar o link).
import type { APIRoute } from 'astro';
import { gerarImagemArtigo } from '../../lib/og.mjs';

export async function getStaticPaths() {
  const modulos = import.meta.glob('../posts/*.md', { eager: true }) as Record<string, any>;
  return Object.entries(modulos)
    .filter(([, m]) => m.frontmatter?.title)
    .map(([caminho, m]) => ({
      params: { slug: caminho.split('/').pop()!.replace(/\.md$/, '') },
      props: { titulo: m.frontmatter.title, categoria: m.frontmatter.category },
    }));
}

export const GET: APIRoute = async ({ props }) => {
  const png = await gerarImagemArtigo(props as { titulo: string; categoria?: string });
  return new Response(png, { headers: { 'Content-Type': 'image/png' } });
};
