/**
 * Validação Luhn — só para feedback instantâneo no formulário. A fronteira
 * de segurança real é o CHECK `luhn_valido()` em SQL (ver
 * supabase/migrations/0014_luhn_e_enums.sql): mesmo que esta função tenha um
 * bug ou seja contornada no client, o banco rejeita o IMEI inválido.
 */
export function luhnValido(numero: string): boolean {
  if (!/^[0-9]+$/.test(numero)) return false

  let soma = 0
  let dobrar = false
  for (let i = numero.length - 1; i >= 0; i--) {
    let digito = Number(numero[i])
    if (dobrar) {
      digito *= 2
      if (digito > 9) digito -= 9
    }
    soma += digito
    dobrar = !dobrar
  }
  return soma % 10 === 0
}

/** IMEI: exatamente 15 dígitos com dígito verificador Luhn válido. */
export function imeiValido(imei: string): boolean {
  return /^[0-9]{15}$/.test(imei) && luhnValido(imei)
}
