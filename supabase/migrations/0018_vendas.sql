-- Cabeçalho da venda + tabelas filhas (itens/pagamentos/trade-in). Múltiplos
-- itens e múltiplas formas de pagamento por venda — por isso não cabe mais
-- embutido na linha do aparelho (ver 0015).
alter table configuracoes
  add column comissao_vendedor_pct_padrao numeric(6, 4) not null default 0
    check (comissao_vendedor_pct_padrao >= 0 and comissao_vendedor_pct_padrao < 1);

create type status_venda as enum ('concluida', 'cancelada');

create table vendas (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  loja_id uuid not null default current_loja_id() references lojas (id),
  vendedor_user_id uuid not null default auth.uid() references auth.users (id),
  cliente_nome text,
  cliente_contato text,
  status status_venda not null default 'concluida',
  comissao_vendedor_pct numeric(6, 4) check (comissao_vendedor_pct is null or (comissao_vendedor_pct >= 0 and comissao_vendedor_pct < 1)),
  comissao_vendedor_valor numeric(12, 2) not null default 0 check (comissao_vendedor_valor >= 0),
  observacoes text,
  data_venda date not null default current_date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index vendas_loja_idx on vendas (loja_id, data_venda);

create trigger vendas_set_updated_at
  before update on vendas
  for each row execute function set_updated_at();

alter table vendas enable row level security;

create policy "vendas_select_own" on vendas
  for select using (auth.uid() = user_id);

create policy "vendas_insert_own" on vendas
  for insert with check (auth.uid() = user_id);

create policy "vendas_update_own" on vendas
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "vendas_delete_own" on vendas
  for delete using (auth.uid() = user_id);

create table venda_itens (
  id uuid primary key default gen_random_uuid(),
  venda_id uuid not null references vendas (id) on delete cascade,
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  loja_id uuid not null default current_loja_id() references lojas (id),
  aparelho_id uuid references aparelhos (id),
  acessorio_id uuid references acessorios (id),
  quantidade integer not null default 1 check (quantidade > 0),
  preco_unitario numeric(12, 2) not null check (preco_unitario >= 0),
  -- Custo capturado no momento da venda — nunca recalculado depois (o custo
  -- de compra do aparelho pode ser editado no cadastro sem afetar vendas já
  -- concluídas).
  custo_unitario_snapshot numeric(12, 2) not null check (custo_unitario_snapshot >= 0),
  created_at timestamptz not null default now(),
  constraint venda_itens_um_tipo check (
    (aparelho_id is not null and acessorio_id is null) or
    (aparelho_id is null and acessorio_id is not null)
  )
);

-- Um aparelho nunca é vendido duas vezes, em venda alguma, pra sempre
-- (índice único não-parcial — diferente do índice de IMEI ativo em 0015,
-- que é parcial por status).
create unique index venda_itens_aparelho_unico_idx on venda_itens (aparelho_id) where aparelho_id is not null;
create index venda_itens_venda_idx on venda_itens (venda_id);
create index venda_itens_acessorio_idx on venda_itens (acessorio_id);

alter table venda_itens enable row level security;

create policy "venda_itens_select_own" on venda_itens
  for select using (auth.uid() = user_id);

create policy "venda_itens_insert_own" on venda_itens
  for insert with check (auth.uid() = user_id);

create policy "venda_itens_update_own" on venda_itens
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "venda_itens_delete_own" on venda_itens
  for delete using (auth.uid() = user_id);

create table venda_pagamentos (
  id uuid primary key default gen_random_uuid(),
  venda_id uuid not null references vendas (id) on delete cascade,
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  loja_id uuid not null default current_loja_id() references lojas (id),
  forma forma_pagamento not null,
  valor numeric(12, 2) not null check (valor > 0),
  parcelas smallint not null default 1 check (parcelas >= 1),
  taxa_pct numeric(6, 4) not null default 0 check (taxa_pct >= 0 and taxa_pct < 1),
  taxa_valor numeric(12, 2) not null default 0 check (taxa_valor >= 0),
  created_at timestamptz not null default now()
);

create index venda_pagamentos_venda_idx on venda_pagamentos (venda_id);

alter table venda_pagamentos enable row level security;

create policy "venda_pagamentos_select_own" on venda_pagamentos
  for select using (auth.uid() = user_id);

create policy "venda_pagamentos_insert_own" on venda_pagamentos
  for insert with check (auth.uid() = user_id);

create policy "venda_pagamentos_update_own" on venda_pagamentos
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "venda_pagamentos_delete_own" on venda_pagamentos
  for delete using (auth.uid() = user_id);

create table venda_trade_ins (
  id uuid primary key default gen_random_uuid(),
  venda_id uuid not null references vendas (id) on delete cascade,
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  loja_id uuid not null default current_loja_id() references lojas (id),
  aparelho_recebido_id uuid not null references aparelhos (id),
  valor_avaliacao numeric(12, 2) not null check (valor_avaliacao >= 0),
  created_at timestamptz not null default now(),
  unique (venda_id)
);

create unique index venda_trade_ins_aparelho_recebido_idx on venda_trade_ins (aparelho_recebido_id);

alter table venda_trade_ins enable row level security;

create policy "venda_trade_ins_select_own" on venda_trade_ins
  for select using (auth.uid() = user_id);

create policy "venda_trade_ins_insert_own" on venda_trade_ins
  for insert with check (auth.uid() = user_id);

create policy "venda_trade_ins_update_own" on venda_trade_ins
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "venda_trade_ins_delete_own" on venda_trade_ins
  for delete using (auth.uid() = user_id);
