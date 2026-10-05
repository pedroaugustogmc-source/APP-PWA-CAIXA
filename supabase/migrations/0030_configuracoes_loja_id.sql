-- Bug encontrado em auditoria: configuracoes é 1-linha-por-user_id (schema
-- pré-PHONEITZ, nunca migrado pro padrão loja_id). Como as policies eram
-- só auth.uid()=user_id, um vendedor convidado (0027) sempre lia sua PRÓPRIA
-- linha vazia (nunca criada) em vez da configuração real da loja —
-- comissao_vendedor_pct_padrao/cashback_pct_padrao sempre apareciam como 0%
-- pra ele, mesmo com o dono tendo configurado valores reais.
alter table configuracoes add column loja_id uuid references lojas (id);

update configuracoes c set loja_id = l.id
from lojas l
where l.user_id = c.user_id and c.loja_id is null;

alter table configuracoes alter column loja_id set not null;
alter table configuracoes alter column loja_id set default phoneitz_current_loja_id();

-- Leitura passa a ser loja-wide (dono OU vendedor com convite aceito) — é
-- informação operacional (comissão/cashback padrão), não financeira
-- sensível. Escrita continua só-dono (insert/update/delete inalterados):
-- vendedor não deve poder mudar meta de lucro/configuração da loja.
alter policy "configuracoes_select_own" on configuracoes
  using (auth.uid() = user_id or phoneitz_tem_acesso_loja(loja_id));
