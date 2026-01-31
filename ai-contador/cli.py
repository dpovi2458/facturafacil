#!/usr/bin/env python3
"""
CLI para generar reportes desde línea de comandos
Uso: python cli.py --business-id 1 --report sales
"""
import argparse
from datetime import datetime

from database import (
    get_business_info,
    get_documents,
    get_sales_summary,
    get_top_clients,
    get_top_products,
    get_clients
)
from ai_analyzer import analyze_sales_trends, analyze_clients
from excel_generator import generate_sales_report, generate_tax_report


def main():
    parser = argparse.ArgumentParser(
        description="Contador AI - Generador de reportes para FacturaFácil"
    )
    parser.add_argument(
        "--business-id", "-b",
        type=int,
        required=True,
        help="ID del negocio"
    )
    parser.add_argument(
        "--report", "-r",
        choices=["sales", "tax", "analysis"],
        default="sales",
        help="Tipo de reporte a generar"
    )
    parser.add_argument(
        "--year", "-y",
        type=int,
        default=datetime.now().year,
        help="Año para el reporte"
    )
    parser.add_argument(
        "--month", "-m",
        type=int,
        default=datetime.now().month,
        help="Mes para reporte tributario"
    )
    parser.add_argument(
        "--start-date", "-s",
        type=str,
        help="Fecha de inicio (YYYY-MM-DD)"
    )
    parser.add_argument(
        "--end-date", "-e",
        type=str,
        help="Fecha de fin (YYYY-MM-DD)"
    )
    parser.add_argument(
        "--output", "-o",
        type=str,
        help="Nombre del archivo de salida"
    )
    
    args = parser.parse_args()
    
    print(f"🤖 Contador AI - Generando reporte...")
    print(f"   Business ID: {args.business_id}")
    print(f"   Tipo: {args.report}")
    
    # Obtener información del negocio
    business = get_business_info(args.business_id)
    if not business:
        print(f"❌ Error: No se encontró el negocio con ID {args.business_id}")
        return
    
    print(f"   Negocio: {business.get('razon_social', 'N/A')}")
    
    if args.report == "sales":
        # Reporte de ventas
        documents = get_documents(args.business_id, args.start_date, args.end_date)
        sales_summary = get_sales_summary(args.business_id, args.year)
        top_clients = get_top_clients(args.business_id)
        top_products = get_top_products(args.business_id)
        
        print(f"   Documentos encontrados: {len(documents)}")
        
        # Análisis IA
        print("   Generando análisis con IA...")
        ai_analysis = analyze_sales_trends(sales_summary, business.get('razon_social', ''))
        
        # Generar Excel
        filepath = generate_sales_report(
            business_info=business,
            documents=documents,
            sales_summary=sales_summary,
            top_clients=top_clients,
            top_products=top_products,
            ai_analysis=ai_analysis,
            filename=args.output
        )
        
        print(f"✅ Reporte generado: {filepath}")
        
        if ai_analysis.get('ai_powered'):
            print("\n🤖 Insights de IA:")
            for insight in ai_analysis.get('insights', [])[:3]:
                print(f"   • {insight}")
    
    elif args.report == "tax":
        # Reporte tributario
        documents = get_documents(args.business_id)
        
        filepath = generate_tax_report(
            business_info=business,
            documents=documents,
            year=args.year,
            month=args.month,
            filename=args.output
        )
        
        print(f"✅ Reporte tributario generado: {filepath}")
    
    elif args.report == "analysis":
        # Solo análisis (sin Excel)
        sales_summary = get_sales_summary(args.business_id, args.year)
        clients = get_clients(args.business_id)
        top_clients = get_top_clients(args.business_id)
        
        print("\n📊 ANÁLISIS DE VENTAS")
        print("=" * 50)
        
        sales_analysis = analyze_sales_trends(sales_summary, business.get('razon_social', ''))
        
        if 'resumen' in sales_analysis:
            resumen = sales_analysis['resumen']
            print(f"Total Ventas: S/ {resumen.get('total_ventas', 0):,.2f}")
            print(f"Promedio Mensual: S/ {resumen.get('promedio_mensual', 0):,.2f}")
            print(f"Total Documentos: {resumen.get('total_documentos', 0)}")
            print(f"Tendencia: {resumen.get('tendencia', 'N/A')}")
        
        print("\n💡 INSIGHTS:")
        for insight in sales_analysis.get('insights', []):
            print(f"   • {insight}")
        
        print("\n📋 RECOMENDACIONES:")
        for rec in sales_analysis.get('recomendaciones', []):
            print(f"   • {rec}")
        
        print("\n👥 ANÁLISIS DE CLIENTES")
        print("=" * 50)
        clients_analysis = analyze_clients(clients, top_clients)
        
        if 'resumen' in clients_analysis:
            resumen = clients_analysis['resumen']
            print(f"Total Clientes: {resumen.get('total_clientes', 0)}")
            print(f"Empresas (RUC): {resumen.get('clientes_con_ruc', 0)}")
            print(f"Personas: {resumen.get('clientes_persona', 0)}")


if __name__ == "__main__":
    main()
