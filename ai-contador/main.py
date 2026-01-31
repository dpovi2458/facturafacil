"""
Contador AI - Servicio de reportes inteligentes para FacturaFácil
API REST con FastAPI para generar reportes Excel con análisis de IA
"""
from datetime import datetime
from pathlib import Path
from typing import Optional
from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from pydantic import BaseModel

from config import PORT, REPORTS_DIR
from database import (
    get_business_info,
    get_documents,
    get_sales_summary,
    get_top_clients,
    get_top_products,
    get_clients,
    get_products
)
from ai_analyzer import (
    analyze_sales_trends,
    analyze_clients,
    generate_tax_calendar,
    get_sunat_tips
)
from excel_generator import generate_sales_report, generate_tax_report

app = FastAPI(
    title="Contador AI - FacturaFácil",
    description="Servicio de reportes inteligentes con análisis de IA para MYPES peruanas",
    version="1.0.0"
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# =====================
# MODELOS
# =====================
class ReportRequest(BaseModel):
    business_id: int
    start_date: Optional[str] = None
    end_date: Optional[str] = None


class TaxReportRequest(BaseModel):
    business_id: int
    year: int
    month: int


# =====================
# ENDPOINTS
# =====================
@app.get("/")
def root():
    return {
        "service": "Contador AI",
        "version": "1.0.0",
        "description": "Reportes inteligentes para FacturaFácil",
        "endpoints": {
            "GET /health": "Estado del servicio",
            "GET /analysis/{business_id}": "Análisis de ventas con IA",
            "POST /reports/sales": "Generar reporte de ventas Excel",
            "POST /reports/tax": "Generar reporte tributario Excel",
            "GET /reports/list": "Listar reportes generados",
            "GET /reports/download/{filename}": "Descargar reporte",
            "GET /calendar/{business_id}": "Calendario tributario",
            "GET /tips": "Tips SUNAT"
        }
    }


@app.get("/health")
def health_check():
    return {"status": "ok", "service": "Contador AI", "timestamp": datetime.now().isoformat()}


@app.get("/analysis/{business_id}")
def get_analysis(
    business_id: int,
    year: Optional[int] = None
):
    """
    Obtiene análisis completo de ventas con IA
    """
    try:
        business = get_business_info(business_id)
        if not business:
            raise HTTPException(status_code=404, detail="Negocio no encontrado")
        
        # Obtener datos
        sales_summary = get_sales_summary(business_id, year)
        top_clients = get_top_clients(business_id)
        top_products = get_top_products(business_id)
        
        # Análisis con IA
        sales_analysis = analyze_sales_trends(sales_summary, business.get('razon_social', ''))
        clients_analysis = analyze_clients(get_clients(business_id), top_clients)
        
        return {
            "business": business,
            "sales_analysis": sales_analysis,
            "clients_analysis": clients_analysis,
            "top_products": top_products.to_dict('records'),
            "generated_at": datetime.now().isoformat()
        }
        
    except FileNotFoundError:
        raise HTTPException(status_code=500, detail="Base de datos no encontrada")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/reports/sales")
def generate_sales_excel(request: ReportRequest):
    """
    Genera reporte completo de ventas en Excel
    """
    try:
        business = get_business_info(request.business_id)
        if not business:
            raise HTTPException(status_code=404, detail="Negocio no encontrado")
        
        # Obtener datos
        documents = get_documents(request.business_id, request.start_date, request.end_date)
        sales_summary = get_sales_summary(request.business_id)
        top_clients = get_top_clients(request.business_id)
        top_products = get_top_products(request.business_id)
        
        # Análisis IA
        ai_analysis = analyze_sales_trends(sales_summary, business.get('razon_social', ''))
        
        # Generar Excel
        filepath = generate_sales_report(
            business_info=business,
            documents=documents,
            sales_summary=sales_summary,
            top_clients=top_clients,
            top_products=top_products,
            ai_analysis=ai_analysis
        )
        
        filename = Path(filepath).name
        
        return {
            "success": True,
            "message": "Reporte generado exitosamente",
            "filename": filename,
            "download_url": f"/reports/download/{filename}",
            "ai_powered": ai_analysis.get('ai_powered', False)
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/reports/tax")
def generate_tax_excel(request: TaxReportRequest):
    """
    Genera reporte tributario mensual para SUNAT
    """
    try:
        business = get_business_info(request.business_id)
        if not business:
            raise HTTPException(status_code=404, detail="Negocio no encontrado")
        
        documents = get_documents(request.business_id)
        
        filepath = generate_tax_report(
            business_info=business,
            documents=documents,
            year=request.year,
            month=request.month
        )
        
        filename = Path(filepath).name
        
        return {
            "success": True,
            "message": "Reporte tributario generado",
            "filename": filename,
            "download_url": f"/reports/download/{filename}"
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/reports/list")
def list_reports():
    """
    Lista todos los reportes generados
    """
    reports = []
    for file in REPORTS_DIR.glob("*.xlsx"):
        reports.append({
            "filename": file.name,
            "size_kb": round(file.stat().st_size / 1024, 2),
            "created": datetime.fromtimestamp(file.stat().st_ctime).isoformat(),
            "download_url": f"/reports/download/{file.name}"
        })
    
    return {
        "total": len(reports),
        "reports": sorted(reports, key=lambda x: x['created'], reverse=True)
    }


@app.get("/reports/download/{filename}")
def download_report(filename: str):
    """
    Descarga un reporte Excel
    """
    filepath = REPORTS_DIR / filename
    if not filepath.exists():
        raise HTTPException(status_code=404, detail="Reporte no encontrado")
    
    return FileResponse(
        path=filepath,
        filename=filename,
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    )


@app.get("/calendar/{business_id}")
def get_tax_calendar(business_id: int):
    """
    Obtiene calendario de obligaciones tributarias
    """
    business = get_business_info(business_id)
    if not business:
        raise HTTPException(status_code=404, detail="Negocio no encontrado")
    
    return {
        "business": business.get('razon_social', ''),
        "ruc": business.get('ruc', ''),
        "calendar": generate_tax_calendar(),
        "tips": get_sunat_tips()
    }


@app.get("/tips")
def get_tips():
    """
    Obtiene tips generales de SUNAT
    """
    return {
        "tips": get_sunat_tips(),
        "calendar": generate_tax_calendar()
    }


if __name__ == "__main__":
    import uvicorn
    print(f"🤖 Contador AI iniciando en http://localhost:{PORT}")
    uvicorn.run(app, host="0.0.0.0", port=PORT)
