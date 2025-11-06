# 🚀 Inicio Rápido - Event Registration System

## Configuración en 5 minutos

### 1. Instalar dependencias

```bash
cd backend
npm install
```

### 2. Crear archivo .env

```bash
cp ../.env.example ../.env
```

### 3. Configurar Gmail para emails (Opción rápida)

**Obtener contraseña de aplicación de Gmail:**

1. Ve a: https://myaccount.google.com/security
2. Activa "Verificación en 2 pasos" si no lo está
3. Ve a: https://myaccount.google.com/apppasswords
4. Selecciona "Correo" y tu dispositivo
5. Copia la contraseña generada (16 caracteres)

**Editar `.env`:**

```env
# Email Configuration
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=tu-email@gmail.com
EMAIL_PASSWORD=xxxx-xxxx-xxxx-xxxx
EMAIL_FROM=Mi Evento <tu-email@gmail.com>

# Event Configuration
EVENT_NAME=Mi Evento de Prueba
EVENT_DATE=2025-12-15T18:00:00
EVENT_LOCATION=Av. Principal #123, Ciudad
EVENT_DESCRIPTION=Un evento increíble para celebrar

# Admin
ADMIN_PASSWORD=admin123
```

### 4. Iniciar el servidor

```bash
npm run dev
```

### 5. Probar la aplicación

Abre tu navegador en:

- **Formulario de registro**: http://localhost:3000
- **Panel de admin**: http://localhost:3000/admin (password: admin123)

## 🧪 Prueba rápida

1. Abre http://localhost:3000
2. Registra un asistente con tu email
3. Revisa tu correo (¡debería llegar inmediatamente!)
4. Abre http://localhost:3000/admin
5. Ingresa la contraseña: `admin123`
6. Ve tus estadísticas y asistentes

## 📧 Verificar emails enviados

Los emails incluyen:
- ✅ Confirmación de registro
- 🎫 Código QR personalizado
- 📱 Link para guardar en móvil
- ❌ Link para cancelar

## 🎯 Siguientes pasos

1. **Personalizar el evento**: Edita las variables en `.env`
2. **Cambiar la contraseña de admin**: Actualiza `ADMIN_PASSWORD` en `.env`
3. **Ajustar timezone**: Edita `backend/server.js` línea 58
4. **Probar recordatorios**:
   ```bash
   npm run reminder
   ```

## 🐛 Problemas comunes

### "Error sending email"

- Verifica que la contraseña de aplicación de Gmail sea correcta
- Asegúrate de que la verificación en 2 pasos esté activa
- Revisa que `EMAIL_USER` y `EMAIL_PASSWORD` no tengan espacios

### "Cannot connect to database"

- La base de datos se crea automáticamente
- Si hay problemas, elimina `backend/database.sqlite` y reinicia

### "Port 3000 already in use"

- Cambia el puerto en `.env`:
  ```env
  PORT=3001
  ```

## 🎨 Personalización

### Cambiar colores del formulario

Edita `frontend/index.html` líneas 30-40:

```css
background: linear-gradient(135deg, #TU_COLOR_1 0%, #TU_COLOR_2 100%);
```

### Cambiar textos de emails

Edita `backend/services/email.js`

### Agregar campos al formulario

1. Edita `frontend/index.html` (agregar input)
2. Edita `backend/routes/api.js` (validar campo)
3. Edita `backend/database.js` (agregar columna)

## 📚 Documentación completa

Lee `README.md` para:
- Despliegue en producción
- Configuración de Apple/Google Wallet
- Migración a PostgreSQL
- Seguridad avanzada

## 💡 Tips

- Usa **nodemon** para desarrollo (se reinicia automáticamente)
- El **cron job** corre a las 9:00 AM diariamente
- Los **recordatorios** solo se envían 1 día antes del evento
- Puedes **exportar CSV** desde el panel de admin

---

¿Listo? 🎉 ¡Empieza a registrar asistentes!
