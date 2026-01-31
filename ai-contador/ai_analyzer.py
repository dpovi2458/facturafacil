"""
Analizador de datos con IA usando DigitalOcean GenAI / OpenAI
Genera insights y recomendaciones para el negocio
"""
import os
import json
from datetime import datetime
from typing import Optional
import pandas as pd
from config import DIGITALOCEAN_API_KEY, DIGITALOCEAN_MODEL, OPENAI_API_KEY


def get_ai_client():
    """Obtiene cliente de IA (DigitalOcean GenAI o OpenAI)"""
    # Primero intentar DigitalOcean GenAI (usa API compatible con OpenAI)
    if DIGITALOCEAN_API_KEY:
        from openai import OpenAI
        # DigitalOcean GenAI usa endpoint compatible con OpenAI
        client = OpenAI(
            api_key=DIGITALOCEAN_API_KEY,
            base_url="https://cloud.digitalocean.com/gen-ai"
        )
        return {
            'type': 'digitalocean',
            'client': client,
            'model': DIGITALOCEAN_MODEL or 'openai-gpt-oss-120b'
        }
    
    # Fallback a OpenAI
    if OPENAI_API_KEY:
        from openai import OpenAI
        return {
            'type': 'openai',
            'client': OpenAI(api_key=OPENAI_API_KEY),
            'model': 'gpt-3.5-turbo'
        }
    
    return None


def chat_completion(ai_config: dict, messages: list, max_tokens: int = 1000) -> str:
    """Realiza una llamada de chat completion independiente del proveedor"""
    try:
        response = ai_config['client'].chat.completions.create(
            model=ai_config['model'],
            messages=messages,
            max_tokens=max_tokens,
            temperature=0.7
        )
        return response.choices[0].message.content
    except Exception as e:
        print(f"Error en chat completion: {e}")
        return ""


def analyze_sales_trends(sales_data: pd.DataFrame, business_name: str) -> dict:
    """
    Analiza tendencias de ventas y genera insights con IA
    """
    ai_config = get_ai_client()
    
    # Preparar datos para el análisis
    summary = {
        'total_ventas': float(sales_data['total'].sum()) if not sales_data.empty else 0,
        'promedio_mensual': float(sales_data['total'].mean()) if not sales_data.empty else 0,
        'total_documentos': int(sales_data['cantidad_documentos'].sum()) if not sales_data.empty else 0,
        'igv_total': float(sales_data['igv'].sum()) if not sales_data.empty else 0,
    }
    
    # Calcular tendencia
    if len(sales_data) >= 2:
        recent = sales_data.head(3)['total'].mean()
        older = sales_data.tail(3)['total'].mean()
        if older > 0:
            trend_pct = ((recent - older) / older) * 100
            summary['tendencia'] = f"{'+' if trend_pct > 0 else ''}{trend_pct:.1f}%"
        else:
            summary['tendencia'] = "N/A"
    else:
        summary['tendencia'] = "Datos insuficientes"
    
    # Si no hay API key, retornar análisis básico
    if not ai_config:
        return {
            'resumen': summary,
            'insights': [
                "⚠️ Configura tu API key de DigitalOcean GenAI para obtener análisis avanzados con IA",
                f"📊 Total de ventas: S/ {summary['total_ventas']:,.2f}",
                f"📈 Promedio mensual: S/ {summary['promedio_mensual']:,.2f}",
                f"📄 Total documentos emitidos: {summary['total_documentos']}"
            ],
            'recomendaciones': [
                "Configura DIGITALOCEAN_API_KEY en el archivo .env para obtener recomendaciones personalizadas"
            ],
            'ai_powered': False
        }
    
    # Análisis con IA
    try:
        prompt = f"""
        Eres un contador y asesor financiero experto para MYPES peruanas. 
        Analiza los siguientes datos de ventas del negocio "{business_name}" y proporciona:
        
        DATOS:
        - Total de ventas: S/ {summary['total_ventas']:,.2f}
        - Promedio mensual: S/ {summary['promedio_mensual']:,.2f}
        - Total documentos: {summary['total_documentos']}
        - IGV acumulado: S/ {summary['igv_total']:,.2f}
        - Tendencia: {summary['tendencia']}
        
        DATOS MENSUALES:
        {sales_data.to_string() if not sales_data.empty else 'Sin datos'}
        
        Proporciona tu respuesta en el siguiente formato JSON:
        {{
            "insights": ["insight1", "insight2", "insight3"],
            "recomendaciones": ["recomendacion1", "recomendacion2", "recomendacion3"],
            "alertas_sunat": ["alerta1 si aplica"],
            "proyeccion_trimestre": "texto de proyección"
        }}
        
        Considera:
        - Obligaciones tributarias de SUNAT (IGV mensual, declaración)
        - Oportunidades de ahorro fiscal
        - Patrones estacionales
        - Recomendaciones prácticas para mejorar flujo de caja
        """
        
        messages = [{"role": "user", "content": prompt}]
        ai_response_text = chat_completion(ai_config, messages, max_tokens=1000)
        ai_response = json.loads(ai_response_text)
        
        return {
            'resumen': summary,
            'insights': ai_response.get('insights', []),
            'recomendaciones': ai_response.get('recomendaciones', []),
            'alertas_sunat': ai_response.get('alertas_sunat', []),
            'proyeccion': ai_response.get('proyeccion_trimestre', ''),
            'ai_powered': True
        }
        
    except Exception as e:
        return {
            'resumen': summary,
            'insights': [f"Error en análisis AI: {str(e)}"],
            'recomendaciones': [],
            'ai_powered': False
        }


def analyze_clients(clients_data: pd.DataFrame, top_clients: pd.DataFrame) -> dict:
    """Analiza la base de clientes"""
    ai_config = get_ai_client()
    
    analysis = {
        'total_clientes': len(clients_data),
        'clientes_con_ruc': len(clients_data[clients_data['tipo_documento'] == 'RUC']) if not clients_data.empty else 0,
        'clientes_persona': len(clients_data[clients_data['tipo_documento'] == 'DNI']) if not clients_data.empty else 0,
    }
    
    if not ai_config or top_clients.empty:
        return {
            'resumen': analysis,
            'insights': [
                f"👥 Total de clientes: {analysis['total_clientes']}",
                f"🏢 Empresas (RUC): {analysis['clientes_con_ruc']}",
                f"👤 Personas (DNI): {analysis['clientes_persona']}"
            ],
            'ai_powered': False
        }
    
    try:
        prompt = f"""
        Analiza esta base de clientes de una MYPE peruana:
        
        RESUMEN:
        - Total clientes: {analysis['total_clientes']}
        - Empresas (RUC): {analysis['clientes_con_ruc']}
        - Personas naturales: {analysis['clientes_persona']}
        
        TOP CLIENTES:
        {top_clients.to_string()}
        
        Proporciona en JSON:
        {{
            "insights": ["3 observaciones clave"],
            "estrategias_retencion": ["2 estrategias"],
            "oportunidades": ["2 oportunidades de crecimiento"]
        }}
        """
        
        messages = [{"role": "user", "content": prompt}]
        ai_response_text = chat_completion(ai_config, messages, max_tokens=500)
        ai_response = json.loads(ai_response_text)
        
        return {
            'resumen': analysis,
            **ai_response,
            'ai_powered': True
        }
        
    except Exception as e:
        return {
            'resumen': analysis,
            'error': str(e),
            'ai_powered': False
        }


def generate_tax_calendar(current_date: datetime = None) -> list:
    """
    Genera recordatorios de obligaciones tributarias SUNAT
    """
    if current_date is None:
        current_date = datetime.now()
    
    # Fechas de vencimiento según último dígito de RUC (ejemplo simplificado)
    calendar = [
        {
            'fecha': f"Hasta el 12-{current_date.month:02d}-{current_date.year}",
            'obligacion': 'Declaración mensual PDT 621 (IGV-Renta)',
            'descripcion': 'Declaración y pago de IGV y pago a cuenta del Impuesto a la Renta'
        },
        {
            'fecha': f"Hasta el 15-{current_date.month:02d}-{current_date.year}",
            'obligacion': 'Libros Electrónicos',
            'descripcion': 'Envío de Registro de Ventas y Compras electrónico'
        },
        {
            'fecha': 'Continuo',
            'obligacion': 'Emisión de Comprobantes',
            'descripcion': 'Emitir boletas/facturas electrónicas por cada venta'
        }
    ]
    
    return calendar


def get_sunat_tips() -> list:
    """
    Tips para cumplimiento SUNAT
    """
    return [
        "💡 Emite comprobantes dentro de las 72 horas posteriores a la operación",
        "💡 Guarda tus XML y CDR por 4 años como respaldo legal",
        "💡 Verifica mensualmente que tus comprobantes estén aceptados en SUNAT",
        "💡 Si tus ventas superan los S/8,000 debes emitir factura (no boleta)",
        "💡 Declara incluso si no tuviste ventas (declaración en cero)",
        "💡 El crédito fiscal del IGV solo aplica a facturas, no boletas"
    ]
