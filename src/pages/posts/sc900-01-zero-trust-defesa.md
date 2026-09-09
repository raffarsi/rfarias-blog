---
layout: ../../layouts/PostLayout.astro
title: "SC-900 na prática [1] — Zero Trust e defesa em profundidade"
category: "Azure"
tag: "azure"
serie: "SC-900 na prática"
serieSlug: "sc900"
serieNum: 1
date: "11 Abr 2026"
readTime: "9 min"
description: "Fundamentos de segurança: modelo Zero Trust, defesa em profundidade e responsabilidade compartilhada."
next:
  title: "SC-900 [2] — Identidade e Acesso"
  slug: "sc900-02-identidade-entra"

---

O SC-900 testa conceitos de segurança, conformidade e identidade na nuvem Microsoft. Este artigo cobre os fundamentos que embasam todo o exame.

## Modelo de Responsabilidade Compartilhada

A segurança na nuvem é dividida entre Microsoft e cliente. A divisão muda conforme o modelo de serviço:

| Responsabilidade | On-premises | IaaS | PaaS | SaaS |
|-----------------|-------------|------|------|------|
| Dados e acesso | Cliente | Cliente | Cliente | Cliente |
| Aplicação | Cliente | Cliente | Cliente | Microsoft |
| SO e runtime | Cliente | Cliente | Microsoft | Microsoft |
| Rede virtual | Cliente | Cliente | Microsoft | Microsoft |
| Infraestrutura física | Cliente | Microsoft | Microsoft | Microsoft |

**Regra geral:** a Microsoft é sempre responsável pela segurança **da** nuvem; o cliente é responsável pela segurança **na** nuvem.

## Zero Trust — Nunca confie, sempre verifique

Zero Trust abandona o modelo de perímetro (firewall externo protege tudo dentro). Em vez disso, **toda requisição é tratada como potencialmente hostil**, independente de origem.

**Três princípios:**

**1. Verificar explicitamente** — sempre autenticar e autorizar com base em todos os dados disponíveis: identidade, localização, dispositivo, serviço, carga de trabalho, classificação de dados.

**2. Usar menor privilégio** — limitar acesso ao mínimo necessário. JIT (Just-in-Time) e JEA (Just-Enough-Access). Acesso privilegiado só quando necessário e pelo tempo mínimo.

**3. Assumir violação** — minimizar o raio de explosão. Segmentar redes e usuários. Criptografar tudo. Monitorar continuamente para detectar e responder a anomalias.

```bash
# Implementar Zero Trust com Acesso Condicional
# (requer Entra ID P1 ou P2)

# Política: bloquear acesso de dispositivos não conformes
az rest --method POST \
  --url "https://graph.microsoft.com/v1.0/identity/conditionalAccess/policies" \
  --body '{
    "displayName": "ZeroTrust-DeviceCompliance",
    "state": "enabled",
    "conditions": {
      "users": {"includeUsers": ["All"]},
      "applications": {"includeApplications": ["All"]}
    },
    "grantControls": {
      "operator": "AND",
      "builtInControls": ["mfa", "compliantDevice"]
    }
  }'
```

## Defesa em Profundidade

Múltiplas camadas de segurança — se uma falha, as outras ainda protegem:

```
Camada 7: Dados (criptografia, classificação)
Camada 6: Aplicação (WAF, SAST, DAST)
Camada 5: Computação (antivírus, patches, EDR)
Camada 4: Rede (NSG, firewall, segmentação)
Camada 3: Perímetro (DDoS Protection, Azure Firewall)
Camada 2: Identidade (MFA, RBAC, PIM)
Camada 1: Segurança física (datacenter Microsoft)
```

<div class="callout">
<strong>Dica para o exame:</strong> O SC-900 frequentemente apresenta cenários e pede qual camada da defesa em profundidade está sendo aplicada, ou qual princípio do Zero Trust está sendo implementado. Associe: MFA = verificar explicitamente; RBAC com menor privilégio = usar menor privilégio; segmentação de rede = assumir violação.
</div>

## Ameaças comuns

**Phishing** — emails falsos que imitam entidades confiáveis para roubar credenciais.
**Ransomware** — malware que criptografa dados e exige pagamento.
**DDoS** — sobrecarregar serviços com tráfego para torná-los indisponíveis.
**Man-in-the-Middle** — interceptar comunicação entre duas partes.
**SQL Injection** — inserir comandos SQL maliciosos em campos de entrada.
**XSS** — injetar scripts maliciosos em páginas web.

## Microsoft Security Response Center (MSRC)

Equipe responsável por receber e responder a vulnerabilidades em produtos Microsoft. Opera o programa Bug Bounty — pesquisadores recebem recompensas por vulnerabilidades reportadas responsavelmente.

**Patch Tuesday** — segunda terça-feira de cada mês, Microsoft lança atualizações de segurança regulares.

## O que cai no exame

- Responsabilidade compartilhada por modelo (IaaS/PaaS/SaaS)
- Três princípios do Zero Trust com exemplos
- Camadas da defesa em profundidade
- Tipos de ameaças (phishing, ransomware, DDoS, MitM)
- MSRC e Patch Tuesday
