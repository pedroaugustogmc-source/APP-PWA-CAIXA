-- Pedido do usuário: no estoque, distinguir "Vendido" (baixa manual, fora do
-- fluxo formal de venda) de "Perdido/danificado" — hoje os dois caíam no
-- mesmo valor 'baixado' do enum, sem jeito de diferenciar um do outro na UI
-- nem em relatório futuro. Mantém 'baixado' com o significado que já tem
-- (usado como "Vendido" manual desde a tela de Estoque) e adiciona um valor
-- novo e distinto só pra perda/dano, sem tocar no que já existe.
alter type status_aparelho add value if not exists 'perdido_danificado';
