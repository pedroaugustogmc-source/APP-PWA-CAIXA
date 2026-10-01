-- Depreciação por modelo/condição, editável no banco (não hardcoded) —
-- alimenta o simulador de upgrade. Depreciação linear (decisão deliberada
-- sobre exponencial — menos superfície de erro de arredondamento):
--   valor_avaliacao = max(0, valor_base - valor_base * depreciacao_mensal_pct * meses_de_uso)
create table depreciacao_modelos (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  loja_id uuid not null default current_loja_id() references lojas (id),
  modelo text not null,
  condicao condicao_aparelho not null,
  valor_base numeric(12, 2) not null check (valor_base >= 0),
  depreciacao_mensal_pct numeric(6, 4) not null default 0 check (depreciacao_mensal_pct >= 0 and depreciacao_mensal_pct < 1),
  vigente_desde date not null default current_date,
  observacoes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (loja_id, modelo, condicao, vigente_desde)
);

create index depreciacao_modelos_modelo_idx on depreciacao_modelos (loja_id, modelo, condicao);

create trigger depreciacao_modelos_set_updated_at
  before update on depreciacao_modelos
  for each row execute function set_updated_at();

alter table depreciacao_modelos enable row level security;

create policy "depreciacao_modelos_select_own" on depreciacao_modelos
  for select using (auth.uid() = user_id);

create policy "depreciacao_modelos_insert_own" on depreciacao_modelos
  for insert with check (auth.uid() = user_id);

create policy "depreciacao_modelos_update_own" on depreciacao_modelos
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "depreciacao_modelos_delete_own" on depreciacao_modelos
  for delete using (auth.uid() = user_id);
