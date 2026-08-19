create table fornecedores (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  nome text not null,
  contato text,
  observacoes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger fornecedores_set_updated_at
  before update on fornecedores
  for each row execute function set_updated_at();

alter table fornecedores enable row level security;

create policy "fornecedores_select_own" on fornecedores
  for select using (auth.uid() = user_id);

create policy "fornecedores_insert_own" on fornecedores
  for insert with check (auth.uid() = user_id);

create policy "fornecedores_update_own" on fornecedores
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "fornecedores_delete_own" on fornecedores
  for delete using (auth.uid() = user_id);
