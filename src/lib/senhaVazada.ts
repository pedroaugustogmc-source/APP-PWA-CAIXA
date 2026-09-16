/**
 * Verifica se a senha já apareceu em vazamentos conhecidos, usando a API
 * "Pwned Passwords" (HaveIBeenPwned) — a mesma fonte que o Supabase usa no
 * recurso "Leaked Password Protection", que só existe no plano Pro. Aqui
 * replicamos a checagem no próprio app, de graça, via k-anonimato: só os 5
 * primeiros caracteres do hash SHA-1 da senha saem do navegador, nunca a
 * senha em si nem o hash completo.
 */
async function sha1Hex(texto: string): Promise<string> {
  const bytes = new TextEncoder().encode(texto)
  const hashBuffer = await crypto.subtle.digest('SHA-1', bytes)
  return Array.from(new Uint8Array(hashBuffer))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
    .toUpperCase()
}

export async function senhaVazada(senha: string): Promise<boolean> {
  try {
    const hash = await sha1Hex(senha)
    const prefixo = hash.slice(0, 5)
    const sufixo = hash.slice(5)
    const res = await fetch(`https://api.pwnedpasswords.com/range/${prefixo}`)
    if (!res.ok) return false
    const texto = await res.text()
    return texto.split('\n').some((linha) => (linha.split(':')[0] ?? '').trim() === sufixo)
  } catch {
    // API indisponível não deve bloquear o cadastro.
    return false
  }
}
