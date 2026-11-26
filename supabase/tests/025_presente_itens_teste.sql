-- Teste da 025 (roda e desfaz tudo: nada fica no banco). Esperado: todas as linhas "ok = true".
begin;
do $$ declare t uuid; r boolean; arr text[]; begin
  insert into public.presente_leads(nome, email, instrumento, faixa_idade) values ('teste 025', 'teste025@exemplo.invalid', 'bateria', '13-17') returning token into t;
  create temp table res025(passo text, ok boolean) on commit drop;
  r := public.presente_itens(t, array['w01-musica-disciplina', 'w05-ritmo-voz-menina', 'w09-transforma-menina']); insert into res025 values ('grava 3 itens', r);
  select presente_itens into arr from public.presente_leads where token = t; insert into res025 values ('itens ficaram gravados', arr = array['w01-musica-disciplina', 'w05-ritmo-voz-menina', 'w09-transforma-menina']);
  r := public.presente_itens(t, array['outro']); insert into res025 values ('só a 1ª gravação vale', r = false);
  r := public.presente_itens(null, array['a']); insert into res025 values ('sem token: recusa', r = false);
  r := public.presente_itens(gen_random_uuid(), array['a']); insert into res025 values ('token que não existe: não grava', r = false);
  insert into public.presente_leads(nome, email, instrumento, faixa_idade) values ('teste 025b', 'teste025b@exemplo.invalid', 'bateria', '13-17') returning token into t;
  r := public.presente_itens(t, array['TEM MAIUSCULA']); insert into res025 values ('id fora do padrão: recusa', r = false);
  r := public.presente_itens(t, array[]::text[]); insert into res025 values ('lista vazia: recusa', r = false);
  r := public.presente_itens(t, (select array_agg('item-' || g) from generate_series(1, 21) g)); insert into res025 values ('mais de 20 itens: recusa', r = false);
end $$;
select * from res025;
rollback;
