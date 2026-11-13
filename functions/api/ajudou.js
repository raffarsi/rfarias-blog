// "Este artigo te ajudou?": recebe o voto (sim ou não) de um artigo e soma no banco D1 AJUDOU.
// Guarda só o endereço do artigo e os dois totais. Nada sobre quem votou (sem IP, sem cookie).
// Os totais não são públicos: consulte no Cloudflare (D1 > rfarias-ajudou > Console):
//   SELECT slug, sim, nao, atualizado FROM votos ORDER BY sim + nao DESC;

// Aceita o site, as prévias do Pages e o teste local (localhost)
const ORIGENS = /^(https:\/\/((www\.)?rfarias\.com|([a-z0-9-]+\.)?rfarias-blog\.pages\.dev)|http:\/\/localhost:\d+)$/;

// A tabela é criada na primeira vez que a função roda (mesmo SQL de db/ajudou.sql)
let tabelaPronta = false;
async function garantirTabela(db) {
  if (tabelaPronta) return;
  await db.prepare(
    `CREATE TABLE IF NOT EXISTS votos (
       slug TEXT PRIMARY KEY,
       sim INTEGER NOT NULL DEFAULT 0,
       nao INTEGER NOT NULL DEFAULT 0,
       atualizado TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
     )`
  ).run();
  tabelaPronta = true;
}

const resposta = (corpo, status = 200) =>
  new Response(JSON.stringify(corpo), {
    status,
    headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' },
  });

export async function onRequestPost({ request, env }) {
  const origem = request.headers.get('origin') || '';
  if (!ORIGENS.test(origem)) return resposta({ ok: false, erro: 'origem' }, 403);
  if (!env.AJUDOU) return resposta({ ok: false, erro: 'indisponivel' }, 503);

  let dados;
  try {
    dados = await request.json();
  } catch {
    return resposta({ ok: false, erro: 'formato' }, 400);
  }
  const slug = String(dados?.slug || '');
  const voto = dados?.voto === 'sim' ? 'sim' : dados?.voto === 'nao' ? 'nao' : null;
  if (!/^[a-z0-9-]{3,120}$/.test(slug) || !voto) return resposta({ ok: false, erro: 'dados' }, 400);

  // Só conta voto de artigo que existe no site
  const pagina = await env.ASSETS.fetch(new URL(`/posts/${slug}/`, request.url));
  if (pagina.status !== 200) return resposta({ ok: false, erro: 'artigo' }, 404);

  await garantirTabela(env.AJUDOU);
  await env.AJUDOU.prepare(
    `INSERT INTO votos (slug, sim, nao) VALUES (?1, ?2, ?3)
     ON CONFLICT(slug) DO UPDATE SET sim = sim + excluded.sim, nao = nao + excluded.nao, atualizado = CURRENT_TIMESTAMP`
  )
    .bind(slug, voto === 'sim' ? 1 : 0, voto === 'nao' ? 1 : 0)
    .run();

  return resposta({ ok: true });
}
