-- Bug encontrado em auditoria: a policy de select de phoneitz_auditoria
-- comparava auth.uid() = user_id (quem executou a ação), não loja_id. Desde
-- a 0027 (vendedor pode inserir/atualizar aparelhos/vendas, o que dispara o
-- trigger de auditoria), uma ação de vendedor grava user_id do vendedor —
-- e o dono, cujo auth.uid() nunca bate com isso, parava de ver essas linhas
-- no rastro de auditoria da própria loja. A intenção documentada em 0027
-- é "phoneitz_auditoria continua só-dono" (vendedor não deve ler nada aqui)
-- — a correção certa é LOJA_ID + só-dono, não phoneitz_tem_acesso_loja()
-- (que abriria pro vendedor também).
alter policy "phoneitz_auditoria_select_own" on phoneitz_auditoria
  using (loja_id in (select id from lojas where user_id = auth.uid()));
