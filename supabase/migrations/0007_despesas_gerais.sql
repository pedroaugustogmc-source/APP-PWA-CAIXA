create table despesas_gerais (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  data date not null,
  categoria_despesa categoria_despesa_tipo not null,
  descricao text,
  valor numeric(12, 2) not null check (valor >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index despesas_gerais_user_data_idx on despesas_gerais (user_id, data desc);

create trigger despesas_gerais_set_updated_at
  before update on despesas_gerais
  for each row execute function set_updated_at();

alter table despesas_gerais enable row level security;

create policy "despesas_gerais_select_own" on despesas_gerais
  for select using (auth.uid() = user_id);

create policy "despesas_gerais_insert_own" on despesas_gerais
  for insert with check (auth.uid() = user_id);

create policy "despesas_gerais_update_own" on despesas_gerais
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "despesas_gerais_delete_own" on despesas_gerais
  for delete using (auth.uid() = user_id);
