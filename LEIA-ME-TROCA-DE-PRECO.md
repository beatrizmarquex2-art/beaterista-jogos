# Troca de preço do Passe Anual Robôterista (01/01/2027)

De: **R$ 49,90 Pix / R$ 79,90 cartão**  →  Para: **R$ 99,90 Pix / R$ 119,90 cartão**

São 3 lugares. Os 3 trocam na mesma virada (00:00 de 01/01/2027, horário de Brasília).

| Onde | Quem troca | Como |
|---|---|---|
| Site, entrada, vendas, checkout Pix, "Meu passe" | **automático** | `js/oferta-precos.js` (tabela por data). Nada a fazer. |
| Valor cobrado no Pix (Mercado Pago) | **automático** depois de publicar a função nova | `supabase/functions/mercadopago-passe` (mesma tabela por data) |
| Valor cobrado no cartão (Hotmart) | **você, na Hotmart** | veja abaixo |

## Hotmart (único passo manual)
1. Em 31/12, depois das 23h (ou em 01/01 logo cedo), entre em Hotmart → Produtos → Passe Anual Robôterista → **Preços/Ofertas**.
2. Mude o preço da oferta pra **R$ 119,90** e salve.
3. Se a Hotmart gerar **link novo** (oferta nova), cole o link em `linkCartao` do período de 2027 em `js/oferta-precos.js` e avise: eu publico. Se o link continuar o mesmo, não precisa mexer em nada.

Dica: a Hotmart permite programar a mudança de preço pra data; se o seu painel tiver essa opção, deixe agendada pra 01/01/2027 00:00.

## Como conferir depois da virada
- Abrir jogos.beaterista.com.br/pix/ → deve mostrar R$ 99,90 e "Hotmart · R$ 119,90".
- Gerar um Pix de teste: o valor no app do banco deve ser R$ 99,90.
- Abrir o link do cartão: deve mostrar R$ 119,90.

## Pedidos já gerados antes da virada
Um Pix gerado em 31/12 por R$ 49,90 e pago depois da meia-noite **continua válido** (o servidor confere o valor do próprio pedido). O Pix vence em 30 minutos de qualquer jeito.

## O que NÃO troca sozinho
- As **artes** (imagens) de divulgação que mostram R$ 49,90 / R$ 79,90: trocar nas redes.
- O valor do **ex-aluno** (R$ 49,90 de renovação, combinado por WhatsApp) e o **Combo Robôterista R$ 79,90** da Lojinha são outros produtos; não mudaram.
