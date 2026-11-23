# Beaterista Play — Pix pelo Mercado Pago (R$ 49,90)
Status: **código pronto em branch de homologação**, não publicar sem teste real.

## Preços e canais
- Cartão: R$ 79,90, checkout Hotmart: https://pay.hotmart.com/Y108629105P
- Pix: R$ 49,90, checkout próprio: https://jogos.beaterista.com.br/pix/
- Ambos: passe anual de 12 meses, até 2 aparelhos, código recebido por e-mail.
- Atenção: o link Hotmart por si só **não garante cartão exclusivo**: verificar meios de pagamento da oferta no painel e a configuração de cupons ativos. O botão apenas identifica a preferência de compra.

## Segurança e privacidade
- A página Pix pede nome, e-mail e CPF do pagador. O CPF é enviado pela Edge Function diretamente ao Mercado Pago; não é gravado na tabela Beaterista.
- O preço de R$ 49,90 fica fixo no backend e em CHECK constraint no banco; o navegador não pode alterar o valor.
- A função só cria códigos depois de buscar o pagamento via API autenticada e conferir status aprovado, método pix, moeda BRL, valor, referência da compra e modo produção.
- O webhook só aceita eventos assinados HMAC-SHA256 com a chave do Mercado Pago, e sempre consulta a API.
- Tabela de vendas com RLS e sem grants para anon/authenticated; RPC apenas service_role; idempotência por UUID do pedido e código único.
- Estorno, chargeback e cancelamento revogam acesso.
- E-mail enviado pelo Resend com chave de idempotência por pedido.
- Endpoint público de criação limita 3 tentativas por e-mail em 15 min; para exposição alta, recomendável ainda Turnstile/quota por IP, monitoramento de abuso e logs.

## Ativação — NÃO inserir segredos no GitHub/ChatGPT
1. No [Mercado Pago Developers](https://www.mercadopago.com.br/developers), criar a aplicação da Beaterista (Checkout Transparente / Checkout API).
2. Obter **Access Token de produção** e habilitar recebimento Pix na conta (chave Pix cadastrada, se exigido).
3. No [Supabase Edge Function Secrets](https://supabase.com/dashboard/project/fnxgjxatremjdxaqmswu/settings/functions), cadastrar:
   - `MP_ACCESS_TOKEN`: Access Token de produção do Mercado Pago.
   - `MP_WEBHOOK_SECRET`: assinatura secreta obtida em configuração de Webhooks dessa mesma aplicação.
   - Reutiliza os existentes `RESEND_API_KEY` e `HOTMART_EMAIL_FROM` (domínio remetente verificado).
4. Ativar notificação **Payments / Pagamentos** via webhook na aplicação Mercado Pago:
   `https://fnxgjxatremjdxaqmswu.supabase.co/functions/v1/mercadopago-passe?hook=1`
   Eventos: alterações de pagamentos. Usar a assinatura gerada no painel.
5. Executar migration `supabase/016_passe_mercadopago_pix.sql` no Supabase.
6. Publicar Edge Function `mercadopago-passe` com **verify_jwt=false**; a função implementa autenticação do webhook e validação de pagamento na API.
7. Abrir `/pix/` em uma versão de staging; gerar Pix, verificar QR/Copia e Cola, pagar uma transação real e confirmar código por e-mail, status e acesso.
8. Testar repetição de webhook (não gera outro código), e estorno (revoga o código).
9. Inspecionar se o checkout Hotmart exibe R$79,90 para cartão sem cupons e se método Pix está habilitado no checkout Hotmart — se estiver, não existe exclusividade por canal apenas pelo botão.
10. Somente após isso, revisar e mesclar branch `pix-mercadopago-passe`; verificar implantação do site.

## API
Endpoint: `https://fnxgjxatremjdxaqmswu.supabase.co/functions/v1/mercadopago-passe`
- `POST ?acao=criar` — body `{ "nome": "...", "email": "...", "cpf": "..." }`. Retorna `pedido`, `valor`, `qr_code`, `qr_code_base64`, `ticket_url`, `pagamento_status`.
- `POST ?acao=status` — body `{ "pedido": "<uuid>" }`. Retorna `status` e `email_enviado` (nunca retorna código/identidade do comprador).
- `POST ?hook=1&type=payment&data.id=<id>` — Mercado Pago com headers `x-signature` e `x-request-id`. Só depois de validar assinatura + API registra a venda.

## Notas
- O domínio de compras é `jogos.beaterista.com.br` (frontend estático).
- A branch depende das alterações da branch `hotmart-passe-checkout-9051614`. Não fazer merge isolado para `main` sem essas alterações.
- A moeda BRL, o valor R$49,90 e a obrigatoriedade de `live_mode=true` evitam conceder acesso em transações de teste.
- Mudanças futuras de preço devem atualizar simultaneamente backend, migration/check e interface; fazer migração versionada.
