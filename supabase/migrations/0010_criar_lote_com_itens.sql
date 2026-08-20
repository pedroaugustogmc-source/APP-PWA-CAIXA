-- Cria o lote e os N itens derivados em uma única transação. Evita o cenário
-- de dois inserts separados no cliente: se o segundo (itens) falhasse depois
-- do primeiro (lote) já ter sido confirmado, sobrava um lote órfão sem itens,
-- quebrando a garantia de "lote com quantidade > 1 gera N linhas em itens".
create or replace function criar_lote_com_itens(
  p_data_compra date,
  p_fornecedor_id uuid,
  p_categoria_id uuid,
  p_quantidade_comprada integer,
  p_custo_produto numeric,
  p_custo_frete numeric,
  p_custo_extra numeric,
  p_cotacao_dolar numeric,
  p_observacoes text
)
returns uuid
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_lote_id uuid;
begin
  insert into public.lotes_compra (
    data_compra, fornecedor_id, categoria_id, quantidade_comprada,
    custo_produto, custo_frete, custo_extra, cotacao_dolar, observacoes
  ) values (
    p_data_compra, p_fornecedor_id, p_categoria_id, p_quantidade_comprada,
    p_custo_produto, p_custo_frete, p_custo_extra, p_cotacao_dolar, p_observacoes
  )
  returning id into v_lote_id;

  insert into public.itens (lote_id)
  select v_lote_id from generate_series(1, p_quantidade_comprada);

  return v_lote_id;
end;
$$;

grant execute on function criar_lote_com_itens(date, uuid, uuid, integer, numeric, numeric, numeric, numeric, text) to authenticated;
