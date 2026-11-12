// Regra de publicacao agendada do blog. Um lugar so, usado pelas paginas e pelo sitemap.
const MESES = { Jan:1, Fev:2, Mar:3, Abr:4, Mai:5, Jun:6, Jul:7, Ago:8, Set:9, Out:10, Nov:11, Dez:12 };
const avisados = new Set();
export const HORA_PADRAO = '10:00';   // artigo entra as 10h de Brasilia, junto com o post do LinkedIn

// "24 Set 2026" + "10:00" -> instante em UTC, respeitando o fuso de Sao Paulo
export function instante(dataPt, hora = HORA_PADRAO) {
  const p = String(dataPt || '').trim().split(/\s+/);
  const [dia, mes, ano] = [Number(p[0]), MESES[p[1]], Number(p[2])];
  // Data fora do padrao "24 Set 2026" (mes desconhecido, dia ou ano invalido): o artigo NAO publica.
  // Antes, mes desconhecido virava janeiro e o artigo podia entrar no ar antes da data.
  if (p.length !== 3 || !mes || !Number.isInteger(dia) || dia < 1 || dia > 31 || !Number.isInteger(ano) || ano < 2000) {
    if (!avisados.has(dataPt)) {
      avisados.add(dataPt);
      console.warn(`[agenda] data invalida "${dataPt}": artigo fica fora do ar ate a data ser corrigida (use ex.: 24 Set 2026)`);
    }
    return Infinity;
  }
  // Hora sem aspas no frontmatter (hora: 14:30) chega como numero: o YAML le "14:30" como 14*60+30 = 870.
  // Aqui o numero volta a ser 14:30. Hora invalida (ex.: 25:00, "10h") tambem nao publica.
  // Numero abaixo de 60 (ex.: hora: 10) e ambiguo e e tratado como invalido.
  const horaTxt = typeof hora === 'number'
    ? (Number.isInteger(hora) && hora >= 60 ? `${Math.floor(hora / 60)}:${String(hora % 60).padStart(2, '0')}` : 'invalida')
    : String(hora || HORA_PADRAO).trim();
  const m = horaTxt.match(/^(\d{1,2}):(\d{2})$/);
  const [h, min] = m ? [Number(m[1]), Number(m[2])] : [NaN, NaN];
  if (!(h >= 0 && h <= 23 && min >= 0 && min <= 59)) {
    const chave = `${dataPt} ${hora}`;
    if (!avisados.has(chave)) {
      avisados.add(chave);
      console.warn(`[agenda] hora invalida "${hora}" em "${dataPt}": artigo fica fora do ar ate a hora ser corrigida (use ex.: 10:00)`);
    }
    return Infinity;
  }
  const palpite = Date.UTC(ano, mes - 1, dia, h, min || 0);
  const local = new Date(palpite).toLocaleString('sv-SE', { timeZone: 'America/Sao_Paulo' });
  return palpite - (Date.parse(local.replace(' ', 'T') + 'Z') - palpite);
}

export const jaPublicado = (dataPt, hora, agora = Date.now()) => instante(dataPt, hora) <= agora;
