-- Rastro bruto de toda mutação em tabela do PHONEITZ — gravado só pelo
-- trigger phoneitz_registrar_auditoria(), nunca pela aplicação (sem policy
-- de insert para "authenticated"). aparelho_eventos (0016) continua
-- existindo em paralelo com propósito diferente: timeline legível por
-- humano de UM aparelho específico, usada na UI; esta tabela é o rastro
-- bruto de compliance para qualquer tabela.
--
-- Nome prefixado (phoneitz_auditoria, não só "auditoria"): este projeto
-- Supabase é compartilhado com outro app do usuário (gestão de fazenda) que
-- já tem uma tabela "auditoria" própria — confirmado via list_tables antes
-- de escrever esta migration. Sem o prefixo, "create table auditoria"
-- falharia (ou, pior, colidiria) com o schema do outro app.
create table phoneitz_auditoria (
  id uuid primary key default gen_random_uuid(),
  loja_id uuid not null references lojas (id),
  user_id uuid not null,
  tabela text not null,
  registro_id uuid not null,
  operacao text not null check (operacao in ('INSERT', 'UPDATE', 'DELETE')),
  dados_antes jsonb,
  dados_depois jsonb,
  created_at timestamptz not null default now()
);

create index phoneitz_auditoria_tabela_registro_idx on phoneitz_auditoria (tabela, registro_id, created_at);
create index phoneitz_auditoria_loja_idx on phoneitz_auditoria (loja_id, created_at);

alter table phoneitz_auditoria enable row level security;

create policy "phoneitz_auditoria_select_own" on phoneitz_auditoria
  for select using (auth.uid() = user_id);

-- Sem policy de insert/update/delete para "authenticated" — só o trigger
-- (SECURITY DEFINER) escreve aqui.

create or replace function phoneitz_registrar_auditoria()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.phoneitz_auditoria (loja_id, user_id, tabela, registro_id, operacao, dados_antes, dados_depois)
  values (coalesce(new.loja_id, old.loja_id), auth.uid(), TG_TABLE_NAME,
    coalesce(new.id, old.id), TG_OP,
    case when TG_OP in ('UPDATE', 'DELETE') then to_jsonb(old) end,
    case when TG_OP in ('INSERT', 'UPDATE') then to_jsonb(new) end);
  return coalesce(new, old);
end;
$$;

create trigger aparelhos_auditoria after insert or update or delete on aparelhos
  for each row execute function phoneitz_registrar_auditoria();
create trigger acessorios_auditoria after insert or update or delete on acessorios
  for each row execute function phoneitz_registrar_auditoria();
create trigger vendas_auditoria after insert or update or delete on vendas
  for each row execute function phoneitz_registrar_auditoria();
create trigger venda_itens_auditoria after insert or update or delete on venda_itens
  for each row execute function phoneitz_registrar_auditoria();
create trigger venda_pagamentos_auditoria after insert or update or delete on venda_pagamentos
  for each row execute function phoneitz_registrar_auditoria();
create trigger venda_trade_ins_auditoria after insert or update or delete on venda_trade_ins
  for each row execute function phoneitz_registrar_auditoria();
create trigger depreciacao_modelos_auditoria after insert or update or delete on depreciacao_modelos
  for each row execute function phoneitz_registrar_auditoria();
