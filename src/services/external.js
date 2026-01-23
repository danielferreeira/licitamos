// src/services/external.js

export const external = {
  // 1. Busca Endereço via CEP (Agora usando BrasilAPI v2)
  fetchCEP: async (cep) => {
    // Remove tudo que não é número
    const cleanCep = cep.replace(/\D/g, '')
    
    // Validação básica
    if (cleanCep.length !== 8) {
      throw new Error('CEP inválido.')
    }
    
    // Chamada à BrasilAPI (Endpoint v2 é o mais robusto)
    const response = await fetch(`https://brasilapi.com.br/api/cep/v2/${cleanCep}`)
    
    if (!response.ok) {
      throw new Error('CEP não encontrado.')
    }
    
    const data = await response.json()
    
    // Normaliza o retorno para o padrão do nosso formulário
    return {
      street: data.street,       // Rua
      neighborhood: data.neighborhood, // Bairro
      city: data.city,           // Cidade
      state: data.state,         // UF
      // A BrasilAPI v2 as vezes retorna coordenadas (location), se quiser usar no futuro
    }
  },

  // 2. Busca Empresa via CNPJ (Mantido BrasilAPI)
  fetchCNPJ: async (cnpj) => {
    const cleanCNPJ = cnpj.replace(/\D/g, '')
    
    if (cleanCNPJ.length !== 14) {
      throw new Error('CNPJ inválido.')
    }

    const response = await fetch(`https://brasilapi.com.br/api/cnpj/v1/${cleanCNPJ}`)
    
    if (!response.ok) {
      // Tenta ler o erro retornado pela API
      try {
        const err = await response.json()
        throw new Error(err.message || 'CNPJ não encontrado.')
      } catch (e) {
        throw new Error('Erro ao consultar CNPJ.')
      }
    }
    
    const data = await response.json()
    
    // Normaliza o retorno
    return {
      company_name: data.razao_social,
      fantasy_name: data.nome_fantasia,
      phone: data.ddd_telefone_1,
      email: data.email,
      // Endereço da empresa (caso queira preencher auto pelo CNPJ também)
      street: data.logradouro,
      number: data.numero,
      neighborhood: data.bairro,
      zip_code: data.cep, // BrasilAPI retorna formato 00000000 ou 00000-000
      city: data.municipio,
      state: data.uf,
      status_receita: data.descricao_situacao_cadastral // Ativa/Inapta
    }
  }
}