// "Meu passe" (aba Perfil do aluno): uma mensagem simples pra cada situação. Só LÊ o estado (código guardado, tipo e resposta do servidor); nunca grava nada.
//  · matriculado       -> passe ativo, acesso grátis enquanto a matrícula estiver ativa
//  · ex-aluno          -> oferta de R$ 49,90 (pagamento único, 1 ano) no MESMO código, pelo canal que preserva o código
//  · passe pago        -> passe ativo
//  · sem código        -> explicação do passe anual e como adquirir
import { h } from './util.js';
import * as CODE from './codigo.js';
import { TXT_PIX, TXT_CARTAO, URL_CARTAO, pixAtivo } from './oferta.js';
import { ligarCompra } from './escolha-pagamento.js';

const WHATS = '5518991804150'; // canal que mantém o MESMO código do ex-aluno (o Pix automático gera um código novo de comprador)
const tipoSalvo = () => { try { return localStorage.getItem('beaterista-aluno-tipo') || ''; } catch { return ''; } };

/** 'ex' | 'matriculado' | 'pago' | 'sem' | null (professora / sem o que mostrar) */
export function situacao() {
  if (!document.documentElement.classList.contains('aluno-on')) return null; // só na área dos alunos
  const c = CODE.saved(); if (!c) return 'sem';
  if (CODE.motivoFalha() === 'matricula') return 'ex';
  const t = tipoSalvo(); if (t === 'prof') return null;
  if (t === 'turma') return 'matriculado'; if (t === 'passe') return 'pago'; return null;
}
const anual = () => { const r = CODE.ultimoAcesso(); const e = r && r.expira_em ? new Date(r.expira_em).getTime() : 0; return e - Date.now() > 200 * 864e5; }; // só diz "anual" quando o vencimento é mesmo de ~1 ano

export function cartaoMeuPasse() {
  const s = situacao(); if (!s) return null;
  const box = (cls, ...kids) => h('section', { class: `mp mp-${cls}`, 'aria-label': 'meu passe', role: 'status' }, ...kids);
  if (s === 'matriculado') return box('ok', h('span', { class: 'mp-rot' }, 'meu passe'), h('h3', {}, 'seu passe beaterista está ativo!'),
    h('p', {}, 'você tem acesso gratuito aos jogos porque faz parte da Escola de Música Beaterista.'), h('p', {}, 'continue aprendendo, jogando e colecionando com o Robôterista Paul!'), h('p', { class: 'mp-nota' }, 'acesso gratuito enquanto sua matrícula estiver ativa.'));
  if (s === 'pago') return box('ok', h('span', { class: 'mp-rot' }, 'meu passe'), h('h3', {}, anual() ? 'seu passe anual está ativo!' : 'seu passe está ativo!'),
    h('p', {}, 'continue aprendendo, jogando e colecionando com o Robôterista Paul!'));
  if (s === 'ex') {
    const c = CODE.saved();
    return box('ex', h('span', { class: 'mp-rot' }, 'meu passe'), h('h3', {}, 'hey! quer continuar jogando?'),
      h('p', {}, 'sua matrícula terminou, mas suas conquistas continuam guardadas!'), h('p', {}, 'continue no Beaterista por apenas:'),
      h('p', { class: 'mp-preco' }, h('b', {}, 'R$ 49,90'), ' — pagamento único'), h('p', { class: 'mp-preco2' }, '1 ano de acesso'),
      h('p', {}, 'você mantém seu código, suas figurinhas e todo o progresso disponível na sua conta.'),
      h('a', { class: 'mp-btn', 'data-compra': 'ex-aluno', href: `https://wa.me/${WHATS}?text=${encodeURIComponent(`Olá! Minha matrícula terminou e quero continuar no Beaterista Play por R$ 49,90 (1 ano). Meu código é ${c}.`)}`, target: '_blank', rel: 'noopener noreferrer' }, 'quero continuar jogando'));
  }
  // sem código
  const pix = pixAtivo();
  return box('sem', h('span', { class: 'mp-rot' }, 'meu passe'), h('h3', {}, 'você ainda não tem um passe'),
    h('p', {}, 'o Passe Anual libera todos os jogos, as aulas, o álbum de figurinhas e as conquistas por 12 meses, em até 2 aparelhos.'),
    h('p', {}, pix ? h('span', {}, h('b', {}, TXT_PIX), ' no Pix ou ', h('b', {}, TXT_CARTAO), ' no cartão · pagamento único') : h('span', {}, h('b', {}, TXT_CARTAO), ' no cartão · pagamento único')),
    h('p', { class: 'mp-nota' }, 'o código chega no seu e-mail assim que o pagamento é confirmado. já tem código? toque em “tenho código” lá em cima.'),
    ligarCompra(h('a', { class: 'mp-btn', 'data-compra': pix ? 'escolha' : 'cartao', href: URL_CARTAO, target: '_blank', rel: 'noopener noreferrer' }, 'quero meu passe'), 'meu-passe'));
}
