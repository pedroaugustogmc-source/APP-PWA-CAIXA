-- Bug encontrado em nova auditoria (parte B, item 7): vendas_update_own,
-- venda_itens_update_own, venda_pagamentos_update_own e
-- venda_trade_ins_update_own foram abertas em 0027 para "quem tem acesso à
-- loja" (dono OU vendedor), seguindo o mesmo padrão das 7 tabelas
-- operacionais. Mas nenhuma função do app faz UPDATE nessas 4 tabelas:
-- phoneitz_concluir_venda (0019/0025) só faz INSERT nelas, e não existe
-- (nem existiu) nenhuma tela de editar venda/item/pagamento/trade-in já
-- registrado, nem RPC de cancelamento. Isso deixava em aberto, via chamada
-- REST direta (ex.: supabase.from('venda_itens').update({preco_unitario:...})),
-- que QUALQUER vendedor da loja reescrevesse o preço/custo de um item já
-- vendido, o valor/taxa de um pagamento já recebido, a comissão da própria
-- venda (vendas.comissao_vendedor_valor/pct) ou a avaliação de um trade-in
-- já concluído — sem passar por nenhuma regra de negócio, já que não há
-- backend próprio e a RLS é a única fronteira real. Restringe a dono, igual
-- ao restante dos dados financeiros da loja (configuracoes/contas_pagar/
-- contas_receber/cashback_lancamentos, ver 0027) — não quebra nada porque
-- vendedor nunca usou UPDATE nessas tabelas pra começo.
alter policy "vendas_update_own" on vendas
  using (loja_id in (select id from lojas where user_id = auth.uid()))
  with check (loja_id in (select id from lojas where user_id = auth.uid()));

alter policy "venda_itens_update_own" on venda_itens
  using (loja_id in (select id from lojas where user_id = auth.uid()))
  with check (loja_id in (select id from lojas where user_id = auth.uid()));

alter policy "venda_pagamentos_update_own" on venda_pagamentos
  using (loja_id in (select id from lojas where user_id = auth.uid()))
  with check (loja_id in (select id from lojas where user_id = auth.uid()));

alter policy "venda_trade_ins_update_own" on venda_trade_ins
  using (loja_id in (select id from lojas where user_id = auth.uid()))
  with check (loja_id in (select id from lojas where user_id = auth.uid()));

-- Bug encontrado em nova auditoria (parte B, item 7): toda policy de DELETE
-- destas 6 tabelas (aparelhos, acessorios, vendas, venda_itens,
-- venda_pagamentos, venda_trade_ins) ficou em `auth.uid() = user_id` desde
-- antes da 0027 — equivalente a "só-dono" ENQUANTO só existia 1 usuário por
-- loja (o próprio dono criava toda linha). Desde a 0027 (vendedor pode
-- inserir aparelhos/acessorios/vendas, o que grava o user_id do VENDEDOR na
-- linha por causa do default `auth.uid()` da coluna), essa policy passou a
-- significar "só quem criou a linha" — não "só dono", como a própria 0027
-- documenta no comentário ("delete continua só-dono"). Efeito duplo e real:
-- (1) o dono fica sem conseguir apagar nada que um vendedor cadastrou — a
-- UI (ex.: EstoqueAparelhosPage) mostra o botão de excluir pra qualquer
-- membro sem checar quem criou a linha, e o delete falha silenciosamente
-- (RLS bloqueia, 0 linhas afetadas, PostgREST não reporta isso como erro) —
-- se o acesso do vendedor for revogado depois, a linha fica órfã, sem
-- ninguém capaz de apagá-la nunca mais; (2) um vendedor consegue apagar a
-- PRÓPRIA venda/item/pagamento/trade-in já concluído (ele é o user_id da
-- linha), destruindo o registro de uma venda que já aconteceu, sem o dono
-- poder impedir. Corrige para o que a 0027 já documentava como intenção:
-- delete é só-dono. (A policy de DELETE de aparelhos ainda se chama
-- "itens_delete_own" no banco — o rename pra "aparelhos_delete_own" do
-- fim da 0015 não chegou a ser aplicado; alteramos pelo nome real, sem
-- renomear, pra não misturar um bug com uma limpeza cosmética.)
alter policy "itens_delete_own" on aparelhos
  using (loja_id in (select id from lojas where user_id = auth.uid()));

alter policy "acessorios_delete_own" on acessorios
  using (loja_id in (select id from lojas where user_id = auth.uid()));

alter policy "vendas_delete_own" on vendas
  using (loja_id in (select id from lojas where user_id = auth.uid()));

alter policy "venda_itens_delete_own" on venda_itens
  using (loja_id in (select id from lojas where user_id = auth.uid()));

alter policy "venda_pagamentos_delete_own" on venda_pagamentos
  using (loja_id in (select id from lojas where user_id = auth.uid()));

alter policy "venda_trade_ins_delete_own" on venda_trade_ins
  using (loja_id in (select id from lojas where user_id = auth.uid()));
