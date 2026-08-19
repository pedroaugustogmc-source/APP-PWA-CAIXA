-- Uma linha por usuário. Alimenta o motor de precificação (margem alvo) e os
-- KPIs 7 (estoque parado) e 12 (meta mensal de lucro).
create table configuracoes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  margem_alvo_pct numeric(6, 4) not null default 0.40 check (margem_alvo_pct >= 0 and margem_alvo_pct < 1),
  meta_mensal_lucro numeric(12, 2) not null default 0 check (meta_mensal_lucro >= 0),
  dias_estoque_parado_alerta integer not null default 30 check (dias_estoque_parado_alerta > 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id)
);

create trigger configuracoes_set_updated_at
  before update on configuracoes
  for each row execute function set_updated_at();

alter table configuracoes enable row level security;

create policy "configuracoes_select_own" on configuracoes
  for select using (auth.uid() = user_id);

create policy "configuracoes_insert_own" on configuracoes
  for insert with check (auth.uid() = user_id);

create policy "configuracoes_update_own" on configuracoes
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "configuracoes_delete_own" on configuracoes
  for delete using (auth.uid() = user_id);
