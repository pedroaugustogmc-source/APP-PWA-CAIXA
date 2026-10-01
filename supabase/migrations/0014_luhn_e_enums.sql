-- Algoritmo de Luhn em SQL — fronteira de segurança real do formato de IMEI
-- (0015). A validação client-side (src/lib/luhn.ts) é só conveniência de UX;
-- mesmo que tenha um bug ou seja contornada no client, o banco rejeita.
create or replace function phoneitz_luhn_valido(p_numero text)
returns boolean
language plpgsql
immutable
set search_path = ''
as $$
declare
  v_soma int := 0;
  v_digito int;
  v_dobro int;
  v_len int := length(p_numero);
  v_i int;
begin
  if p_numero !~ '^[0-9]+$' then
    return false;
  end if;

  for v_i in 0 .. v_len - 1 loop
    v_digito := substring(p_numero from v_len - v_i for 1)::int;
    if v_i % 2 = 1 then
      v_dobro := v_digito * 2;
      if v_dobro > 9 then
        v_dobro := v_dobro - 9;
      end if;
      v_soma := v_soma + v_dobro;
    else
      v_soma := v_soma + v_digito;
    end if;
  end loop;

  return v_soma % 10 = 0;
end;
$$;

-- Vetores sintéticos de teste (não são IMEIs reais — mesmos do
-- src/lib/luhn.test.ts):
-- select phoneitz_luhn_valido('352562041506190'); -- true
-- select phoneitz_luhn_valido('352562041506191'); -- false

create type condicao_aparelho as enum ('novo', 'seminovo', 'vitrine', 'defeito');

create type status_aparelho as enum ('em_estoque', 'reservado', 'vendido', 'devolvido', 'baixado');

-- 'outro' cobre venda histórica migrada do Catira Control (0018), cuja forma
-- de pagamento original não foi registrada no schema antigo (só a
-- plataforma/canal de venda e a taxa dela eram guardados).
create type forma_pagamento as enum ('dinheiro', 'pix', 'cartao_debito', 'cartao_credito', 'boleto', 'financiamento', 'outro');
