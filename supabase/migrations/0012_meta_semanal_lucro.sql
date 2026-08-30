-- Meta semanal de lucro, ao lado da meta mensal já existente.
alter table configuracoes
  add column meta_semanal_lucro numeric(12, 2) not null default 0 check (meta_semanal_lucro >= 0);
