-- Renomeia itens -> aparelhos e estende para o modelo de estoque serializado
-- por IMEI da Fase 1. Dados de venda saem da linha do aparelho — passam a
-- viver em vendas/venda_itens/venda_pagamentos/venda_trade_ins (0018).
-- Rename + ADD/DROP COLUMN, nunca DROP TABLE — zero perda de dado existente.
--
-- MIGRATION MAIS ARRISCADA DA FASE 1 — mostrar o SQL completo e esperar
-- confirmação explícita do usuário antes de aplicar em produção.

alter table itens rename to aparelhos;

-- Novas colunas, nullable por ora (backfill e CHECKs vêm nos passos abaixo).
alter table aparelhos
  add column loja_id uuid references lojas (id),
  add column modelo text,
  add column cor text,
  add column capacidade_gb integer check (capacidade_gb is null or capacidade_gb > 0),
  add column bateria_saude smallint check (bateria_saude is null or bateria_saude between 0 and 100),
  add column imei text,
  add column imei2 text;

-- Backfill de loja_id via join por user_id (lojas já tem 1 linha por usuário
-- com item cadastrado, garantido pelo backfill da 0013).
update aparelhos a
set loja_id = l.id
from lojas l
where l.user_id = a.user_id and a.loja_id is null;

alter table aparelhos alter column loja_id set not null;
alter table aparelhos alter column loja_id set default phoneitz_current_loja_id();

-- modelo: sem equivalente no schema antigo — backfill com o próprio nome do
-- aparelho, pra não deixar linha existente com modelo vazio (usuário edita
-- depois se quiser diferenciar nome de modelo).
update aparelhos set modelo = nome where modelo is null;
alter table aparelhos alter column modelo set not null;
alter table aparelhos alter column modelo set default '';

-- condicao: novo enum (novo/seminovo/vitrine/defeito) substitui o antigo
-- (novo/usado) — 'usado' mapeia para 'seminovo'.
alter table aparelhos add column condicao_novo condicao_aparelho;
update aparelhos set condicao_novo = (case condicao::text when 'usado' then 'seminovo' else condicao::text end)::condicao_aparelho;
alter table aparelhos alter column condicao_novo set not null;
alter table aparelhos alter column condicao_novo set default 'novo';
alter table aparelhos drop column condicao;
alter table aparelhos rename column condicao_novo to condicao;

-- status: novo enum (em_estoque/reservado/vendido/devolvido/baixado)
-- substitui o antigo (em_estoque/reservado/vendido/perdido_danificado) —
-- 'perdido_danificado' mapeia para 'baixado'.
alter table aparelhos add column status_novo status_aparelho;
update aparelhos set status_novo = (case status::text when 'perdido_danificado' then 'baixado' else status::text end)::status_aparelho;
alter table aparelhos alter column status_novo set not null;
alter table aparelhos alter column status_novo set default 'em_estoque';
alter table aparelhos drop column status;
alter table aparelhos rename column status_novo to status;

-- Remove dados de venda da linha do aparelho — agora vivem em
-- vendas/venda_itens/venda_pagamentos (0018). ANTES de apagar as colunas,
-- captura o histórico de vendas já existente (linhas com status 'vendido')
-- numa tabela de staging — 0018 usa isso pra recriar essas vendas nas
-- tabelas novas, depois de dropar a staging. Zero perda de dado: o rename
-- custo_compra/custos_extras continua na própria linha do aparelho (não é
-- dado de venda), só os 4 campos abaixo são realmente removidos daqui.
create table _staging_historico_vendas as
select id as aparelho_id, user_id, loja_id, data_venda, preco_venda, plataforma_id, taxa_plataforma_pct
from aparelhos
where status = 'vendido';

alter table aparelhos drop constraint itens_dados_venda_consistentes;
alter table aparelhos drop column data_venda;
alter table aparelhos drop column preco_venda;
alter table aparelhos drop column plataforma_id;
alter table aparelhos drop column taxa_plataforma_pct;

-- IMEI: formato (15 dígitos) + Luhn válido via CHECK — fronteira real de
-- segurança (src/lib/luhn.ts no client é só UX). NULL é permitido porque
-- toda linha existente fica sem IMEI até edição manual; a aplicação exige
-- IMEI em todo cadastro NOVO (ver AparelhoInput em useAparelhos.ts), mas o
-- banco não pode forçar NOT NULL aqui sem apagar/inventar dado de linha já
-- existente.
alter table aparelhos add constraint aparelhos_imei_formato
  check (imei is null or (imei ~ '^[0-9]{15}$' and phoneitz_luhn_valido(imei)));
alter table aparelhos add constraint aparelhos_imei2_formato
  check (imei2 is null or (imei2 ~ '^[0-9]{15}$' and phoneitz_luhn_valido(imei2)));

-- Único por loja, só entre aparelhos "ativos" (em_estoque/reservado) — um
-- IMEI pode reaparecer depois (ex.: trade-in futuro do mesmo aparelho já
-- revendido) sem violar a constraint, porque a linha antiga já está em
-- status terminal (vendido/devolvido/baixado). NULL não colide com NULL em
-- índice único do Postgres, então linhas legadas sem IMEI não se bloqueiam.
create unique index aparelhos_loja_imei_ativo_idx on aparelhos (loja_id, imei)
  where status in ('em_estoque', 'reservado');
create unique index aparelhos_loja_imei2_ativo_idx on aparelhos (loja_id, imei2)
  where imei2 is not null and status in ('em_estoque', 'reservado');

alter index itens_categoria_idx rename to aparelhos_categoria_idx;
alter index itens_fornecedor_idx rename to aparelhos_fornecedor_idx;
alter index itens_data_compra_idx rename to aparelhos_data_compra_idx;
alter index itens_user_status_idx rename to aparelhos_user_status_idx;
drop index if exists itens_plataforma_idx;
drop index if exists itens_data_venda_idx;

create index aparelhos_loja_idx on aparelhos (loja_id);
create index aparelhos_imei_idx on aparelhos (imei);

alter trigger itens_set_updated_at on aparelhos rename to aparelhos_set_updated_at;

alter policy "itens_select_own" on aparelhos rename to "aparelhos_select_own";
alter policy "itens_insert_own" on aparelhos rename to "aparelhos_insert_own";
alter policy "itens_update_own" on aparelhos rename to "aparelhos_update_own";
alter policy "itens_delete_own" on aparelhos rename to "aparelhos_delete_own";
