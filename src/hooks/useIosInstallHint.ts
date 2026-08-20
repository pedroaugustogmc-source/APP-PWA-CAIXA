import { useEffect, useState } from 'react'

const DISMISSED_KEY = 'catira-ios-install-hint-dismissed'

function isIos(): boolean {
  return /iPad|iPhone|iPod/.test(navigator.userAgent) && !('MSStream' in window)
}

function isStandalone(): boolean {
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    (navigator as Navigator & { standalone?: boolean }).standalone === true
  )
}

/**
 * Safari no iOS não mostra banner automático de instalação — o app precisa
 * avisar manualmente: "toque em Compartilhar → Adicionar à Tela de Início".
 */
export function useIosInstallHint() {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const jaFechou = localStorage.getItem(DISMISSED_KEY) === '1'
    setVisible(isIos() && !isStandalone() && !jaFechou)
  }, [])

  function dismiss() {
    localStorage.setItem(DISMISSED_KEY, '1')
    setVisible(false)
  }

  return { visible, dismiss }
}
