-- PRESENTE DO PAUL, parte 3 (nov/2026): além do TIPO de presente (planner, wallpaper ou colorir), fica anotado QUAIS itens a pessoa levou
-- (ex.: os 3 wallpapers que ela escolheu na grade). Guarda só os nomes dos arquivos (ids como 'w05-ritmo-voz-menina'), nunca dado pessoal.
--  · presente_itens: lista dos ids; só a 1ª gravação vale (igual ao tipo do presente);
--  · o app chama presente_itens(token, ids) além de presente_escolher; se esta migração ainda não rodou, o app funciona igual (só não anota os itens);
--  · a lista da professora ganha a coluna presente_itens.
-- Só ADICIONA coluna/função; não apaga dado. Seguro rodar de novo.
alter table public.presente_leads add column if not exists presente_itens text[];

create or replace function public.presente_itens(p_token uuid, p_itens text[]) returns boolean
language plpgsql security definer set search_path = public as $$
declare n int; x text;
begin
  if p_token is null or p_itens is null or coalesce(array_length(p_itens, 1), 0) not between 1 and 20 then return false; end if;
  foreach x in array p_itens loop
    if x is null or x !~ '^[a-z0-9-]{1,60}$' then return false; end if;
  end loop;
  update public.presente_leads set presente_itens = p_itens where token = p_token and presente_itens is null; get diagnostics n = row_count;
  return n > 0;
end $$;
revoke all on function public.presente_itens(uuid, text[]) from public;
grant execute on function public.presente_itens(uuid, text[]) to anon, authenticated;

drop function if exists public.presente_leads_listar();
create or replace function public.presente_leads_listar() returns table(id bigint, criado_em timestamptz, nome text, email text, whatsapp text, instrumento text, instrumento_outro text, faixa_idade text, aceita_novidades boolean, origem text, presente text, assinou boolean, presente_itens text[])
language plpgsql security definer set search_path = public as $$
begin
  perform public._bea_exige();
  return query select l.id, l.criado_em, l.nome, l.email, l.whatsapp, l.instrumento, l.instrumento_outro, l.faixa_idade, l.aceita_novidades, l.origem, l.presente,
    (l.email is not null and (exists (select 1 from public.mercadopago_passe_vendas v where lower(v.comprador_email) = lower(l.email) and v.status = 'aprovada')
                              or exists (select 1 from public.hotmart_passe_vendas v where lower(v.comprador_email) = lower(l.email) and v.status = 'aprovada'))),
    l.presente_itens
    from public.presente_leads l order by l.criado_em desc limit 5000;
end $$;
revoke all on function public.presente_leads_listar() from public, anon;
grant execute on function public.presente_leads_listar() to authenticated;
