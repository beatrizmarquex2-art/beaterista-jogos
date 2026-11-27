// Preço do Pix por data (meia-noite de Brasília). SEM imports de propósito: o app, a página de vendas e a Lojinha leem a mesma tabela.
// IGUAL à tabela PRECOS_PIX da função mercadopago-passe (supabase/functions/mercadopago-passe/index.ts, repositório beateristapp-): se mudar aqui, mude lá (é a função que cobra de verdade).
// Hoje: promoção de Natal R$ 49,90 até 31/12/2026; a partir de 01/01/2027, R$ 99,90.
export const PRECOS_PIX = [
  { desde: '1970-01-01T00:00:00-03:00', valor: 49.9 },
  { desde: '2027-01-01T00:00:00-03:00', valor: 99.9 },
];
// Cartão (Hotmart): o preço de lá quem muda é a Bea no painel da Hotmart; esta tabela só decide o que o SITE mostra. Natal R$ 79,90 até 31/12; de 01/01/2027 R$ 119,00 (12 x R$ 9,92).
export const PRECOS_CARTAO = [
  { desde: '1970-01-01T00:00:00-03:00', valor: 79.9 },
  { desde: '2027-01-01T00:00:00-03:00', valor: 119 },
];
export function precoCartaoAgora(agora = Date.now()) { let v = PRECOS_CARTAO[0].valor; for (const p of PRECOS_CARTAO) if (Date.parse(p.desde) <= agora) v = p.valor; return v; }
export const FIM_NATAL = '2027-01-01T00:00:00-03:00'; // a oferta vale até 31/12/2026 23:59 (Brasília)
export const brl = (n) => `R$ ${n.toFixed(2).replace('.', ',')}`;
export function precoPixAgora(agora = Date.now()) { let v = PRECOS_PIX[0].valor; for (const p of PRECOS_PIX) if (Date.parse(p.desde) <= agora) v = p.valor; return v; }
export const emOferta = (agora = Date.now()) => agora < Date.parse(FIM_NATAL);
// A mesma oferta (R$ 49,90) tem 2 nomes: Black Friday até 15/12 (fim do dia) e, a partir do dia 16, Natal até 31/12. O preço não muda; só o selo (e a arte do Paul Noel, que entra no dia 16).
export const FIM_BLACK_FRIDAY = '2026-12-16T00:00:00-03:00';
export const nomeOferta = (agora = Date.now()) => (!emOferta(agora) ? '' : agora < Date.parse(FIM_BLACK_FRIDAY) ? 'Black Friday' : 'de Natal');
export const ateOferta = (agora = Date.now()) => (agora < Date.parse(FIM_BLACK_FRIDAY) ? '15/12' : '31/12');
export const seloPix = (agora = Date.now()) => (emOferta(agora) ? `Oferta ${nomeOferta(agora)} · até ${ateOferta(agora)}` : 'Pagamento único');
export const PRECO_NORMAL_PIX = PRECOS_PIX[PRECOS_PIX.length - 1].valor;
