---
layout: ../../layouts/PostLayout.astro
title: "Microsoft Entra ID: o que mudou do Azure AD e por que importa para você"
category: "IAM"
tag: "azure"
date: "07 Ago 2025"
readTime: "7 min"
description: "O Azure Active Directory virou Microsoft Entra ID. Mais do que renomeação, é uma mudança de posicionamento. Entenda o que mudou na prática."
---

Em julho de 2023, a Microsoft renomeou o Azure Active Directory para **Microsoft Entra ID**. Para quem usa no dia a dia, a pergunta imediata é: mudou alguma coisa além do nome?

A resposta curta: sim — e a mudança vai além de marketing.

## Por que a renomeação importa

O Azure AD foi criado como o serviço de identidade para a nuvem Microsoft — autenticação para Microsoft 365, Azure e aplicações empresariais. Com o tempo, ele cresceu muito além disso: passou a suportar identidades externas (B2B e B2C), Privileged Identity Management, Conditional Access, Workload Identities e muito mais.

O problema: o nome "Azure Active Directory" sugeria que era apenas "o AD, mas no Azure" — uma extensão do Active Directory on-premises. Na prática, o serviço evoluiu para uma plataforma de identidade completa e independente.

**Microsoft Entra** é agora a família de produtos de identidade e acesso da Microsoft, que inclui:
- **Microsoft Entra ID** — o antigo Azure AD (identidade para workforce e aplicações)
- **Microsoft Entra External ID** — o antigo Azure AD B2B e B2C
- **Microsoft Entra ID Governance** — ciclo de vida de identidades e entitlement management
- **Microsoft Entra Permissions Management** — gerenciamento de permissões multi-cloud (CIEM)
- **Microsoft Entra Verified ID** — credenciais verificáveis descentralizadas

## O que continua igual

Para a maioria dos administradores e desenvolvedores, o dia a dia não mudou:
- As APIs (Microsoft Graph) continuam as mesmas
- Os portais de administração são os mesmos (Entra admin center = antigo Azure AD portal)
- PowerShell e CLI continuam funcionando
- SDKs e bibliotecas MSAL não mudaram

Os IDs de tenant, App Registrations, grupos, usuários — tudo continua no lugar.

## O que mudou de verdade

**1. Posicionamento como plataforma multi-cloud**

O Entra ID agora é explicitamente posicionado como identidade para qualquer cloud, não só Azure. Workload Identities (identidades para aplicações e serviços) e Permissions Management são projetados para funcionar com AWS e GCP também.

**2. Entra ID Governance**

O que antes era um add-on (Identity Governance) agora é uma parte central da família Entra. Access reviews, entitlement management e lifecycle workflows são o padrão para organizações maduras.

**3. Terminologia atualizada**

Algumas mudanças de nomenclatura que aparecem no portal:
- "Azure AD roles" → "Microsoft Entra roles"
- "Enterprise Applications" → continua no mesmo lugar, mas sob "Entra ID"
- "App Registrations" → continua igual

**4. Licenciamento consolidado**

Os planos P1 e P2 do Azure AD viraram **Microsoft Entra ID P1** e **Microsoft Entra ID P2**. O conteúdo é o mesmo.

## O que isso significa na prática para administradores Azure

Se você gerencia identidades no Azure, o impacto imediato é pequeno. Mas vale atenção para:

- Documentação e scripts que referenciam "Azure AD" precisarão ser atualizados ao longo do tempo
- O portal principal de administração agora é **entra.microsoft.com** (o antigo aad.portal.azure.com redireciona)
- Treinamentos e certificações já estão sendo atualizados — o AZ-104 e SC-900 já refletem a nova nomenclatura

<div class="callout">
<strong>Para candidatos a certificações:</strong> Nos exames Microsoft atuais, você vai encontrar "Microsoft Entra ID" como o nome oficial. Se o seu material de estudo ainda diz "Azure AD", verifique se está atualizado — o conteúdo técnico é o mesmo, mas a nomenclatura nos exames já mudou.
</div>

## Conclusão

A mudança de nome para Microsoft Entra ID reflete uma evolução real do produto — de serviço de identidade Azure para plataforma de identidade multi-cloud. Para o dia a dia operacional, o impacto é mínimo. Para o posicionamento estratégico e roadmap de funcionalidades, a direção ficou mais clara: identidade como plataforma independente de qual cloud você usa.
