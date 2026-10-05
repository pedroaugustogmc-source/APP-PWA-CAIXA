-- Bug encontrado em nova auditoria: phoneitz_aceitar_convite_loja fazia um
-- SELECT (sem lock) pra achar a linha do convite, depois um UPDATE sem
-- revalidar aceito_em/user_id no WHERE. Dois `aceitar_convite` concorrentes
-- com o MESMO código (ex.: o vendedor clica duas vezes rápido em duas abas,
-- ou dois dispositivos tentam o mesmo código quase ao mesmo tempo) podiam
-- ambos passar pelo SELECT antes de qualquer um commitar — o segundo UPDATE
-- então sobrescrevia o user_id do primeiro, que ficava com a RPC retornando
-- sucesso mas sem vínculo real nenhum salvo (reaparecia na tela de escolha
-- no próximo refresh, sem erro nenhum explicando o motivo).
create or replace function phoneitz_aceitar_convite_loja(p_codigo text)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_id uuid;
  v_loja_id uuid;
begin
  if exists (select 1 from public.loja_membros where user_id = auth.uid() and aceito_em is not null) then
    raise exception 'Sua conta já está vinculada a uma loja.';
  end if;
  if exists (select 1 from public.lojas where user_id = auth.uid()) then
    raise exception 'Você já é dono de uma loja — não pode aceitar convite de outra.';
  end if;

  select id, loja_id into v_id, v_loja_id
  from public.loja_membros
  where codigo_convite = upper(p_codigo) and aceito_em is null and user_id is null;

  if v_id is null then
    raise exception 'Código de convite inválido ou já utilizado.';
  end if;

  -- Revalida no próprio UPDATE (aceito_em/user_id ainda nulos) — fecha a
  -- corrida: se outra chamada concorrente já reivindicou esta linha entre
  -- o SELECT acima e este UPDATE, "not found" dispara a exceção certa em
  -- vez de sobrescrever silenciosamente o vínculo de quem chegou primeiro.
  update public.loja_membros set user_id = auth.uid(), aceito_em = now()
  where id = v_id and aceito_em is null and user_id is null;

  if not found then
    raise exception 'Código de convite inválido ou já utilizado.';
  end if;

  return v_loja_id;
end;
$$;
