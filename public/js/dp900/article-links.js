// ============================================================================
// article-links.js — Mapeamento domínio → artigos do blog
// Injetado antes do app.js — define ARTICLE_LINKS global
// ============================================================================

const ARTICLE_LINKS = {
  // AZ-900
  "Cloud Concepts":             [{ title: "AZ-900 [1] — Conceitos de Cloud Computing", slug: "az900-01-conceitos-nuvem" }],
  "Nuvem Pública, Privada e Híbrida": [{ title: "AZ-900 [1] — Conceitos de Cloud Computing", slug: "az900-01-conceitos-nuvem" }],
  "Modelos IaaS, PaaS e SaaS": [{ title: "AZ-900 [3] — Computação e redes", slug: "az900-03-computacao-redes" }],
  "Azure Architecture":         [{ title: "AZ-900 [2] — Arquitetura e componentes do Azure", slug: "az900-02-arquitetura-azure" }],
  "Regiões e Availability Zones":[{ title: "AZ-900 [2] — Arquitetura e componentes do Azure", slug: "az900-02-arquitetura-azure" }],
  "Azure Resource Manager":     [{ title: "AZ-900 [2] — Arquitetura e componentes do Azure", slug: "az900-02-arquitetura-azure" }],
  "Resource Groups":            [{ title: "AZ-900 [2] — Arquitetura e componentes do Azure", slug: "az900-02-arquitetura-azure" }],
  "Compute Services":           [{ title: "AZ-900 [3] — Computação e redes", slug: "az900-03-computacao-redes" }],
  "Networking":                 [{ title: "AZ-900 [3] — Computação e redes", slug: "az900-03-computacao-redes" }],
  "Core Azure Services":        [{ title: "AZ-900 [3] — Computação e redes", slug: "az900-03-computacao-redes" }, { title: "AZ-900 [4] — Storage e banco de dados", slug: "az900-04-storage-database" }],
  "Storage":                    [{ title: "AZ-900 [4] — Storage e banco de dados", slug: "az900-04-storage-database" }],
  "Identity, Access and Security":[{ title: "AZ-900 [5] — Identidade, segurança e governança", slug: "az900-05-identidade-seguranca" }],
  "Microsoft Entra ID":         [{ title: "AZ-900 [5] — Identidade, segurança e governança", slug: "az900-05-identidade-seguranca" }],
  "Governance and Compliance":  [{ title: "AZ-900 [5] — Identidade, segurança e governança", slug: "az900-05-identidade-seguranca" }],
  "Azure Policy":               [{ title: "AZ-900 [5] — Identidade, segurança e governança", slug: "az900-05-identidade-seguranca" }],
  "Cost Management":            [{ title: "AZ-900 [6] — Custos, SLA e ciclo de vida", slug: "az900-06-custos-sla" }],
  "Azure Pricing":              [{ title: "AZ-900 [6] — Custos, SLA e ciclo de vida", slug: "az900-06-custos-sla" }],
  "SLA":                        [{ title: "AZ-900 [6] — Custos, SLA e ciclo de vida", slug: "az900-06-custos-sla" }],
  "Monitoring Tools":           [{ title: "AZ-900 [6] — Custos, SLA e ciclo de vida", slug: "az900-06-custos-sla" }],
  "Well-Architected Framework": [{ title: "AZ-900 [2] — Arquitetura e componentes do Azure", slug: "az900-02-arquitetura-azure" }],

  // AI-901
  "Panorama de Workloads de IA":          [{ title: "AI-901 [1] — Fundamentos de IA e ML", slug: "ai901-01-fundamentos-ia" }],
  "IA Responsável":                        [{ title: "AI-901 [5] — IA Responsável e Azure AI Foundry", slug: "ai901-05-ia-responsavel-foundry" }],
  "Modelos de IA Generativa e Configuração":[{ title: "AI-901 [3] — Linguagem natural e IA Generativa", slug: "ai901-03-linguagem-ia-generativa" }],
  "Análise de Texto e Fala":              [{ title: "AI-901 [2] — Azure AI Services: visão e fala", slug: "ai901-02-azure-ai-services" }],
  "Visão Computacional e Extração de Informação":[{ title: "AI-901 [2] — Azure AI Services: visão e fala", slug: "ai901-02-azure-ai-services" }],
  "Fundamentos do Microsoft Foundry e Prompts":[{ title: "AI-901 [5] — IA Responsável e Azure AI Foundry", slug: "ai901-05-ia-responsavel-foundry" }],
  "Agentes e Apps com Foundry SDK":       [{ title: "AI-901 [4] — IA conversacional e agentes", slug: "ai901-04-ia-conversacional" }],
  "Implementação de Texto e Fala com Foundry":[{ title: "AI-901 [2] — Azure AI Services: visão e fala", slug: "ai901-02-azure-ai-services" }],
  "Implementação de Visão e Geração de Imagem com Foundry":[{ title: "AI-901 [2] — Azure AI Services: visão e fala", slug: "ai901-02-azure-ai-services" }],
  "Content Understanding — Extração de Informação na Prática":[{ title: "AI-901 [3] — Linguagem natural e IA Generativa", slug: "ai901-03-linguagem-ia-generativa" }],

  // SC-900
  "Conceitos de Segurança":     [{ title: "SC-900 [1] — Zero Trust e defesa em profundidade", slug: "sc900-01-zero-trust-defesa" }],
  "Conceitos de Conformidade":  [{ title: "SC-900 [4] — Conformidade e Microsoft Purview", slug: "sc900-04-conformidade-purview" }],
  "Identidade e Acesso":        [{ title: "SC-900 [2] — Identidade e acesso com Entra ID", slug: "sc900-02-identidade-entra" }],
  "Soluções de Segurança":      [{ title: "SC-900 [3] — Soluções de segurança Microsoft", slug: "sc900-03-solucoes-seguranca" }],
  "Conformidade Microsoft":     [{ title: "SC-900 [4] — Conformidade e Microsoft Purview", slug: "sc900-04-conformidade-purview" }, { title: "SC-900 [5] — Governança e Service Trust Portal", slug: "sc900-05-governanca-trust" }],

  // DP-900
  "Conceitos Core de Dados":            [{ title: "DP-900 [1] — Conceitos fundamentais de dados", slug: "dp900-01-conceitos-dados" }],
  "Dados Relacionais no Azure":         [{ title: "DP-900 [2] — Dados relacionais no Azure", slug: "dp900-02-dados-relacionais" }],
  "Dados Não Relacionais no Azure":     [{ title: "DP-900 [3] — Dados não relacionais e Cosmos DB", slug: "dp900-03-dados-nao-relacionais" }],
  "Cargas de Trabalho de Analytics no Azure":[{ title: "DP-900 [4] — Analytics, Synapse e Power BI", slug: "dp900-04-analytics-powerbi" }, { title: "DP-900 [5] — Pipelines e governança de dados", slug: "dp900-05-pipelines-governanca" }],

  // AZ-104 (para uso futuro)
  "Entra ID e Identidade":      [{ title: "AZ-104 [1] — Gerenciando identidades com Entra ID", slug: "az104-01-entra-id-na-pratica" }],
  "RBAC":                        [{ title: "AZ-104 [2] — RBAC: controle de acesso", slug: "az104-02-rbac-escopos" }],
  "Azure Policy e Governança":  [{ title: "AZ-104 [3] — Azure Policy e governança", slug: "az104-03-azure-policy" }],
  "Storage Accounts":           [{ title: "AZ-104 [4] — Storage Accounts", slug: "az104-04-storage-accounts" }],
  "Azure Files":                 [{ title: "AZ-104 [5] — Azure Files e File Sync", slug: "az104-05-azure-files" }],
  "Virtual Machines":           [{ title: "AZ-104 [6] — VMs: criação e configuração", slug: "az104-06-virtual-machines" }],
  "Alta Disponibilidade":       [{ title: "AZ-104 [7] — VMs: disponibilidade e Scale Sets", slug: "az104-07-vm-disponibilidade" }],
  "App Service":                 [{ title: "AZ-104 [8] — Azure App Service", slug: "az104-08-app-service" }],
  "Containers e AKS":           [{ title: "AZ-104 [9] — Containers: ACI e AKS", slug: "az104-09-containers-aks" }],
  "VNets e Subnets":            [{ title: "AZ-104 [10] — VNets, subnets e peering", slug: "az104-10-vnets-subnets" }],
  "NSG e Roteamento":           [{ title: "AZ-104 [11] — NSG, UDR e roteamento", slug: "az104-11-nsg-roteamento" }],
  "Load Balancer":              [{ title: "AZ-104 [12] — Load Balancer e Application Gateway", slug: "az104-12-load-balancer" }],
  "VPN e ExpressRoute":         [{ title: "AZ-104 [13] — VPN Gateway e ExpressRoute", slug: "az104-13-vpn-expressroute" }],
  "Azure Monitor":              [{ title: "AZ-104 [14] — Azure Monitor e Log Analytics", slug: "az104-14-azure-monitor" }],
  "Backup e Recuperação":       [{ title: "AZ-104 [15] — Backup e Azure Site Recovery", slug: "az104-15-backup" }],
  "Gerenciamento de Custos":    [{ title: "AZ-104 [16] — Gerenciamento de custos", slug: "az104-16-custos" }],
};

function getArticleLinks(domain) {
  return ARTICLE_LINKS[domain] || [];
}

function buildArticleLinkHTML(domain) {
  const links = getArticleLinks(domain);
  if (!links.length) return '';
  return `<div class="article-link-box">
    <span class="article-link-label">📖 Leia no blog:</span>
    ${links.map(l => `<a href="/posts/${l.slug}" target="_blank" class="article-link">${l.title} →</a>`).join('')}
  </div>`;
}
