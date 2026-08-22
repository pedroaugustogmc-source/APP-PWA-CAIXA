-- Redesenho: cada item carrega seus próprios custos (compra + despesas
-- extras), sem passar por um lote intermediário. Despesas gerais somem —
-- tudo vira custo do item que gerou aquele gasto. Sem dados reais em
-- produção ainda, então a mudança é direta (sem migração de linhas).

drop function if exists criar_lote_com_itens(date, uuid, uuid, integer, numeric, numeric, numeric, numeric, text);
drop table if exists despesas_gerais;
drop type if exists categoria_despesa_tipo;

alter table itens drop column lote_id;

alter table itens
  add column nome text not null,
  add column categoria_id uuid references categorias (id) on delete restrict,
  add column fornecedor_id uuid references fornecedores (id) on delete set null,
  add column data_compra date not null,
  add column custo_compra numeric(12, 2) not null default 0 check (custo_compra >= 0),
  -- [{ "label": "Frete", "valor": 12.5 }, ...] — custo_total = custo_compra + soma(valor)
  add column custos_extras jsonb not null default '[]'::jsonb,
  add column dias_planejados integer check (dias_planejados is null or dias_planejados > 0);

drop table if exists lotes_compra;

create index itens_categoria_idx on itens (categoria_id);
create index itens_fornecedor_idx on itens (fornecedor_id);
create index itens_data_compra_idx on itens (data_compra);
