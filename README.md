# rfarias — Blog Pessoal

Blog pessoal de **Rafael Farias da Silva** sobre tecnologia (Azure, Cloud, IA) e carreira (docência, palestras, liderança técnica).

## Stack

- [Astro](https://astro.build/) — gerador de sites estáticos
- [Cloudflare Pages](https://pages.cloudflare.com/) — hospedagem + CDN global
- [Pages CMS](https://pagescms.org/) — painel para publicar artigos (configuração em `.pages.yml`)
- Markdown — posts escritos em `.md`

## Desenvolvimento local

```bash
npm install
npm run dev
```

O site estará disponível em `http://localhost:4321`.

## Deploy (Cloudflare Pages)

### Setup inicial

1. Acesse [dash.cloudflare.com](https://dash.cloudflare.com) > **Workers & Pages** > **Create**
2. Conecte o repositório GitHub `rfarias-blog`
3. Configure:
   - **Build command:** `npm run build`
   - **Build output directory:** `dist`
   - **Node version:** 20 (em Environment Variables: `NODE_VERSION` = `20`)
4. Clique em **Save and Deploy**

### Domínio customizado

1. Após o primeiro deploy, vá em **Custom domains**
2. Adicione `rfarias.dev` (ou o domínio que comprar)
3. O Cloudflare configura o DNS e SSL automaticamente

### Painel de administração (CMS)

Acesse [app.pagescms.org](https://app.pagescms.org), entre com o GitHub e abra `raffarsi/rfarias-blog` na branch `main`. Cada "Salvar" vira um commit e o Cloudflare Pages publica sozinho. O artigo só aparece no site na data e hora definidas (regra em `src/lib/agenda.mjs`).

## Estrutura

```
src/
├── components/
│   ├── HeroPost.astro     # Destaque na home
│   ├── PostCard.astro      # Card de post
│   └── SEO.astro           # Open Graph + Twitter Cards
├── layouts/
│   ├── BaseLayout.astro    # Nav + footer + SEO
│   └── PostLayout.astro    # Post com TOC lateral (tech)
├── pages/
│   ├── index.astro         # Home
│   ├── tecnologia.astro    # Posts técnicos
│   ├── carreira.astro      # Posts de carreira
│   ├── treinamentos.astro  # Cursos e simulados
│   ├── sobre.astro         # Bio + links
│   ├── 404.astro           # Página de erro
│   └── posts/              # Artigos em Markdown
└── styles/
    └── global.css          # Design tokens
public/
├── _headers                # Segurança + cache
├── _redirects              # www → apex
└── robots.txt              # SEO
```

## Criando um novo post

### Via CMS (recomendado)

No Pages CMS, abra "Artigos", clique "Add an entry", preencha os campos e salve. Data no padrão `18 Nov 2026`; fora desse padrão o artigo não entra no ar.

### Via Markdown

Crie um arquivo `.md` em `src/pages/posts/`:

```markdown
---
layout: ../../layouts/PostLayout.astro
title: "Título do post"
category: "Azure"
tag: "tech"
date: "01 Set 2026"
readTime: "8 min"
description: "Descrição para SEO."
---

Conteúdo aqui...
```

## Identidade visual

| Elemento | Valor |
|----------|-------|
| Azul principal | `#1a56db` |
| Coral (carreira) | `#e8604c` |
| Títulos | Lora (serif) |
| Corpo | Inter (sans-serif) |
| Código | JetBrains Mono |

## Licença

Conteúdo © Rafael Farias da Silva. Código do tema sob MIT.
