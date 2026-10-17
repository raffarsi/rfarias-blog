// Imagem de compartilhamento (Open Graph) de cada artigo, gerada no build.
// Só aparece na prévia do link (LinkedIn, WhatsApp etc.); não é exibida no site.
import fs from 'node:fs';
import path from 'node:path';
import satori from 'satori';
import { Resvg } from '@resvg/resvg-js';

const dirFontes = path.resolve('node_modules/@fontsource/inter/files');
const fontes = [
  { name: 'Inter', weight: 400, style: 'normal', data: fs.readFileSync(path.join(dirFontes, 'inter-latin-400-normal.woff')) },
  { name: 'Inter', weight: 700, style: 'normal', data: fs.readFileSync(path.join(dirFontes, 'inter-latin-700-normal.woff')) },
];

const el = (type, style, children) => ({ type, props: { style, children } });

// Símbolo do blog (o mesmo do favicon), em SVG embutido
const simbolo = 'data:image/svg+xml;base64,' + Buffer.from(
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 40 40" width="56" height="56">' +
  '<line x1="20" y1="12" x2="20" y2="19" stroke="#50B0F0" stroke-width="2"/>' +
  '<line x1="17.5" y1="24" x2="11" y2="27" stroke="#50B0F0" stroke-width="2"/>' +
  '<line x1="22.5" y1="24" x2="29" y2="27" stroke="#50B0F0" stroke-width="2"/>' +
  '<circle cx="20" cy="8" r="4" fill="#50B0F0"/><circle cx="8" cy="28" r="4" fill="#50B0F0"/>' +
  '<circle cx="32" cy="28" r="4" fill="#50B0F0"/><circle cx="20" cy="22" r="3" fill="#E8604C"/></svg>'
).toString('base64');

export async function gerarImagemArtigo({ titulo, categoria }) {
  const n = titulo.length;
  const tamanho = n > 110 ? 46 : n > 80 ? 54 : n > 55 ? 62 : 70;
  const arvore = el('div', {
    width: '1200px', height: '630px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
    background: '#0B1E3D', padding: '64px 72px', fontFamily: 'Inter',
  }, [
    el('div', { display: 'flex', flexDirection: 'column' }, [
      el('div', { fontSize: '24px', fontWeight: 700, letterSpacing: '4px', color: '#50B0F0', textTransform: 'uppercase', marginBottom: '28px' }, categoria || 'Artigo'),
      el('div', { fontSize: `${tamanho}px`, fontWeight: 700, color: '#FFFFFF', lineHeight: 1.15, display: 'flex' }, titulo),
    ]),
    el('div', { display: 'flex', alignItems: 'center', borderTop: '2px solid #1E3A66', paddingTop: '28px' }, [
      { type: 'img', props: { src: simbolo, width: 56, height: 56, style: { marginRight: '20px' } } },
      el('div', { display: 'flex', flexDirection: 'column' }, [
        el('div', { fontSize: '26px', fontWeight: 700, color: '#FFFFFF' }, 'Rafael Farias da Silva'),
        el('div', { fontSize: '22px', color: '#50B0F0', marginTop: '4px' }, 'rfarias.com'),
      ]),
    ]),
  ]);
  const svg = await satori(arvore, { width: 1200, height: 630, fonts: fontes });
  return new Resvg(svg, { fitTo: { mode: 'width', value: 1200 } }).render().asPng();
}
