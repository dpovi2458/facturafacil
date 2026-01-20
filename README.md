# FacturaFácil.pe 🧾

Sistema de facturación electrónica simple para MYPES peruanas. Emite boletas y facturas electrónicas cumpliendo con SUNAT.

![FacturaFácil](https://img.shields.io/badge/version-1.0.0-blue.svg)
![License](https://img.shields.io/badge/license-MIT-green.svg)

## 🎯 Problema que Resuelve

Los negocios pequeños formales (bodegas, restaurantes, talleres) necesitan emitir boletas y facturas electrónicas porque SUNAT lo exige, pero:
- No saben cómo hacerlo técnicamente
- El sistema de SUNAT es complicado
- Pagan S/100-200/mes a contadores por esto

## 💡 Solución

Una web app simple y económica para emitir boletas y facturas electrónicas:
- ✅ Interfaz fácil de usar
- ✅ 100% compatible con SUNAT
- ✅ Desde S/29/mes
- ✅ Sin conocimientos técnicos requeridos

## 🚀 Características

- **Emisión de Comprobantes**: Boletas y facturas electrónicas válidas ante SUNAT
- **Gestión de Clientes**: Registra y busca clientes por DNI/RUC
- **Catálogo de Productos**: Mantén un catálogo para facturar más rápido
- **Dashboard**: Visualiza ventas diarias, mensuales y anuales
- **Generación de PDF**: Descarga comprobantes en PDF
- **Reportes**: Estadísticas de ventas y uso

## 📋 Planes de Precios

| Plan | Precio | Comprobantes/mes |
|------|--------|------------------|
| Prueba | Gratis (7 días) | 10 |
| Básico | S/29 | 50 |
| Negocio | S/59 | Ilimitados |

## 🛠 Stack Tecnológico

### Backend
- Node.js + Express
- SQLite (better-sqlite3)
- JWT para autenticación
- PDFKit para generación de PDFs

### Frontend
- React 18 + TypeScript
- Vite
- Tailwind CSS
- React Router
- React Hook Form
- Recharts
- Zustand

## 📁 Estructura del Proyecto

```
facturafacil/
├── client/                 # Frontend React
│   ├── src/
│   │   ├── components/     # Componentes reutilizables
│   │   ├── pages/          # Páginas de la aplicación
│   │   ├── services/       # API calls
│   │   ├── store/          # Estado global (Zustand)
│   │   └── types/          # Tipos TypeScript
│   └── public/
├── server/                 # Backend Express
│   ├── src/
│   │   ├── database/       # Inicialización SQLite
│   │   ├── middleware/     # Auth middleware
│   │   ├── routes/         # API routes
│   │   └── services/       # PDF, SUNAT services
│   ├── data/               # Base de datos SQLite
│   └── pdfs/               # PDFs generados
└── package.json
```

## 🔧 Instalación

### Requisitos
- Node.js 18+
- npm o yarn

### Pasos

1. **Clonar el repositorio**
```bash
cd facturafacil
```

2. **Instalar dependencias**
```bash
npm run install:all
```

3. **Configurar variables de entorno**
```bash
# El archivo server/.env ya está configurado para desarrollo
# Para producción, actualiza JWT_SECRET
```

4. **Iniciar en modo desarrollo**
```bash
npm run dev
```

Esto iniciará:
- Backend en `http://localhost:3001`
- Frontend en `http://localhost:5173`

## 📖 Uso

### 1. Registro
- Ingresa a `http://localhost:5173`
- Crea una cuenta con tu RUC y datos del negocio
- Obtienes 7 días de prueba gratis con 10 comprobantes

### 2. Configuración Inicial
- Agrega tus productos/servicios frecuentes
- Registra tus clientes habituales

### 3. Emitir Comprobantes
- Click en "Nuevo Comprobante"
- Selecciona Boleta o Factura
- Agrega items y cliente
- Click en "Emitir"
- ¡Listo! Descarga el PDF

## 🔌 API Endpoints

### Autenticación
```
POST /api/auth/register   - Registro de usuario
POST /api/auth/login      - Inicio de sesión
GET  /api/auth/me         - Usuario actual
```

### Clientes
```
GET    /api/clients       - Listar clientes
POST   /api/clients       - Crear cliente
PUT    /api/clients/:id   - Actualizar cliente
DELETE /api/clients/:id   - Eliminar cliente
```

### Productos
```
GET    /api/products      - Listar productos
POST   /api/products      - Crear producto
PUT    /api/products/:id  - Actualizar producto
DELETE /api/products/:id  - Eliminar producto
```

### Documentos
```
GET    /api/documents           - Listar documentos
GET    /api/documents/:id       - Obtener documento
POST   /api/documents           - Crear documento
GET    /api/documents/:id/pdf   - Descargar PDF
POST   /api/documents/:id/anular - Anular documento
```

### Dashboard
```
GET /api/dashboard/stats  - Estadísticas
```

## 🔐 Seguridad

- Contraseñas hasheadas con bcrypt
- JWT con expiración de 7 días
- Validación de datos con express-validator
- Protección de rutas en frontend y backend

## 📊 Base de Datos

### Tablas
- `users` - Usuarios del sistema
- `businesses` - Datos de negocios
- `clients` - Clientes de cada negocio
- `products` - Productos/servicios
- `documents` - Boletas y facturas
- `document_items` - Items de cada documento
- `series` - Control de series (B001, F001, etc.)

## 🌟 Próximas Mejoras

- [ ] Integración real con API de SUNAT
- [ ] Consulta de RUC/DNI automática
- [ ] Notas de crédito y débito
- [ ] Reportes exportables a Excel
- [ ] Notificaciones por email
- [ ] App móvil

## 🤝 Contribuir

1. Fork el proyecto
2. Crea una rama (`git checkout -b feature/nueva-funcionalidad`)
3. Commit cambios (`git commit -am 'Agrega nueva funcionalidad'`)
4. Push a la rama (`git push origin feature/nueva-funcionalidad`)
5. Crea un Pull Request

## 📄 Licencia

MIT License - ver [LICENSE](LICENSE)

## 📞 Soporte

- Email: soporte@facturafacil.pe
- WhatsApp: +51 999 999 999

---

Hecho con ❤️ para las MYPES peruanas
