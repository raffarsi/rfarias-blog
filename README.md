# rfarias — Blog Pessoal

Blog pessoal de **Rafael Farias da Silva** sobre tecnologia (Azure, Cloud, IA) e carreira (docência, palestras, liderança técnica).

## Stack

- [Astro](https://astro.build/) — gerador de sites estáticos
- [Cloudflare Pages](https://pages.cloudflare.com/) — hospedagem + CDN global
- [Decap CMS](https://decapcms.org/) — editor visual de posts
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

Acesse `seudominio.dev/admin/` para escrever e publicar posts pelo navegador.

> **Nota:** Na primeira vez, o Decap CMS pedirá autorização para acessar seu repositório GitHub. Depois disso, cada post publicado vira um commit automático.

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
├── admin/                  # Decap CMS
├── _headers                # Segurança + cache
├── _redirects              # www → apex
└── robots.txt              # SEO
```

## Criando um novo post

### Via CMS (recomendado)

Acesse `/admin/`, escolha "Posts — Tecnologia" ou "Posts — Carreira", clique "New" e escreva.

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
