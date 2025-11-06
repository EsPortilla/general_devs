# Deployment Guide - Railway.app

## Despliegue Rápido en Railway (Gratis)

### 1. Preparar el proyecto

Primero necesitamos crear algunos archivos de configuración para el despliegue.

### 2. Crear cuenta en Railway

1. Ve a https://railway.app
2. Haz clic en "Start a New Project"
3. Conecta tu cuenta de GitHub
4. Selecciona el repositorio `general_devs`

### 3. Configurar variables de entorno

En Railway, ve a Variables y agrega:

```env
NODE_ENV=production
PORT=3000

# Database (Railway te dará esto automáticamente si agregas PostgreSQL)
DATABASE_PATH=./database.sqlite

# Email Configuration (usa tus credenciales)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=tu-email@gmail.com
EMAIL_PASSWORD=tu-password-de-aplicacion
EMAIL_FROM=Event Registration <tu-email@gmail.com>

# Event Configuration
EVENT_NAME=Mi Evento Increíble
EVENT_DATE=2025-12-31T19:00:00
EVENT_LOCATION=Tu Ubicación
EVENT_DESCRIPTION=Descripción del evento

# Application URLs (Railway te dará un dominio)
APP_URL=${{RAILWAY_PUBLIC_DOMAIN}}
FRONTEND_URL=${{RAILWAY_PUBLIC_DOMAIN}}

# Admin
ADMIN_PASSWORD=tu-password-seguro
```

### 4. Deploy automático

Railway detectará automáticamente tu app Node.js y la desplegará.

### 5. Obtener tu URL

Railway te dará una URL como: `https://tu-app.railway.app`

---

## Alternativa: Render.com (También gratis)

### 1. Ir a https://render.com

### 2. Crear cuenta y conectar GitHub

### 3. Crear nuevo "Web Service"

- Selecciona tu repositorio
- Build Command: `cd backend && npm install`
- Start Command: `cd backend && npm start`

### 4. Configurar variables de entorno

Igual que en Railway, agrega todas las variables del `.env.example`

### 5. Deploy

Render desplegará automáticamente tu app.

---

## Alternativa: Heroku

```bash
# 1. Instalar Heroku CLI
# https://devcenter.heroku.com/articles/heroku-cli

# 2. Login
heroku login

# 3. Crear app
heroku create mi-evento-app

# 4. Configurar variables de entorno
heroku config:set EMAIL_HOST=smtp.gmail.com
heroku config:set EMAIL_USER=tu-email@gmail.com
# ... todas las variables

# 5. Deploy
git push heroku main
```

---

## Para desarrollo local y prueba móvil

### Opción A: Usar tu computadora como servidor

1. En tu computadora:
```bash
cd backend
npm run dev
```

2. Obtener tu IP local:
```bash
# En Windows
ipconfig

# En Mac/Linux
ifconfig
```

3. Busca tu IP local (ejemplo: 192.168.1.100)

4. Edita `backend/server.js` y cambia:
```javascript
app.listen(PORT, '0.0.0.0', () => {
  // ...
});
```

5. En tu móvil (conectado a la misma WiFi):
```
http://192.168.1.100:3000
```

### Opción B: Usar ngrok (túnel temporal)

```bash
# 1. Instalar ngrok
# https://ngrok.com/download

# 2. Iniciar tu servidor
cd backend
npm run dev

# 3. En otra terminal
ngrok http 3000

# 4. Ngrok te dará una URL pública:
# https://abc123.ngrok.io
```

---

## ¿Cuál elegir?

| Plataforma | Pros | Contras |
|------------|------|---------|
| **Railway** | Muy fácil, PostgreSQL gratis, CI/CD automático | Límite de horas gratis al mes |
| **Render** | Gratis permanente, fácil | Se duerme después de inactividad |
| **Heroku** | Muy conocido, documentación extensa | Ya no tiene plan gratis |
| **Ngrok** | Perfecto para pruebas rápidas | Temporal, no para producción |

## Recomendación

Para producción: **Railway.app**
Para pruebas rápidas: **ngrok**
