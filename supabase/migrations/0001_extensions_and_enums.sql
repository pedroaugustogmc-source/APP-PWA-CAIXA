-- Extensões e tipos enumerados usados pelo schema do Catira Control.

create extension if not exists pgcrypto with schema extensions;

create type condicao_item as enum ('novo', 'usado');

create type status_item as enum ('em_estoque', 'reservado', 'vendido', 'perdido_danificado');

create type categoria_despesa_tipo as enum ('marketing', 'embalagem_geral', 'transporte', 'taxas', 'outros');

-- Função utilitária: mantém "updated_at" sempre atualizado.
create or replace function set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;
