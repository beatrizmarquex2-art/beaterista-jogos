# Integração Hotmart - Passe Anual Beaterista

**Estado: código preparado, NÃO implantado em produção.**
**Produto Hotmart**: ID 9051614. **Checkout**: https://pay.hotmart.com/Y108629105P
**Área do aluno**: https://jogos.beaterista.com.br/?entrar
**Supabase projeto encontrado no frontend**: https://fnxgjxatremjdxaqmswu.supabase.co

## Objetivo

Quando a Hotmart enviar `PURCHASE_APPROVED` do produto **9051614**, a Edge Function verifica o HOTTOK, grava transação + comprador, cria código `PXXXXXXXXX` em `alunos_codigos` com 12 meses/2 aparelhos e envia e-mail com o código. Eventos `PURCHASE_REFUNDED`, `PURCHASE_CHARGEBACK` e `PURCHASE_CANCELED` desativam o acesso. Todos os demais produtos ficam intocados.

**IMPORTANTE**: antes de publicar, configure o preço do checkout **R$49,90** até 15/12/2026. Depois ajuste na Hotmart para R$79,90. O app altera a etiqueta de preço automaticamente mas NÃO altera a oferta na Hotmart.

## Passos de instalação

1. No painel Supabase do projeto correto, SQL Editor, conferir as colunas existentes na tabela `public.alunos_codigos`. Ela precisa aceitar `code`, `nome`, `tipo`, `dias`, `max_aparelhos`, `expira_em`, `ativo`. Executar o arquivo `supabase/015_passe_hotmart.sql` **após verificar compatibilidade**. O SQL cria tabela de vendas privada e função transacional com permissão apenas de `service_role`. Não aplicar em um banco errado.
2. Criar uma conta Resend (ou configurar serviço equivalente modificando a função), verificar seu domínio de e-mail remetente e criar uma chave de API de envio.
3. Supabase > Edge Functions > Secrets (ou CLI `supabase secrets set`): cadastrar:
   - `HOTMART_HOTTOK`: copiar da tela Hotmart > Ferramentas > Webhook (API e notificações) > Autenticação.
   - `RESEND_API_KEY`: chave secreta do Resend.
   - `HOTMART_EMAIL_FROM`: remetente de domínio verificado no Resend (ex.: `Beaterista <acesso@SEU-DOMINIO>`).
   - `SUPABASE_URL` e `SUPABASE_SERVICE_ROLE_KEY`: normalmente já disponibilizados no ambiente da Edge Function; conferir, **nunca copiar no frontend ou GitHub**.
4. Implantar a função a partir deste ramo no projeto correto:
   `supabase functions deploy hotmart-passe --no-verify-jwt`
   ou usar `supabase/config.toml`, que já configura `verify_jwt = false`.
5. Cadastrar em Hotmart > Ferramentas > Webhook (API e notificações) um webhook **v2.0.0**, selecionar o produto **9051614** e os eventos de compra aprovada, reembolso, chargeback e cancelamento; URL:
   `https://fnxgjxatremjdxaqmswu.supabase.co/functions/v1/hotmart-passe`
   O HOTTOK precisa ser idêntico ao segredo cadastrado no Supabase. **Não colocar segredo na URL**.
6. Usar o botão de teste do Webhook da Hotmart. O teste só deve conceder acesso se simular o evento `PURCHASE_APPROVED` para o produto correto e contiver comprador com e-mail válido. Conferir Supabase Function Logs e a tabela `hotmart_passe_vendas`.
7. Testar todo o fluxo: compra de teste autorizada (pela Hotmart), e-mail recebido, código válido em `?entrar`, repetição do mesmo webhook sem duplicar códigos, código rejeitado após estorno. Usar seu próprio e-mail e compensar a venda de teste conforme as regras da plataforma.
8. Só depois revisar e publicar as alterações dos botões de compra deste ramo no domínio público.

## Alertas antes de lançar

- O arquivo `js/codigo.js` mantém validação offline por até **365 dias**. Isso permite que um acesso reembolsado continue funcionando sem rede. Ajustar a política de offline antes de colocar à venda; não fazer a mudança sem decidir o efeito sobre alunos presenciais.
- O limite de **2 aparelhos** já está na função `aluno_acesso` existente; criar o código não substitui a verificação do Supabase.
- Se a Hotmart enviar o evento duas vezes, a transação é única e a mesma chave continua sendo usada. O e-mail é enviado com uma chave de idempotência de transação; mesmo assim, testar retentativas e quedas de rede.
- A aprovação do produto Hotmart **não** implica implantação de webhook nem de Resend.
- Não pedir que a compradora cole o código na página de pagamento. O código chega depois do pagamento aprovado por e-mail.
- Se a função responder 503 (por configuração ou envio de e-mail), não considerar integração ativa. Consultar logs e reprocessar a notificação após corrigir.
- A lista de vendas contém e-mails de compradores. A tabela usa RLS e não deve ter políticas públicas.

## Arquivos desta integração

- `js/loja-config.js`: link do Passe no app.
- `vendas/index.html`: link da página de vendas.
- `supabase/config.toml`: endpoint para notificações externas.
- `supabase/015_passe_hotmart.sql`: tabela privada e função transacional.
- `supabase/functions/hotmart-passe/index.ts`: webhook e envio de e-mail.

**Sem acesso ao painel Supabase e ao HOTTOK, não é possível considerar este fluxo implantado ou testado.**
