// Regra de publicacao agendada do blog. Um lugar so, usado pelas paginas e pelo sitemap.
const MESES = { Jan:1, Fev:2, Mar:3, Abr:4, Mai:5, Jun:6, Jul:7, Ago:8, Set:9, Out:10, Nov:11, Dez:12 };
export const HORA_PADRAO = '10:00';   // artigo entra as 10h de Brasilia, junto com o post do LinkedIn

// "24 Set 2026" + "10:00" -> instante em UTC, respeitando o fuso de Sao Paulo
export function instante(dataPt, hora = HORA_PADRAO) {
  const p = String(dataPt || '').trim().split(' ');
  if (p.length < 3) return 0;
  const [dia, mes, ano] = [Number(p[0]), MESES[p[1]] || 1, Number(p[2])];
  const [h, min] = String(hora || HORA_PADRAO).split(':').map(Number);
  const palpite = Date.UTC(ano, mes - 1, dia, h, min || 0);
  const local = new Date(palpite).toLocaleString('sv-SE', { timeZone: 'America/Sao_Paulo' });
  return palpite - (Date.parse(local.replace(' ', 'T') + 'Z') - palpite);
}

export const jaPublicado = (dataPt, hora, agora = Date.now()) => instante(dataPt, hora) <= agora;
