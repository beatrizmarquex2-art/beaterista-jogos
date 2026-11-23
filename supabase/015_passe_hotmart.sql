-- Hotmart Passe Anual (produto 9051614): executar manualmente no Supabase SQL Editor.
-- Nao rodar antes de confirmar que public.alunos_codigos tem:
-- code, nome, tipo, dias, max_aparelhos, expira_em, ativo.
-- Nunca expose este RPC para anon/authenticated. O servidor usa service_role.
create table if not exists public.hotmart_passe_vendas (
  transacao text primary key,
  comprador_email text,
  comprador_nome text,
  codigo text unique,
  status text not null check (status in ('aprovada', 'reembolsada', 'chargeback', 'cancelada')),
  expira_em timestamptz,
  email_enviado_em timestamptz,
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now(),
  constraint hotmart_venda_codigo_format check (codigo is null or codigo ~ '^P[A-Z0-9]{9}$')
);
alter table public.hotmart_passe_vendas enable row level security;
revoke all on public.hotmart_passe_vendas from anon, authenticated;
-- RLS sem políticas: apenas funções internas/service_role acessam.
create or replace function public.hotmart_passe_processar(
  p_transacao text,
  p_email text,
  p_nome text,
  p_evento text,
  p_codigo text default null,
  p_aprovada_em timestamptz default null
)
returns jsonb
language plpgsql security definer set search_path = public, pg_temp
as $$
declare
  v_status text;
  v_codigo text;
  v_email_enviado timestamptz;
  v_expira timestamptz;
  v_retorno jsonb;
begin
  if p_transacao is null or length(trim(p_transacao)) < 4 then
    raise exception 'Transacao Hotmart invalida';
  end if;
  if p_evento not in ('PURCHASE_APPROVED','PURCHASE_REFUNDED','PURCHASE_CHARGEBACK','PURCHASE_CANCELED') then
    raise exception 'Evento Hotmart nao suportado';
  end if;
  -- Mesmo diante de dois eventos simultaneos, criar no maximo um codigo por transacao.
  perform pg_advisory_xact_lock(hashtextextended(p_transacao, 9051614));
  select status, codigo, email_enviado_em, expira_em
    into v_status, v_codigo, v_email_enviado, v_expira
    from public.hotmart_passe_vendas
    where transacao = p_transacao for update;
  if p_evento = 'PURCHASE_APPROVED' then
    if v_status is not null then
      -- Nao reativar venda ja estornada/cancelada ao receber evento antigo repetido.
      return jsonb_build_object('status',v_status,'codigo',v_codigo,
                                'email_enviado',v_email_enviado is not null,'novo',false);
    end if;
    if nullif(trim(coalesce(p_email,'')),'') is null then
      raise exception 'Email do comprador ausente';
    end if;
    if p_codigo is null or p_codigo !~ '^P[A-Z0-9]{9}$' then
      raise exception 'Codigo de acesso fora do padrao';
    end if;
    v_expira := coalesce(p_aprovada_em,now()) + interval '12 months';
    insert into public.alunos_codigos
      (code,nome,tipo,dias,max_aparelhos,expira_em,ativo)
      values (p_codigo,left('Passe '||coalesce(nullif(trim(p_nome),''),'Hotmart'),60),
              'passe',365,2,v_expira,true);
    insert into public.hotmart_passe_vendas
      (transacao,comprador_email,comprador_nome,codigo,status,expira_em)
      values (p_transacao,lower(trim(p_email)),left(coalesce(p_nome,''),160),
              p_codigo,'aprovada',v_expira);
    return jsonb_build_object('status','aprovada','codigo',p_codigo,'email_enviado',false,'novo',true);
  end if;
  -- Reembolso / chargeback / cancelamento: impedir uso do codigo.
  v_status := case p_evento
    when 'PURCHASE_REFUNDED' then 'reembolsada'
    when 'PURCHASE_CHARGEBACK' then 'chargeback'
    else 'cancelada' end;
  if not exists (select 1 from public.hotmart_passe_vendas where transacao=p_transacao) then
    insert into public.hotmart_passe_vendas
      (transacao,comprador_email,comprador_nome,status)
      values (p_transacao,nullif(lower(trim(coalesce(p_email,''))),''),
              left(coalesce(p_nome,''),160),v_status);
  else
    update public.hotmart_passe_vendas
       set status=v_status, atualizado_em=now()
       where transacao=p_transacao;
    if v_codigo is not null then
      update public.alunos_codigos set ativo=false where code=v_codigo;
    end if;
  end if;
  return jsonb_build_object('status',v_status,'codigo',v_codigo,'novo',false);
end;
$$;
revoke all on function public.hotmart_passe_processar(text,text,text,text,text,timestamptz) from public, anon, authenticated;
grant execute on function public.hotmart_passe_processar(text,text,text,text,text,timestamptz) to service_role;
