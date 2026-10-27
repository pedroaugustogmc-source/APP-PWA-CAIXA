-- Une ao PHONEITZ os módulos do "Meu Gestor" (projeto Supabase separado
-- ijkfvkagmyhnxrbstuwz) que não tinham equivalente aqui: fontes de renda
-- (recebíveis/juros, não é financeiro da loja), checklists de mesada
-- (desafio de poupança dia-a-dia) e carteiras de investimento (só os
-- contêineres — nenhum ativo/transação foi registrado neles no Meu Gestor,
-- então não há posições pra migrar). Estoque e vendas do Meu Gestor já
-- tinham sido reconciliados direto nas tabelas aparelhos/vendas existentes
-- numa correção anterior.
--
-- São dados pessoais do dono, não da operação da loja — mesmo padrão
-- dono-only de contas_pagar/contas_receber/clientes (ver 0033): membro
-- vendedor nunca lê nem escreve aqui.
create type tipo_fonte_renda as enum (
  'salario', 'freelance', 'aluguel', 'pro_labore', 'comissao', 'beneficio', 'rendimento_extra', 'outro'
);
create type frequencia_renda as enum ('semanal', 'quinzenal', 'mensal', 'anual', 'eventual');
create type tipo_carteira as enum ('pessoal', 'previdencia', 'outro');

create table carteiras_investimento (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  loja_id uuid not null default phoneitz_current_loja_id() references lojas (id),
  nome text not null,
  tipo tipo_carteira not null default 'pessoal',
  created_at timestamptz not null default now()
);

create index carteiras_investimento_loja_idx on carteiras_investimento (loja_id);
alter table carteiras_investimento enable row level security;

create policy "carteiras_investimento_select_own" on carteiras_investimento
  for select using (loja_id in (select id from lojas where user_id = auth.uid()));
create policy "carteiras_investimento_insert_own" on carteiras_investimento
  for insert with check (loja_id in (select id from lojas where user_id = auth.uid()));
create policy "carteiras_investimento_update_own" on carteiras_investimento
  for update using (loja_id in (select id from lojas where user_id = auth.uid()))
  with check (loja_id in (select id from lojas where user_id = auth.uid()));
create policy "carteiras_investimento_delete_own" on carteiras_investimento
  for delete using (loja_id in (select id from lojas where user_id = auth.uid()));

create table fontes_renda (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  loja_id uuid not null default phoneitz_current_loja_id() references lojas (id),
  nome text not null,
  tipo tipo_fonte_renda not null default 'outro',
  frequencia frequencia_renda not null default 'mensal',
  dia_recebimento smallint check (dia_recebimento is null or (dia_recebimento between 1 and 31)),
  moeda text not null default 'BRL',
  data_inicio date not null,
  data_fim date,
  observacoes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index fontes_renda_loja_idx on fontes_renda (loja_id);
create trigger fontes_renda_set_updated_at before update on fontes_renda for each row execute function set_updated_at();
alter table fontes_renda enable row level security;

create policy "fontes_renda_select_own" on fontes_renda
  for select using (loja_id in (select id from lojas where user_id = auth.uid()));
create policy "fontes_renda_insert_own" on fontes_renda
  for insert with check (loja_id in (select id from lojas where user_id = auth.uid()));
create policy "fontes_renda_update_own" on fontes_renda
  for update using (loja_id in (select id from lojas where user_id = auth.uid()))
  with check (loja_id in (select id from lojas where user_id = auth.uid()));
create policy "fontes_renda_delete_own" on fontes_renda
  for delete using (loja_id in (select id from lojas where user_id = auth.uid()));

-- Histórico de valor esperado por fonte — o valor atual é sempre o de
-- vigente_desde mais recente (mesmo padrão de depreciacao_modelos/
-- "vigente" em useDepreciacaoModelos.ts).
create table fontes_renda_valores (
  id uuid primary key default gen_random_uuid(),
  fonte_renda_id uuid not null references fontes_renda (id) on delete cascade,
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  loja_id uuid not null default phoneitz_current_loja_id() references lojas (id),
  valor_bruto_esperado numeric(12, 2) not null check (valor_bruto_esperado >= 0),
  valor_liquido_esperado numeric(12, 2) not null check (valor_liquido_esperado >= 0),
  vigente_desde date not null,
  motivo text,
  created_at timestamptz not null default now()
);

create index fontes_renda_valores_fonte_idx on fontes_renda_valores (fonte_renda_id, vigente_desde desc);
alter table fontes_renda_valores enable row level security;

create policy "fontes_renda_valores_select_own" on fontes_renda_valores
  for select using (loja_id in (select id from lojas where user_id = auth.uid()));
create policy "fontes_renda_valores_insert_own" on fontes_renda_valores
  for insert with check (loja_id in (select id from lojas where user_id = auth.uid()));
create policy "fontes_renda_valores_update_own" on fontes_renda_valores
  for update using (loja_id in (select id from lojas where user_id = auth.uid()))
  with check (loja_id in (select id from lojas where user_id = auth.uid()));
create policy "fontes_renda_valores_delete_own" on fontes_renda_valores
  for delete using (loja_id in (select id from lojas where user_id = auth.uid()));

create table checklists_mesada (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  loja_id uuid not null default phoneitz_current_loja_id() references lojas (id),
  nome text not null,
  mes_inicio date not null,
  valor_mensal numeric(12, 2) not null default 0 check (valor_mensal >= 0),
  created_at timestamptz not null default now()
);

create index checklists_mesada_loja_idx on checklists_mesada (loja_id);
alter table checklists_mesada enable row level security;

create policy "checklists_mesada_select_own" on checklists_mesada
  for select using (loja_id in (select id from lojas where user_id = auth.uid()));
create policy "checklists_mesada_insert_own" on checklists_mesada
  for insert with check (loja_id in (select id from lojas where user_id = auth.uid()));
create policy "checklists_mesada_update_own" on checklists_mesada
  for update using (loja_id in (select id from lojas where user_id = auth.uid()))
  with check (loja_id in (select id from lojas where user_id = auth.uid()));
create policy "checklists_mesada_delete_own" on checklists_mesada
  for delete using (loja_id in (select id from lojas where user_id = auth.uid()));

-- Uma linha por dia do desafio (índice 0-based). unique(checklist_id,indice)
-- porque cada dia só existe uma vez por checklist.
create table checklist_mesada_itens (
  id uuid primary key default gen_random_uuid(),
  checklist_id uuid not null references checklists_mesada (id) on delete cascade,
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  loja_id uuid not null default phoneitz_current_loja_id() references lojas (id),
  indice smallint not null check (indice >= 0),
  recebido boolean not null default false,
  updated_at timestamptz not null default now(),
  unique (checklist_id, indice)
);

create index checklist_mesada_itens_checklist_idx on checklist_mesada_itens (checklist_id);
create trigger checklist_mesada_itens_set_updated_at before update on checklist_mesada_itens for each row execute function set_updated_at();
alter table checklist_mesada_itens enable row level security;

create policy "checklist_mesada_itens_select_own" on checklist_mesada_itens
  for select using (loja_id in (select id from lojas where user_id = auth.uid()));
create policy "checklist_mesada_itens_insert_own" on checklist_mesada_itens
  for insert with check (loja_id in (select id from lojas where user_id = auth.uid()));
create policy "checklist_mesada_itens_update_own" on checklist_mesada_itens
  for update using (loja_id in (select id from lojas where user_id = auth.uid()))
  with check (loja_id in (select id from lojas where user_id = auth.uid()));
create policy "checklist_mesada_itens_delete_own" on checklist_mesada_itens
  for delete using (loja_id in (select id from lojas where user_id = auth.uid()));

-- Migração dos dados reais do Meu Gestor (projeto ijkfvkagmyhnxrbstuwz),
-- preservando os IDs originais (já eram uuid) pra rastreabilidade. Roda
-- como escrita direta de migration, igual à reconstrução de histórico em
-- 0018 — não passa por RPC porque é reconstrução de dado pré-existente,
-- não uma operação nova do usuário.
do $$
declare
  v_user_id uuid := '742662ab-eb83-48c4-80a1-30ab44f8e8d9';
  v_loja_id uuid := '6967b712-e6b4-4ab7-937e-b6d1b0416c8c';
begin
  insert into carteiras_investimento (id, user_id, loja_id, nome, tipo, created_at) values
    ('08f685f1-8289-4860-a893-fc07bc90caf5', v_user_id, v_loja_id, 'PC INVESTIMENTOS', 'pessoal', '2026-09-20 17:06:03.099+00'),
    ('53d3967a-da22-40c7-9006-bb06f00c04da', v_user_id, v_loja_id, 'PC BRIQUES', 'previdencia', '2026-09-20 17:09:27.163+00'),
    ('4f16891a-3d70-4803-b265-e10fb8f8ea24', v_user_id, v_loja_id, 'PC', 'outro', '2026-09-20 17:09:35.94+00');

  insert into fontes_renda (id, user_id, loja_id, nome, tipo, frequencia, dia_recebimento, moeda, data_inicio, data_fim, observacoes, created_at, updated_at) values
    ('99c0a16a-f708-4af2-8e55-826d3c5a9739', v_user_id, v_loja_id, 'MESADA', 'outro', 'mensal', null, 'BRL', '2026-09-26', '2026-09-26', 'Migrado do módulo fonte-renda simples (estava com ativa=false, valor único R$300,00 mensal).', '2026-09-26 22:45:58.529+00', '2026-09-28 18:31:16.874+00'),
    ('c5a30073-4bef-40a5-9c9e-4fcd43eba4d2', v_user_id, v_loja_id, 'Juros 1 Daniel', 'rendimento_extra', 'mensal', 10, 'BRL', '2026-10-10', null, '100,00 reais', '2026-10-06 16:19:06.285+00', '2026-10-10 16:11:22.122+00'),
    ('589c1cac-b122-40f4-858b-7eac5db00139', v_user_id, v_loja_id, 'Receber Samuel 900,00 mês', 'rendimento_extra', 'mensal', 14, 'BRL', '2026-09-14', null, '2 meses', '2026-10-07 14:37:37.569+00', '2026-10-07 14:38:00.914+00'),
    ('81158bc8-86e8-4136-a50e-71486d0004f6', v_user_id, v_loja_id, 'Juros 2 Daniel', 'rendimento_extra', 'mensal', 10, 'BRL', '2026-10-10', '2026-10-10', '45,00 reais', '2026-10-10 16:09:35.295+00', '2026-10-10 16:10:57.054+00');

  insert into fontes_renda_valores (id, fonte_renda_id, user_id, loja_id, valor_bruto_esperado, valor_liquido_esperado, vigente_desde, motivo, created_at) values
    ('8c5a90ea-59bd-4dc5-b871-9163aaf9fcb1', '99c0a16a-f708-4af2-8e55-826d3c5a9739', v_user_id, v_loja_id, 300.00, 300.00, '2026-09-26', 'Valor original migrado do módulo fonte-renda simples.', '2026-09-28 18:31:16.874+00'),
    ('ac6af1e1-77e0-4f26-bb6a-d1fef79e30f7', 'c5a30073-4bef-40a5-9c9e-4fcd43eba4d2', v_user_id, v_loja_id, 500.00, 500.00, '2026-10-10', 'Valor inicial da fonte.', '2026-10-06 16:19:06.32+00'),
    ('d991ea38-d506-4c2d-9e74-7856788ed92b', 'c5a30073-4bef-40a5-9c9e-4fcd43eba4d2', v_user_id, v_loja_id, 100.00, 100.00, '2026-10-06', null, '2026-10-06 16:19:43.994+00'),
    ('6164160c-e4c7-470c-8c3d-e1ce05bbc0ce', '589c1cac-b122-40f4-858b-7eac5db00139', v_user_id, v_loja_id, 1800.00, 1800.00, '2026-09-14', 'Valor inicial da fonte.', '2026-10-07 14:37:37.613+00'),
    ('4643a158-6559-49fc-9cba-6f2aefff6671', '81158bc8-86e8-4136-a50e-71486d0004f6', v_user_id, v_loja_id, 45.00, 45.00, '2026-10-10', 'Valor inicial da fonte.', '2026-10-10 16:09:35.329+00');

  insert into checklists_mesada (id, user_id, loja_id, nome, mes_inicio, valor_mensal, created_at) values
    ('fd2b8090-de45-4d0c-a6e6-021c1f399603', v_user_id, v_loja_id, 'Checklist 1', '2026-09-01', 150.00, '2026-09-30 14:34:56.619+00'),
    ('8e886aa6-9c08-44a0-b435-6b289df8826c', v_user_id, v_loja_id, 'Checklist 2', '2036-09-01', 150.00, '2026-09-30 14:34:56.731+00');

  -- 120 dias por checklist (índice 0-119), todos não recebidos por padrão;
  -- os 2 que já estavam marcados (índice 0 de cada um) são corrigidos logo
  -- depois com o updated_at real do Meu Gestor.
  insert into checklist_mesada_itens (checklist_id, user_id, loja_id, indice, recebido)
  select c.id, v_user_id, v_loja_id, s.indice, false
  from checklists_mesada c
  cross join generate_series(0, 119) as s(indice)
  where c.id in ('fd2b8090-de45-4d0c-a6e6-021c1f399603', '8e886aa6-9c08-44a0-b435-6b289df8826c');

  update checklist_mesada_itens set recebido = true, updated_at = '2026-10-05 04:04:51.293+00'
  where checklist_id = 'fd2b8090-de45-4d0c-a6e6-021c1f399603' and indice = 0;
  update checklist_mesada_itens set recebido = true, updated_at = '2026-10-05 04:04:57.247+00'
  where checklist_id = '8e886aa6-9c08-44a0-b435-6b289df8826c' and indice = 0;
end $$;
