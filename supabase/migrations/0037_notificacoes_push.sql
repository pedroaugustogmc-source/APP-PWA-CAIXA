-- Notificações push (pedido do usuário): avisar sobre conta a pagar
-- vencendo e item parado em estoque, mesmo com o app fechado.
--
-- push_subscriptions: 1 linha por dispositivo inscrito (um usuário pode usar
-- o app em mais de um aparelho). endpoint é a chave natural do navegador/SO
-- pra essa inscrição — único, pra um re-subscribe no mesmo aparelho
-- atualizar em vez de duplicar.
create table push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  loja_id uuid not null default phoneitz_current_loja_id() references lojas (id),
  endpoint text not null unique,
  p256dh text not null,
  auth_key text not null,
  user_agent text,
  created_at timestamptz not null default now()
);

create index push_subscriptions_user_idx on push_subscriptions (user_id);
create index push_subscriptions_loja_idx on push_subscriptions (loja_id);

alter table push_subscriptions enable row level security;

create policy "push_subscriptions_select_own" on push_subscriptions
  for select using (auth.uid() = user_id);
create policy "push_subscriptions_insert_own" on push_subscriptions
  for insert with check (auth.uid() = user_id);
create policy "push_subscriptions_update_own" on push_subscriptions
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "push_subscriptions_delete_own" on push_subscriptions
  for delete using (auth.uid() = user_id);

-- notificacoes_log: registra cada aviso automático já disparado, pra não
-- mandar a mesma notificação de novo a cada execução do cron (dedupe por
-- user_id + chave). Sem RLS de usuário — só a Edge Function (service role)
-- escreve aqui; o front nunca lê nem grava.
create table notificacoes_log (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  loja_id uuid not null references lojas (id),
  tipo text not null,
  chave_dedupe text not null,
  titulo text not null,
  corpo text not null,
  enviado_em timestamptz not null default now(),
  unique (user_id, chave_dedupe)
);

create index notificacoes_log_user_idx on notificacoes_log (user_id, enviado_em desc);

alter table notificacoes_log enable row level security;

create policy "notificacoes_log_select_own" on notificacoes_log
  for select using (auth.uid() = user_id);

-- Extensões pra agendar a verificação diária e chamar a Edge Function de
-- envio a partir do próprio Postgres.
create extension if not exists pg_cron;
create extension if not exists pg_net;

-- Segredos usados pela Edge Function send-push (chaves VAPID) e pela função
-- de verificação abaixo (service_role_key, pra chamar a Edge Function via
-- pg_net). Ficam no Vault, não em Edge Function Secret, porque esta função
-- precisa lê-los de dentro do Postgres mesmo. Só o service_role acessa —
-- revoga de público/anon/authenticated explicitamente, nunca exposta por
-- RLS nenhuma (a tabela por trás do Vault é interna).
create or replace function phoneitz_segredo_push(p_nome text)
returns text
language sql
security definer
set search_path = ''
stable
as $$
  select decrypted_secret from vault.decrypted_secrets where name = p_nome limit 1;
$$;

revoke all on function phoneitz_segredo_push(text) from public;
revoke all on function phoneitz_segredo_push(text) from anon, authenticated;

-- Varre contas a pagar vencendo (hoje até 3 dias) e itens parados além do
-- prazo configurado em cada loja; registra em notificacoes_log (dedupe) e
-- dispara a Edge Function send-push via pg_net pra cada aviso novo. SECURITY
-- DEFINER porque roda pelo pg_cron, sem sessão de usuário autenticado —
-- search_path travado por segurança (padrão já usado nas outras funções
-- SECURITY DEFINER deste projeto).
create or replace function phoneitz_verificar_notificacoes()
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_conta record;
  v_aparelho record;
  v_chave text;
  v_titulo text;
  v_corpo text;
  v_project_url text := 'https://rurqtctrbzxppeickltz.supabase.co';
  v_service_key text;
begin
  select decrypted_secret into v_service_key
  from vault.decrypted_secrets
  where name = 'service_role_key'
  limit 1;

  if v_service_key is null then
    return;
  end if;

  -- Contas a pagar vencendo em até 3 dias (ou já vencidas), ainda pendentes.
  for v_conta in
    select cp.id, cp.user_id, cp.loja_id, cp.descricao, cp.valor, cp.data_vencimento
    from public.contas_pagar cp
    where cp.status = 'pendente'
      and cp.data_vencimento <= current_date + interval '3 days'
  loop
    v_chave := 'conta_pagar:' || v_conta.id || ':' || current_date;
    v_titulo := case
      when v_conta.data_vencimento < current_date then 'Conta atrasada'
      when v_conta.data_vencimento = current_date then 'Conta vence hoje'
      else 'Conta vence em breve'
    end;
    v_corpo := v_conta.descricao || ' — R$ ' || to_char(v_conta.valor, 'FM999G999G990D00') ||
      ' (vencimento ' || to_char(v_conta.data_vencimento, 'DD/MM') || ')';

    begin
      insert into public.notificacoes_log (user_id, loja_id, tipo, chave_dedupe, titulo, corpo)
      values (v_conta.user_id, v_conta.loja_id, 'conta_pagar', v_chave, v_titulo, v_corpo);
    exception when unique_violation then
      continue;
    end;

    perform net.http_post(
      url := v_project_url || '/functions/v1/send-push',
      headers := jsonb_build_object('Content-Type', 'application/json', 'Authorization', 'Bearer ' || v_service_key),
      body := jsonb_build_object('user_id', v_conta.user_id, 'title', v_titulo, 'body', v_corpo, 'url', '/financeiro/pagar')
    );
  end loop;

  -- Aparelhos em estoque parados além do prazo configurado na loja.
  for v_aparelho in
    select a.id, a.user_id, a.loja_id, a.nome, a.modelo, a.data_compra, c.dias_estoque_parado_alerta
    from public.aparelhos a
    join public.configuracoes c on c.loja_id = a.loja_id
    where a.status = 'em_estoque'
      and a.data_compra <= current_date - (c.dias_estoque_parado_alerta || ' days')::interval
  loop
    v_chave := 'item_parado:' || v_aparelho.id || ':' || to_char(current_date, 'IYYY-IW');
    v_titulo := 'Item parado em estoque';
    v_corpo := coalesce(v_aparelho.nome, v_aparelho.modelo) || ' está parado há mais de ' ||
      v_aparelho.dias_estoque_parado_alerta || ' dias';

    begin
      insert into public.notificacoes_log (user_id, loja_id, tipo, chave_dedupe, titulo, corpo)
      values (v_aparelho.user_id, v_aparelho.loja_id, 'item_parado', v_chave, v_titulo, v_corpo);
    exception when unique_violation then
      continue;
    end;

    perform net.http_post(
      url := v_project_url || '/functions/v1/send-push',
      headers := jsonb_build_object('Content-Type', 'application/json', 'Authorization', 'Bearer ' || v_service_key),
      body := jsonb_build_object('user_id', v_aparelho.user_id, 'title', v_titulo, 'body', v_corpo, 'url', '/estoque')
    );
  end loop;
end;
$$;

-- Roda 1x por dia, 9h da manhã em Brasília (12h UTC).
select cron.schedule(
  'phoneitz-verificar-notificacoes-diario',
  '0 12 * * *',
  $$select phoneitz_verificar_notificacoes()$$
);
