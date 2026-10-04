-- Fase 3 (financeiro): cashback — ledger append-only (igual padrão de
-- aparelho_eventos), nunca uma coluna de "saldo" cacheada: o saldo é sempre
-- SUM(credito) - SUM(resgate) calculado na leitura, pra nunca dessincronizar.
-- Chave é cliente_contato (texto livre, já é o único dado de cliente que
-- vendas.cliente_contato captura hoje) — migra pra um cliente_id de verdade
-- quando a Fase 4 criar a tabela clientes.

alter table configuracoes
  add column cashback_pct_padrao numeric(6, 4) not null default 0
    check (cashback_pct_padrao >= 0 and cashback_pct_padrao < 1);

create type tipo_lancamento_cashback as enum ('credito', 'resgate');

create table cashback_lancamentos (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  loja_id uuid not null default phoneitz_current_loja_id() references lojas (id),
  cliente_contato text not null,
  venda_id uuid references vendas (id),
  tipo tipo_lancamento_cashback not null,
  valor numeric(12, 2) not null check (valor > 0),
  observacoes text,
  created_at timestamptz not null default now()
);

create index cashback_lancamentos_cliente_idx on cashback_lancamentos (loja_id, cliente_contato);
create index cashback_lancamentos_venda_idx on cashback_lancamentos (venda_id);
create index cashback_lancamentos_user_idx on cashback_lancamentos (user_id);

alter table cashback_lancamentos enable row level security;

create policy "cashback_lancamentos_select_own" on cashback_lancamentos
  for select using (auth.uid() = user_id);
create policy "cashback_lancamentos_insert_own" on cashback_lancamentos
  for insert with check (auth.uid() = user_id);
create policy "cashback_lancamentos_delete_own" on cashback_lancamentos
  for delete using (auth.uid() = user_id);
-- sem update: lançamento é imutável (corrige com um novo lançamento, não editando um já feito).

create trigger cashback_lancamentos_auditoria
  after insert or update or delete on cashback_lancamentos
  for each row execute function phoneitz_registrar_auditoria();

-- Resgate precisa validar saldo disponível de forma atômica (SUM() sobre
-- várias linhas não dá pra proteger com CHECK declarativo). Lock consultivo
-- por (loja_id, cliente_contato) serializa resgates concorrentes do mesmo
-- cliente — sem isso, duas chamadas simultâneas poderiam ler o mesmo saldo
-- e as duas passarem na validação, resgatando mais do que existe.
create or replace function phoneitz_resgatar_cashback(p_cliente_contato text, p_valor numeric, p_observacoes text default null)
returns uuid
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_loja_id uuid := public.phoneitz_current_loja_id();
  v_saldo numeric(12, 2);
  v_id uuid;
begin
  if v_loja_id is null then
    raise exception 'Nenhuma loja configurada para este usuário.';
  end if;
  if p_valor <= 0 then
    raise exception 'Valor de resgate precisa ser maior que zero.';
  end if;

  perform pg_advisory_xact_lock(hashtext(v_loja_id::text || ':' || p_cliente_contato));

  select coalesce(sum(case when tipo = 'credito' then valor else -valor end), 0)
  into v_saldo
  from public.cashback_lancamentos
  where loja_id = v_loja_id and cliente_contato = p_cliente_contato;

  if p_valor > v_saldo then
    raise exception 'Saldo de cashback insuficiente: disponível %, solicitado %.', v_saldo, p_valor;
  end if;

  insert into public.cashback_lancamentos (loja_id, cliente_contato, tipo, valor, observacoes)
  values (v_loja_id, p_cliente_contato, 'resgate', p_valor, p_observacoes)
  returning id into v_id;

  return v_id;
end;
$$;
grant execute on function phoneitz_resgatar_cashback(text, numeric, text) to authenticated;
