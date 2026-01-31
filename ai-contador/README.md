# 🤖 Contador AI - FacturaFácil

Módulo de inteligencia artificial para generar reportes contables automáticos en Excel con análisis inteligente.

## ✨ Características

- 📊 **Reportes de Ventas en Excel** - Formato profesional con gráficos
- 🤖 **Análisis con IA** - Insights y recomendaciones usando OpenAI
- 📅 **Reportes Tributarios** - Preparados para declaración SUNAT
- 🏆 **Top Clientes y Productos** - Rankings automáticos
- 📈 **Gráficos Automáticos** - Visualizaciones de ventas mensuales
- ⚡ **API REST** - Integración fácil con el frontend

## 🚀 Instalación

```bash
# Desde la carpeta ai-contador
cd ai-contador

# Crear entorno virtual
python -m venv venv
source venv/bin/activate  # Linux/Mac
# o
.\venv\Scripts\activate  # Windows

# Instalar dependencias
pip install -r requirements.txt

# Configurar variables de entorno
cp .env.example .env
# Editar .env con tu API key de OpenAI (opcional)
```

## ⚙️ Configuración

Edita el archivo `.env`:

```env
# API Key de OpenAI (opcional, para análisis con IA)
OPENAI_API_KEY=sk-tu-api-key-aqui

# Ruta a la base de datos
DATABASE_PATH=../server/data/facturafacil.db

# Puerto del servicio
PORT=3002
```

> 💡 El análisis con IA es opcional. Sin API key, obtendrás reportes con métricas básicas.

## 🖥️ Uso

### Opción 1: API REST (Recomendado)

```bash
# Iniciar servidor
python main.py

# El servidor estará en http://localhost:3002
```

**Endpoints disponibles:**

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/health` | Estado del servicio |
| GET | `/analysis/{business_id}` | Análisis completo con IA |
| POST | `/reports/sales` | Generar reporte de ventas |
| POST | `/reports/tax` | Generar reporte tributario |
| GET | `/reports/list` | Listar reportes generados |
| GET | `/reports/download/{filename}` | Descargar reporte |
| GET | `/calendar/{business_id}` | Calendario tributario |
| GET | `/tips` | Tips SUNAT |

**Ejemplos de uso:**

```bash
# Obtener análisis
curl http://localhost:3002/analysis/1

# Generar reporte de ventas
curl -X POST http://localhost:3002/reports/sales \
  -H "Content-Type: application/json" \
  -d '{"business_id": 1}'

# Generar reporte tributario
curl -X POST http://localhost:3002/reports/tax \
  -H "Content-Type: application/json" \
  -d '{"business_id": 1, "year": 2026, "month": 1}'
```

### Opción 2: Línea de Comandos (CLI)

```bash
# Reporte de ventas
python cli.py --business-id 1 --report sales

# Reporte tributario
python cli.py --business-id 1 --report tax --year 2026 --month 1

# Solo análisis (sin generar Excel)
python cli.py --business-id 1 --report analysis

# Con filtro de fechas
python cli.py -b 1 -r sales --start-date 2026-01-01 --end-date 2026-01-31
```

## 📊 Contenido de los Reportes

### Reporte de Ventas (`/reports/sales`)

1. **Resumen Ejecutivo**
   - Métricas principales (total ventas, promedio, tendencia)
   - Análisis de IA con insights
   - Recomendaciones personalizadas

2. **Documentos**
   - Lista completa de boletas y facturas
   - Totales por tipo

3. **Resumen Mensual**
   - Ventas agrupadas por mes
   - Gráfico de barras

4. **Top Clientes**
   - Ranking de mejores clientes
   - Monto total y frecuencia

5. **Top Productos**
   - Productos más vendidos
   - Gráfico de pastel

### Reporte Tributario (`/reports/tax`)

- Resumen de ventas del mes
- Boletas vs Facturas
- Base imponible e IGV
- Totales para declaración PDT 621

## 🧠 Análisis con IA

Cuando configuras `OPENAI_API_KEY`, el sistema proporciona:

- 📈 **Análisis de tendencias** - Detecta patrones en tus ventas
- 💡 **Insights automáticos** - Observaciones clave sobre tu negocio
- 📋 **Recomendaciones** - Sugerencias para mejorar
- ⚠️ **Alertas SUNAT** - Recordatorios de obligaciones tributarias
- 🔮 **Proyecciones** - Estimaciones del próximo trimestre

## 🔗 Integración con FacturaFácil

Para integrar con el frontend React:

```typescript
// En el frontend, agregar servicio
const AI_API = 'http://localhost:3002';

export const contadorAI = {
  getAnalysis: (businessId: number) => 
    fetch(`${AI_API}/analysis/${businessId}`).then(r => r.json()),
  
  generateSalesReport: (businessId: number) =>
    fetch(`${AI_API}/reports/sales`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ business_id: businessId })
    }).then(r => r.json()),
  
  downloadReport: (filename: string) =>
    `${AI_API}/reports/download/${filename}`
};
```

## 📁 Estructura del Módulo

```
ai-contador/
├── main.py           # API REST con FastAPI
├── cli.py            # Interfaz de línea de comandos
├── config.py         # Configuración
├── database.py       # Conexión a SQLite
├── ai_analyzer.py    # Análisis con OpenAI
├── excel_generator.py # Generador de Excel
├── requirements.txt  # Dependencias Python
├── .env.example      # Variables de entorno ejemplo
├── reports/          # Reportes generados (auto-creado)
└── README.md
```

## 🛠️ Desarrollo

```bash
# Ejecutar en modo desarrollo con recarga automática
uvicorn main:app --reload --port 3002
```

## 📝 Licencia

MIT - Parte del proyecto FacturaFácil
