-- Fase 3 (financeiro): contas a receber — dinheiro que o cliente deve à
-- loja (venda parcelada direto com a loja, fiado, etc.), separado dos
-- pagamentos já registrados em venda_pagamentos (que são a forma de
-- quitação IMEDIATA da venda). venda_id é opcional: dá pra registrar uma
-- conta a receber vinculada a uma venda existente, ou avulsa.
create table contas_receber (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  loja_id uuid not null default phoneitz_current_loja_id() references lojas (id),
  venda_id uuid references vendas (id),
  cliente_nome text,
  cliente_contato text,
  descricao text not null,
  valor numeric(12, 2) not null check (valor > 0),
  data_vencimento date not null,
  data_recebimento date,
  status status_conta not null default 'pendente',
  observacoes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint contas_receber_recebimento_consistente check (
    (status = 'quitada' and data_recebimento is not null) or
    (status != 'quitada' and data_recebimento is null)
  )
);

create index contas_receber_loja_vencimento_idx on contas_receber (loja_id, data_vencimento);
create index contas_receber_venda_idx on contas_receber (venda_id);
create index contas_receber_user_idx on contas_receber (user_id);

alter table contas_receber enable row level security;

create policy "contas_receber_select_own" on contas_receber
  for select using (auth.uid() = user_id);
create policy "contas_receber_insert_own" on contas_receber
  for insert with check (auth.uid() = user_id);
create policy "contas_receber_update_own" on contas_receber
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "contas_receber_delete_own" on contas_receber
  for delete using (auth.uid() = user_id);

create trigger contas_receber_set_updated_at
  before update on contas_receber
  for each row execute function set_updated_at();

create trigger contas_receber_auditoria
  after insert or update or delete on contas_receber
  for each row execute function phoneitz_registrar_auditoria();
