-- Corrige bug introduzido na própria migration 0033: dentro do EXISTS do
-- with_check de cashback_lancamentos_insert_own, a referência não
-- qualificada a `loja_id` resolvia pro `vendas.loja_id` da subquery (mais
-- interno), não pro `cashback_lancamentos.loja_id` da linha sendo
-- inserida — resolução de nome padrão do SQL quando as duas tabelas têm
-- uma coluna com o mesmo nome. O resultado era `v.loja_id = v.loja_id`,
-- uma tautologia sempre verdadeira: a checagem "a venda_id referenciada
-- pertence à MESMA loja do lançamento" não acontecia de fato. Nos casos
-- normais (loja_id vem do default phoneitz_current_loja_id(), nunca
-- sobrescrito pelo client) isso não tinha efeito observável — mas um
-- INSERT direto via REST que informasse explicitamente um `loja_id` de
-- OUTRA loja, junto de um venda_id de uma venda da própria loja do
-- atacante (que ele tem acesso), passaria pela checagem e poluiria o
-- ledger de cashback de uma loja completamente diferente. Corrige
-- qualificando a referência pelo nome da tabela (cashback_lancamentos),
-- que o Postgres aceita como alias implícito da linha sendo avaliada.
alter policy "cashback_lancamentos_insert_own" on cashback_lancamentos
  with check (
    loja_id in (select id from lojas where user_id = auth.uid())
    or (
      tipo = 'credito'
      and venda_id is not null
      and exists (
        select 1 from vendas v
        where v.id = venda_id and v.loja_id = cashback_lancamentos.loja_id and phoneitz_tem_acesso_loja(v.loja_id)
      )
    )
  );
