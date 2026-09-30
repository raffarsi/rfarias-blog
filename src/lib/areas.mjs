// Organização dos artigos por área (páginas /networking e /compute) e escolha de artigos relacionados.
// Tudo aqui é lido na hora do build; artigo agendado só aparece depois da data (jaPublicado).
import { instante, jaPublicado } from './agenda.mjs';

// Trilhas de certificação têm navegação própria (anterior/próximo); ficam fora das áreas e dos relacionados.
export const PREFIXOS_TRILHA = ['az900-', 'az104-', 'ai901-', 'dp900-', 'sc900-', 'aula-', 'simulado-'];
export const ehTrilha = (slug) => PREFIXOS_TRILHA.some((p) => slug.startsWith(p));

// Cada área: quais tags entram e como agrupar por assunto (primeiro grupo cuja palavra aparece no slug).
export const AREAS = {
  networking: {
    titulo: 'Azure Networking',
    subtitulo: 'Conectividade, segurança de rede, DNS e arquitetura de rede no Azure, a partir de problemas reais de produção.',
    tags: ['networking'],
    fixos: { 'azure-front-door-waf-cdn': 'Balanceamento e entrega global' },
    grupos: [
      { nome: 'Conectividade híbrida', palavras: ['expressroute', 'vpn', 'hibrida', 'sdwan', 'route-server', 'virtual-wan'] },
      { nome: 'Segurança de rede', palavras: ['firewall', 'nsg', 'asg', 'waf', 'ddos', 'bastion', 'network-manager', 'nva', 'network-policies', 'egress'] },
      { nome: 'Acesso privado e DNS', palavras: ['private', 'dns', 'vnet-integration', 'vnets-privadas'] },
      { nome: 'Balanceamento e entrega global', palavras: ['load-balancer', 'application-gateway', 'front-door', 'traffic-manager'] },
      { nome: 'Topologia, roteamento e diagnóstico', palavras: ['hub', 'peering', 'topology', 'multi-region', 'nat-gateway', 'network-watcher', 'fundamentos', 'latencia'] },
    ],
  },
  compute: {
    titulo: 'Azure Compute',
    subtitulo: 'Máquinas virtuais, escala, Kubernetes, capacidade e operação da infraestrutura de compute no Azure.',
    tags: ['infra'],
    extras: ['aks-'],   // artigos de AKS com tag networking também aparecem aqui, no grupo de Kubernetes
    grupos: [
      { nome: 'VMs, escala e capacidade', palavras: ['vmss', 'capacity', 'golden-image', 'gpu', 'onde-rodar'] },
      { nome: 'Kubernetes (AKS)', palavras: ['aks', 'kubernetes', 'network-policies'] },
      { nome: 'Operação, resiliência e governança', palavras: ['monitor', 'backup', 'arc'] },
    ],
  },
};

// Lê os módulos de import.meta.glob e devolve só o que já está no ar.
export function listarPublicados(modulos, agora = Date.now()) {
  return Object.entries(modulos)
    .map(([caminho, mod]) => ({
      slug: caminho.split('/').pop().replace(/\.md$/, ''),
      fm: mod.frontmatter || {},
    }))
    .filter((p) => p.fm.title && jaPublicado(p.fm.date, p.fm.hora, agora))
    .map((p) => ({
      slug: p.slug,
      title: p.fm.title,
      category: p.fm.category,
      tag: p.fm.tag,
      date: p.fm.date,
      hora: p.fm.hora,
      readTime: p.fm.readTime,
      excerpt: p.fm.excerpt || p.fm.description || '',
      quando: instante(p.fm.date, p.fm.hora),
    }));
}

function grupoNaArea(area, slug) {
  if (area.fixos && area.fixos[slug]) return area.grupos.findIndex((g) => g.nome === area.fixos[slug]);
  return area.grupos.findIndex((g) => g.palavras.some((w) => slug.includes(w)));
}

const pertence = (area, p) =>
  !ehTrilha(p.slug) && (area.tags.includes(p.tag) || (area.extras || []).some((e) => p.slug.startsWith(e) || p.slug.includes(e)));

export function agruparArea(posts, chave) {
  const area = AREAS[chave];
  const daArea = posts.filter((p) => pertence(area, p)).sort((a, b) => b.quando - a.quando);
  const grupos = area.grupos.map((g) => ({ nome: g.nome, posts: [] }));
  const outros = { nome: 'Outros temas', posts: [] };
  for (const p of daArea) {
    const i = grupoNaArea(area, p.slug);
    (i >= 0 ? grupos[i] : outros).posts.push(p);
  }
  return { ...area, total: daArea.length, grupos: [...grupos, outros].filter((g) => g.posts.length > 0) };
}

// Assunto do artigo dentro da área da própria tag (ou null), usado para priorizar relacionados.
function assunto(p) {
  for (const area of Object.values(AREAS)) {
    if (!area.tags.includes(p.tag)) continue;
    const i = grupoNaArea(area, p.slug);
    if (i >= 0) return area.grupos[i].nome;
  }
  return null;
}

const PARADAS = new Set(['azure', 'virtual', 'network', 'networking', 'rede', 'redes', 'vnet', 'de', 'do', 'da', 'e', 'o', 'a', 'com', 'para', 'por', 'sem', 'em', 'no', 'na', 'vs', 'como', 'que']);
const termos = (slug) => new Set(slug.split('-').filter((w) => w.length > 2 && !PARADAS.has(w)));

// Até `n` artigos da mesma tag, por afinidade de termos no slug e, no empate, os mais recentes.
export function relacionados(posts, atual, n = 3) {
  if (!atual || ehTrilha(atual.slug)) return [];
  const excluir = new Set([atual.slug, ...(atual.excluir || [])]);
  const meus = termos(atual.slug);
  const meuAssunto = assunto(atual);
  return posts
    .filter((p) => p.tag === atual.tag && !excluir.has(p.slug) && !ehTrilha(p.slug))
    .map((p) => {
      let score = meuAssunto && assunto(p) === meuAssunto ? 3 : 0;
      for (const t of termos(p.slug)) if (meus.has(t)) score++;
      return { ...p, score };
    })
    .sort((a, b) => b.score - a.score || b.quando - a.quando)
    .slice(0, n);
}

export function areaDaTag(tag) {
  return Object.entries(AREAS).find(([, a]) => a.tags.includes(tag))?.[0] || null;
}
