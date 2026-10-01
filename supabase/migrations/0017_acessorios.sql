-- Produto fungível (não serializado) — capa, película, carregador, fone.
create table acessorios (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  loja_id uuid not null default current_loja_id() references lojas (id),
  sku text not null,
  nome text not null,
  categoria_id uuid references categorias (id) on delete restrict,
  fornecedor_id uuid references fornecedores (id) on delete set null,
  custo_unitario numeric(12, 2) not null default 0 check (custo_unitario >= 0),
  preco_venda numeric(12, 2) not null default 0 check (preco_venda >= 0),
  -- CHECK >= 0 é a trava de concorrência: duas vendas simultâneas que
  -- estourariam o saldo — a segunda UPDATE viola esta constraint.
  quantidade_estoque integer not null default 0 check (quantidade_estoque >= 0),
  estoque_minimo integer not null default 0 check (estoque_minimo >= 0),
  observacoes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (loja_id, sku)
);

create index acessorios_categoria_idx on acessorios (categoria_id);
create index acessorios_fornecedor_idx on acessorios (fornecedor_id);
create index acessorios_loja_idx on acessorios (loja_id);

create trigger acessorios_set_updated_at
  before update on acessorios
  for each row execute function set_updated_at();

alter table acessorios enable row level security;

create policy "acessorios_select_own" on acessorios
  for select using (auth.uid() = user_id);

create policy "acessorios_insert_own" on acessorios
  for insert with check (auth.uid() = user_id);

create policy "acessorios_update_own" on acessorios
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "acessorios_delete_own" on acessorios
  for delete using (auth.uid() = user_id);
