// Trilhas de leitura da home e da página de artigo (aprovadas em 12/11/2026; lista em redesign/trilhas.md no Project).
// A ordem dos slugs é a ordem de leitura. Artigo agendado ou removido some sozinho da trilha.
export const TRILHAS = [
  {
    id: 'rede',
    nome: 'Rede no Azure',
    desc: 'Do básico à arquitetura: VNets, NSG, conectividade privada e híbrida.',
    tags: ['networking'],
    cta: 'Ver todos de Networking',
    ctaHref: '/artigos/?cat=networking',
    slugs: [
      'azure-networking-fundamentos-vnet-subnet',
      'nsg-na-pratica-regras-seguranca-rede',
      'azure-vnet-peering-hub-spoke-basico',
      'service-endpoint-ou-private-endpoint-azure',
      'dns-privado-arquiteturas-ia-multi-vnet',
      'troubleshooting-conectividade-hibrida-azure',
    ],
  },
  {
    id: 'ia',
    nome: 'IA Generativa no Azure',
    desc: 'Do primeiro projeto à produção: dados, limites, rede e agentes.',
    tags: ['ia-generativa'],
    cta: 'Ver todos de IA Generativa',
    ctaHref: '/artigos/?cat=ia-generativa',
    slugs: [
      'azure-openai-primeiros-passos-corporativo',
      'azure-openai-grounding-dados-corporativos',
      'rag-chunking-estrategias-azure',
      'azure-openai-rate-limits-producao',
      'azure-openai-exposto-na-internet-private-link',
      'multi-agent-azure-ai-foundry-orchestracao',
    ],
  },
  {
    id: 'compute',
    nome: 'Compute e Infra',
    desc: 'VMs que aguentam produção: imagem, escala, capacidade e latência.',
    tags: ['infra'],
    cta: 'Ver todos de Infra',
    ctaHref: '/artigos/?cat=infra',
    slugs: [
      'golden-image-azure-compute-gallery-image-builder',
      'vmss-flexible-autoscale-pico',
      'spot-vms-azure-quando-vale-o-risco',
      'azure-capacity-reservation-zonas-alocacao',
      'proximity-placement-groups-latencia-vms',
      'aks-upgrade-sem-downtime-surge-pdb',
    ],
  },
  {
    id: 'identidade',
    nome: 'Identidade e segurança',
    desc: 'Entra ID, acesso privilegiado, segredos e governança.',
    tags: ['iam', 'seguranca'],
    cta: 'Ver todos de IAM',
    ctaHref: '/artigos/?cat=iam',
    slugs: [
      'azure-ad-entra-id-o-que-mudou',
      'azure-app-registrations-service-principals',
      'azure-pim-privileged-identity-management',
      'azure-key-vault-boas-praticas',
      'azure-defender-for-cloud-postura',
      'azure-blueprints-landing-zone',
    ],
  },
];

export const CERTIFICACOES = {
  nome: 'Certificações Microsoft',
  desc: 'Séries de estudo com simulados, labs e ranking dentro do blog.',
  total: '5 certificações',
  cta: 'Abrir os treinamentos',
  ctaHref: '/treinamentos/',
  passos: [
    { titulo: 'AZ-900 · Azure Fundamentals', href: '/series/az900/' },
    { titulo: 'AI-901 · AI Fundamentals', href: '/series/ai901/' },
    { titulo: 'SC-900 · Security, Compliance & Identity', href: '/series/sc900/' },
    { titulo: 'DP-900 · Azure Data Fundamentals', href: '/series/dp900/' },
    { titulo: 'AZ-104 · Azure Administrator', href: '/series/az104/' },
  ],
};

// posts: lista de artigos já publicados com { slug, title }. Devolve os passos que existem, em ordem.
export function passosDaTrilha(trilha, posts) {
  const porSlug = new Map(posts.map((p) => [p.slug, p]));
  return trilha.slugs
    .map((s) => porSlug.get(s))
    .filter(Boolean)
    .map((p) => ({ slug: p.slug, titulo: p.title, href: `/posts/${p.slug}/` }));
}

// A trilha em que o artigo está, com a posição dele entre os passos publicados (ou null).
export function trilhaDoArtigo(slug, posts) {
  for (const t of TRILHAS) {
    const passos = passosDaTrilha(t, posts);
    const i = passos.findIndex((p) => p.slug === slug);
    if (i >= 0) return { trilha: t, passos, indice: i };
  }
  return null;
}
