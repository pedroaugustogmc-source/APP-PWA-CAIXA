import { useState } from 'react'
import { usePushNotifications } from '../hooks/usePushNotifications'
import { Card, CardLabel } from './Card'
import { Button } from './Button'
import { ErrorMessage } from './ErrorMessage'

export function NotificacoesPanel() {
  const { suporte, ativo, carregando, processando, erro, ativar, desativar, enviarTeste } = usePushNotifications()
  const [avisoTeste, setAvisoTeste] = useState<string | null>(null)

  async function handleTeste() {
    setAvisoTeste(null)
    const { error } = await enviarTeste()
    if (!error) setAvisoTeste('Notificação de teste enviada — confira em instantes.')
  }

  if (carregando) return null

  return (
    <Card>
      <CardLabel>Notificações</CardLabel>
      <p className="mb-3 text-sm text-slate-600">
        Receba avisos no celular sobre contas a pagar vencendo e itens parados em estoque, mesmo com o app fechado.
      </p>

      {suporte === 'nao_suportado' && (
        <p className="text-xs text-slate-400">Seu navegador não suporta notificações push.</p>
      )}

      {suporte === 'ios_precisa_instalar' && (
        <p className="text-xs text-slate-400">
          No iPhone, primeiro adicione o PHONEITZ à tela de início (botão Compartilhar → Adicionar à Tela de Início)
          e abra por esse atalho pra poder ativar notificações.
        </p>
      )}

      {suporte === 'suportado' && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-slate-700">{ativo ? 'Notificações ativadas' : 'Notificações desativadas'}</span>
            <Button variant={ativo ? 'secondary' : 'primary'} size="sm" disabled={processando} onClick={ativo ? desativar : ativar}>
              {ativo ? 'Desativar' : 'Ativar'}
            </Button>
          </div>

          {ativo && (
            <Button variant="secondary" size="sm" disabled={processando} onClick={handleTeste}>
              Enviar notificação de teste
            </Button>
          )}

          {avisoTeste && <p className="text-xs text-emerald-600">{avisoTeste}</p>}
        </div>
      )}

      {erro && <ErrorMessage message={erro} />}
    </Card>
  )
}
