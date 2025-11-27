import requests
import os
from datetime import datetime, timedelta
from supabase import create_client, Client
import time

# --- CONFIGURAÇÃO ---
URL_SUPABASE = os.environ.get("URL_SUPABASE", "https://yqtkwilgezwkoqpytxhy.supabase.co")
CHAVE_SUPABASE = os.environ.get("CHAVE_SUPABASE", "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlxdGt3aWxnZXp3a29xcHl0eGh5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQxNzI2NzcsImV4cCI6MjA3OTc0ODY3N30.q1yERtVTOrPBrd8P1lVip9YVWoTIFwZLd8WCwrYlW7U")

supabase: Client = create_client(URL_SUPABASE, CHAVE_SUPABASE)

def limpar_texto(texto):
    if not texto: return None
    t = str(texto).strip()
    if t.lower() in ["none", "null", "objeto não informado", "sem descrição"]: return None
    return t

def buscar_arquivos(url_base, id_compra):
    if not id_compra: return []
    url = f"{url_base}/{id_compra}/arquivos"
    arquivos = []
    try:
        response = requests.get(url, timeout=10)
        if response.status_code == 200:
            for arq in response.json():
                arquivos.append({"titulo": arq.get('titulo', 'Documento'), "url": arq.get('urlRecuperacao')})
    except: pass
    return arquivos

def buscar_dados_profundos(url_base, id_compra):
    """ Busca Itens para preencher a descrição faltante """
    if not id_compra: return None
    url = f"{url_base}/{id_compra}/itens"
    try:
        # Pega o primeiro item
        response = requests.get(url, params={"pagina": "1", "tamanhoPagina": "1"}, timeout=15)
        if response.status_code == 200:
            dados = response.json().get('data', [])
            if dados:
                item = dados[0]
                # Retorna a descrição do item
                return item.get('descricao')
    except: pass
    return None

def coleta_v11_deep_mining():
    url_pub = "https://pncp.gov.br/api/consulta/v1/contratacoes/publicacao"
    url_base = "https://pncp.gov.br/api/consulta/v1/contratacoes"
    
    # Pega 3 dias para garantir
    dias = 3
    print(f"⛏️ Iniciando Coleta V11 (Mineração Profunda)...")
    
    total_salvo = 0

    for i in range(dias):
        data_alvo = (datetime.now() - timedelta(days=i)).strftime("%Y%m%d")
        print(f"\n📅 Processando Data: {data_alvo}")
        
        for modalidade in [6, 8, 13]: 
            for pagina in range(1, 4):
                params = {
                    "dataInicial": data_alvo, "dataFinal": data_alvo,
                    "codigoModalidadeContratacao": modalidade,
                    "pagina": str(pagina), "tamanhoPagina": "10"
                }

                try:
                    r = requests.get(url_pub, params=params, timeout=20)
                    if r.status_code != 200: continue
                    dados = r.json().get('data', [])
                    if not dados: break 
                    
                    batch = []
                    for item in dados:
                        id_pncp = item.get('id')
                        link_origem = item.get('linkSistemaOrigem')
                        
                        # --- 1. TÍTULO OFICIAL ---
                        mod_nome = item.get('modalidadeNome', 'Edital')
                        num = item.get('numeroCompra', 'S/N')
                        ano = item.get('anoCompra', datetime.now().year)
                        titulo_oficial = f"{mod_nome} Nº {num}/{ano}".upper()

                        # --- 2. DESCRIÇÃO (A Lógica da Mineração) ---
                        # Tenta pegar na ordem: Objeto -> Info Complementar -> Item 1 -> Título Oficial
                        desc_final = limpar_texto(item.get('objetoContratacao'))
                        
                        if not desc_final:
                            desc_final = limpar_texto(item.get('informacaoComplementar'))
                        
                        if not desc_final:
                            # Se ainda não tem descrição, faz a requisição extra nos ITENS
                            print(f"      🔍 Buscando itens para: {titulo_oficial}...")
                            desc_item = buscar_dados_profundos(url_base, id_pncp)
                            if desc_item:
                                desc_final = f"[Item 1] {desc_item}"
                        
                        # Se falhou tudo, repete o título para não ficar vazio no card
                        if not desc_final:
                            desc_final = f"Objeto referente ao {titulo_oficial}. Consulte o edital para detalhes."

                        # --- 3. DATAS DO CRONOGRAMA ---
                        # Garante que null vire null (para o frontend tratar)
                        dt_inicio_prop = item.get('dataInicioRecebimentoProposta')
                        dt_fim_prop = item.get('dataFimRecebimentoProposta')
                        
                        # Se não tiver data de fim, usa a data de abertura como fallback
                        dt_abertura = item.get('dataRecebimentoProposta') or item.get('dataPublicacaoPncp')
                        if not dt_fim_prop: dt_fim_prop = dt_abertura

                        obj = {
                            "data_publicacao": item.get('dataPublicacaoPncp', '')[:10],
                            "data_abertura": dt_abertura,
                            
                            # CRONOGRAMA PREENCHIDO
                            "data_inicio_proposta": dt_inicio_prop,
                            "data_fim_proposta": dt_fim_prop,
                            "data_inicio_disputa": item.get('dataInicioDisputa'),
                            "data_impugnacao": item.get('dataLimiteImpugnacao'),
                            "data_esclarecimento": item.get('dataLimiteEsclarecimento'),

                            "titulo": titulo_oficial,
                            "descricao": desc_final[:1000], # Aumentei o limite
                            "orgao": item.get('orgaoEntidade', {}).get('razaoSocial', 'Desconhecido'),
                            "valor": item.get('valorTotalEstimado', 0),
                            "uf": item.get('unidadeOrgao', {}).get('ufSigla', 'BR'),
                            "municipio": item.get('unidadeOrgao', {}).get('municipioNome', ''),
                            "modalidade_id": modalidade,
                            "link_edital": link_origem,
                            "arquivos": buscar_arquivos(url_base, id_pncp),
                            "fonte": "PNCP",
                            "status": "novo"
                        }
                        batch.append(obj)

                    if batch:
                        supabase.table("licitacoes").upsert(batch, on_conflict="link_edital").execute()
                        print(f"   ✅ Pag {pagina}: {len(batch)} itens salvos.")

                except Exception as e:
                    pass

    print(f"\n🏁 Processo Finalizado.")

if __name__ == "__main__":
    coleta_v11_deep_mining()