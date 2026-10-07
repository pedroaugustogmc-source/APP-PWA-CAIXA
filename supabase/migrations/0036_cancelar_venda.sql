-- Pedido do usuário: poder desfazer/cancelar uma venda já registrada (não
-- existia nenhuma forma de apagar uma venda completa pela UI — só o status
-- isolado de um aparelho dava pra mudar). RPC atômico, espelho inverso do
-- phoneitz_concluir_venda (0019): devolve cada aparelho vendido pro estoque,
-- devolve a quantidade de cada acessório, reverte o crédito automático de
-- cashback (se houver) e apaga o registro da venda inteira.
--
-- Só dono cancela — checado explicitamente logo no início (mensagem de erro
-- clara) em vez de confiar só na RLS (que bloquearia a mesma coisa, mas sem
-- dizer o motivo, e só depois de já ter mexido no estoque).
--
-- Trade-in: o aparelho recebido como troca só existe por causa desta venda.
-- Se ninguém mexeu nele desde então (ainda 'em_estoque'), apaga junto. Se já
-- foi vendido/reservado/baixado numa operação posterior, cancelar aqui
-- quebraria aquele outro registro — bloqueia com uma mensagem explicando,
-- em vez de corromper silenciosamente outra venda.
create or replace function phoneitz_cancelar_venda(p_venda_id uuid)
returns void
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_loja_id uuid;
  v_item record;
  v_trade_in_aparelho_id uuid;
  v_trade_in_status public.status_aparelho;
begin
  select v.loja_id into v_loja_id
  from public.vendas v
  join public.lojas l on l.id = v.loja_id
  where v.id = p_venda_id and l.user_id = auth.uid();

  if v_loja_id is null then
    raise exception 'Venda não encontrada ou você não tem permissão pra cancelá-la (só o dono da loja cancela vendas).';
  end if;

  select vt.aparelho_recebido_id, a.status into v_trade_in_aparelho_id, v_trade_in_status
  from public.venda_trade_ins vt
  join public.aparelhos a on a.id = vt.aparelho_recebido_id
  where vt.venda_id = p_venda_id;

  if v_trade_in_aparelho_id is not null and v_trade_in_status <> 'em_estoque' then
    raise exception 'Não dá pra cancelar: o aparelho recebido como troca nessa venda já foi movimentado depois (status atual: %). Reverta essa movimentação primeiro.', v_trade_in_status;
  end if;

  for v_item in
    select aparelho_id, acessorio_id, quantidade from public.venda_itens where venda_id = p_venda_id
  loop
    if v_item.aparelho_id is not null then
      update public.aparelhos set status = 'em_estoque'
      where id = v_item.aparelho_id and loja_id = v_loja_id and status = 'vendido';
    elsif v_item.acessorio_id is not null then
      update public.acessorios set quantidade_estoque = quantidade_estoque + v_item.quantidade
      where id = v_item.acessorio_id and loja_id = v_loja_id;
    end if;
  end loop;

  delete from public.cashback_lancamentos where venda_id = p_venda_id and tipo = 'credito';
  delete from public.venda_pagamentos where venda_id = p_venda_id;
  delete from public.venda_trade_ins where venda_id = p_venda_id;
  delete from public.venda_itens where venda_id = p_venda_id;

  if v_trade_in_aparelho_id is not null then
    delete from public.aparelhos where id = v_trade_in_aparelho_id and status = 'em_estoque';
  end if;

  delete from public.vendas where id = p_venda_id;
end;
$$;
grant execute on function phoneitz_cancelar_venda(uuid) to authenticated;
