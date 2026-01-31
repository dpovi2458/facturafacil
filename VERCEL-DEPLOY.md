# 🚀 Guía de Despliegue: Vercel + Render

## Arquitectura de Producción

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│    VERCEL       │     │     RENDER      │     │    APPWRITE     │
│   (Frontend)    │────▶│    (Backend)    │────▶│   (Database)    │
│   facturafacil  │     │  facturafacil   │     │     Cloud       │
│    .vercel.app  │     │  -api.onrender  │     │   (ya config)   │
└─────────────────┘     └─────────────────┘     └─────────────────┘
```

---

## PASO 1: Subir a GitHub

```bash
cd /home/dpovi/factura-facil

# Autenticar con GitHub CLI
gh auth login

# O usar token personal
git push -u origin main
```

---

## PASO 2: Deploy Backend en Render (GRATIS)

### 2.1 Crear cuenta en Render
1. Ve a https://render.com
2. Regístrate con GitHub

### 2.2 Crear Web Service
1. Click **"New +"** → **"Web Service"**
2. Conecta tu repo: `gorgojomagneto3-dot/Facturafacil`
3. Configura:

| Campo | Valor |
|-------|-------|
| Name | `facturafacil-api` |
| Region | Oregon (US West) |
| Branch | `main` |
| Root Directory | `server` |
| Runtime | Node |
| Build Command | `npm install` |
| Start Command | `node src/index.appwrite.js` |
| Plan | Free |

### 2.3 Variables de Entorno en Render

Click **"Environment"** y agrega:

```
NODE_ENV=production
PORT=3001
JWT_SECRET=<genera uno con: openssl rand -hex 32>
APPWRITE_ENDPOINT=https://sfo.cloud.appwrite.io/v1
APPWRITE_PROJECT_ID=facil
APPWRITE_DATABASE_ID=facturafacil
APPWRITE_API_KEY=<tu api key de appwrite>
ADMIN_LICENSE_PASSWORD=<tu contraseña para admin>
DO_GENAI_API_KEY=<tu api key de DigitalOcean GenAI>
```

### 2.4 Deploy
1. Click **"Create Web Service"**
2. Espera ~5 minutos al primer deploy
3. Copia la URL: `https://facturafacil-api.onrender.com`

---

## PASO 3: Deploy Frontend en Vercel

### 3.1 Crear cuenta en Vercel
1. Ve a https://vercel.com
2. Regístrate con GitHub

### 3.2 Importar Proyecto
1. Click **"Add New..."** → **"Project"**
2. Importa: `gorgojomagneto3-dot/Facturafacil`
3. Configura:

| Campo | Valor |
|-------|-------|
| Framework Preset | Vite |
| Root Directory | `client` |
| Build Command | `npm run build` |
| Output Directory | `dist` |
| Install Command | `npm install` |

### 3.3 Variables de Entorno en Vercel

Click **"Environment Variables"** y agrega:

```
VITE_API_URL=https://facturafacil-api.onrender.com/api
```

> ⚠️ Usa la URL de tu backend en Render

### 3.4 Deploy
1. Click **"Deploy"**
2. Espera ~2 minutos
3. Tu app estará en: `https://facturafacil.vercel.app`

---

## PASO 4: Configurar Dominio Personalizado (Opcional)

### En Vercel:
1. Settings → Domains
2. Agrega: `facturafacil.pe` o el dominio que tengas
3. Configura DNS según instrucciones

### En Render:
1. Settings → Custom Domains
2. Agrega: `api.facturafacil.pe`
3. Configura DNS

---

## PASO 5: Panel Admin de Licencias

Una vez desplegado, accede a:

```
https://facturafacil-api.onrender.com/admin/admin-licenses.html
```

Contraseña: La que pusiste en `ADMIN_LICENSE_PASSWORD`

---

## 🔧 Troubleshooting

### Error CORS
Si hay errores de CORS, agrega en `server/src/index.appwrite.js`:
```javascript
app.use(cors({
  origin: ['https://facturafacil.vercel.app', 'http://localhost:5173'],
  credentials: true
}));
```

### Backend no responde
- Render pone en sleep los servicios gratis después de 15 min sin uso
- La primera request puede tardar 30-60 segundos en despertar
- Considera upgrade a $7/mes para evitar esto

### Variables de entorno no funcionan
- Asegúrate que en Vercel las variables empiecen con `VITE_`
- Redeploy después de cambiar variables

---

## 📋 Checklist Final

- [ ] GitHub: Código subido
- [ ] Render: Backend desplegado
- [ ] Render: Variables configuradas
- [ ] Vercel: Frontend desplegado
- [ ] Vercel: VITE_API_URL configurado
- [ ] Panel admin: Accesible
- [ ] Test: Login funciona
- [ ] Test: Crear documento funciona
- [ ] Test: Activar licencia funciona

---

## 💰 Costos

| Servicio | Plan | Costo |
|----------|------|-------|
| Vercel | Hobby | GRATIS |
| Render | Free | GRATIS |
| Appwrite | Cloud Free | GRATIS |
| **Total** | | **S/0** |

> Nota: Render Free tiene "cold starts" de 30-60s. Para producción real, upgrade a $7/mes.

---

## 🎉 ¡Listo!

Tu app estará disponible en:
- **Frontend**: https://facturafacil.vercel.app
- **Backend**: https://facturafacil-api.onrender.com
- **Admin**: https://facturafacil-api.onrender.com/admin/admin-licenses.html
