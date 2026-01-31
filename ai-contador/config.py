"""
Configuración del Contador AI para FacturaFácil
"""
import os
from pathlib import Path
from dotenv import load_dotenv

load_dotenv()

# Rutas
BASE_DIR = Path(__file__).parent
DATABASE_PATH = os.getenv('DATABASE_PATH', '../server/data/facturafacil.db')
REPORTS_DIR = Path(os.getenv('REPORTS_DIR', './reports'))

# Crear directorio de reportes si no existe
REPORTS_DIR.mkdir(exist_ok=True)

# DigitalOcean GenAI / OpenAI Configuration
# Usar DigitalOcean GenAI como proveedor principal
DIGITALOCEAN_API_KEY = os.getenv('DIGITALOCEAN_API_KEY', '')
DIGITALOCEAN_ENDPOINT = os.getenv('DIGITALOCEAN_ENDPOINT', 'https://cloud.digitalocean.com/gen-ai')
DIGITALOCEAN_MODEL = os.getenv('DIGITALOCEAN_MODEL', 'openai-gpt-oss-120b')

# Fallback a OpenAI si no hay DigitalOcean
OPENAI_API_KEY = os.getenv('OPENAI_API_KEY', '')

# Servidor
PORT = int(os.getenv('PORT', 3002))

# Configuración de reportes
REPORT_CONFIG = {
    'company_name': 'FacturaFácil',
    'currency': 'S/',
    'date_format': '%d/%m/%Y',
    'locale': 'es_PE'
}
