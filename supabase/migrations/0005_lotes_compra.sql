-- custo_total_lote e custo_unitario são CALCULADOS, não armazenados.
-- Toda a lógica de cálculo vive em /src/lib (fonte única da verdade), nunca no banco.
create table lotes_compra (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  data_compra date not null,
  fornecedor_id uuid references fornecedores (id) on delete restrict,
  categoria_id uuid references categorias (id) on delete restrict,
  quantidade_comprada integer not null check (quantidade_comprada > 0),
  custo_produto numeric(12, 2) not null default 0 check (custo_produto >= 0),
  custo_frete numeric(12, 2) not null default 0 check (custo_frete >= 0),
  custo_extra numeric(12, 2) not null default 0 check (custo_extra >= 0),
  cotacao_dolar numeric(10, 4) check (cotacao_dolar is null or cotacao_dolar > 0),
  observacoes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index lotes_compra_user_data_idx on lotes_compra (user_id, data_compra desc);
create index lotes_compra_categoria_idx on lotes_compra (categoria_id);
create index lotes_compra_fornecedor_idx on lotes_compra (fornecedor_id);

create trigger lotes_compra_set_updated_at
  before update on lotes_compra
  for each row execute function set_updated_at();

alter table lotes_compra enable row level security;

create policy "lotes_compra_select_own" on lotes_compra
  for select using (auth.uid() = user_id);

create policy "lotes_compra_insert_own" on lotes_compra
  for insert with check (auth.uid() = user_id);

create policy "lotes_compra_update_own" on lotes_compra
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "lotes_compra_delete_own" on lotes_compra
  for delete using (auth.uid() = user_id);
