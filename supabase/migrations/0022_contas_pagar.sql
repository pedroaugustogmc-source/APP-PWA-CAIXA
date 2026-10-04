-- Fase 3 (financeiro): contas a pagar da loja (fornecedores, despesas fixas
-- como aluguel/internet, etc.). "Atrasada" NÃO é status armazenado — é
-- derivado (pendente + vencimento no passado) em lib/financeiro.ts, pra não
-- depender de um job pra manter o status em dia.

create type status_conta as enum ('pendente', 'quitada', 'cancelada');

create table contas_pagar (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  loja_id uuid not null default phoneitz_current_loja_id() references lojas (id),
  fornecedor_id uuid references fornecedores (id),
  descricao text not null,
  categoria text,
  valor numeric(12, 2) not null check (valor > 0),
  data_vencimento date not null,
  data_pagamento date,
  status status_conta not null default 'pendente',
  recorrente boolean not null default false,
  observacoes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint contas_pagar_pagamento_consistente check (
    (status = 'quitada' and data_pagamento is not null) or
    (status != 'quitada' and data_pagamento is null)
  )
);

create index contas_pagar_loja_vencimento_idx on contas_pagar (loja_id, data_vencimento);
create index contas_pagar_fornecedor_idx on contas_pagar (fornecedor_id);
create index contas_pagar_user_idx on contas_pagar (user_id);

alter table contas_pagar enable row level security;

create policy "contas_pagar_select_own" on contas_pagar
  for select using (auth.uid() = user_id);
create policy "contas_pagar_insert_own" on contas_pagar
  for insert with check (auth.uid() = user_id);
create policy "contas_pagar_update_own" on contas_pagar
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "contas_pagar_delete_own" on contas_pagar
  for delete using (auth.uid() = user_id);

create trigger contas_pagar_set_updated_at
  before update on contas_pagar
  for each row execute function set_updated_at();

create trigger contas_pagar_auditoria
  after insert or update or delete on contas_pagar
  for each row execute function phoneitz_registrar_auditoria();
