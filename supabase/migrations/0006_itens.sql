-- 1 linha por unidade. Gerada automaticamente pela aplicação ao cadastrar um lote
-- (quantidade_comprada linhas, todas com o mesmo lote_id).
-- taxa_plataforma_valor, lucro_liquido, margem_pct, roi_pct e dias_em_estoque
-- são CALCULADOS em /src/lib a partir destes dados brutos + custo_unitario do lote.
create table itens (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  lote_id uuid not null references lotes_compra (id) on delete cascade,
  identificador text,
  condicao condicao_item not null default 'novo',
  status status_item not null default 'em_estoque',
  data_venda date,
  preco_venda numeric(12, 2) check (preco_venda is null or preco_venda >= 0),
  plataforma_id uuid references plataformas (id) on delete restrict,
  -- fração de 0 a 1; puxa o padrão da plataforma na venda, mas é editável por item.
  taxa_plataforma_pct numeric(6, 4) check (taxa_plataforma_pct is null or (taxa_plataforma_pct >= 0 and taxa_plataforma_pct < 1)),
  observacoes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  -- Dados de venda só existem quando status = 'vendido'; cancelar a venda
  -- (voltar para em_estoque) precisa limpá-los por completo.
  constraint itens_dados_venda_consistentes check (
    (
      status = 'vendido'
      and data_venda is not null
      and preco_venda is not null
      and plataforma_id is not null
      and taxa_plataforma_pct is not null
    )
    or (
      status <> 'vendido'
      and data_venda is null
      and preco_venda is null
      and plataforma_id is null
      and taxa_plataforma_pct is null
    )
  )
);

create index itens_user_status_idx on itens (user_id, status);
create index itens_lote_idx on itens (lote_id);
create index itens_plataforma_idx on itens (plataforma_id);
create index itens_data_venda_idx on itens (data_venda);

create trigger itens_set_updated_at
  before update on itens
  for each row execute function set_updated_at();

alter table itens enable row level security;

create policy "itens_select_own" on itens
  for select using (auth.uid() = user_id);

create policy "itens_insert_own" on itens
  for insert with check (auth.uid() = user_id);

create policy "itens_update_own" on itens
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "itens_delete_own" on itens
  for delete using (auth.uid() = user_id);
