-- Fase 4: níveis de acesso. O dono continua com acesso total via
-- lojas.user_id (nunca muda — nenhuma policy existente é removida, só
-- estendida com OR). loja_membros é estritamente ADITIVO: abre acesso às
-- tabelas operacionais do dia-a-dia (estoque + vendas) pra quem aceitar um
-- convite, sem afetar o dono.
--
-- Convite é por código, não por e-mail — criar um usuário em auth.users
-- exigiria service_role key, que o client não tem. Fluxo real: o dono gera
-- um código (phoneitz_criar_convite_loja), o vendedor cria sua PRÓPRIA
-- conta normal (signup comum) e usa o código pra se vincular
-- (phoneitz_aceitar_convite_loja).
--
-- Fora do escopo desta migration, por decisão deliberada: categorias,
-- fornecedores, configuracoes, depreciacao_modelos, contas_pagar,
-- contas_receber, cashback_lancamentos, clientes e phoneitz_auditoria
-- continuam só-dono — um vendedor vende e consulta estoque, não mexe em
-- configuração/financeiro/fornecedores da loja.

create type papel_membro as enum ('dono', 'vendedor');

create table loja_membros (
  id uuid primary key default gen_random_uuid(),
  loja_id uuid not null references lojas (id) on delete cascade,
  user_id uuid references auth.users (id) on delete cascade,
  papel papel_membro not null default 'vendedor',
  codigo_convite text,
  convidado_por uuid references auth.users (id),
  convidado_em timestamptz not null default now(),
  aceito_em timestamptz,
  created_at timestamptz not null default now()
);

-- Um usuário pertence a no máximo 1 loja — o app não tem seletor de loja,
-- phoneitz_current_loja_id() pressupõe contexto único.
create unique index loja_membros_user_unico_idx on loja_membros (user_id) where user_id is not null;
create unique index loja_membros_codigo_idx on loja_membros (codigo_convite) where codigo_convite is not null and aceito_em is null;
create index loja_membros_loja_idx on loja_membros (loja_id);

alter table loja_membros enable row level security;

create policy "loja_membros_select" on loja_membros
  for select using (
    auth.uid() = user_id or loja_id in (select id from lojas where user_id = auth.uid())
  );
create policy "loja_membros_insert_dono" on loja_membros
  for insert with check (loja_id in (select id from lojas where user_id = auth.uid()));
create policy "loja_membros_update_dono" on loja_membros
  for update using (loja_id in (select id from lojas where user_id = auth.uid()))
  with check (loja_id in (select id from lojas where user_id = auth.uid()));
create policy "loja_membros_delete_dono" on loja_membros
  for delete using (loja_id in (select id from lojas where user_id = auth.uid()));

-- Backfill: dono de cada loja já existente também é membro (pra aparecer
-- na listagem "Membros da loja").
insert into loja_membros (loja_id, user_id, papel, aceito_em)
select id, user_id, 'dono', created_at from lojas
on conflict do nothing;

-- Toda loja nova já nasce com o dono como membro.
create or replace function phoneitz_registrar_dono_membro()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.loja_membros (loja_id, user_id, papel, aceito_em)
  values (new.id, new.user_id, 'dono', now());
  return new;
end;
$$;
revoke execute on function phoneitz_registrar_dono_membro() from public, anon, authenticated;

create trigger lojas_registrar_dono_membro
  after insert on lojas
  for each row execute function phoneitz_registrar_dono_membro();

-- current_loja_id() passa a resolver também pra membros (vendedores) —
-- toda coluna loja_id not null default phoneitz_current_loja_id() em
-- qualquer INSERT novo depende disto pra um vendedor conseguir cadastrar.
create or replace function phoneitz_current_loja_id()
returns uuid
language sql
stable
set search_path = ''
as $$
  select coalesce(
    (select id from public.lojas where user_id = auth.uid()),
    (select loja_id from public.loja_membros where user_id = auth.uid() and aceito_em is not null limit 1)
  );
$$;

-- Acesso efetivo a uma loja: dono OU membro com convite aceito. Usada nas
-- policies abaixo em vez de repetir o OR em cada uma.
create or replace function phoneitz_tem_acesso_loja(p_loja_id uuid)
returns boolean
language sql
stable
security invoker
set search_path = ''
as $$
  select exists (select 1 from public.lojas where id = p_loja_id and user_id = auth.uid())
    or exists (
      select 1 from public.loja_membros
      where loja_id = p_loja_id and user_id = auth.uid() and aceito_em is not null
    );
$$;

-- RPC: dono gera um código de convite de 8 caracteres pra um vendedor.
create or replace function phoneitz_criar_convite_loja()
returns text
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_loja_id uuid;
  v_codigo text;
begin
  select id into v_loja_id from public.lojas where user_id = auth.uid();
  if v_loja_id is null then
    raise exception 'Só o dono da loja pode gerar convites.';
  end if;

  v_codigo := upper(substr(md5(random()::text || clock_timestamp()::text), 1, 8));

  insert into public.loja_membros (loja_id, papel, codigo_convite, convidado_por)
  values (v_loja_id, 'vendedor', v_codigo, auth.uid());

  return v_codigo;
end;
$$;
grant execute on function phoneitz_criar_convite_loja() to authenticated;

-- RPC: usuário autenticado aceita um convite por código. SECURITY DEFINER
-- é necessário aqui — antes do UPDATE a linha ainda não "pertence" a
-- ninguém (user_id is null), então a policy de UPDATE (só dono) nunca
-- deixaria um vendedor completar o próprio aceite via SECURITY INVOKER. A
-- validação de integridade (código certo, sem vínculo duplicado) é feita
-- toda dentro da função, não depende de RLS pra ser segura.
create or replace function phoneitz_aceitar_convite_loja(p_codigo text)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_id uuid;
  v_loja_id uuid;
begin
  if exists (select 1 from public.loja_membros where user_id = auth.uid() and aceito_em is not null) then
    raise exception 'Sua conta já está vinculada a uma loja.';
  end if;
  if exists (select 1 from public.lojas where user_id = auth.uid()) then
    raise exception 'Você já é dono de uma loja — não pode aceitar convite de outra.';
  end if;

  select id, loja_id into v_id, v_loja_id
  from public.loja_membros
  where codigo_convite = upper(p_codigo) and aceito_em is null and user_id is null;

  if v_id is null then
    raise exception 'Código de convite inválido ou já utilizado.';
  end if;

  update public.loja_membros set user_id = auth.uid(), aceito_em = now() where id = v_id;

  return v_loja_id;
end;
$$;
revoke execute on function phoneitz_aceitar_convite_loja(text) from public, anon;
grant execute on function phoneitz_aceitar_convite_loja(text) to authenticated;

-- RLS aditivo: select/insert/update das 7 tabelas operacionais passam a
-- aceitar também membros com convite aceito (delete continua só-dono).
alter policy "aparelhos_select_own" on aparelhos using (phoneitz_tem_acesso_loja(loja_id));
alter policy "aparelhos_insert_own" on aparelhos with check (phoneitz_tem_acesso_loja(loja_id));
alter policy "aparelhos_update_own" on aparelhos using (phoneitz_tem_acesso_loja(loja_id)) with check (phoneitz_tem_acesso_loja(loja_id));

alter policy "acessorios_select_own" on acessorios using (phoneitz_tem_acesso_loja(loja_id));
alter policy "acessorios_insert_own" on acessorios with check (phoneitz_tem_acesso_loja(loja_id));
alter policy "acessorios_update_own" on acessorios using (phoneitz_tem_acesso_loja(loja_id)) with check (phoneitz_tem_acesso_loja(loja_id));

alter policy "aparelho_eventos_select_own" on aparelho_eventos using (phoneitz_tem_acesso_loja(loja_id));

alter policy "vendas_select_own" on vendas using (phoneitz_tem_acesso_loja(loja_id));
alter policy "vendas_insert_own" on vendas with check (phoneitz_tem_acesso_loja(loja_id));
alter policy "vendas_update_own" on vendas using (phoneitz_tem_acesso_loja(loja_id)) with check (phoneitz_tem_acesso_loja(loja_id));

alter policy "venda_itens_select_own" on venda_itens using (phoneitz_tem_acesso_loja(loja_id));
alter policy "venda_itens_insert_own" on venda_itens with check (phoneitz_tem_acesso_loja(loja_id));
alter policy "venda_itens_update_own" on venda_itens using (phoneitz_tem_acesso_loja(loja_id)) with check (phoneitz_tem_acesso_loja(loja_id));

alter policy "venda_pagamentos_select_own" on venda_pagamentos using (phoneitz_tem_acesso_loja(loja_id));
alter policy "venda_pagamentos_insert_own" on venda_pagamentos with check (phoneitz_tem_acesso_loja(loja_id));
alter policy "venda_pagamentos_update_own" on venda_pagamentos using (phoneitz_tem_acesso_loja(loja_id)) with check (phoneitz_tem_acesso_loja(loja_id));

alter policy "venda_trade_ins_select_own" on venda_trade_ins using (phoneitz_tem_acesso_loja(loja_id));
alter policy "venda_trade_ins_insert_own" on venda_trade_ins with check (phoneitz_tem_acesso_loja(loja_id));
alter policy "venda_trade_ins_update_own" on venda_trade_ins using (phoneitz_tem_acesso_loja(loja_id)) with check (phoneitz_tem_acesso_loja(loja_id));
