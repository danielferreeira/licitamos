import { supabase } from '../supabaseClient'

export const api = {
  // Clientes
  // Clientes (Atualizado para trazer documentos junto)
  // ...
  getClients: async () => {
    // O segredo é: ', client_documents(*)' 
    // O nome deve ser IGUAL ao nome da tabela no banco
    const { data, error } = await supabase
      .from('clients')
      .select('*, client_documents(*)')  // <--- ATENÇÃO AQUI
      .order('company_name', { ascending: true })
      
    if (error) throw error
    return data
  },
  // ...

  saveClient: async (client) => {
    // AQUI ESTÁ A CORREÇÃO:
    // Removemos 'id', 'created_at', 'user_id' (são automáticos)
    // Removemos 'documents' (que vem do join da busca)
    // Removemos 'status_receita' (que vem da API externa)
    const { 
      id, 
      created_at, 
      user_id, 
      documents, 
      status_receita, 
      ...dataToSave 
    } = client
    
    if (id) {
      return await supabase.from('clients').update(dataToSave).eq('id', id)
    }
    return await supabase.from('clients').insert([dataToSave])
  },

  deleteClient: async (id) => {
    return await supabase.from('clients').delete().eq('id', id)
  },

  // Interações
  getInteractions: async (clientId) => {
    const { data, error } = await supabase
      .from('interactions')
      .select('*')
      .eq('client_id', clientId)
      .order('created_at', { ascending: false })
    if (error) throw error
    return data
  },
  
  updateTheme: async (newTheme) => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { error } = await supabase
      .from('profiles')
      .update({ theme: newTheme })
      .eq('id', user.id)

    if (error) throw error
  },

  addInteraction: async (clientId, note) => {
    return await supabase.from('interactions').insert([{ 
      client_id: clientId, 
      notes: note, 
      contact_type: 'Anotação' 
    }])
  },
  // Documentos
  getDocuments: async (clientId) => {
    const { data, error } = await supabase
      .from('documents')
      .select('*')
      .eq('client_id', clientId)
      .order('expiration_date', { ascending: true }) // Mostra os que vencem antes primeiro
    if (error) throw error
    return data
  },

  addDocument: async (docData) => {
    return await supabase.from('documents').insert([docData])
  },

  deleteDocument: async (id) => {
    return await supabase.from('documents').delete().eq('id', id)
  },
  // ... resto do código anterior ...

  // Dashboard & Alertas
  getDashboardStats: async () => {
    const today = new Date().toISOString().split('T')[0]
    
    // Data daqui a 30 dias
    const next30Days = new Date()
    next30Days.setDate(next30Days.getDate() + 30)
    const next30DaysStr = next30Days.toISOString().split('T')[0]

    // 1. Total de Clientes
    const { count: clientsCount } = await supabase
      .from('clients')
      .select('*', { count: 'exact', head: true })

    // 2. Docs Vencidos (data < hoje)
    const { count: expiredCount } = await supabase
      .from('documents')
      .select('*', { count: 'exact', head: true })
      .lt('expiration_date', today)

    // 3. Docs Vencendo em Breve (hoje <= data <= 30 dias)
    const { count: expiringCount } = await supabase
      .from('documents')
      .select('*', { count: 'exact', head: true })
      .gte('expiration_date', today)
      .lte('expiration_date', next30DaysStr)

    return {
      clients: clientsCount || 0,
      expired: expiredCount || 0,
      expiring: expiringCount || 0
    }
  },
  // ... (código anterior)

  // Licitações (Kanban)
  getBids: async () => {
    const { data, error } = await supabase
      .from('bids')
      .select('*, clients(company_name)') // Traz o nome do cliente junto
      .order('deadline', { ascending: true })
    if (error) throw error
    return data
  },

  saveBid: async (bid) => {
    // AQUI ESTÁ A CORREÇÃO:
    // Removemos 'clients' (que vem da leitura e causa o erro)
    // Removemos 'created_at' e 'user_id' (são automáticos)
    // Removemos 'id' (usado apenas para identificar qual atualizar)
    const { 
      id, 
      clients, 
      created_at, 
      user_id, 
      ...dataToSave 
    } = bid
    
    if (id) {
      return await supabase.from('bids').update(dataToSave).eq('id', id)
    }
    return await supabase.from('bids').insert([dataToSave])
  },

  deleteBid: async (id) => {
    return await supabase.from('bids').delete().eq('id', id)
  },
  
  updateBidStatus: async (id, newStatus) => {
    return await supabase.from('bids').update({ status: newStatus }).eq('id', id)
  },
  // ... código anterior ...

  // PERFIL / CONFIGURAÇÕES
  getProfile: async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return null

    const { data, error } = await supabase
      .from('profiles')
      .select('*') // O * já vai trazer a coluna 'theme' nova
      .eq('id', user.id)
      .single()

    if (error && error.code !== 'PGRST116') throw error
    return data
  },

  saveProfile: async (profileData) => {
    const { data: { user } } = await supabase.auth.getUser()
    
    const updates = {
      id: user.id,
      ...profileData,
      updated_at: new Date(),
    }

    const { error } = await supabase.from('profiles').upsert(updates)
    if (error) throw error
  },

  // BACKUP COMPLETO (Exportar Dados)
  getFullBackup: async () => {
    const { data: clients } = await supabase.from('clients').select('*')
    const { data: bids } = await supabase.from('bids').select('*')
    return { clients, bids, exported_at: new Date() }
  },
  // ... (código anterior)

  // IMPORTAÇÃO DE DADOS (Restaurar Backup)
  importData: async (jsonData) => {
    const { clients, bids } = jsonData
    
    // 1. Validar estrutura básica
    if (!Array.isArray(clients) || !Array.isArray(bids)) {
      throw new Error("Arquivo inválido. Formato JSON incorreto.")
    }

    // 2. Importar Clientes primeiro (Upsert = Atualiza se existir, Cria se não)
    if (clients.length > 0) {
      const { error: errorClients } = await supabase
        .from('clients')
        .upsert(clients, { onConflict: 'id' }) // Usa o ID para saber se atualiza
      
      if (errorClients) throw new Error("Erro ao importar clientes: " + errorClients.message)
    }

    // 3. Importar Licitações depois
    if (bids.length > 0) {
      const { error: errorBids } = await supabase
        .from('bids')
        .upsert(bids, { onConflict: 'id' })
        
      if (errorBids) throw new Error("Erro ao importar licitações: " + errorBids.message)
    }

    return { clientsCount: clients.length, bidsCount: bids.length }
  },
  // --- HISTÓRICO DO CLIENTE ---
  getClientHistory: async (clientId) => {
    const { data, error } = await supabase
      .from('client_history')
      .select('*')
      .eq('client_id', clientId)
      .order('created_at', { ascending: true }) 
    
    if (error) throw error
    return data
  },

  addClientHistory: async (clientId, content) => {
    const { data: { user } } = await supabase.auth.getUser()
    
    // Mudança: Adicionei .select().single() para retornar o objeto criado
    const { data, error } = await supabase
      .from('client_history')
      .insert([
        { 
          client_id: clientId, 
          content: content,
          user_id: user.id
        }
      ])
      .select() 
      .single() 
    
    if (error) throw error
    
    // Retorna o dado para a gente usar na tela imediatamente
    return data 
  },


  // --- DOCUMENTOS ---
  getDocuments: async (clientId) => {
    const { data, error } = await supabase
      .from('client_documents')
      .select('*')
      .eq('client_id', clientId)
      .order('expiration_date', { ascending: true })
    if (error) throw error
    return data
  },

  addDocument: async (docData) => {
    const { error } = await supabase.from('client_documents').insert([docData])
    if (error) throw error
  },

  deleteDocument: async (docId) => {
    const { error } = await supabase.from('client_documents').delete().eq('id', docId)
    if (error) throw error
  },

  // ... (outras funções)

  // BUSCAR DADOS FINANCEIROS REAIS
  getFinancialSummary: async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return null

    // Busca todas as licitações do usuário
    const { data, error } = await supabase
      .from('bids')
      .select('*')
      .eq('user_id', user.id)

    if (error) throw error

    // Calcula os totais no Javascript
    const summary = {
      won: { value: 0, count: 0 },
      lost: { value: 0, count: 0 },
      potential: { value: 0, count: 0 }
    }

    data.forEach(bid => {
      const val = Number(bid.amount) || 0
      if (bid.status === 'Ganho') {
        summary.won.value += val
        summary.won.count += 1
      } else if (bid.status === 'Perdido') {
        summary.lost.value += val
        summary.lost.count += 1
      } else {
        // Qualquer outra coisa consideramos "Em Aberto" (Potencial)
        summary.potential.value += val
        summary.potential.count += 1
      }
    })

    return summary
  },

  // (Opcional) Função para criar uma licitação rápida (para testes)
  addBid: async (bidData) => {
    const { data: { user } } = await supabase.auth.getUser()
    const { error } = await supabase.from('bids').insert([{ ...bidData, user_id: user.id }])
    if (error) throw error
  }
  
  // ... (resto do código)
}
