# FacturaFácil - Integración con Appwrite

Sistema de facturación electrónica para Perú, ahora con Appwrite como base de datos.

## 🚀 Configuración Rápida

### 1. Crear proyecto en Appwrite

1. Ve a [Appwrite Cloud](https://cloud.appwrite.io) o tu instancia self-hosted
2. Crea un nuevo proyecto
3. Anota el **Project ID**
4. Ve a **Settings > API Keys** y crea una nueva API Key con estos permisos:
   - `databases.read`, `databases.write`
   - `collections.read`, `collections.write`
   - `documents.read`, `documents.write`
   - `attributes.read`, `attributes.write`
   - `indexes.read`, `indexes.write`

### 2. Configurar el Servidor

```bash
cd server

# Copiar archivo de configuración
cp .env.example .env

# Editar .env con tus credenciales de Appwrite
nano .env
```

Configurar estas variables:
```env
APPWRITE_ENDPOINT=https://cloud.appwrite.io/v1
APPWRITE_PROJECT_ID=tu_project_id
APPWRITE_API_KEY=tu_api_key
APPWRITE_DATABASE_ID=facturafacil
JWT_SECRET=tu_secreto_jwt
```

### 3. Crear Base de Datos y Colecciones

```bash
cd server
npm install
npm run setup:appwrite
```

Este comando creará automáticamente:
- Base de datos `facturafacil`
- Colecciones: users, businesses, clients, products, documents, document_items, series
- Índices necesarios

### 4. Iniciar el Servidor

```bash
# Con Appwrite (por defecto)
npm run dev

# O con SQLite (versión anterior)
npm run dev:sqlite
```

### 5. Configurar el Cliente

```bash
cd client

# Copiar archivo de configuración
cp .env.example .env

# Editar .env (opcional si usas el backend)
nano .env
```

```bash
npm install
npm run dev
```

## 📁 Estructura de Archivos

### Servidor (con Appwrite)

```
server/src/
├── config/
│   └── appwrite.js          # Configuración del cliente Appwrite
├── database/
│   ├── appwrite.js          # Servicios de base de datos Appwrite
│   └── init.js              # Base de datos SQLite (legacy)
├── middleware/
│   ├── auth.appwrite.js     # Middleware con Appwrite
│   └── auth.js              # Middleware con SQLite (legacy)
├── routes/
│   ├── auth.appwrite.js     # Rutas de autenticación
│   ├── clients.appwrite.js  # Rutas de clientes
│   ├── products.appwrite.js # Rutas de productos
│   ├── documents.appwrite.js # Rutas de documentos
│   ├── dashboard.appwrite.js # Rutas del dashboard
│   └── business.appwrite.js  # Rutas del negocio
├── index.appwrite.js        # Entry point con Appwrite
├── index.js                 # Entry point con SQLite (legacy)
└── setup-appwrite.js        # Script de configuración
```

### Cliente

```
client/src/
├── config/
│   └── appwrite.ts          # Configuración del cliente Appwrite
├── services/
│   ├── api.ts               # API usando backend Express
│   └── appwrite.ts          # Servicios Appwrite directos (opcional)
```

## 🔧 Scripts Disponibles

### Servidor

```bash
npm run dev              # Desarrollo con Appwrite
npm run dev:sqlite       # Desarrollo con SQLite
npm run start            # Producción con Appwrite
npm run start:sqlite     # Producción con SQLite
npm run setup:appwrite   # Configurar base de datos Appwrite
```

### Cliente

```bash
npm run dev      # Servidor de desarrollo
npm run build    # Build para producción
npm run preview  # Preview del build
```

## 🗃️ Colecciones de Appwrite

### users
- `email` (string, único)
- `password` (string, hasheado)
- `created_at`, `updated_at` (datetime)

### businesses
- `user_id` (string, único)
- `ruc` (string, único, 11 caracteres)
- `razon_social`, `nombre_comercial`, `direccion` (string)
- `ubigeo`, `departamento`, `provincia`, `distrito` (string)
- `telefono`, `email`, `logo` (string)
- `plan` (string: trial, basico, negocio)
- `documents_this_month` (integer)

### clients
- `business_id` (string)
- `tipo_documento` (string: DNI, RUC, CE, PASAPORTE)
- `numero_documento`, `nombre` (string)
- `direccion`, `email`, `telefono` (string, opcional)

### products
- `business_id` (string)
- `codigo`, `descripcion` (string)
- `unidad_medida` (string, default: NIU)
- `precio` (float)
- `tipo` (string: producto, servicio)
- `igv_incluido`, `activo` (boolean)

### documents
- `business_id`, `client_id` (string)
- `tipo` (string: boleta, factura)
- `serie`, `numero` (string, integer)
- `fecha_emision`, `fecha_vencimiento` (string)
- `moneda` (string, default: PEN)
- `subtotal`, `igv`, `total` (float)
- `estado` (string: emitido, aceptado, rechazado, anulado)
- `sunat_respuesta`, `sunat_codigo`, `hash_cpe` (string)
- `pdf_path`, `xml_path`, `observaciones` (string)

### document_items
- `document_id`, `product_id` (string)
- `cantidad`, `precio_unitario`, `valor_venta`, `igv`, `total` (float)
- `unidad_medida`, `descripcion` (string)

### series
- `business_id` (string)
- `tipo` (string: boleta, factura)
- `serie` (string: B001, F001, etc.)
- `ultimo_numero` (integer)
- `activo` (boolean)

## 🔄 Migración desde SQLite

Si tienes datos en SQLite que quieres migrar a Appwrite:

1. Exporta los datos de SQLite
2. Ejecuta `npm run setup:appwrite` para crear las colecciones
3. Importa los datos usando la API de Appwrite o scripts personalizados

## 🛡️ Seguridad

- Los passwords se hashean con bcrypt antes de guardar
- Las API Keys de Appwrite solo deben usarse en el servidor
- El cliente puede usar Appwrite directamente solo para operaciones permitidas
- JWT se usa para autenticación entre cliente y servidor Express

## 📝 Notas

- El servidor Express actúa como middleware entre el cliente y Appwrite
- Esto permite lógica de negocio adicional (validaciones, generación de PDFs, etc.)
- Para producción, considera usar Appwrite Functions para lógica serverless
