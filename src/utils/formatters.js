// Formata CPF ou CNPJ automaticamente
export const maskDocument = (value) => {
  if (!value) return ""
  return value
    .replace(/\D/g, '') // Remove tudo que não é dígito
    .replace(/^(\d{2})(\d)/, '$1.$2')
    .replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3')
    .replace(/\.(\d{3})(\d)/, '.$1/$2')
    .replace(/(\d{4})(\d)/, '$1-$2')
    .substring(0, 18) // Limita ao tamanho do CNPJ
}

// Formata Telefone (Celular ou Fixo)
export const maskPhone = (value) => {
  if (!value) return ""
  let r = value.replace(/\D/g, "")
  r = r.replace(/^0/, "")
  if (r.length > 10) {
    r = r.replace(/^(\d\d)(\d{5})(\d{4}).*/, "($1) $2-$3")
  } else if (r.length > 5) {
    r = r.replace(/^(\d\d)(\d{4})(\d{0,4}).*/, "($1) $2-$3")
  } else if (r.length > 2) {
    r = r.replace(/^(\d\d)(\d{0,5})/, "($1) $2")
  } else {
    r = r.replace(/^(\d*)/, "($1")
  }
  return r
}

// Formata Moeda (BRL)
export const formatCurrency = (value) => {
  if (!value) return "R$ 0,00"
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(value)
}
// Formata CEP (00000-000)
export const maskZipCode = (value) => {
  if (!value) return ""
  return value
    .replace(/\D/g, "")
    .replace(/^(\d{5})(\d)/, "$1-$2")
    .substring(0, 9)
}

export const maskCpf = (value) => {
  return value
    .replace(/\D/g, '')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d{1,2})/, '$1-$2')
    .replace(/(-\d{2})\d+?$/, '$1')
}

// Classe utilitária para "Loading Skeleton" (aquele efeito cinza piscando)
export const skeletonClass = "animate-pulse bg-slate-200 rounded"