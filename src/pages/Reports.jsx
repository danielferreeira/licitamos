import { useState, useEffect } from 'react'
import { FileText, Download, Copy, Search, User, FileCheck, CheckCircle, Printer, Edit3 } from 'lucide-react'
import { api } from '../services/api'
import { toast } from 'sonner'
import { maskDocument, maskPhone } from '../utils/formatters'

export function Reports() {
  const [clients, setClients] = useState([])
  const [userProfile, setUserProfile] = useState(null)
  
  // Controle do Modal e Seleção
  const [selectedReport, setSelectedReport] = useState(null) // 'contrato', 'checklist', 'proposta'
  const [selectedClient, setSelectedClient] = useState(null)
  const [generatedContent, setGeneratedContent] = useState('')
  const [searchTerm, setSearchTerm] = useState('')

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    try {
      const [clientsData, profileData] = await Promise.all([
        api.getClients(),
        api.getProfile()
      ])
      setClients(clientsData || [])
      setUserProfile(profileData || {})
    } catch (error) {
      toast.error("Erro ao carregar dados.")
    }
  }

  // --- MODELOS DE DOCUMENTOS (Templates) ---
  
  const generateChecklist = (client) => {
    return `SOLICITAÇÃO DE DOCUMENTOS PARA LICITAÇÃO
Cliente: ${client.company_name}
CNPJ: ${maskDocument(client.cnpj)}
Data: ${new Date().toLocaleDateString('pt-BR')}

Prezados,

Para darmos início à preparação da documentação e participação nos processos licitatórios, solicitamos o envio dos seguintes documentos atualizados:

DOCUMENTAÇÃO JURÍDICA E FISCAL:
[ ] Contrato Social (e última alteração, se houver)
[ ] Documento do Representante Legal (RG/CPF ou CNH)
[ ] Alvará de Funcionamento
[ ] Certidão Simplificada (Junta Comercial)

DADOS CADASTRAIS E ACESSO:
[ ] Nome completo do representante que irá assinar
[ ] Dados Bancários (Banco, Agência, Conta - Pessoa Jurídica)
[ ] E-mail e Telefone de contato para o cadastro
[ ] Certificado Digital (A1) ou Senha de Acesso GOV.BR

QUALIFICAÇÃO ECONÔMICA E TÉCNICA:
[ ] Balanço Patrimonial e DRE dos últimos 2 anos (com termos de abertura e fechamento)
[ ] Atestados de Capacidade Técnica (emitidos por PJ)
[ ] Registro em Conselhos de Classe da Empresa (CREA/CAU), se houver
[ ] Registro em Conselhos de Classe do Técnico Responsável
[ ] Comprovação de Vínculo do Técnico com a Empresa (se não for sócio)
[ ] Papel Timbrado da Empresa (em arquivo digital)

OBSERVAÇÃO:
As Certidões Negativas (Federal, Estadual, Municipal, FGTS e Trabalhista) serão emitidas por nossa equipe, mas é imprescindível que a empresa esteja sem pendências financeiras nestes órgãos.

Atenciosamente,
${userProfile?.company_name || 'Equipe Licitamos'}`
  }

  const generateContract = (client) => {
    // Endereço formatado da CONTRATADA (Sua empresa)
    const yourAddress = `${userProfile?.street || 'Rua...'}, ${userProfile?.number || 's/n'}, ${userProfile?.neighborhood || 'Bairro'}, ${userProfile?.city || 'Cidade'}/${userProfile?.state || 'UF'}, CEP: ${userProfile?.zip_code || '...'}`
    
    // Dados Bancários
    const bankInfo = `Banco: ${userProfile?.bank_name || '...'}, Ag: ${userProfile?.bank_agency || '...'}, Conta: ${userProfile?.bank_account || '...'}, PIX: ${userProfile?.pix_key || '...'}`

    return `CONTRATO DE PRESTAÇÃO DE SERVIÇOS JURÍDICOS E ASSESSORIA EM LICITAÇÕES

CONTRATADA: ${userProfile?.company_name || 'SUA EMPRESA'}, inscrita no CNPJ sob o nº ${userProfile?.cnpj || '...'}, com sede em ${yourAddress}, neste ato representada por ${userProfile?.representative_name || '...'}, CPF ${userProfile?.representative_cpf || '...'}.

CONTRATANTE: ${client.company_name}, inscrita no CNPJ sob o nº ${maskDocument(client.cnpj)}, com sede em ${client.street}, ${client.number}, ${client.neighborhood}, ${client.city}/${client.state}, CEP: ${client.zip_code}, neste ato representada por seu responsável legal.

CLÁUSULA PRIMEIRA – DO OBJETO
O presente contrato tem como objeto a prestação de serviços de assessoria e apoio na preparação de documentação e participação em licitações.

CLÁUSULA SEGUNDA – DAS OBRIGAÇÕES
A CONTRATADA compromete-se a monitorar oportunidades, organizar documentação e representar a Contratante em pregões eletrônicos com zelo e sigilo.

CLÁUSULA TERCEIRA – DOS HONORÁRIOS
Pelos serviços prestados, a Contratante pagará:
1. Mensalidade: R$ [VALOR] mensais.
2. Êxito: [PORCENTAGEM]% sobre o valor líquido dos contratos vencidos.

Parágrafo Único: Os pagamentos deverão ser realizados via transferência bancária para:
${bankInfo}

CLÁUSULA QUARTA – DA VIGÊNCIA
O contrato terá vigência de 12 (doze) meses, podendo ser rescindido mediante aviso prévio de 30 dias.

E por estarem justas e contratadas, as partes assinam o presente.

Local e Data:
${userProfile?.city || 'Itajaí'}/${userProfile?.state || 'SC'}, ${new Date().toLocaleDateString('pt-BR', { day: 'numeric', month: 'long', year: 'numeric' })}.

__________________________________________
${client.company_name}
(Contratante)

__________________________________________
${userProfile?.company_name || 'CONTRATADA'}
${userProfile?.representative_name || ''}
(Contratada)
`
  }

  const generateProposal = (client) => {
    return `PROPOSTA DE ASSESSORIA EM LICITAÇÕES
Para: ${client.company_name}

Prezados,

Temos o prazer de apresentar esta proposta para oferecer suporte especializado em licitações públicas, maximizando suas chances de venda para o governo.

NOSSOS SERVIÇOS INCLUEM:
1. Inteligência: Monitoramento diário de editais em todo o Brasil.
2. Burocracia Zero: Nós cuidamos das certidões, cadastros e habilitação jurídica.
3. Estratégia: Análise dos concorrentes e definição de lances.
4. Jurídico: Elaboração de impugnações e recursos administrativos.

INVESTIMENTO:
- Mensalidade Fixa: R$ 600,00 (nos 3 primeiros meses) / R$ 750,00 (após).
- Comissão de Êxito: 5% sobre o contrato conquistado.

A vigência da proposta é de 10 dias.

Atenciosamente,

${userProfile?.company_name || 'Licitamos Consultoria'}
${userProfile?.phone || ''} | ${userProfile?.email_contact || ''}`
  }

  // --- AÇÕES ---

  function handleSelectReport(type) {
    setSelectedReport(type)
    setGeneratedContent('')
    setSelectedClient(null)
  }

  function handleGenerate(client) {
    setSelectedClient(client)
    let content = ''
    
    if (selectedReport === 'checklist') content = generateChecklist(client)
    if (selectedReport === 'contrato') content = generateContract(client)
    if (selectedReport === 'proposta') content = generateProposal(client)
    
    setGeneratedContent(content)
  }

  function handleCopy() {
    navigator.clipboard.writeText(generatedContent)
    toast.success("Texto copiado para a área de transferência!")
  }

  function handlePrint() {
    const printWindow = window.open('', '', 'height=600,width=800');
    printWindow.document.write('<html><head><title>Imprimir Documento</title>');
    // Ajuste de estilo para impressão ficar bonita
    printWindow.document.write('<style>body{font-family: Arial, sans-serif; white-space: pre-wrap; padding: 40px; font-size: 12pt; line-height: 1.5;}</style>');
    printWindow.document.write('</head><body>');
    printWindow.document.write(generatedContent); // Imprime o conteúdo editado
    printWindow.document.write('</body></html>');
    printWindow.document.close();
    printWindow.print();
  }

  // Filtragem de clientes para o modal
  const filteredClients = clients.filter(c => 
    c.company_name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    c.cnpj.includes(searchTerm)
  )

  return (
    <div className="max-w-7xl mx-auto pb-10 animate-fade-in">
      <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">Central de Documentos</h1>
      <p className="text-slate-500 dark:text-slate-400 mb-8">Gere contratos, propostas e solicitações automaticamente.</p>

      {/* GRADE DE MODELOS DISPONÍVEIS */}
      {!selectedReport && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          <button onClick={() => handleSelectReport('checklist')} className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm hover:border-brand-green hover:shadow-md transition group text-left">
            <div className="w-12 h-12 bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <FileCheck size={24}/>
            </div>
            <h3 className="font-bold text-lg text-slate-800 dark:text-white mb-2">Solicitação de Documentos</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400">Gera a lista completa de documentos iniciais para enviar ao cliente.</p>
          </button>

          <button onClick={() => handleSelectReport('contrato')} className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm hover:border-brand-green hover:shadow-md transition group text-left">
            <div className="w-12 h-12 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <FileText size={24}/>
            </div>
            <h3 className="font-bold text-lg text-slate-800 dark:text-white mb-2">Minuta de Contrato</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400">Gera um contrato de prestação de serviços preenchido com os dados do cliente.</p>
          </button>

          <button onClick={() => handleSelectReport('proposta')} className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm hover:border-brand-green hover:shadow-md transition group text-left">
            <div className="w-12 h-12 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <User size={24}/>
            </div>
            <h3 className="font-bold text-lg text-slate-800 dark:text-white mb-2">Proposta Comercial</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400">Gera uma proposta padrão de assessoria em licitações.</p>
          </button>

        </div>
      )}

      {/* ÁREA DE GERAÇÃO */}
      {selectedReport && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-fade-in">
          
          {/* Coluna da Esquerda: Seleção de Cliente */}
          <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-100 dark:border-slate-700 h-[calc(100vh-200px)] flex flex-col">
            <button onClick={() => setSelectedReport(null)} className="text-sm text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 mb-4 flex items-center gap-1">
              ← Voltar aos modelos
            </button>
            
            <h3 className="font-bold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
              <Search size={18}/> Selecionar Cliente
            </h3>

            <div className="relative mb-4">
              <input 
                placeholder="Buscar cliente..." 
                className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-800 dark:text-white outline-none focus:ring-2 focus:ring-brand-green"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
              />
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar space-y-2">
              {filteredClients.map(client => (
                <button
                  key={client.id}
                  onClick={() => handleGenerate(client)}
                  className={`w-full text-left p-3 rounded-xl border transition-all ${
                    selectedClient?.id === client.id 
                      ? 'bg-brand-green text-white border-brand-green' 
                      : 'bg-white dark:bg-slate-800 border-slate-100 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700'
                  }`}
                >
                  <div className="font-bold text-sm truncate">{client.company_name}</div>
                  <div className={`text-xs ${selectedClient?.id === client.id ? 'text-white/80' : 'text-slate-400'}`}>
                    {maskDocument(client.cnpj)}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Coluna da Direita: EDITOR do Documento */}
          <div className="lg:col-span-2 bg-white dark:bg-slate-800 p-8 rounded-2xl border border-slate-100 dark:border-slate-700 flex flex-col h-[calc(100vh-200px)]">
            {selectedClient ? (
              <>
                <div className="flex justify-between items-center mb-4 pb-4 border-b border-slate-100 dark:border-slate-700">
                  <div>
                    <h2 className="font-bold text-lg text-slate-800 dark:text-white flex items-center gap-2">
                      <Edit3 size={18} className="text-brand-green"/> Editor de Documento
                    </h2>
                    <p className="text-xs text-slate-500">Editando para: {selectedClient.company_name}</p>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={handleCopy} className="p-2 text-slate-500 hover:text-brand-green hover:bg-green-50 dark:hover:bg-green-900/20 rounded-lg transition" title="Copiar Texto">
                      <Copy size={20}/>
                    </button>
                    <button onClick={handlePrint} className="bg-brand-green hover:bg-brand-light text-white px-4 py-2 rounded-lg font-bold text-sm flex items-center gap-2 transition shadow-sm">
                      <Printer size={18}/> Imprimir / PDF
                    </button>
                  </div>
                </div>

                {/* AREA EDITÁVEL */}
                <textarea 
                  className="flex-1 w-full h-full bg-slate-50 dark:bg-slate-900/50 p-6 rounded-xl border border-slate-200 dark:border-slate-700 resize-none focus:outline-none focus:ring-2 focus:ring-brand-green font-sans text-sm text-slate-700 dark:text-slate-300 leading-relaxed custom-scrollbar"
                  value={generatedContent}
                  onChange={(e) => setGeneratedContent(e.target.value)}
                  spellCheck="false"
                />
              </>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-slate-400 opacity-60">
                <FileText size={48} className="mb-4 stroke-1"/>
                <p>Selecione um cliente na lista ao lado para gerar e editar o documento.</p>
              </div>
            )}
          </div>

        </div>
      )}
    </div>
  )
}