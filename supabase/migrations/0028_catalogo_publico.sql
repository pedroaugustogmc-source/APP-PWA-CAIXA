-- Fase 4: catálogo público — link compartilhável, sem login, com os
-- aparelhos que o lojista quis anunciar. preco_sugerido é nullable e opt-in:
-- um aparelho só aparece no catálogo se o lojista preencher um preço (nunca
-- expõe custo_compra, IMEI ou qualquer dado interno).
--
-- A view roda com os privilégios de quem a criou (padrão do Postgres pra
-- view sem security_invoker=true), então ela "vaza" através do RLS de
-- aparelhos de forma controlada — só pelas colunas que ela seleciona, só
-- pra linhas em_estoque com preco_sugerido preenchido. Isso é o padrão
-- documentado do Supabase pra expor dados parciais de tabela protegida.
alter table aparelhos
  add column preco_sugerido numeric(12, 2) check (preco_sugerido is null or preco_sugerido > 0);

create view catalogo_publico as
select
  a.loja_id,
  a.id as aparelho_id,
  a.nome,
  a.modelo,
  a.cor,
  a.capacidade_gb,
  a.condicao,
  a.bateria_saude,
  a.preco_sugerido,
  l.nome as loja_nome
from aparelhos a
join lojas l on l.id = a.loja_id
where a.status = 'em_estoque' and a.preco_sugerido is not null;

grant select on catalogo_publico to anon, authenticated;
