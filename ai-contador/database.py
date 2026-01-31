"""
Conexión a la base de datos SQLite de FacturaFácil
"""
import sqlite3
import pandas as pd
from pathlib import Path
from config import DATABASE_PATH


def get_connection():
    """Obtiene conexión a la base de datos SQLite"""
    db_path = Path(DATABASE_PATH)
    if not db_path.exists():
        raise FileNotFoundError(f"Base de datos no encontrada en: {db_path}")
    return sqlite3.connect(db_path)


def query_to_dataframe(query: str, params: tuple = ()) -> pd.DataFrame:
    """Ejecuta una query y retorna un DataFrame"""
    conn = get_connection()
    df = pd.read_sql_query(query, conn, params=params)
    conn.close()
    return df


def get_business_info(business_id: int) -> dict:
    """Obtiene información del negocio"""
    query = """
        SELECT id, ruc, razon_social, nombre_comercial, direccion, 
               telefono, email, plan
        FROM businesses 
        WHERE id = ?
    """
    df = query_to_dataframe(query, (business_id,))
    if df.empty:
        return None
    return df.iloc[0].to_dict()


def get_documents(business_id: int, start_date: str = None, end_date: str = None) -> pd.DataFrame:
    """Obtiene documentos (facturas/boletas) con filtros opcionales"""
    query = """
        SELECT 
            d.id,
            d.tipo,
            d.serie,
            d.numero,
            d.fecha_emision,
            d.fecha_vencimiento,
            d.moneda,
            d.subtotal,
            d.igv,
            d.total,
            d.estado,
            c.nombre as cliente_nombre,
            c.numero_documento as cliente_documento,
            c.tipo_documento as cliente_tipo_doc
        FROM documents d
        LEFT JOIN clients c ON d.client_id = c.id
        WHERE d.business_id = ?
    """
    params = [business_id]
    
    if start_date:
        query += " AND d.fecha_emision >= ?"
        params.append(start_date)
    if end_date:
        query += " AND d.fecha_emision <= ?"
        params.append(end_date)
    
    query += " ORDER BY d.fecha_emision DESC"
    
    return query_to_dataframe(query, tuple(params))


def get_document_items(document_ids: list) -> pd.DataFrame:
    """Obtiene los items de los documentos"""
    if not document_ids:
        return pd.DataFrame()
    
    placeholders = ','.join(['?' for _ in document_ids])
    query = f"""
        SELECT 
            di.document_id,
            di.cantidad,
            di.unidad_medida,
            di.descripcion,
            di.precio_unitario,
            di.valor_venta,
            di.igv,
            di.total,
            p.codigo as producto_codigo
        FROM document_items di
        LEFT JOIN products p ON di.product_id = p.id
        WHERE di.document_id IN ({placeholders})
    """
    return query_to_dataframe(query, tuple(document_ids))


def get_clients(business_id: int) -> pd.DataFrame:
    """Obtiene todos los clientes del negocio"""
    query = """
        SELECT 
            id, tipo_documento, numero_documento, nombre, 
            direccion, email, telefono, created_at
        FROM clients 
        WHERE business_id = ?
        ORDER BY nombre
    """
    return query_to_dataframe(query, (business_id,))


def get_products(business_id: int) -> pd.DataFrame:
    """Obtiene todos los productos del negocio"""
    query = """
        SELECT 
            id, codigo, descripcion, unidad_medida, 
            precio, tipo, igv_incluido, activo
        FROM products 
        WHERE business_id = ?
        ORDER BY descripcion
    """
    return query_to_dataframe(query, (business_id,))


def get_sales_summary(business_id: int, year: int = None) -> pd.DataFrame:
    """Obtiene resumen de ventas por mes"""
    query = """
        SELECT 
            strftime('%Y', fecha_emision) as año,
            strftime('%m', fecha_emision) as mes,
            tipo,
            COUNT(*) as cantidad_documentos,
            SUM(subtotal) as subtotal,
            SUM(igv) as igv,
            SUM(total) as total
        FROM documents
        WHERE business_id = ? AND estado != 'anulado'
    """
    params = [business_id]
    
    if year:
        query += " AND strftime('%Y', fecha_emision) = ?"
        params.append(str(year))
    
    query += " GROUP BY año, mes, tipo ORDER BY año DESC, mes DESC"
    
    return query_to_dataframe(query, tuple(params))


def get_top_clients(business_id: int, limit: int = 10) -> pd.DataFrame:
    """Obtiene los clientes con más compras"""
    query = """
        SELECT 
            c.nombre,
            c.numero_documento,
            COUNT(d.id) as total_compras,
            SUM(d.total) as monto_total,
            MAX(d.fecha_emision) as ultima_compra
        FROM clients c
        JOIN documents d ON c.id = d.client_id
        WHERE c.business_id = ? AND d.estado != 'anulado'
        GROUP BY c.id
        ORDER BY monto_total DESC
        LIMIT ?
    """
    return query_to_dataframe(query, (business_id, limit))


def get_top_products(business_id: int, limit: int = 10) -> pd.DataFrame:
    """Obtiene los productos más vendidos"""
    query = """
        SELECT 
            di.descripcion,
            SUM(di.cantidad) as cantidad_vendida,
            SUM(di.total) as monto_total,
            COUNT(DISTINCT di.document_id) as en_documentos
        FROM document_items di
        JOIN documents d ON di.document_id = d.id
        WHERE d.business_id = ? AND d.estado != 'anulado'
        GROUP BY di.descripcion
        ORDER BY monto_total DESC
        LIMIT ?
    """
    return query_to_dataframe(query, (business_id, limit))
