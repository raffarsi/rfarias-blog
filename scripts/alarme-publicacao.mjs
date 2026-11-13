// Alarme de publicação do rfarias.com.
// Roda todo dia às 10h30 (Brasília) pelo GitHub Actions (.github/workflows/alarme-publicacao.yml).
// Confere se o site está no ar e se os artigos que já deviam ter saído aparecem em /artigos/.
// Se algo faltar, o script termina com erro e o GitHub manda um e-mail para o dono do repositório.
// Só lê: não muda nada no site nem no repositório.
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { instante } from '../src/lib/agenda.mjs';

const SITE = process.env.SITE_URL || 'https://rfarias.com';
const PASTA = new URL('../src/pages/posts/', import.meta.url).pathname;
const DIAS_OLHADOS = 7;               // só cobra artigos que deviam ter saído nos últimos 7 dias
const HORA_REBUILD = { h: 10, min: 5 }; // o worker do Cloudflare reconstrói o site às 10h05

// Instante do último rebuild diário (10h05 de Brasília de hoje, ou de ontem se ainda não deu 10h05)
function ultimoRebuild(agora = Date.now()) {
  const hojeSP = new Date(agora).toLocaleDateString('sv-SE', { timeZone: 'America/Sao_Paulo' }); // AAAA-MM-DD
  const [a, m, d] = hojeSP.split('-').map(Number);
  const MES = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
  const hora = `${HORA_REBUILD.h}:${String(HORA_REBUILD.min).padStart(2, '0')}`;
  const hoje = instante(`${d} ${MES[m - 1]} ${a}`, hora);
  return hoje <= agora ? hoje : hoje - 24 * 60 * 60 * 1000;
}

// Lê data e hora do frontmatter sem dependências (linhas "date:" e "hora:")
function frontmatter(texto) {
  const bloco = texto.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  const campo = (nome) => {
    const l = bloco && bloco[1].match(new RegExp(`^${nome}:\\s*(.*)$`, 'm'));
    return l ? l[1].trim().replace(/^["']|["']$/g, '') : undefined;
  };
  return { date: campo('date'), hora: campo('hora') || undefined };
}

async function buscar(caminho) {
  const url = `${SITE}${caminho}${caminho.includes('?') ? '&' : '?'}alarme=${Date.now()}`;
  const r = await fetch(url, { headers: { 'cache-control': 'no-cache', 'user-agent': 'rfarias-alarme-publicacao' } });
  return { status: r.status, html: r.ok ? await r.text() : '' };
}

const agora = Date.now();
const corte = ultimoRebuild(agora);
const devidos = readdirSync(PASTA)
  .filter((f) => f.endsWith('.md'))
  .map((f) => ({ slug: f.replace(/\.md$/, ''), ...frontmatter(readFileSync(join(PASTA, f), 'utf8')) }))
  .map((p) => ({ ...p, quando: instante(p.date, p.hora) }))
  .filter((p) => Number.isFinite(p.quando) && p.quando <= corte && p.quando > agora - DIAS_OLHADOS * 86400000);

const problemas = [];
const home = await buscar('/');
if (home.status !== 200) problemas.push(`A home respondeu ${home.status} (esperado 200).`);
const lista = await buscar('/artigos/');
if (lista.status !== 200) problemas.push(`A página /artigos/ respondeu ${lista.status} (esperado 200).`);
else {
  for (const p of devidos) {
    if (!lista.html.includes(`/posts/${p.slug}/`)) {
      problemas.push(`O artigo "${p.slug}" (${p.date}${p.hora ? ' ' + p.hora : ''}) já devia estar em /artigos/ e não está.`);
    }
  }
}

const fmt = (ms) => new Date(ms).toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' });
console.log(`Último rebuild esperado: ${fmt(corte)}. Artigos cobrados (últimos ${DIAS_OLHADOS} dias): ${devidos.length}.`);
devidos.forEach((p) => console.log(`  - ${p.slug} (${p.date}${p.hora ? ' ' + p.hora : ''})`));

if (problemas.length) {
  console.error('\nALARME: a publicação não saiu como esperado.');
  problemas.forEach((t) => console.error(`  * ${t}`));
  console.error('\nO que olhar: no Cloudflare, Workers e Pages > rfarias-blog > Implantações (o rebuild das 10h05 rodou e terminou com sucesso?).');
  process.exit(1);
}
console.log('\nTudo certo: o site está no ar e os artigos do período aparecem em /artigos/.');
