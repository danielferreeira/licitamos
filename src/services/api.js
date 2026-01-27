import { createClient } from '@supabase/supabase-js'

// Inicialização do Cliente Supabase
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY
export const supabase = createClient(supabaseUrl, supabaseKey)

export const api = {
  
  // --- CLIENTES ---
  getClients: async () => {
    const { data, error } = await supabase
      .from('clients')
      .select('*, client_documents(*)')
      .order('company_name', { ascending: true })
      
    if (error) throw error
    return data
  },

  saveClient: async (client) => {
    const { 
      id, 
      created_at, 
      user_id, 
      client_documents, // Remove para não tentar salvar a lista junto
      client_history,   // Remove histórico
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

  // --- HISTÓRICO (Interações) ---
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

  // --- DASHBOARD (KPIs) ---
  getDashboardStats: async () => {
    const today = new Date().toISOString().split('T')[0]
    
    const next30Days = new Date()
    next30Days.setDate(next30Days.getDate() + 30)
    const next30DaysStr = next30Days.toISOString().split('T')[0]

    // 1. Total de Clientes
    const { count: clientsCount } = await supabase
      .from('clients')
      .select('*', { count: 'exact', head: true })

    // 2. Docs Vencidos (Usando a tabela correta: client_documents)
    const { count: expiredCount } = await supabase
      .from('client_documents')
      .select('*', { count: 'exact', head: true })
      .lt('expiration_date', today)

    // 3. Docs Vencendo (Usando a tabela correta: client_documents)
    const { count: expiringCount } = await supabase
      .from('client_documents')
      .select('*', { count: 'exact', head: true })
      .gte('expiration_date', today)
      .lte('expiration_date', next30DaysStr)

    return {
      clients: clientsCount || 0,
      expired: expiredCount || 0,
      expiring: expiringCount || 0
    }
  },

  // --- LICITAÇÕES (Kanban) ---
  getBids: async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return []

    const { data, error } = await supabase
      .from('bids')
      .select('*, clients(company_name)')
      .order('deadline', { ascending: true })
      
    if (error) throw error
    return data
  },

  saveBid: async (bid) => {
    const { data: { user } } = await supabase.auth.getUser()
    
    // Removemos 'clients' pois é um objeto de leitura (join), não existe na tabela bids
    const { 
      id, 
      clients, 
      created_at, 
      user_id, 
      ...dataToSave 
    } = bid
    
    // Garante que o valor seja numérico e não string vazia
    if (dataToSave.value === '') dataToSave.value = 0

    if (id) {
      return await supabase.from('bids').update(dataToSave).eq('id', id)
    }
    // No insert, forçamos o user_id do usuário logado
    return await supabase.from('bids').insert([{ ...dataToSave, user_id: user.id }])
  },

  deleteBid: async (id) => {
    return await supabase.from('bids').delete().eq('id', id)
  },
  
  updateBidStatus: async (id, newStatus) => {
    return await supabase.from('bids').update({ status: newStatus }).eq('id', id)
  },

  // --- FINANCEIRO ---
  getFinancialSummary: async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return null

    // Busca apenas status e valor para economizar dados
    const { data, error } = await supabase
      .from('bids')
      .select('status, value')
      .eq('user_id', user.id)

    if (error) throw error

    const summary = {
      won: { value: 0, count: 0 },
      lost: { value: 0, count: 0 },
      potential: { value: 0, count: 0 }
    }

    data.forEach(bid => {
      // CORREÇÃO: Usamos 'value' (nome da coluna no banco), não 'amount'
      const val = Number(bid.value) || 0
      
      // CORREÇÃO: Usamos 'Ganha'/'Perdida' para bater com o Modal
      if (bid.status === 'Ganha') {
        summary.won.value += val
        summary.won.count += 1
      } else if (bid.status === 'Perdida') {
        summary.lost.value += val
        summary.lost.count += 1
      } else {
        // Todo o resto é potencial (Triagem, Disputa, etc)
        summary.potential.value += val
        summary.potential.count += 1
      }
    })

    return summary
  },

  // --- PERFIL & TEMA ---
  getProfile: async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return null

    const { data, error } = await supabase
      .from('profiles')
      .select('*')
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

  updateTheme: async (newTheme) => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { error } = await supabase
      .from('profiles')
      .update({ theme: newTheme })
      .eq('id', user.id)

    if (error) throw error
  },

  // --- BACKUP & IMPORT ---
  getFullBackup: async () => {
    const { data: clients } = await supabase.from('clients').select('*')
    const { data: bids } = await supabase.from('bids').select('*')
    return { clients, bids, exported_at: new Date() }
  },

  importData: async (jsonData) => {
    const { clients, bids } = jsonData
    if (!Array.isArray(clients) || !Array.isArray(bids)) {
      throw new Error("Arquivo inválido.")
    }

    if (clients.length > 0) {
      const { error: errorClients } = await supabase
        .from('clients')
        .upsert(clients, { onConflict: 'id' })
      if (errorClients) throw new Error("Erro clientes: " + errorClients.message)
    }

    if (bids.length > 0) {
      const { error: errorBids } = await supabase
        .from('bids')
        .upsert(bids, { onConflict: 'id' })
      if (errorBids) throw new Error("Erro licitações: " + errorBids.message)
    }

    return { clientsCount: clients.length, bidsCount: bids.length }
  }
}