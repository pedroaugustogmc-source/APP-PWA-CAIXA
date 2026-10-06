-- Bug encontrado em nova auditoria (parte B, item 7): phoneitz_current_loja_id()
-- foi redefinida em 0027 pra também resolver pra MEMBROS (vendedores com
-- convite aceito), não só pro dono — correta e necessária pra aparelhos/
-- acessorios/vendas (as "7 tabelas operacionais" que 0027 abriu de
-- propósito). Mas essa mesma função também é o DEFAULT de `loja_id` em
-- categorias/fornecedores/contas_pagar/contas_receber/cashback_lancamentos/
-- clientes/depreciacao_modelos — tabelas que a PRÓPRIA 0027 documenta como
-- "fora do escopo, decisão deliberada... continuam só-dono". Antes de 0027,
-- um vendedor nunca conseguia inserir nelas porque loja_id vinha NULL (a
-- função só resolvia pro dono) e a coluna é not null — a proteção real era
-- essa, não a policy. Depois de 0027, loja_id passou a resolver também pro
-- vendedor, e a policy de INSERT dessas tabelas sempre foi só
-- `auth.uid() = user_id` — que, com `user_id default auth.uid()`, é
-- satisfeita por QUALQUER usuário autenticado. Resultado: qualquer vendedor
-- da loja (ou, pra categorias/fornecedores, até um usuário sem vínculo
-- algum) passou a conseguir inserir direto nessas tabelas via REST, criando
-- linhas que o dono nunca veria (SELECT dele também filtra por
-- auth.uid() = user_id) — fornecedor/categoria/conta a pagar/conta a
-- receber/cliente/regra de depreciação "fantasma", presa à loja mas
-- invisível pra quem administra o negócio. Em cashback_lancamentos isso é
-- pior que um fantasma: é dinheiro de verdade (crédito resgatável como
-- desconto) — um vendedor podia inserir um lançamento 'credito' de QUALQUER
-- valor, pra QUALQUER cliente_contato, sem nenhuma venda por trás.
--
-- Corrige restringindo escrita a dono (padrão já estabelecido em 0032:
-- `loja_id in (select id from lojas where user_id = auth.uid())`), com duas
-- excessões deliberadas e mínimas:
-- 1. depreciacao_modelos: LEITURA passa a ser de qualquer membro da loja
--    (phoneitz_tem_acesso_loja) — o vendedor precisa ler as regras do dono
--    pra usar o Simulador de upgrade e a sugestão de trade-in em
--    NovaVendaWizard (ver src/components/vendas/NovaVendaWizard.tsx); hoje,
--    com a leitura só-dono, essas duas telas mostravam "nenhuma regra
--    cadastrada" pro vendedor mesmo com regras cadastradas pelo dono.
-- 2. cashback_lancamentos: LEITURA passa a ser de qualquer membro da loja
--    (o saldo é um SUM() sobre a loja inteira — com leitura só-dono, cada
--    membro só via os lançamentos que ELE MESMO inseriu, inclusive dentro
--    do RPC phoneitz_resgatar_cashback, que soma o saldo sob RLS: um
--    vendedor fechando um resgate de cashback de uma venda que o DONO tinha
--    creditado via outra venda via nunca enxergava aquele crédito, e o
--    resgate falhava com "saldo insuficiente" mesmo havendo saldo real).
--    ESCRITA continua restrita, mas com uma excessão mínima pro crédito
--    automático de phoneitz_concluir_venda (que roda como SECURITY INVOKER
--    — qualquer vendedor completando uma venda com cashback precisa que
--    esse INSERT passe): aceita INSERT de tipo='credito' vinculado a uma
--    venda_id real da própria loja, de qualquer membro. Lançamento manual
--    (credito sem venda, ou qualquer resgate) continua só-dono — é a
--    ferramenta de "Lançamento manual" em CashbackPage, que é gestão
--    financeira, não operação de venda.
--
-- Resíduo conhecido, não coberto por esta migration (documentado no
-- relatório da auditoria): o INSERT automático de crédito ainda não valida
-- que o `valor` corresponde ao que phoneitz_concluir_venda calcularia
-- (receita × cashback_pct) — só que existe uma venda real da loja por
-- trás. Fechar isso por completo exigiria persistir cashback_pct em
-- `vendas` e mover o INSERT pra dentro de uma função SECURITY DEFINER que
-- recalcula o valor, uma mudança de schema maior que o escopo de uma
-- correção de bug. Ainda assim, hoje nenhum caminho de crédito-sem-venda ou
-- de resgate indevido fica aberto pra quem não é dono.

create or replace function phoneitz_dono_da_minha_loja()
returns uuid
language sql
stable
security invoker
set search_path = ''
as $$
  select coalesce(
    (select user_id from public.lojas where user_id = auth.uid()),
    (select l.user_id from public.lojas l
       join public.loja_membros lm on lm.loja_id = l.id
      where lm.user_id = auth.uid() and lm.aceito_em is not null
      limit 1)
  );
$$;

-- categorias / fornecedores: sem loja_id (pré-datam o conceito de loja
-- multi-usuário) — user_id É o identificador de "dono" aqui. Leitura passa
-- a valer também pra quem é membro da loja desse dono (precisa pra
-- cadastrar aparelho/acessório com a categoria/fornecedor certos — ver
-- src/pages/EstoqueAparelhosPage.tsx); escrita continua só de quem É dono
-- de alguma loja (bloqueia o vendedor sem tocar no shape da policy
-- existente pros dois únicos usuários legítimos: dono lendo/escrevendo o
-- próprio cadastro).
alter policy "categorias_select_own" on categorias
  using (user_id = phoneitz_dono_da_minha_loja());
alter policy "categorias_insert_own" on categorias
  with check (auth.uid() = user_id and exists (select 1 from lojas where user_id = auth.uid()));

alter policy "fornecedores_select_own" on fornecedores
  using (user_id = phoneitz_dono_da_minha_loja());
alter policy "fornecedores_insert_own" on fornecedores
  with check (auth.uid() = user_id and exists (select 1 from lojas where user_id = auth.uid()));

-- contas_pagar / contas_receber / clientes: nenhum RPC insere nelas (sem
-- exceção de "crédito automático" como cashback) — ficam inteiramente
-- dono-only, nas 4 operações, igual ao padrão de 0032. SELECT também passa
-- de auth.uid()=user_id pra loja_id-based: estritamente mais correto pro
-- dono (continua vendo só a própria loja) e permite ao dono encontrar e
-- limpar qualquer linha "fantasma" que já tenha sido criada por um membro
-- antes desta correção.
alter policy "contas_pagar_select_own" on contas_pagar
  using (loja_id in (select id from lojas where user_id = auth.uid()));
alter policy "contas_pagar_insert_own" on contas_pagar
  with check (loja_id in (select id from lojas where user_id = auth.uid()));
alter policy "contas_pagar_update_own" on contas_pagar
  using (loja_id in (select id from lojas where user_id = auth.uid()))
  with check (loja_id in (select id from lojas where user_id = auth.uid()));
alter policy "contas_pagar_delete_own" on contas_pagar
  using (loja_id in (select id from lojas where user_id = auth.uid()));

alter policy "contas_receber_select_own" on contas_receber
  using (loja_id in (select id from lojas where user_id = auth.uid()));
alter policy "contas_receber_insert_own" on contas_receber
  with check (loja_id in (select id from lojas where user_id = auth.uid()));
alter policy "contas_receber_update_own" on contas_receber
  using (loja_id in (select id from lojas where user_id = auth.uid()))
  with check (loja_id in (select id from lojas where user_id = auth.uid()));
alter policy "contas_receber_delete_own" on contas_receber
  using (loja_id in (select id from lojas where user_id = auth.uid()));

alter policy "clientes_select_own" on clientes
  using (loja_id in (select id from lojas where user_id = auth.uid()));
alter policy "clientes_insert_own" on clientes
  with check (loja_id in (select id from lojas where user_id = auth.uid()));
alter policy "clientes_update_own" on clientes
  using (loja_id in (select id from lojas where user_id = auth.uid()))
  with check (loja_id in (select id from lojas where user_id = auth.uid()));
alter policy "clientes_delete_own" on clientes
  using (loja_id in (select id from lojas where user_id = auth.uid()));

-- depreciacao_modelos: leitura de qualquer membro (ver exceção 1 acima),
-- escrita só-dono.
alter policy "depreciacao_modelos_select_own" on depreciacao_modelos
  using (phoneitz_tem_acesso_loja(loja_id));
alter policy "depreciacao_modelos_insert_own" on depreciacao_modelos
  with check (loja_id in (select id from lojas where user_id = auth.uid()));
alter policy "depreciacao_modelos_update_own" on depreciacao_modelos
  using (loja_id in (select id from lojas where user_id = auth.uid()))
  with check (loja_id in (select id from lojas where user_id = auth.uid()));
alter policy "depreciacao_modelos_delete_own" on depreciacao_modelos
  using (loja_id in (select id from lojas where user_id = auth.uid()));

-- cashback_lancamentos: leitura de qualquer membro (ver exceção 2 acima).
-- Escrita: dono sempre pode (lançamento manual, credito ou resgate); além
-- disso, qualquer membro pode inserir um 'credito' vinculado a uma venda
-- real da própria loja (o que phoneitz_concluir_venda faz ao fechar uma
-- venda com cashback). DELETE também vira loja_id-based — antes, com
-- auth.uid()=user_id, o dono não conseguia apagar um crédito que o RPC
-- gravou com user_id do VENDEDOR que fechou aquela venda (mesmo bug de
-- "dono não apaga o que vendedor criou" já corrigido em 0032 pras outras
-- tabelas operacionais).
alter policy "cashback_lancamentos_select_own" on cashback_lancamentos
  using (phoneitz_tem_acesso_loja(loja_id));
alter policy "cashback_lancamentos_insert_own" on cashback_lancamentos
  with check (
    loja_id in (select id from lojas where user_id = auth.uid())
    or (
      tipo = 'credito'
      and venda_id is not null
      and exists (
        select 1 from vendas v
        where v.id = venda_id and v.loja_id = loja_id and phoneitz_tem_acesso_loja(v.loja_id)
      )
    )
  );
alter policy "cashback_lancamentos_delete_own" on cashback_lancamentos
  using (loja_id in (select id from lojas where user_id = auth.uid()));
