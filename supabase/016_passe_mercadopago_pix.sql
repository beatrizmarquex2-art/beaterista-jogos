-- Passe Anual Beaterista Play — Mercado Pago Pix, preço fixado no servidor em R$49,90.
-- Nenhuma permissão concedida ao navegador: apenas Edge Function (service_role).
-- Mantenha a migração independente do webhook Hotmart.
create table if not exists public.mercadopago_passe_vendas (
  pedido uuid primary key,
  pagamento_id text unique,
  idempotencia text not null unique,
  comprador_email text not null,
  comprador_nome text not null,
  valor numeric(10,2) not null default 49.90 check (valor = 49.90),
  status text not null default 'pendente'
    check (status in ('pendente','aprovada','reembolsada','chargeback','cancelada','falhou')),
  codigo text unique,
  expira_em timestamptz,
  email_enviado_em timestamptz,
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now(),
  constraint mp_passe_codigo_format check (codigo is null or codigo ~ '^P[A-Z0-9]{9}$')
);
alter table public.mercadopago_passe_vendas enable row level security;
revoke all on public.mercadopago_passe_vendas from public, anon, authenticated;
-- Sem políticas RLS: o cliente nunca pode consultar pagamentos ou e-mails diretamente.

create or replace function public.mercadopago_passe_processar(
  p_pedido uuid,
  p_pagamento_id text,
  p_status text,
  p_codigo text default null,
  p_aprovada_em timestamptz default null
) returns jsonb
language plpgsql security definer
set search_path = public, pg_temp
as $$
declare
  v public.mercadopago_passe_vendas%rowtype;
  v_expira timestamptz;
  v_revogacao text;
begin
  if p_pedido is null or p_pagamento_id !~ '^[0-9]{4,25}$' then
    raise exception 'Identificador de pagamento invalido';
  end if;
  if p_status not in ('approved','refunded','charged_back','cancelled','rejected','pending','in_process','authorized') then
    raise exception 'Status Mercado Pago nao suportado';
  end if;
  perform pg_advisory_xact_lock(hashtextextended(p_pedido::text, 20261123));
  select * into v from public.mercadopago_passe_vendas
    where pedido = p_pedido for update;
  if not found then raise exception 'Pedido Pix inexistente'; end if;
  if v.pagamento_id is not null and v.pagamento_id <> p_pagamento_id then
    raise exception 'Pagamento nao pertence ao pedido';
  end if;
  if v.pagamento_id is null then
    update public.mercadopago_passe_vendas
      set pagamento_id = p_pagamento_id, atualizado_em = now()
      where pedido = p_pedido;
  end if;

  if p_status in ('pending','in_process','authorized') then
    return jsonb_build_object('status',v.status,'codigo_gerado',v.codigo is not null,
                              'email_enviado',v.email_enviado_em is not null);
  end if;

  if p_status = 'approved' then
    -- Um pagamento reembolsado ou cancelado nunca é reativado por webhook atrasado.
    if v.status in ('aprovada','reembolsada','chargeback','cancelada') then
      return jsonb_build_object('status',v.status,'codigo_gerado',v.codigo is not null,
                                'email_enviado',v.email_enviado_em is not null);
    end if;
    if p_codigo is null or p_codigo !~ '^P[A-Z0-9]{9}$' then
      raise exception 'Formato do codigo invalido';
    end if;
    v_expira := coalesce(p_aprovada_em, now()) + interval '12 months';
    insert into public.alunos_codigos (code,nome,tipo,dias,max_aparelhos,expira_em,ativo)
      values (p_codigo, left('Passe '||v.comprador_nome,60),'passe',365,2,v_expira,true);
    update public.mercadopago_passe_vendas
      set codigo = p_codigo, expira_em = v_expira, status = 'aprovada',
          atualizado_em = now()
      where pedido = p_pedido;
    return jsonb_build_object('status','aprovada','codigo_gerado',true,'email_enviado',false);
  end if;

  v_revogacao := case p_status
    when 'refunded' then 'reembolsada'
    when 'charged_back' then 'chargeback'
    else 'cancelada' end;
  -- Não retroceder estados de estorno/chargeback para eventos atrasados.
  if v.status in ('reembolsada','chargeback') then
    return jsonb_build_object('status',v.status,'email_enviado',v.email_enviado_em is not null);
  end if;
  update public.mercadopago_passe_vendas
    set status = v_revogacao, atualizado_em = now()
    where pedido = p_pedido;
  if v.codigo is not null then
    update public.alunos_codigos set ativo = false where code = v.codigo;
  end if;
  return jsonb_build_object('status',v_revogacao,'email_enviado',v.email_enviado_em is not null);
end;
$$;
revoke all on function public.mercadopago_passe_processar(uuid,text,text,text,timestamptz)
  from public, anon, authenticated;
grant execute on function public.mercadopago_passe_processar(uuid,text,text,text,timestamptz)
  to service_role;
