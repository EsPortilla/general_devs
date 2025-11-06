# 🚀 Despliegue en Railway.app - Paso a Paso

## Tutorial completo para desplegar tu app en 10 minutos

### Paso 1: Crear cuenta en Railway

1. Ve a https://railway.app
2. Haz clic en **"Login"**
3. Selecciona **"Login With GitHub"**
4. Autoriza Railway para acceder a tus repositorios

### Paso 2: Crear nuevo proyecto

1. Haz clic en **"New Project"**
2. Selecciona **"Deploy from GitHub repo"**
3. Busca y selecciona tu repositorio: **`general_devs`**
4. Railway detectará automáticamente que es una app Node.js

### Paso 3: Configurar variables de entorno

1. En tu proyecto, haz clic en la pestaña **"Variables"**
2. Haz clic en **"+ New Variable"** y agrega una por una:

```env
NODE_ENV=production
PORT=3000
DATABASE_PATH=./database.sqlite

# ===== EMAIL CONFIGURATION =====
# IMPORTANTE: Usa una contraseña de aplicación de Gmail
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=tu-email@gmail.com
EMAIL_PASSWORD=xxxx-xxxx-xxxx-xxxx
EMAIL_FROM=Event Registration <tu-email@gmail.com>

# ===== EVENT CONFIGURATION =====
EVENT_NAME=Mi Evento Increíble
EVENT_DATE=2025-12-31T19:00:00
EVENT_LOCATION=Calle Principal #123, Ciudad
EVENT_DESCRIPTION=¡Únete a nosotros para una noche inolvidable!

# ===== ADMIN =====
ADMIN_PASSWORD=mi-password-super-seguro-123
```

3. **IMPORTANTE**: Para `APP_URL` y `FRONTEND_URL`, usa variables especiales de Railway:

```env
APP_URL=https://${{RAILWAY_PUBLIC_DOMAIN}}
FRONTEND_URL=https://${{RAILWAY_PUBLIC_DOMAIN}}
```

### Paso 4: Obtener contraseña de aplicación de Gmail

**¡MUY IMPORTANTE!** No uses tu contraseña normal de Gmail.

1. Ve a https://myaccount.google.com/security
2. Busca **"Verificación en 2 pasos"** y actívala si no lo está
3. Ve a https://myaccount.google.com/apppasswords
4. En "Selecciona la app", elige **"Correo"**
5. En "Selecciona el dispositivo", elige **"Otro"** y escribe "Railway"
6. Haz clic en **"Generar"**
7. Copia la contraseña de 16 caracteres (formato: xxxx xxxx xxxx xxxx)
8. Pégala en `EMAIL_PASSWORD` (sin espacios)

### Paso 5: Configurar dominio público

1. En tu proyecto, ve a **"Settings"**
2. Busca la sección **"Networking"**
3. Haz clic en **"Generate Domain"**
4. Railway te dará un dominio como: `tu-app-production.up.railway.app`
5. **Copia este dominio**

### Paso 6: Actualizar las URLs

1. Ve de nuevo a **"Variables"**
2. Actualiza (si es necesario) `APP_URL` y `FRONTEND_URL` con tu dominio:

```env
APP_URL=https://tu-app-production.up.railway.app
FRONTEND_URL=https://tu-app-production.up.railway.app
```

**O mejor**, usa las variables dinámicas de Railway:

```env
APP_URL=https://${{RAILWAY_PUBLIC_DOMAIN}}
FRONTEND_URL=https://${{RAILWAY_PUBLIC_DOMAIN}}
```

### Paso 7: Desplegar

Railway desplegará automáticamente tu aplicación. Verás los logs en tiempo real:

```
Building...
Installing dependencies...
Starting server...
✓ Deploy successful!
```

### Paso 8: ¡Probar tu aplicación!

1. Haz clic en el dominio generado (o cópialo)
2. Abre en tu navegador: `https://tu-app-production.up.railway.app`
3. Deberías ver el formulario de registro ✨

### Paso 9: Probar en tu móvil

1. Abre el dominio en tu móvil
2. Registra un asistente con tu email
3. Revisa tu correo (debería llegar en segundos)
4. Abre el QR code
5. Guarda el ticket en tu pantalla de inicio

### Paso 10: Acceder al panel de admin

1. Ve a: `https://tu-dominio.railway.app/admin`
2. Ingresa tu `ADMIN_PASSWORD`
3. ¡Listo! Puedes ver tus asistentes 🎉

---

## 🐛 Solución de Problemas

### "Application failed to respond"

**Causa**: El servidor no está iniciando correctamente.

**Solución**:
1. Ve a **"Deployments"** en Railway
2. Haz clic en el último deployment
3. Ve a **"View Logs"**
4. Busca errores en los logs

Errores comunes:
- Puerto incorrecto (debe ser 3000)
- Falta alguna variable de entorno
- Error en credenciales de email

### "Error sending email"

**Causa**: Credenciales de Gmail incorrectas.

**Solución**:
1. Verifica que `EMAIL_USER` sea tu email completo
2. Verifica que `EMAIL_PASSWORD` sea la contraseña de aplicación (16 caracteres)
3. Asegúrate de tener verificación en 2 pasos activa
4. Intenta generar una nueva contraseña de aplicación

### "Cannot connect to database"

**Causa**: SQLite puede tener problemas en algunos entornos de Railway.

**Solución** (Opcional - usar PostgreSQL):
1. En Railway, haz clic en **"+ New"**
2. Selecciona **"Database" → "PostgreSQL"**
3. Railway creará variables automáticamente: `DATABASE_URL`
4. Necesitarás modificar `backend/database.js` para usar PostgreSQL

### No veo mis cambios reflejados

**Causa**: Railway no ha redesplgado.

**Solución**:
1. Haz un nuevo commit y push al repositorio
2. Railway detectará automáticamente y redessplegará
3. O en Railway, haz clic en **"Redeploy"**

---

## 📊 Monitoreo

### Ver logs en tiempo real

1. En tu proyecto Railway
2. Ve a **"Deployments"**
3. Haz clic en el deployment activo
4. Ve a **"View Logs"**

### Estadísticas

Railway muestra:
- CPU usage
- Memory usage
- Request count
- Error rate

---

## 💰 Plan Gratuito de Railway

Railway ofrece:
- **$5 USD de crédito gratis al mes**
- Suficiente para una app pequeña/mediana
- ~500 horas de ejecución
- 1GB de RAM
- 1GB de disco

Si se acaba:
- La app se pausará hasta el siguiente mes
- O puedes agregar una tarjeta para continuar

---

## 🔐 Seguridad

**Antes de producción**:

1. ✅ Cambia `ADMIN_PASSWORD` a algo muy seguro
2. ✅ Usa contraseña de aplicación de Gmail (no tu password normal)
3. ✅ No compartas tus variables de entorno
4. ✅ Mantén tu repositorio privado o usa `.env` local

---

## 🎨 Personalización Post-Despliegue

### Cambiar nombre del evento

1. Ve a Railway → Variables
2. Modifica `EVENT_NAME`, `EVENT_DATE`, `EVENT_LOCATION`
3. Guarda (se redesplega automáticamente)

### Cambiar colores

1. Edita `frontend/index.html` localmente
2. Haz commit y push
3. Railway redesplega automáticamente

---

## 📱 Dominio Personalizado (Opcional)

Si tienes un dominio propio:

1. En Railway, ve a **Settings → Networking**
2. Haz clic en **"Custom Domain"**
3. Ingresa tu dominio: `evento.tudominio.com`
4. Railway te dará registros DNS para configurar
5. Agrega esos registros en tu proveedor de dominio
6. ¡Listo! Railway configurará HTTPS automáticamente

---

## ✅ Checklist Final

Antes de compartir tu app:

- [ ] App desplegada y funcionando
- [ ] Email de confirmación llega correctamente
- [ ] QR code se genera
- [ ] Ticket móvil se puede guardar
- [ ] Panel de admin accesible
- [ ] Contraseña de admin cambiada
- [ ] Evento configurado con fecha correcta
- [ ] Probado en móvil
- [ ] Dominio compartido con asistentes

---

## 🆘 ¿Necesitas ayuda?

Si tienes problemas:
1. Revisa los logs en Railway
2. Verifica todas las variables de entorno
3. Asegúrate que las credenciales de Gmail sean correctas
4. Prueba localmente primero con `npm run dev`

---

¡Felicidades! 🎉 Tu aplicación está en producción y lista para registrar asistentes.
