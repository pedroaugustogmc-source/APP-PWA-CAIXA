-- Loja: hoje 1 única por usuário, mas toda tabela nova do PHONEITZ já carrega
-- loja_id desde já (decisão do usuário: esta app pode virar produto
-- multi-loja depois de uso pessoal — evita migration dolorosa no futuro).
-- RLS continua em auth.uid() = user_id nesta fase — loja_id não entra em
-- policy ainda, é só a coluna.
create table lojas (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique default auth.uid() references auth.users (id) on delete cascade,
  nome text not null default 'Minha loja',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger lojas_set_updated_at
  before update on lojas
  for each row execute function set_updated_at();

alter table lojas enable row level security;

create policy "lojas_select_own" on lojas
  for select using (auth.uid() = user_id);

create policy "lojas_insert_own" on lojas
  for insert with check (auth.uid() = user_id);

create policy "lojas_update_own" on lojas
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "lojas_delete_own" on lojas
  for delete using (auth.uid() = user_id);

-- Backfill: todo usuário que já tem item cadastrado ganha loja agora, para
-- a 0015 conseguir popular aparelhos.loja_id via join por user_id. Não dá
-- pra usar current_loja_id()/auth.uid() aqui porque esta migration roda sem
-- contexto de sessão autenticada.
insert into lojas (user_id)
select distinct user_id from itens
on conflict (user_id) do nothing;

-- Garante a loja do usuário atual, criando na primeira chamada (idempotente
-- sob concorrência via ON CONFLICT). Chamada 1x no login (useAuth.tsx).
create or replace function garantir_loja()
returns uuid
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_loja_id uuid;
begin
  insert into public.lojas (user_id)
  values (auth.uid())
  on conflict (user_id) do nothing;

  select id into v_loja_id from public.lojas where user_id = auth.uid();
  return v_loja_id;
end;
$$;
grant execute on function garantir_loja() to authenticated;

-- Função pura (STABLE), usada como default em toda coluna loja_id nova.
create or replace function current_loja_id()
returns uuid
language sql
stable
security invoker
set search_path = ''
as $$
  select id from public.lojas where user_id = auth.uid();
$$;
grant execute on function current_loja_id() to authenticated;
