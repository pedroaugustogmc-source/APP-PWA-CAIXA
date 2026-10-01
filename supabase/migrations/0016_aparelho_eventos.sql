-- Timeline append-only de mudanças de status de um aparelho (usada na UI de
-- detalhe). Diferente de `auditoria` (0021): aqui é só a transição de
-- status, legível por humano; auditoria é o rastro bruto de qualquer
-- mutação em qualquer tabela, para compliance.
create table aparelho_eventos (
  id uuid primary key default gen_random_uuid(),
  loja_id uuid not null references lojas (id),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  aparelho_id uuid not null references aparelhos (id) on delete cascade,
  status_anterior status_aparelho,
  status_novo status_aparelho not null,
  motivo text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index aparelho_eventos_aparelho_idx on aparelho_eventos (aparelho_id, created_at);

alter table aparelho_eventos enable row level security;

create policy "aparelho_eventos_select_own" on aparelho_eventos
  for select using (auth.uid() = user_id);

-- Append-only: sem policy de update/delete para "authenticated" — ninguém
-- edita/apaga histórico pelo client. O insert é feito só pelo trigger abaixo
-- (SECURITY DEFINER), nunca diretamente pela aplicação.

create or replace function log_aparelho_evento()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if TG_OP = 'UPDATE' and old.status is distinct from new.status then
    insert into public.aparelho_eventos (loja_id, user_id, aparelho_id, status_anterior, status_novo)
    values (new.loja_id, new.user_id, new.id, old.status, new.status);
  elsif TG_OP = 'INSERT' then
    insert into public.aparelho_eventos (loja_id, user_id, aparelho_id, status_anterior, status_novo)
    values (new.loja_id, new.user_id, new.id, null, new.status);
  end if;
  return new;
end;
$$;

create trigger aparelhos_log_evento
  after insert or update on aparelhos
  for each row execute function log_aparelho_evento();
