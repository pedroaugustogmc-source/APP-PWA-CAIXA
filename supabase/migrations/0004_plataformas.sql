create table plataformas (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  nome text not null,
  -- fração de 0 a 1 (ex.: 0.12 = 12%), aplicada sobre o preço de venda.
  taxa_padrao_pct numeric(6, 4) not null default 0 check (taxa_padrao_pct >= 0 and taxa_padrao_pct < 1),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, nome)
);

create trigger plataformas_set_updated_at
  before update on plataformas
  for each row execute function set_updated_at();

alter table plataformas enable row level security;

create policy "plataformas_select_own" on plataformas
  for select using (auth.uid() = user_id);

create policy "plataformas_insert_own" on plataformas
  for insert with check (auth.uid() = user_id);

create policy "plataformas_update_own" on plataformas
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "plataformas_delete_own" on plataformas
  for delete using (auth.uid() = user_id);
