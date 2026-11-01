import { useState } from 'react'
import { useInstallPrompt } from '../hooks/useInstallPrompt'
import { Card, CardLabel } from './Card'
import { Button } from './Button'
import { ErrorMessage } from './ErrorMessage'
import { IconDownload } from './icons'

export function InstalarAppCard() {
  const { disponivel, instalado, instalar } = useInstallPrompt()
  const [erro, setErro] = useState<string | null>(null)

  async function handleInstalar() {
    setErro(null)
    const { error } = await instalar()
    if (error) setErro(error)
  }

  return (
    <Card as="section">
      <CardLabel>
        <IconDownload className="h-4 w-4" /> Instalar o app
      </CardLabel>

      {instalado ? (
        <p className="text-sm text-slate-600">PHONEITZ já está instalado neste dispositivo.</p>
      ) : disponivel ? (
        <>
          <p className="mb-3 text-xs text-slate-500">
            Instale o PHONEITZ como um app no seu computador — abre numa janela própria, sem a barra do navegador, e
            fica fixado na tela inicial ou na barra de tarefas.
          </p>
          {erro && <ErrorMessage message={erro} />}
          <Button variant="primary" fullWidth onClick={handleInstalar}>
            <IconDownload className="h-3.5 w-3.5" /> Instalar PHONEITZ
          </Button>
        </>
      ) : (
        <div className="space-y-2 text-xs text-slate-500">
          <p>
            <strong className="text-slate-700">Chrome ou Edge:</strong> clique no ícone{' '}
            <IconDownload className="inline h-3 w-3 -translate-y-px align-middle" /> na barra de endereço, ou no menu{' '}
            <strong>⋮</strong> → <strong>Instalar PHONEITZ…</strong>
          </p>
          <p>
            <strong className="text-slate-700">Safari (Mac):</strong> menu <strong>Arquivo</strong> →{' '}
            <strong>Adicionar ao Dock…</strong>
          </p>
          <p>
            <strong className="text-slate-700">Firefox:</strong> no computador, o Firefox ainda não tem suporte a
            instalar apps — use Chrome, Edge ou Safari pra isso.
          </p>
        </div>
      )}
    </Card>
  )
}
