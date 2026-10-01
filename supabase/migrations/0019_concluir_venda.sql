-- RPC atômico: cabeçalho + itens (aparelho ou acessório) + pagamentos +
-- trade-in opcional, numa única transação. Concorrência sem lock explícito:
-- `update aparelhos set status='vendido' where ... and status in (...)`
-- adquire lock de linha implícito; duas chamadas concorrentes pro mesmo
-- aparelho_id — a segunda bloqueia até a primeira comitar, reavalia o WHERE
-- contra a linha já committada (status='vendido'), 0 linhas afetadas,
-- RAISE EXCEPTION desfaz a transação inteira desta chamada.
--
-- SECURITY INVOKER + search_path='' (padrão do projeto): toda referência a
-- tabela é qualificada com public.*; os únicos CASTs para tipo definido pelo
-- usuário (forma_pagamento, condicao_aparelho) também são qualificados —
-- tipos criados em `public` não resolvem por nome com search_path vazio,
-- diferente de tipos built-in (numeric, uuid, date, ...) que vivem em
-- pg_catalog e sempre resolvem.
create or replace function phoneitz_concluir_venda(p_venda jsonb)
returns uuid
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_loja_id uuid := public.phoneitz_current_loja_id();
  v_venda_id uuid;
  v_item jsonb;
  v_pagamento jsonb;
  v_aparelho_id uuid;
  v_custo_item numeric(12,2);
  v_custo_total_itens numeric(12,2) := 0;
  v_receita_total numeric(12,2) := 0;
  v_soma_pagamentos numeric(12,2) := 0;
  v_valor_trade_in numeric(12,2) := 0;
  v_rows int;
  v_trade_in_id uuid;
begin
  if v_loja_id is null then
    raise exception 'Nenhuma loja configurada para este usuário.';
  end if;

  insert into public.vendas (loja_id, cliente_nome, cliente_contato, observacoes,
    data_venda, comissao_vendedor_pct, comissao_vendedor_valor)
  values (v_loja_id, p_venda->>'cliente_nome', p_venda->>'cliente_contato',
    p_venda->>'observacoes', coalesce((p_venda->>'data_venda')::date, current_date),
    nullif(p_venda->>'comissao_vendedor_pct', '')::numeric,
    coalesce(nullif(p_venda->>'comissao_vendedor_valor', '')::numeric, 0))
  returning id into v_venda_id;

  for v_item in select jsonb_array_elements(p_venda->'itens') loop
    if (v_item->>'aparelho_id') is not null then
      v_aparelho_id := (v_item->>'aparelho_id')::uuid;
      update public.aparelhos set status = 'vendido'
      where id = v_aparelho_id and loja_id = v_loja_id and status in ('em_estoque', 'reservado')
      returning custo_compra + coalesce(
        (select sum((extra->>'valor')::numeric) from jsonb_array_elements(custos_extras) extra), 0
      ) into v_custo_item;
      get diagnostics v_rows = row_count;
      if v_rows = 0 then
        raise exception 'Aparelho % já foi vendido ou não está disponível.', v_aparelho_id;
      end if;
      insert into public.venda_itens (venda_id, loja_id, aparelho_id, quantidade, preco_unitario, custo_unitario_snapshot)
      values (v_venda_id, v_loja_id, v_aparelho_id, 1, (v_item->>'preco_unitario')::numeric, v_custo_item);
      v_custo_total_itens := v_custo_total_itens + v_custo_item;
      v_receita_total := v_receita_total + (v_item->>'preco_unitario')::numeric;
    else
      update public.acessorios set quantidade_estoque = quantidade_estoque - (v_item->>'quantidade')::integer
      where id = (v_item->>'acessorio_id')::uuid and loja_id = v_loja_id
      returning custo_unitario into v_custo_item;
      get diagnostics v_rows = row_count;
      if v_rows = 0 then
        raise exception 'Acessório % não encontrado.', (v_item->>'acessorio_id');
      end if;
      insert into public.venda_itens (venda_id, loja_id, acessorio_id, quantidade, preco_unitario, custo_unitario_snapshot)
      values (v_venda_id, v_loja_id, (v_item->>'acessorio_id')::uuid,
        (v_item->>'quantidade')::integer, (v_item->>'preco_unitario')::numeric, v_custo_item);
      v_custo_total_itens := v_custo_total_itens + v_custo_item * (v_item->>'quantidade')::integer;
      v_receita_total := v_receita_total + (v_item->>'preco_unitario')::numeric * (v_item->>'quantidade')::integer;
    end if;
  end loop;

  for v_pagamento in select jsonb_array_elements(p_venda->'pagamentos') loop
    insert into public.venda_pagamentos (venda_id, loja_id, forma, valor, parcelas, taxa_pct, taxa_valor)
    values (v_venda_id, v_loja_id, (v_pagamento->>'forma')::public.forma_pagamento,
      (v_pagamento->>'valor')::numeric, coalesce((v_pagamento->>'parcelas')::smallint, 1),
      coalesce((v_pagamento->>'taxa_pct')::numeric, 0),
      round((v_pagamento->>'valor')::numeric * coalesce((v_pagamento->>'taxa_pct')::numeric, 0), 2));
    v_soma_pagamentos := v_soma_pagamentos + (v_pagamento->>'valor')::numeric;
  end loop;

  if p_venda ? 'trade_in' and p_venda->'trade_in' is not null and p_venda->'trade_in' <> 'null'::jsonb then
    v_valor_trade_in := (p_venda->'trade_in'->>'valor_avaliacao')::numeric;
    insert into public.aparelhos (loja_id, nome, modelo, cor, capacidade_gb, bateria_saude,
      imei, imei2, categoria_id, condicao, status, data_compra, custo_compra)
    values (v_loja_id,
      p_venda->'trade_in'->'aparelho_recebido'->>'nome',
      p_venda->'trade_in'->'aparelho_recebido'->>'modelo',
      p_venda->'trade_in'->'aparelho_recebido'->>'cor',
      nullif(p_venda->'trade_in'->'aparelho_recebido'->>'capacidade_gb', '')::integer,
      nullif(p_venda->'trade_in'->'aparelho_recebido'->>'bateria_saude', '')::smallint,
      p_venda->'trade_in'->'aparelho_recebido'->>'imei',
      nullif(p_venda->'trade_in'->'aparelho_recebido'->>'imei2', ''),
      nullif(p_venda->'trade_in'->'aparelho_recebido'->>'categoria_id', '')::uuid,
      (p_venda->'trade_in'->'aparelho_recebido'->>'condicao')::public.condicao_aparelho,
      'em_estoque', coalesce((p_venda->>'data_venda')::date, current_date), v_valor_trade_in)
    returning id into v_trade_in_id;
    insert into public.venda_trade_ins (venda_id, loja_id, aparelho_recebido_id, valor_avaliacao)
    values (v_venda_id, v_loja_id, v_trade_in_id, v_valor_trade_in);
  end if;

  if v_soma_pagamentos + v_valor_trade_in <> v_receita_total then
    raise exception 'Pagamentos (%) + trade-in (%) não batem com o total da venda (%).',
      v_soma_pagamentos, v_valor_trade_in, v_receita_total;
  end if;

  return v_venda_id;
end;
$$;
grant execute on function phoneitz_concluir_venda(jsonb) to authenticated;
