// Preço do passe anual (12 meses). Valem os preços da oferta oficial (js/oferta.js): R$ 49,90 no Pix (pagamento único) e R$ 79,90 no cartão (Hotmart).
// Promoção de Natal no Pix até 31/12/2026 (por data, em js/oferta-precos.js); `atual` é o valor do Pix de agora (texto do painel de códigos, que registra vendas pagas no Pix).
import { TXT_PIX, TXT_CARTAO } from './oferta.js';
import { emOferta, brl, PRECO_NORMAL_PIX } from './oferta-precos.js';
export const PASSE_NORMAL = PRECO_NORMAL_PIX; export const PASSE_OFERTA = 49.9;
/** { oferta, atual, de, ate, cartao, normal }. */
export function precoPasse(agora = Date.now()) { return { oferta: emOferta(agora), atual: TXT_PIX, de: '', ate: '31 de dezembro', cartao: TXT_CARTAO, normal: brl(PRECO_NORMAL_PIX) }; }
