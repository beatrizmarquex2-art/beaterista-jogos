// TABELA ÚNICA DE PREÇOS DO PASSE ANUAL, por data. Sem imports de propósito: o app, a entrada, a página de vendas e o checkout Pix leem a MESMA tabela.
// Pra mudar um valor, um selo ou um link: só aqui. A troca acontece sozinha na data de `desde` (meia-noite de Brasília).
// ATENÇÃO: o valor REALMENTE cobrado no Pix mora na função do servidor (supabase/functions/mercadopago-passe) e o do cartão, na Hotmart.
// Os três precisam trocar juntos (veja LEIA-ME-TROCA-DE-PRECO.md).
export const PERIODOS = [
  { desde: '1970-01-01T00:00:00-03:00', pix: 49.9, cartao: 79.9, selo: 'Oferta de lançamento', notaPix: 'Oferta de lançamento no Pix.', linkCartao: 'https://pay.hotmart.com/Y108629105P' },
  // 2027: se na Hotmart você criar uma OFERTA nova (link novo), cole o link novo em linkCartao. Se só mudar o preço da oferta atual, deixe o mesmo link.
  { desde: '2027-01-01T00:00:00-03:00', pix: 99.9, cartao: 119.9, selo: 'Acesso por 12 meses', notaPix: 'Pagamento único no Pix.', linkCartao: 'https://pay.hotmart.com/Y108629105P' },
];
export const brl = (n) => `R$ ${n.toFixed(2).replace('.', ',')}`;
/** Período vigente em `agora` (milissegundos). Se o relógio do aparelho estiver errado, só o texto na tela muda: quem cobra é o servidor. */
export function periodo(agora = Date.now()) {
  let p = PERIODOS[0];
  for (const x of PERIODOS) if (Date.parse(x.desde) <= agora) p = x;
  return p;
}
export const precos = (agora = Date.now()) => { const p = periodo(agora); return { ...p, txtPix: brl(p.pix), txtCartao: brl(p.cartao) }; };
