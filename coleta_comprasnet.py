import requests
from requests.adapters import HTTPAdapter
from urllib3.util.retry import Retry
import os
from datetime import datetime, timedelta
from supabase import create_client, Client

# --- CONFIGURAÇÃO ---
URL_SUPABASE = os.environ.get("URL_SUPABASE", "https://yqtkwilgezwkoqpytxhy.supabase.co")
CHAVE_SUPABASE = os.environ.get("CHAVE_SUPABASE", "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlxdGt3aWxnZXp3a29xcHl0eGh5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQxNzI2NzcsImV4cCI6MjA3OTc0ODY3N30.q1yERtVTOrPBrd8P1lVip9YVWoTIFwZLd8WCwrYlW7U")

supabase: Client = create_client(URL_SUPABASE, CHAVE_SUPABASE)

def criar_sessao_robusta():
    """ Cria uma sessão que insiste se der erro e finge ser um browser """
    session = requests.Session()
    
    # Configura retentativas (Tenta 3x com intervalo se der erro 500 ou 504)
    retries = Retry(total=3, backoff_factor=2, status_forcelist=[500, 502, 503, 504])
    session.mount('https://', HTTPAdapter(max_retries=retries))
    
    # Finge ser um navegador Chrome para não ser bloqueado
    session.headers.update({
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    })
    return session

def buscar_comprasnet_v2():
    print("🏛️  Iniciando Coleta COMPRASNET (Modo Resiliente)...")
    
    url_base = "https://compras.dados.gov.br/pregoes/v1/pregoes.json"
    datas = [datetime.now(), datetime.now() - timedelta(days=1)]
    session = criar_sessao_robusta()
    total_salvo = 0

    for data in datas:
        data_str = data.strftime("%Y-%m-%d")
        print(f"   📅 Tentando baixar dia: {data_str} (Aguarde, servidor lento...)")
        
        params = {
            "data_publicacao": data_str,
            "order_by": "data_entrega_proposta"
        }

        try:
            # AUMENTAMOS O TIMEOUT PARA 60 SEGUNDOS
            response = session.get(url_base, params=params, timeout=60)
            
            if response.status_code != 200:
                print(f"      ❌ Erro HTTP: {response.status_code}")
                continue

            dados = response.json().get('_embedded', {}).get('pregoes', [])
            
            if not dados:
                print("      ⚠️  Nenhum pregão encontrado (ou API vazia).")
                continue

            print(f"      📥 Baixou {len(dados)} itens. Processando...")

            batch = []
            for item in dados:
                uasg = item.get('co_uasg')
                num_pregao = item.get('num_pregao')
                link = f"http://comprasnet.gov.br/ConsultaLicitacoes/download/download_editais_detalhe.asp?cod_uasg={uasg}&modprp=5&numprp={num_pregao}"

                data_abertura = None
                if item.get('data_entrega_proposta'):
                    try:
                        data_raw = item.get('data_entrega_proposta')
                        hora_raw = item.get('hora_entrega_proposta', '00:00')
                        data_abertura = f"{data_raw}T{hora_raw}:00"
                    except: pass

                obj = {
                    "data_publicacao": item.get('data_publicacao'),
                    "data_abertura": data_abertura,
                    "titulo": str(item.get('objeto', 'Ver Edital'))[:300],
                    "descricao": f"UASG {uasg} - Pregão {num_pregao}. {str(item.get('objeto', ''))[:500]}",
                    "orgao": f"UASG {uasg} (Órgão Federal)",
                    "valor": 0,
                    "uf": "BR",
                    "municipio": "Federal",
                    "modalidade_id": 6,
                    "link_edital": link,
                    "status": "novo",
                    "fonte": "COMPRASNET"
                }
                batch.append(obj)

            if batch:
                supabase.table("licitacoes").upsert(batch, on_conflict="link_edital").execute()
                total_salvo += len(batch)
                print(f"      ✅ Lote salvo com sucesso.")

        except Exception as e:
            print(f"      ❌ Erro persistente: {e}")

    print(f"🏁 FIM. Total processado: {total_salvo}")

if __name__ == "__main__":
    buscar_comprasnet_v2()