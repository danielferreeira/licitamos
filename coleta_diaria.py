import requests
from datetime import datetime, timedelta
from supabase import create_client, Client

# --- CONFIGURAÇÃO ---
URL_SUPABASE = "https://yqtkwilgezwkoqpytxhy.supabase.co"
CHAVE_SUPABASE = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlxdGt3aWxnZXp3a29xcHl0eGh5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQxNzI2NzcsImV4cCI6MjA3OTc0ODY3N30.q1yERtVTOrPBrd8P1lVip9YVWoTIFwZLd8WCwrYlW7U"

supabase: Client = create_client(URL_SUPABASE, CHAVE_SUPABASE)

def buscar_arquivos(url_base, id_interno):
    """ Busca arquivos usando o ID numérico interno do PNCP (Mais seguro) """
    if not id_interno: return []
    # Endpoint: /contratacoes/{id}/arquivos
    url = f"{url_base}/{id_interno}/arquivos"
    arquivos = []
    try:
        response = requests.get(url)
        if response.status_code == 200:
            for arq in response.json():
                arquivos.append({
                    "titulo": arq.get('titulo', 'Documento'),
                    "url": arq.get('urlRecuperacao'),
                    "tamanho": arq.get('tamanho', 0)
                })
    except: pass
    return arquivos

def buscar_titulo_item(url_base, id_interno):
    """ Busca detalhes do item 1 usando ID interno """
    if not id_interno: return None
    url = f"{url_base}/{id_interno}/itens"
    try:
        response = requests.get(url, params={"pagina": "1", "tamanhoPagina": "1"})
        if response.status_code == 200:
            dados = response.json().get('data', [])
            if dados: return dados[0].get('descricao')
    except: pass
    return None

def coleta_v6_final():
    url_pub = "https://pncp.gov.br/api/consulta/v1/contratacoes/publicacao"
    url_base = "https://pncp.gov.br/api/consulta/v1/contratacoes"
    
    dias_atras = 5
    print(f"🚀 Iniciando Coleta V6 (ID Interno)...")
    
    # Se quiser limpar tudo antes:
    # supabase.table("licitacoes").delete().neq("id", 0).execute()

    for i in range(dias_atras):
        data_alvo = (datetime.now() - timedelta(days=i)).strftime("%Y%m%d")
        print(f"\n📅 Data: {data_alvo}")
        
        for modalidade in [6, 8]:
            for pagina in range(1, 4):
                params = {
                    "dataInicial": data_alvo, "dataFinal": data_alvo,
                    "codigoModalidadeContratacao": modalidade,
                    "pagina": str(pagina), "tamanhoPagina": "10"
                }

                try:
                    r = requests.get(url_pub, params=params)
                    if r.status_code != 200: continue
                    dados = r.json().get('data', [])
                    if not dados: break 
                    
                    batch = []
                    for item in dados:
                        # 1. Pega o ID INTERNO (long integer) - É mais confiável para endpoints
                        id_interno = item.get('id')
                        
                        titulo = item.get('objetoContratacao')
                        desc = item.get('informacaoComplementar', '')
                        
                        # 2. Recupera Título
                        if not titulo or titulo in ["Sem descrição", "Objeto não informado", "None", ""]:
                            novo = buscar_titulo_item(url_base, id_interno)
                            if novo: titulo = f"[Item] {novo}"
                            elif desc: titulo = desc
                            else: titulo = "Ver Edital"
                        
                        if desc == titulo: desc = ''

                        # 3. Busca Arquivos usando ID Interno
                        lista_arquivos = buscar_arquivos(url_base, id_interno)
                        if lista_arquivos:
                            print(f"      📎 {len(lista_arquivos)} arq encontrados para {id_interno}")

                        obj = {
                            "data_publicacao": item.get('dataPublicacaoPncp', '')[:10],
                            "data_abertura": item.get('dataRecebimentoProposta') or item.get('dataPublicacaoPncp'),
                            "titulo": str(titulo)[:300],
                            "descricao": str(desc)[:600],
                            "orgao": item.get('orgaoEntidade', {}).get('razaoSocial', 'Desconhecido'),
                            "valor": item.get('valorTotalEstimado', 0),
                            "uf": item.get('unidadeOrgao', {}).get('ufSigla', 'BR'),
                            "municipio": item.get('unidadeOrgao', {}).get('municipioNome', ''),
                            "modalidade_id": modalidade,
                            "link_edital": item.get('linkSistemaOrigem'),
                            "arquivos": lista_arquivos,
                            "status": "novo"
                        }
                        batch.append(obj)

                    if batch:
                        # Insert ignorando duplicados seria ideal, mas o Supabase não tem "ignore" nativo fácil
                        # Upsert vai substituir os dados velhos pelos novos (com arquivos)
                        supabase.table("licitacoes").upsert(batch, on_conflict="id").execute()
                        print(f"   ✅ Pag {pagina}: {len(batch)} atualizados.")

                except Exception as e:
                    print(f"   Erro: {e}")

    print(f"\n🏁 FIM.")

if __name__ == "__main__":
    coleta_v6_final()