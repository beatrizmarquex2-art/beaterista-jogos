// Presente do Paul: no Início de quem está em "experimentar grátis" (sem código) aparece "quer um presente especial do Paul?".
// Formulário: nome, e-mail e WhatsApp do RESPONSÁVEL (basta um dos dois), faixa de idade, instrumento favorito e a caixinha SEPARADA de novidades (desmarcada).
// O presente é liberado na hora. Os dados vão pra função presente_registrar (supabase/023_presente_paul.sql); nada pessoal fica no aparelho além de "já abriu".
import { h } from './util.js';
import { sheet, toast } from './ui.js';
import { CONFIG } from './config.js';
import * as CODE from './codigo.js';
import * as AC from './acesso.js';
import { FAIXAS, INSTRUMENTOS, ICONE_INSTRUMENTO, PRESENTES } from './presente-config.js';
import { icone } from './presente-icones.js';

const KEY = 'beaterista-presente-paul'; // guarda só { faixa, instr, escolha, itens, token, em }: o cartão some depois que a pessoa ESCOLHEU o presente (se fechou antes de escolher, o cartão volta direto na escolha)
const previa = () => { try { return /[?&]presente-preview(?:[=&#]|$)/.test(location.search); } catch { return false; } };
const lerAbriu = () => { try { return JSON.parse(localStorage.getItem(KEY) || 'null'); } catch { return null; } };
/** Presentes disponíveis pra essa faixa de idade (só os que têm arquivo). Na prévia (?presente-preview), os 3 aparecem com um arquivo de teste. */
export function presentesDaFaixa(faixa, instr) {
  const out = []; for (const [id, p] of Object.entries(PRESENTES)) {
    let arq = (p.arquivos || []).filter((a) => (!a.faixas || !faixa || a.faixas.includes(faixa)) && (!a.instrumentos || !instr || instr === 'outro' || a.instrumentos.includes(instr)));
    if (!arq.length && previa()) arq = [{ nome: `${p.titulo} (arquivo de teste)`, arquivo: 'assets/paul/animacoes/web/paul-presente.webp' }];
    if (arq.length) out.push({ id, ...p, arquivos: arq });
  } return out;
}
export const presenteAtivo = () => previa() || Object.values(PRESENTES).some((p) => (p.arquivos || []).length > 0);
const semCodigo = () => { try { return document.documentElement.classList.contains('aluno-on') && !AC.liberado() && !CODE.saved(); } catch { return false; } };

/** Avisa o banco qual presente a pessoa escolheu (só com o token do contato; nunca trava nem bloqueia o presente se falhar). */
const anotaEscolha = (token, id) => { if (!token) return; try { fetch(`${CONFIG.SUPABASE_URL}/rest/v1/rpc/presente_escolher`, { method: 'POST', keepalive: true, headers: { apikey: CONFIG.SUPABASE_ANON_KEY, Authorization: `Bearer ${CONFIG.SUPABASE_ANON_KEY}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ p_token: token, p_presente: id }) }).catch(() => {}); } catch { /* sem rede: o presente vem do mesmo jeito */ } };
/** Avisa o banco QUAIS itens a pessoa levou (ids dos arquivos; supabase/025_presente_itens.sql). Falha em silêncio: o presente vem do mesmo jeito. */
const anotaItens = (token, ids) => { if (!token || !ids || !ids.length) return; try { fetch(`${CONFIG.SUPABASE_URL}/rest/v1/rpc/presente_itens`, { method: 'POST', keepalive: true, headers: { apikey: CONFIG.SUPABASE_ANON_KEY, Authorization: `Bearer ${CONFIG.SUPABASE_ANON_KEY}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ p_token: token, p_itens: ids }) }).catch(() => {}); } catch { /* sem rede */ } };
export const idDe = (a) => String(a.arquivo || '').split('/').pop().replace(/\.[a-z0-9]+$/i, '');
const MAX_ITENS = 3; // wallpaper e colorir: a pessoa escolhe 3 na grade; planner vem todo do instrumento dela
const TIPO = { planner: 'planner · PDF pra imprimir', wallpaper: 'wallpaper · imagem pro celular', colorir: 'pra colorir · PDF tamanho A4' };
const chamar = async (corpo) => {
  const r = await fetch(`${CONFIG.SUPABASE_URL}/rest/v1/rpc/presente_registrar`, { method: 'POST', headers: { apikey: CONFIG.SUPABASE_ANON_KEY, Authorization: `Bearer ${CONFIG.SUPABASE_ANON_KEY}`, 'Content-Type': 'application/json' }, body: JSON.stringify(corpo) });
  if (!r.ok) throw new Error(String(r.status)); return r.json();
};

const confeteEl = () => h('div', { class: 'pr-confete', 'aria-hidden': 'true' }, ...Array.from({ length: 14 }, (_, i) => h('i', { style: `--i:${i}` })));
/** Passo 2: a pessoa ESCOLHE 1 presente. */
function telaEscolha(faixa, escolheu, instr) {
  const lista = presentesDaFaixa(faixa, instr);
  return h('div', { class: 'sheet-body pr-ok pr-escolha' }, confeteEl(),
    h('img', { class: 'pr-paul-fest', src: 'assets/paul/animacoes/web/paul-comemoracao.webp', alt: '', width: 120, height: 120, draggable: 'false' }),
    h('h2', { class: 'pr-ok-tit' }, 'escolha o seu presente!'),
    h('p', { class: 'pr-ok-sub' }, 'o Paul separou estes presentes. toque no que você mais gostar:'),
    h('div', { class: 'pr-opcoes' }, ...lista.map((p) => h('button', { type: 'button', class: 'pr-opcao', 'data-p': p.id, onclick: () => escolheu(p) },
      h('span', { class: 'pr-opcao-i', 'aria-hidden': 'true' }, icone(p.id)), h('span', { class: 'pr-opcao-t' }, h('b', {}, p.titulo), h('small', {}, p.desc)), h('i', { 'aria-hidden': 'true' }, '›')))));
}
/** Passo 2b: GRADE. Wallpaper e colorir: a pessoa toca em 3 miniaturas e só então o presente é liberado. */
function telaGrade(p, liberar, voltar) {
  const max = Math.min(MAX_ITENS, p.arquivos.length), sel = [];
  const nomeItem = p.id === 'wallpaper' ? ['wallpaper', 'wallpapers'] : ['desenho', 'desenhos'];
  const cont = h('b', { class: 'pr-grade-cont', 'aria-live': 'polite' }), dica = h('p', { class: 'pr-grade-dica', role: 'status' });
  const bt = h('button', { type: 'button', class: 'pr-liberar' });
  const tiles = p.arquivos.map((a) => { const b = h('button', { type: 'button', class: `pr-tile pr-tile-${p.id}`, 'aria-pressed': 'false', 'aria-label': a.nome, title: a.nome },
    h('img', { src: a.mini || a.arquivo, alt: '', loading: 'lazy', draggable: 'false' }), h('span', { class: 'pr-tile-n', 'aria-hidden': 'true' }, ''));
    b.addEventListener('click', () => { const i = sel.indexOf(a); if (i >= 0) sel.splice(i, 1); else if (sel.length < max) sel.push(a); else { dica.textContent = `já são ${max}! toque em um escolhido pra trocar.`; return; } pinta(); }); return [a, b]; });
  const pinta = () => { const grade = tiles[0] && tiles[0][1].parentElement; if (grade) grade.classList.toggle('cheio', sel.length === max); tiles.forEach(([a, b]) => { const i = sel.indexOf(a); b.classList.toggle('on', i >= 0); b.setAttribute('aria-pressed', String(i >= 0)); b.querySelector('.pr-tile-n').textContent = i >= 0 ? String(i + 1) : ''; });
    const falta = max - sel.length; cont.textContent = `${sel.length} de ${max}`; dica.textContent = falta > 0 ? `toque em mais ${falta} pra liberar.` : 'prontinho! agora é só liberar.';
    bt.disabled = falta > 0; bt.replaceChildren(...(falta > 0 ? [`escolha mais ${falta}`] : [`liberar meus ${max} ${max === 1 ? nomeItem[0] : nomeItem[1]} `, icone('gift')])); };
  bt.addEventListener('click', () => { if (sel.length === max) liberar(sel.slice()); });
  const el = h('div', { class: 'sheet-body pr-ok pr-grade' },
    h('button', { type: 'button', class: 'pr-voltar', onclick: voltar }, '‹ voltar'),
    h('h2', { class: 'pr-ok-tit pr-grade-tit' }, icone(p.id), ` escolha ${max} ${max === 1 ? nomeItem[0] : nomeItem[1]}`),
    h('p', { class: 'pr-ok-sub' }, 'toque nos que você mais gostar. toque de novo pra tirar.'),
    h('div', { class: `pr-grade-grid pr-grade-${p.id}` }, ...tiles.map((t) => t[1])),
    h('div', { class: 'pr-grade-rodape' }, h('div', { class: 'pr-grade-info' }, cont, dica), bt));
  pinta(); return el;
}
/** Passo 3: ENTREGA. Cada item vira um cartão com a miniatura, o nome e o botão de baixar. */
function telaPresente(p, itens, fecha) {
  const n = itens.length;
  return h('div', { class: 'sheet-body pr-ok pr-entrega' }, confeteEl(),
    h('div', { class: 'pr-ent-topo' },
      h('img', { class: 'pr-paul-fest', src: 'assets/paul/animacoes/web/paul-comemoracao.webp', alt: '', width: 110, height: 110, draggable: 'false' }),
      h('div', { class: 'pr-ent-tt' }, h('span', { class: 'pr-ent-fita' }, icone(p.id), ` ${p.titulo}`), h('h2', { class: 'pr-ok-tit' }, 'seu presente chegou!'), h('p', { class: 'pr-ok-sub' }, `${n} ${n === 1 ? 'item' : 'itens'} pra você. é só baixar.`))),
    h('div', { class: 'pr-cartas' }, ...itens.map((a, i) => h('article', { class: `pr-carta pr-carta-${p.id}`, style: `--r:${i % 2 ? 1.4 : -1.4}deg;--d:${i * 110}ms` },
      h('a', { class: 'pr-carta-img', href: a.arquivo, target: '_blank', rel: 'noopener', 'aria-label': `abrir ${a.nome}` }, h('img', { src: a.mini || a.arquivo, alt: '', loading: 'lazy', draggable: 'false' }), h('i', { class: 'pr-carta-n', 'aria-hidden': 'true' }, String(i + 1))),
      h('div', { class: 'pr-carta-t' }, h('small', {}, TIPO[p.id] || 'presente'), h('b', {}, a.nome), h('a', { class: 'pr-baixar', href: a.arquivo, download: '', target: '_blank', rel: 'noopener' }, icone('baixar'), ' baixar'))))),
    p.id === 'wallpaper' ? h('p', { class: 'pr-ent-dica' }, 'no celular: abra a imagem, segure o dedo nela e toque em “salvar”.') : (p.id === 'planner' || p.id === 'colorir' ? h('p', { class: 'pr-ent-dica' }, 'abra o PDF e imprima em folha A4.') : null),
    h('button', { type: 'button', class: 'pr-fechar', onclick: fecha }, 'fechar'));
}
/** Escolha + grade + entrega numa folha só (usada logo depois do formulário e quando a pessoa volta sem ter escolhido). */
function fluxoEscolha(box, faixa, fecha, aoEscolher, instr) {
  const grava = (id, itens) => { const ja = lerAbriu() || {}; const ids = itens.map(idDe); try { localStorage.setItem(KEY, JSON.stringify({ faixa, instr: instr || ja.instr || null, escolha: id, itens: ids, token: ja.token || null, em: Date.now() })); } catch { /* sem storage */ } anotaEscolha(ja.token, id); anotaItens(ja.token, ids); };
  const entrega = (p, itens) => { grava(p.id, itens); if (aoEscolher) aoEscolher(); box.replaceChildren(telaPresente(p, itens, fecha)); };
  const inicio = () => box.replaceChildren(telaEscolha(faixa, (p) => { if (p.id === 'planner' || p.arquivos.length <= MAX_ITENS) entrega(p, p.arquivos); else box.replaceChildren(telaGrade(p, (itens) => entrega(p, itens), inicio)); }, instr));
  inicio();
}

/** Abre o formulário numa folha. `aoAbrir` roda quando o presente é liberado (o cartão some). */
export function abrirFormulario(aoAbrir, aoPreencher) {
  sheet('presente do Paul', (close) => {
    const ja = lerAbriu(); if (ja && !ja.escolha && ja.faixa) { const caixa = h('div', {}); fluxoEscolha(caixa, ja.faixa, close, aoAbrir, ja.instr); return caixa; }
    let nomeSalvo = ''; try { nomeSalvo = localStorage.getItem('beaterista-aluno-nome') || ''; } catch { /* sem storage */ }
    let faixa = '', instr = '';
    const campo = (rot, el) => h('label', { class: 'field pr-campo' }, h('span', {}, rot), el);
    const nome = h('input', { class: 'field', type: 'text', maxlength: 60, autocomplete: 'name', autocapitalize: 'words', value: nomeSalvo, 'aria-label': 'Nome' });
    const email = h('input', { class: 'field', type: 'email', inputmode: 'email', maxlength: 160, autocomplete: 'email', autocapitalize: 'none', spellcheck: 'false', placeholder: 'nome@exemplo.com', 'aria-label': 'E-mail' });
    const zap = h('input', { class: 'field', type: 'tel', inputmode: 'tel', maxlength: 20, autocomplete: 'tel', placeholder: '(00) 00000-0000', 'aria-label': 'WhatsApp' });
    const outro = h('input', { class: 'field', type: 'text', maxlength: 40, placeholder: 'qual?', 'aria-label': 'Qual instrumento', hidden: true });
    const aceita = h('input', { type: 'checkbox', id: 'pr-aceita' });
    const erro = h('p', { class: 'pr-erro', role: 'alert' });
    const rotBotao = () => botao.replaceChildren('abrir meu presente ', icone('gift'));
    const botao = h('button', { type: 'button', class: 'btn primary wide' }); rotBotao();
    const fichas = (lista, atual, onPick, rotulo) => { const box = h('div', { class: `pr-chips${rotulo === 'Instrumento favorito' ? ' pr-inst' : ''}`, role: 'radiogroup', 'aria-label': rotulo }); const pinta = () => box.querySelectorAll('button').forEach((b) => { const on = b.dataset.v === atual(); b.classList.toggle('on', on); b.setAttribute('aria-checked', String(on)); });
      lista.forEach(([v, t]) => box.append(h('button', { type: 'button', role: 'radio', 'aria-checked': 'false', 'data-v': v, class: 'pr-chip', onclick: () => { onPick(v); pinta(); } }, ICONE_INSTRUMENTO[v] && rotulo === 'Instrumento favorito' ? h('span', { class: 'pr-chip-i', 'aria-hidden': 'true' }, ICONE_INSTRUMENTO[v]) : null, rotulo === 'Instrumento favorito' ? h('small', {}, t) : t))); return { box, pinta }; };
    const idade = h('select', { class: 'field pr-select', 'aria-label': 'Sua idade' }, h('option', { value: '', disabled: true, selected: true }, 'toque pra escolher'), ...FAIXAS.map(([v, t]) => h('option', { value: v }, t))); idade.addEventListener('change', () => { faixa = idade.value; });
    const fx = { box: idade, pinta: () => {} }; const ins = fichas(INSTRUMENTOS, () => instr, (v) => { instr = v; outro.hidden = v !== 'outro'; if (v === 'outro') outro.focus(); }, 'Instrumento favorito');
    botao.addEventListener('click', async () => {
      erro.textContent = '';
      const n = nome.value.trim(); const em = email.value.trim(); const dz = zap.value.replace(/\D/g, '');
      if (n.length < 2) { erro.textContent = 'escreva o seu nome.'; nome.focus(); return; }
      if (!em && !dz) { erro.textContent = 'coloque seu e-mail ou seu WhatsApp pra gente enviar o presente.'; email.focus(); return; }
      if (em && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(em)) { erro.textContent = 'confira o e-mail: parece que falta alguma coisa.'; email.focus(); return; }
      if (dz && dz.length < 10) { erro.textContent = 'confira o WhatsApp: coloque o DDD e o número.'; zap.focus(); return; }
      if (!faixa) { erro.textContent = 'escolha a sua idade.'; return; }
      if (!instr) { erro.textContent = 'escolha o instrumento que você mais ama.'; return; }
      botao.disabled = true; botao.textContent = 'abrindo…';
      try {
        const r = await chamar({ p_nome: n, p_email: em || null, p_whatsapp: dz || null, p_instrumento: instr, p_outro: outro.value.trim() || null, p_faixa: faixa, p_aceita: aceita.checked, p_origem: 'inicio' });
        if (!r || r.ok !== true) { erro.textContent = r && r.motivo === 'contato' ? 'não consegui entender o contato. confira o e-mail ou o WhatsApp.' : 'não deu pra abrir agora. confira os campos e tente de novo.'; return; }
        try { localStorage.setItem(KEY, JSON.stringify({ faixa, instr, escolha: null, token: r.token || null, em: Date.now() })); } catch { /* sem storage */ } // guarda só o token (não é dado pessoal), nunca e-mail nem WhatsApp
        if (aoPreencher) aoPreencher();
        fluxoEscolha(box, faixa, close, aoAbrir, instr);
      } catch { erro.textContent = 'sem internet agora. tente de novo.'; } finally { botao.disabled = false; rotBotao(); }
    });
    const box = h('div', { class: 'sheet-body pr-form' },
      h('header', { class: 'pr-topo' }, h('img', { src: 'assets/paul/animacoes/web/paul-presente.webp', alt: '', width: 96, height: 88, draggable: 'false' }),
        h('div', {}, h('small', {}, 'presente especial'), h('h2', {}, 'o Paul preparou um presente pra você!'), h('p', {}, 'conta um pouquinho de você:'))),
      h('section', { class: 'pr-sec' },
        campo('nome', nome), h('div', { class: 'field pr-campo' }, h('span', {}, 'idade'), fx.box), campo('e-mail', email), campo('WhatsApp', zap),
        h('div', { class: 'field pr-campo' }, h('span', {}, 'instrumento que você mais ama'), ins.box, outro)),
      h('label', { class: 'pr-aceita' }, aceita, h('span', {}, h('b', {}, 'quero receber novidades e ofertas'), h('small', {}, 'da Beaterista · você pode sair quando quiser'))),
      h('p', { class: 'pr-lgpd' }, '🔒 se você tem menos de 18 anos, coloque o contato de um responsável. usamos os dados só pra te enviar o presente e, se você marcar a caixinha acima, também novidades.'),
      erro, botao);
    fx.pinta(); ins.pinta(); return box;
  });
}

/** O cartão do Início. Devolve null quando não deve aparecer (tem código, já abriu, ou ainda não há presente configurado). */
export function cartaoPresente() {
  const ja = lerAbriu(); if (!presenteAtivo() || !semCodigo() || (ja && ja.escolha)) return null;
  const el = h('section', { class: 'pr-cartao', 'aria-label': 'presente especial do Paul' },
    h('span', { class: 'pr-fita' }, 'presente'),
    h('img', { class: 'pr-cartao-paul', src: 'assets/paul/animacoes/web/paul-presente.webp', alt: '', width: 96, height: 96, loading: 'lazy', draggable: 'false' }),
    h('div', { class: 'pr-cartao-txt' }, h('b', {}, ja ? 'escolha o seu presente do Paul!' : 'quer um presente especial do Paul?'), h('small', {}, ja ? 'falta só escolher' : 'uma surpresa de graça pra você'), h('button', { type: 'button', class: 'pr-abrir', onclick: () => abrirFormulario(() => el.remove(), () => { const b = el.querySelector('b'), sm = el.querySelector('small'); if (b) b.textContent = 'escolha o seu presente do Paul!'; if (sm) sm.textContent = 'falta só escolher'; }) }, 'abrir meu presente ', icone('gift'))));
  return el;
}
