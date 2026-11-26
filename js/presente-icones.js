// Ícones do presente do Paul: desenhados no estilo da marca (contorno grosso de grafite, dourado, vermelho e azul). Substituem os emojis do sistema.
// Só desenho (SVG fixo, sem dado de ninguém): `icone('planner')` devolve um <span> pronto pra pôr na tela.
const I = '#1b1818';
const D = {
  planner: `<rect x="7" y="10" width="34" height="32" rx="4" fill="#fffaf0" stroke="${I}" stroke-width="3"/><path d="M7 14a4 4 0 0 1 4-4h26a4 4 0 0 1 4 4v7H7z" fill="#d6283d" stroke="${I}" stroke-width="3" stroke-linejoin="round"/><path d="M15 6v8M33 6v8" stroke="${I}" stroke-width="3.4" stroke-linecap="round"/><path d="m13 29 3 3 5-6M26 29h9M13 38l3 3M26 38h9" fill="none" stroke="${I}" stroke-width="2.8" stroke-linecap="round" stroke-linejoin="round"/>`,
  wallpaper: `<rect x="12" y="4" width="24" height="40" rx="5" fill="${I}" stroke="${I}" stroke-width="3"/><rect x="15" y="9" width="18" height="30" rx="2" fill="#f6c445"/><path d="M15 33 22 25l4 4 3-3 4 5v5H15z" fill="#d6283d"/><circle cx="27" cy="16" r="3.2" fill="#fffaf0"/><path d="M21 43h6" stroke="#fffaf0" stroke-width="2" stroke-linecap="round"/>`,
  colorir: `<path d="m8 36 24-24 8 8-24 24-10 2z" fill="#f6c445" stroke="${I}" stroke-width="3" stroke-linejoin="round"/><path d="m32 12 5-5a3.6 3.6 0 0 1 5 0l3 3a3.6 3.6 0 0 1 0 5l-5 5z" fill="#d6283d" stroke="${I}" stroke-width="3" stroke-linejoin="round"/><path d="m8 36 4 4-6 2z" fill="${I}"/><path d="m18 22 8 8" stroke="${I}" stroke-width="2.6" stroke-linecap="round"/><circle cx="38" cy="38" r="4" fill="#2b59d6" stroke="${I}" stroke-width="2.6"/><circle cx="26" cy="41" r="2.6" fill="#14a06a" stroke="${I}" stroke-width="2.2"/>`,
  gift: `<rect x="6" y="19" width="36" height="8" rx="2" fill="#f6c445" stroke="${I}" stroke-width="3"/><path d="M9 27h30v15a2 2 0 0 1-2 2H11a2 2 0 0 1-2-2z" fill="#d6283d" stroke="${I}" stroke-width="3" stroke-linejoin="round"/><path d="M24 19v25" stroke="${I}" stroke-width="3"/><path d="M24 19c-3-9-12-9-12-4 0 3 6 4 12 4zm0 0c3-9 12-9 12-4 0 3-6 4-12 4z" fill="#f6c445" stroke="${I}" stroke-width="3" stroke-linejoin="round"/>`,
  baixar: `<path d="M24 6v24M13 21l11 11 11-11" fill="none" stroke="currentColor" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/><path d="M8 40h32" stroke="currentColor" stroke-width="5" stroke-linecap="round"/>`,
};
/** `<span class="pr-ico">` com o desenho. `nome`: planner | wallpaper | colorir | gift | baixar. */
export function icone(nome, classe = '') {
  const s = document.createElement('span'); s.className = `pr-ico pr-ico-${nome}${classe ? ` ${classe}` : ''}`; s.setAttribute('aria-hidden', 'true');
  s.innerHTML = `<svg viewBox="0 0 48 48" focusable="false">${D[nome] || ''}</svg>`; return s;
}
