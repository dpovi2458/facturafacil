# FacturaFácil - Guía de Despliegue a Producción

## 🚀 Preparación

### 1. Configuración del Servidor (.env)

Copia `.env.production.example` a `.env` y configura:

```bash
cd /home/dpovi/factura-facil/server
cp .env.production.example .env
nano .env
```

**Variables críticas:**
- `JWT_SECRET`: Genera uno nuevo con `openssl rand -hex 32`
- `ADMIN_LICENSE_PASSWORD`: Tu contraseña para el panel de licencias
- `APPWRITE_API_KEY`: Tu API key de Appwrite

### 2. Configuración del Cliente

Edita `client/.env.production`:
```
VITE_API_URL=https://tu-dominio.com/api
```

### 3. Build de Producción

```bash
# Build del cliente
cd /home/dpovi/factura-facil/client
npm run build

# Los archivos estarán en /client/dist
```

---

## 📦 Opciones de Despliegue

### Opción A: DigitalOcean App Platform (Recomendado)

1. Crea una App en DigitalOcean
2. Conecta tu repositorio de GitHub
3. Configura las variables de entorno
4. El deploy es automático con cada push

### Opción B: VPS con PM2

```bash
# Instalar PM2
npm install -g pm2

# Iniciar servidor
cd /home/dpovi/factura-facil/server
pm2 start src/index.appwrite.js --name "facturafacil-api"

# Guardar configuración
pm2 save
pm2 startup
```

### Opción C: Docker

```dockerfile
# Dockerfile para el servidor
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
EXPOSE 3001
CMD ["node", "src/index.appwrite.js"]
```

---

## 🔑 Sistema de Licencias

### Cómo funciona

1. **Cliente te contacta** (WhatsApp 944 507 095)
2. **Cliente paga** (Yape, Plin, transferencia)
3. **Tú generas licencia** en el panel admin
4. **Envías código** por WhatsApp
5. **Cliente activa** en la app

### Panel de Admin

Accede a: `https://tu-dominio.com/admin/admin-licenses.html`

**Contraseña:** La que configuraste en `ADMIN_LICENSE_PASSWORD`

### Flujo de Trabajo Diario

```
📱 Te llegan por WhatsApp
     ↓
💰 Confirmas pago (Yape/Plin)
     ↓
🔑 Panel Admin → Generar Licencia
     ↓
📋 Copiar mensaje con licencia
     ↓
📤 Pegar en WhatsApp al cliente
     ↓
✅ Cliente activa y listo!
```

### Mensaje Pre-armado

El panel genera automáticamente el mensaje:

```
¡Hola! 🎉

Aquí está tu licencia de FacturaFácil:

🔑 Código: XXXX-XXXX-XXXX-XXXX
📦 Plan: Plan Negocio
⏱️ Duración: 30 días

Para activarla:
1. Inicia sesión en facturafacil.pe
2. Ve a "Pagos" en el menú
3. Ingresa el código y presiona "Activar"

¡Gracias por tu compra! 🙏
```

---

## 📊 Planes y Precios

| Plan | Precio | Duración | Límites |
|------|--------|----------|---------|
| Trial | Gratis | 7 días | 10 comprobantes |
| Básico | S/29 | 30 días | 50 comprobantes/mes |
| Negocio | S/59 | 30 días | Ilimitados + AI |

### Crear licencias en bulk

```bash
# 10 licencias básicas de 30 días
curl -X POST http://localhost:3001/api/licenses/admin/create \
  -H "Content-Type: application/json" \
  -H "X-Admin-Key: TU_CONTRASEÑA" \
  -d '{"plan":"basico","duracion_dias":30,"cantidad":10}'

# 5 licencias negocio de 90 días (3 meses)
curl -X POST http://localhost:3001/api/licenses/admin/create \
  -H "Content-Type: application/json" \
  -H "X-Admin-Key: TU_CONTRASEÑA" \
  -d '{"plan":"negocio","duracion_dias":90,"cantidad":5}'
```

---

## 🔒 Seguridad en Producción

1. **HTTPS obligatorio** - Usa Cloudflare o Let's Encrypt
2. **Cambiar contraseñas** - JWT_SECRET y ADMIN_LICENSE_PASSWORD
3. **Firewall** - Solo puertos 80 y 443
4. **Backups** - Appwrite maneja esto automáticamente
5. **Monitoreo** - Usa PM2 o DigitalOcean Monitoring

---

## 📱 WhatsApp Business

Recomiendo usar WhatsApp Business para:
- Respuestas rápidas predefinidas
- Catálogo de planes
- Horarios de atención
- Etiquetas para organizar clientes

### Respuestas Rápidas Sugeridas

1. **Saludo inicial:**
   ```
   ¡Hola! 👋 Gracias por contactar FacturaFácil.
   
   Nuestros planes:
   📦 Básico: S/29/mes (50 facturas)
   🚀 Negocio: S/59/mes (ilimitado + AI)
   
   ¿Cuál te interesa?
   ```

2. **Datos de pago:**
   ```
   Puedes pagar por:
   
   📱 Yape: 944 507 095
   💳 Plin: 944 507 095
   🏦 BCP: XXX-XXX-XXX
   
   Envíame captura del pago y te activo al instante! ⚡
   ```

---

## ✅ Checklist de Producción

- [ ] JWT_SECRET nuevo generado
- [ ] ADMIN_LICENSE_PASSWORD cambiado
- [ ] HTTPS configurado
- [ ] Build de cliente en /dist
- [ ] PM2 o Docker configurado
- [ ] Dominio apuntando al servidor
- [ ] WhatsApp Business configurado
- [ ] Primeras 10 licencias creadas

¡Listo para facturar! 🎉
