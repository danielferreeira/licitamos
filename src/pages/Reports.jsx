import { useState, useEffect } from 'react'
import { FileText, Download, Copy, Search, User, FileCheck, CheckCircle, Printer, Edit3 } from 'lucide-react'
import { api } from '../services/api'
import { toast } from 'sonner'
import { maskDocument, maskPhone } from '../utils/formatters'

export function Reports() {
  const [clients, setClients] = useState([])
  const [userProfile, setUserProfile] = useState(null)
  
  // Controle do Modal e Seleção
  const [selectedReport, setSelectedReport] = useState(null)
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

  // --- MODELOS DE DOCUMENTOS ---
  
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
    const yourAddress = `${userProfile?.street || 'Rua...'}, ${userProfile?.number || 's/n'}, ${userProfile?.neighborhood || 'Bairro'}, ${userProfile?.city || 'Cidade'}/${userProfile?.state || 'UF'}, CEP: ${userProfile?.zip_code || '...'}`
    const bankInfo = `Banco: ${userProfile?.bank_name || '...'}, Ag: ${userProfile?.bank_agency || '...'}, Conta: ${userProfile?.bank_account || '...'}, PIX: ${userProfile?.pix_key || '...'}`

    return `CONTRATO DE PRESTAÇÃO DE SERVIÇOS JURÍDICOS PARA PREPARAÇÃO DE DOCUMENTAÇÃO E PARTICIPAÇÃO EM LICITAÇÕES.
  
          Pelo presente instrumento particular de contrato de prestação de serviços, de um lado:

CONTRATADO: ${userProfile?.company_name || 'SUA EMPRESA'}, inscrita no CNPJ sob o nº ${userProfile?.cnpj || '...'}, com sede em ${yourAddress}, neste ato representada por ${userProfile?.representative_name || '...'}, CPF ${userProfile?.representative_cpf || '...'}.

CONTRATANTE: ${client.company_name}, inscrita no CNPJ sob o nº ${maskDocument(client.cnpj)}, com sede em ${client.street}, ${client.number}, ${client.neighborhood}, ${client.city}/${client.state}, CEP: ${client.zip_code}, neste ato representada por seu responsável legal.

As partes têm entre si, justas e contratadas, a celebração do presente Contrato de Prestação de Serviços, que se regerá pelas seguintes cláusulas: 

CLÁUSULA PRIMEIRA – DO OBJETO

O presente contrato tem como objeto a prestação de serviços de assessoria e apoio na preparação de documentação e participação em licitações, abrangendo as seguintes atividades: 
- Busca de Editais: Realização de pesquisa regular em fontes de informação sobre editais relacionados ao segmento da empresa, incluindo plataformas governamentais, jornais e portais específicos.
- Identificação de oportunidades de licitação que atendam aos interesses e necessidades da empresa.
- Análise de Editais: Estudo detalhado dos editais encontrados, incluindo requisitos técnicos, prazos e condições de participação.
- Elaboração de relatórios resumidos sobre as oportunidades identificadas, destacando informações relevantes e possíveis riscos.
- Elaboração e de documentação: Coordenar e elaborar toda a documentação necessária para a participação em licitações, incluindo, mas não se limitando a: 
● Certidões e declarações exigidas pelas licitações;
● Propostas comerciais e técnicas;
● Comprovações de regularidade fiscal e trabalhista;
● Qualificações técnicas e operacionais do CONTRATANTE.
● Fornecer assessoria jurídica relacionada a questões de licitação, ajudando a evitar problemas legais e a garantir a conformidade com a legislação.

Acompanhamento da licitação: 
A CONTRATADA compromete-se a monitorar o andamento das licitações em que a CONTRATANTE esteja participando, garantindo que sejam respeitados todos os prazos e procedimentos estabelecidos nos editais. 
O monitoramento incluirá, mas não se limitará a:
● Verificação rigorosa das datas de entrega de documentação e demais prazos estipulados no edital.
● Acompanhamento de todas as etapas do processo licitatório, incluindo eventuais alterações ou retificações no edital.
● Comunicação constante com a comissão de licitação para esclarecimento de dúvidas e obtenção de informações atualizadas sobre o andamento do processo.
● Avaliação da concorrência e suas propostas para ajustar estratégias e melhorar a proposta da CONTRATANTE.
● Preparação para imprevistos, incluindo a elaboração de recursos em caso de desclassificação ou impugnação por parte de concorrentes.
● Elaboração de relatórios de progresso para manter a equipe da CONTRATANTE informada e alinhada com as responsabilidades e próximos passos.

CLÁUSULA SEGUNDA – DAS OBRIGAÇÕES

São obrigações do CONTRATANTE:
- Fornecer todas as informações e documentos necessário para a prestação dos serviços;
- Efetuar o pagamento no prazo estipulado;
- Acompanhar as orientações dadas pelo CONTRATADO.
- O atraso na entrega de documentos ou informações solicitadas pelo CONTRATADO poderá acarretar prejuízo à prestação dos serviços, sendo de inteira responsabilidade do CONTRATANTE eventuais perdas decorrentes.

São obrigações da CONTRATADA:
- Prestar serviços contratados com diligência e eficiência;
- Manter sigilo sobre as informações obtidas durante a vigência deste contrato;
- Informar ao CONTRATANTE sobre qualquer fato que possa influenciar a execução dos serviços e sobre o andamento do processo licitatório.

CLÁUSULA TERCEIRA – DOS HONORÁRIOS

- Pelos serviços prestados serão remunerados da seguinte forma: R$ 1.200,00 (Um mil e duzentos reais) a primeira parcela será paga no dia 10.02.2026, e demais serão pago todo dia 10, mediante PIX, direto na conta da CONTRATADA, qual seja: Nome: Débora Felipiak Ern Sociedade Unipessoal de Advocacia, Banco Sicoob: 756, agência 3326, conta-corrente 51.563-9; Chave PIX: 51.561.503/0001-77.
- Comissão de Êxito: De igual forma, A CONTRATANTE se compromete a pagar ao CONTRATADO, como contraprestação pelos serviços de assessoria empresarial, um montante correspondente a 6% (seis por cento) do valor líquido dos contratos firmados em decorrência de licitações bem-sucedidas, na mesma conta bancária mencionada acima. A remuneração por êxito será devida independentemente de rescisão contratual posterior à assinatura do contrato oriundo da licitação, sendo irrevogável e irretratável.

CLÁUSULA QUARTA – DA VIGÊNCIA

O presente contrato passará a vigorar a partir da data de sua assinatura e será válido pelo período de 12 (doze) meses, podendo ser prorrogado por igual período, mediante concordância expressa das partes.

CLÁUSULA QUINTA – DO REAJUSTE 

Os honorários mensais serão reajustados anualmente, com base no índice IPCA ou outro que venha a substituí-lo, a partir do 13º mês de vigência.

CLÁUSULA SEXTA - RESPONSABILIDADE LIMITADA 

O CONTRATADO compromete-se a prestar os serviços contratados com zelo, diligência, ética e respeito às normas aplicáveis, observando as melhores práticas jurídicas.
Contudo, o CONTRATADO não garante resultados específicos no processo administrativo de licitação, como o ganho na licitação ou qualquer outra decisão favorável, sendo sua responsabilidade limitada à correta elaboração e apresentação de documentos, participação no certame, acompanhamento do processo do início ao fim.

CLÁUSULA SÉTIMA – DA RESCISÃO CONTRATUAL

Poderá o presente Instrumento ser rescindido por qualquer das partes, devendo a parte desistente notificar a outra por escrito, mediante aviso prévio de 30 (trinta) dias, sob pena de multa no importe de 10% (dez por cento) do valor total das mensalidades a vencer. 

DO FORO DE ELEIÇÃO

Para resolver qualquer controvérsia deste contrato, as partes elegem o foro da Comarca de Maravilha/SC, renunciando a qualquer outro.

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

Prezados Senhores, 

Temos o prazer de apresentar esta proposta, feita para atender às necessidades da sua empresa. Nosso objetivo é oferecer suporte jurídico de qualidade em licitações públicas. Combinamos nossa experiência em Licitações com uma compreensão das suas necessidades, para simplificar o processo e aumentar seus resultados.

ESCOPO DOS SERVIÇO
Nossa assessoria engloba um conjunto completo de atividades estratégicas, garantindo um acompanhamento integral e especializado: 
●	Inteligência em Licitações: Realizamos a identificação proativa de licitações alinhadas ao seu negócio, maximizando suas oportunidades no mercado público. 
●	Preparação da Documentação: Cuidamos de todos os detalhes na organização e elaboração da documentação necessária, garantindo que sua proposta seja completa, atenda às exigências legais e seja competitiva.
●	Acompanhamento Integral do Processo: Monitoramos cada etapa do processo licitatório, desde a publicação do edital, com uma análise detalhada dos requisitos e prazos. Também cuidamos da preparação e organização de toda a documentação necessária. Durante a abertura das propostas e lances, garantimos sua representação e acompanhamento. Se necessário, elaboramos recursos e seguimos com o processo até a homologação, mantendo você sempre informado e preparado para qualquer eventualidade ou necessidade de intervenção.
●	Suporte na Documentação Administrativa: Elaboramos a documentação administrativa necessária para o andamento do processo, incluindo pedidos de esclarecimento, impugnações e a elaboração de recursos.

INVESTIMENTO E CONDIÇÕES GERAIS

Acreditamos em soluções flexíveis e personalizadas. Por isso, oferecemos as seguintes opções de investimento: 

1.	Mensalidade Fixa: 
o	O valor da mensalidade nos 3 (três) primeiros meses é de R$ 600,00.
o	A partir do quarto mês, o valor é reajustado para R$ 750,00.
o	O pagamento da mensalidade fixa será realizado até o dia 10 (dez) de cada mês. 
2.	Comissão por Êxito: 
o	 (5% por cento) sobre o valor do contrato conquistado. 

Condições Adicionais Importantes:
●	As despesas com viagens, hospedagem e materiais, quando necessárias para o bom andamento dos serviços, serão cobradas à parte, mediante apresentação de comprovantes. 
●	O contrato de prestação de serviços terá duração inicial de 1 (um) ano, não possuindo cláusula de fidelidade, o que oferece flexibilidade e transparência na nossa relação. 

Proposta válida por 10 dias.

Atenciosamente,

${userProfile?.company_name || 'Licitamos Consultoria'}
${userProfile?.phone || ''}`
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

  // --- IMPRESSÃO INTELIGENTE (Com Assinaturas Lado a Lado) ---
  function handlePrint() {
    const printWindow = window.open('', '', 'height=600,width=800');
    
    // 1. Detectar se é um contrato com assinaturas
    const signatureLine = '__________________________________________';
    const parts = generatedContent.split(signatureLine);
    
    // Se tiver 3 partes (Texto + Assinatura 1 + Assinatura 2), formatamos especial
    let finalContent = generatedContent;
    let isSideBySide = false;

    if (parts.length === 3) {
      isSideBySide = true;
      const body = parts[0];
      const sig1 = parts[1].trim(); // Contratante
      const sig2 = parts[2].trim(); // Contratada
      
      finalContent = `
        ${body}
        <div class="signature-container">
           <div class="signature-box">
             ${sig1.replace(/\n/g, '<br/>')}
           </div>
           <div class="signature-box">
             ${sig2.replace(/\n/g, '<br/>')}
           </div>
        </div>
      `;
    }

    printWindow.document.write('<html><head><title>Imprimir Documento</title>');
    
    printWindow.document.write(`
      <style>
        body { font-family: Arial, sans-serif; white-space: pre-wrap; padding: 40px; font-size: 12pt; line-height: 1.5; color: #333; }
        
        /* LOGO CENTRALIZADA E MAIOR */
        .header-logo { 
          max-width: 300px; 
          display: block; 
          margin: 0 auto 30px auto; 
        }

        /* ESTILO DAS ASSINATURAS LADO A LADO */
        .signature-container {
          display: flex;
          justify-content: space-between;
          margin-top: 60px;
          page-break-inside: avoid;
        }
        .signature-box {
          width: 45%;
          text-align: center;
          border-top: 1px solid #000; /* Cria a linha automaticamente */
          padding-top: 10px;
          line-height: 1.4;
        }

        @media print {
          body { padding: 0; }
          .header-logo { margin-bottom: 20px; }
        }
      </style>
    `);
    
    printWindow.document.write('</head><body>');
    
    // Inserir Imagem
    printWindow.document.write('<img src="/logo-full.png" class="header-logo" alt="Logo Licitamos" />');
    
    // Inserir Conteúdo (Formatado ou Texto Puro)
    printWindow.document.write(finalContent);
    
    printWindow.document.write('</body></html>');
    printWindow.document.close();
    
    setTimeout(() => {
      printWindow.print();
    }, 500);
  }

  // Filtragem de clientes
  const filteredClients = clients.filter(c => 
    c.company_name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    c.cnpj.includes(searchTerm)
  )

  return (
    <div className="max-w-7xl mx-auto pb-10 animate-fade-in">
      <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">Central de Documentos</h1>
      <p className="text-slate-500 dark:text-slate-400 mb-8">Gere contratos, propostas e solicitações automaticamente.</p>

      {/* GRADE DE MODELOS */}
      {!selectedReport && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <button onClick={() => handleSelectReport('checklist')} className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm hover:border-brand-green hover:shadow-md transition group text-left">
            <div className="w-12 h-12 bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform"><FileCheck size={24}/></div>
            <h3 className="font-bold text-lg text-slate-800 dark:text-white mb-2">Solicitação de Documentos</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400">Checklist inicial de documentos.</p>
          </button>

          <button onClick={() => handleSelectReport('contrato')} className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm hover:border-brand-green hover:shadow-md transition group text-left">
            <div className="w-12 h-12 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform"><FileText size={24}/></div>
            <h3 className="font-bold text-lg text-slate-800 dark:text-white mb-2">Minuta de Contrato</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400">Contrato padrão de prestação de serviços.</p>
          </button>

          <button onClick={() => handleSelectReport('proposta')} className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm hover:border-brand-green hover:shadow-md transition group text-left">
            <div className="w-12 h-12 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform"><User size={24}/></div>
            <h3 className="font-bold text-lg text-slate-800 dark:text-white mb-2">Proposta Comercial</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400">Apresentação comercial dos serviços.</p>
          </button>
        </div>
      )}

      {/* ÁREA DE GERAÇÃO */}
      {selectedReport && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-fade-in">
          
          <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-100 dark:border-slate-700 h-[calc(100vh-200px)] flex flex-col">
            <button onClick={() => setSelectedReport(null)} className="text-sm text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 mb-4 flex items-center gap-1">← Voltar</button>
            <h3 className="font-bold text-slate-800 dark:text-white mb-4 flex items-center gap-2"><Search size={18}/> Selecionar Cliente</h3>
            <input placeholder="Buscar..." className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-800 dark:text-white outline-none focus:ring-2 focus:ring-brand-green mb-4" value={searchTerm} onChange={e => setSearchTerm(e.target.value)}/>
            <div className="flex-1 overflow-y-auto custom-scrollbar space-y-2">
              {filteredClients.map(client => (
                <button key={client.id} onClick={() => handleGenerate(client)} className={`w-full text-left p-3 rounded-xl border transition-all ${selectedClient?.id === client.id ? 'bg-brand-green text-white border-brand-green' : 'bg-white dark:bg-slate-800 border-slate-100 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700'}`}>
                  <div className="font-bold text-sm truncate">{client.company_name}</div>
                  <div className={`text-xs ${selectedClient?.id === client.id ? 'text-white/80' : 'text-slate-400'}`}>{maskDocument(client.cnpj)}</div>
                </button>
              ))}
            </div>
          </div>

          <div className="lg:col-span-2 bg-white dark:bg-slate-800 p-8 rounded-2xl border border-slate-100 dark:border-slate-700 flex flex-col h-[calc(100vh-200px)]">
            {selectedClient ? (
              <>
                <div className="flex justify-between items-center mb-4 pb-4 border-b border-slate-100 dark:border-slate-700">
                  <div>
                    <h2 className="font-bold text-lg text-slate-800 dark:text-white flex items-center gap-2"><Edit3 size={18} className="text-brand-green"/> Editor</h2>
                    <p className="text-xs text-slate-500">Editando para: {selectedClient.company_name}</p>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={handleCopy} className="p-2 text-slate-500 hover:text-brand-green hover:bg-green-50 dark:hover:bg-green-900/20 rounded-lg transition" title="Copiar"><Copy size={20}/></button>
                    <button onClick={handlePrint} className="bg-brand-green hover:bg-brand-light text-white px-4 py-2 rounded-lg font-bold text-sm flex items-center gap-2 transition shadow-sm"><Printer size={18}/> Imprimir / PDF</button>
                  </div>
                </div>
                <textarea className="flex-1 w-full h-full bg-slate-50 dark:bg-slate-900/50 p-6 rounded-xl border border-slate-200 dark:border-slate-700 resize-none focus:outline-none focus:ring-2 focus:ring-brand-green font-sans text-sm text-slate-700 dark:text-slate-300 leading-relaxed custom-scrollbar" value={generatedContent} onChange={(e) => setGeneratedContent(e.target.value)} spellCheck="false"/>
              </>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-slate-400 opacity-60">
                <FileText size={48} className="mb-4 stroke-1"/>
                <p>Selecione um cliente para gerar o documento.</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}