create table categorias (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  nome text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, nome)
);

create trigger categorias_set_updated_at
  before update on categorias
  for each row execute function set_updated_at();

alter table categorias enable row level security;

create policy "categorias_select_own" on categorias
  for select using (auth.uid() = user_id);

create policy "categorias_insert_own" on categorias
  for insert with check (auth.uid() = user_id);

create policy "categorias_update_own" on categorias
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "categorias_delete_own" on categorias
  for delete using (auth.uid() = user_id);
