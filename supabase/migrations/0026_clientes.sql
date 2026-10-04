-- Fase 4: cadastro formal de clientes. vendas.cliente_nome/cliente_contato
-- continuam existindo como texto livre (fonte de verdade histórica,
-- inclusive das vendas migradas do Catira Control) — cliente_id é um
-- vínculo opcional e aditivo, nunca substitui os campos de texto.
create table clientes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  loja_id uuid not null default phoneitz_current_loja_id() references lojas (id),
  nome text not null,
  contato text,
  cpf text,
  email text,
  observacoes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index clientes_loja_idx on clientes (loja_id);
create index clientes_contato_idx on clientes (loja_id, contato);
create index clientes_user_idx on clientes (user_id);

alter table clientes enable row level security;

create policy "clientes_select_own" on clientes
  for select using (auth.uid() = user_id);
create policy "clientes_insert_own" on clientes
  for insert with check (auth.uid() = user_id);
create policy "clientes_update_own" on clientes
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "clientes_delete_own" on clientes
  for delete using (auth.uid() = user_id);

create trigger clientes_set_updated_at
  before update on clientes
  for each row execute function set_updated_at();

create trigger clientes_auditoria
  after insert or update or delete on clientes
  for each row execute function phoneitz_registrar_auditoria();

-- Vínculo opcional venda <-> cliente cadastrado.
alter table vendas add column cliente_id uuid references clientes (id);
create index vendas_cliente_idx on vendas (cliente_id);
