// Presente do Paul: no Início de quem está em "experimentar grátis" (sem código) aparece "quer um presente especial do Paul?".
// Formulário: nome, e-mail e WhatsApp do RESPONSÁVEL (basta um dos dois), faixa de idade, instrumento favorito e a caixinha SEPARADA de novidades (desmarcada).
// O presente é liberado na hora. Os dados vão pra função presente_registrar (supabase/023_presente_paul.sql); nada pessoal fica no aparelho além de "já abriu".
import { h } from './util.js';
import { sheet, toast } from './ui.js';
import { CONFIG } from './config.js';
import * as CODE from './codigo.js';
import * as AC from './acesso.js';
import { FAIXAS, INSTRUMENTOS, ICONE_INSTRUMENTO, PRESENTES } from './presente-config.js';

const KEY = 'beaterista-presente-paul'; // guarda só { faixa, escolha, em }: o cartão some depois que a pessoa ESCOLHEU o presente (se fechou antes de escolher, o cartão volta direto na escolha)
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
      h('span', { class: 'pr-opcao-i', 'aria-hidden': 'true' }, p.icone), h('span', { class: 'pr-opcao-t' }, h('b', {}, p.titulo), h('small', {}, p.desc)), h('i', { 'aria-hidden': 'true' }, '›')))));
}
/** Passo 3: o presente escolhido (arquivos pra abrir ou salvar). */
function telaPresente(p, fecha) {
  return h('div', { class: 'sheet-body pr-ok' }, confeteEl(),
    h('img', { class: 'pr-paul-fest', src: 'assets/paul/animacoes/web/paul-comemoracao.webp', alt: '', width: 150, height: 150, draggable: 'false' }),
    h('h2', { class: 'pr-ok-tit' }, 'seu presente chegou!'),
    h('p', { class: 'pr-ok-sub' }, `${p.icone} ${p.titulo}: toque pra abrir ou salvar:`),
    h('div', { class: 'pr-lista' }, ...p.arquivos.map((a, i) => h('a', { class: 'pr-ticket', href: a.arquivo, target: '_blank', rel: 'noopener', download: '' }, h('span', { class: 'pr-ticket-n' }, String(i + 1)), h('span', { class: 'pr-ticket-t' }, a.nome), h('b', {}, '🎁 abrir')))),
    h('button', { type: 'button', class: 'pr-fechar', onclick: fecha }, 'fechar'));
}
/** Escolha + presente numa folha só (usada logo depois do formulário e quando a pessoa volta sem ter escolhido). */
function fluxoEscolha(box, faixa, fecha, aoEscolher, instr) {
  const gravaEscolha = (id) => { const ja = lerAbriu() || {}; try { localStorage.setItem(KEY, JSON.stringify({ faixa, instr: instr || ja.instr || null, escolha: id, token: ja.token || null, em: Date.now() })); } catch { /* sem storage */ } anotaEscolha(ja.token, id); };
  box.replaceChildren(telaEscolha(faixa, (p) => { gravaEscolha(p.id); if (aoEscolher) aoEscolher(); box.replaceChildren(telaPresente(p, fecha)); }, instr));
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
    const botao = h('button', { type: 'button', class: 'btn primary wide' }, 'abrir meu presente 🎁');
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
      } catch { erro.textContent = 'sem internet agora. tente de novo.'; } finally { botao.disabled = false; botao.textContent = 'abrir meu presente 🎁'; }
    });
    const box = h('div', { class: 'sheet-body pr-form' },
      h('header', { class: 'pr-topo' }, h('img', { src: 'assets/paul/animacoes/web/paul-presente.webp', alt: '', width: 96, height: 88, draggable: 'false' }),
        h('div', {}, h('small', {}, 'presente especial'), h('h2', {}, 'o Paul preparou um presente pra você! 🎁'), h('p', {}, 'conta um pouquinho de você:'))),
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
    h('div', { class: 'pr-cartao-txt' }, h('b', {}, ja ? 'escolha o seu presente do Paul!' : 'quer um presente especial do Paul?'), h('small', {}, ja ? 'falta só escolher 🎁' : 'uma surpresa de graça pra você 🎁'), h('button', { type: 'button', class: 'pr-abrir', onclick: () => abrirFormulario(() => el.remove(), () => { const b = el.querySelector('b'), sm = el.querySelector('small'); if (b) b.textContent = 'escolha o seu presente do Paul!'; if (sm) sm.textContent = 'falta só escolher 🎁'; }) }, 'abrir meu presente 🎁')));
  return el;
}
