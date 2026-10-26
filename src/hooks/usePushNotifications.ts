import { useCallback, useEffect, useState } from 'react'
import {
  ativarNotificacoes,
  desativarNotificacoes,
  detectarSuportePush,
  enviarNotificacaoTeste,
  obterInscricaoAtual,
  type SuportePush,
} from '../lib/push'

export function usePushNotifications() {
  const [suporte, setSuporte] = useState<SuportePush>('nao_suportado')
  const [ativo, setAtivo] = useState(false)
  const [carregando, setCarregando] = useState(true)
  const [processando, setProcessando] = useState(false)
  const [erro, setErro] = useState<string | null>(null)

  const refetch = useCallback(async () => {
    setCarregando(true)
    const suporteAtual = detectarSuportePush()
    setSuporte(suporteAtual)
    if (suporteAtual === 'suportado') {
      try {
        const inscricao = await obterInscricaoAtual()
        setAtivo(!!inscricao)
      } catch {
        setAtivo(false)
      }
    }
    setCarregando(false)
  }, [])

  useEffect(() => {
    refetch()
  }, [refetch])

  const ativar = useCallback(async () => {
    setProcessando(true)
    setErro(null)
    const { error } = await ativarNotificacoes()
    if (error) {
      setErro(error)
    } else {
      setAtivo(true)
    }
    setProcessando(false)
  }, [])

  const desativar = useCallback(async () => {
    setProcessando(true)
    setErro(null)
    const { error } = await desativarNotificacoes()
    if (error) {
      setErro(error)
    } else {
      setAtivo(false)
    }
    setProcessando(false)
  }, [])

  const enviarTeste = useCallback(async () => {
    setProcessando(true)
    setErro(null)
    const { error } = await enviarNotificacaoTeste()
    if (error) setErro(error)
    setProcessando(false)
    return { error }
  }, [])

  return { suporte, ativo, carregando, processando, erro, ativar, desativar, enviarTeste }
}
