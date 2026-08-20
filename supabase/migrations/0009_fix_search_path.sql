-- Corrige alerta do Supabase Advisor: search_path mutável em função SECURITY INVOKER
-- (risco de search_path hijacking). Trava o search_path da função.
create or replace function set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;
