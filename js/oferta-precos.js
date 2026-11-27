// Preço do Pix por data (meia-noite de Brasília). SEM imports de propósito: o app, a página de vendas e a Lojinha leem a mesma tabela.
// IGUAL à tabela PRECOS_PIX da função mercadopago-passe (supabase/functions/mercadopago-passe/index.ts, repositório beateristapp-): se mudar aqui, mude lá (é a função que cobra de verdade).
// Hoje: promoção de Natal R$ 49,90 até 31/12/2026; a partir de 01/01/2027, R$ 99,90.
export const PRECOS_PIX = [
  { desde: '1970-01-01T00:00:00-03:00', valor: 49.9 },
  { desde: '2027-01-01T00:00:00-03:00', valor: 99.9 },
];
export const FIM_NATAL = '2027-01-01T00:00:00-03:00'; // a oferta vale até 31/12/2026 23:59 (Brasília)
export const brl = (n) => `R$ ${n.toFixed(2).replace('.', ',')}`;
export function precoPixAgora(agora = Date.now()) { let v = PRECOS_PIX[0].valor; for (const p of PRECOS_PIX) if (Date.parse(p.desde) <= agora) v = p.valor; return v; }
export const emOferta = (agora = Date.now()) => agora < Date.parse(FIM_NATAL);
export const seloPix = (agora = Date.now()) => (emOferta(agora) ? 'Oferta de Natal · até 31/12' : 'Pagamento único');
export const PRECO_NORMAL_PIX = PRECOS_PIX[PRECOS_PIX.length - 1].valor;
