# Event Registration System

Sistema completo de registro para eventos con generación de códigos QR, envío automático de correos, y passes para móviles.

## 🎯 Características

- ✅ **Registro de Asistentes**: Formulario web simple para registrarse al evento
- 📧 **Email Automático**: Envío de confirmación con código QR al registrarse
- 🔔 **Recordatorios**: Email recordatorio 1 día antes del evento
- 📱 **Mobile Ticket**: Ticket HTML optimizado para guardar en el móvil
- 🎫 **Códigos QR**: Generación automática de QR personalizados
- 📊 **Panel Admin**: Dashboard para ver estadísticas y lista de asistentes
- ❌ **Cancelaciones**: Opción para cancelar asistencia desde el email
- ✅ **Confirmaciones**: Confirmar asistencia antes del evento
- 📥 **Exportar**: Exportar lista de asistentes en formato CSV
- 🔐 **Seguridad**: Panel de administración protegido con contraseña

## 📁 Estructura del Proyecto

```
general_devs/
├── backend/
│   ├── routes/
│   │   └── api.js              # Rutas API REST
│   ├── services/
│   │   ├── email.js            # Servicio de envío de emails
│   │   ├── qr.js               # Generación de códigos QR
│   │   └── wallet.js           # Passes para wallet (mobile ticket)
│   ├── jobs/
│   │   └── reminder.js         # Cron job para recordatorios
│   ├── utils/
│   ├── database.js             # Base de datos SQLite
│   ├── server.js               # Servidor Express
│   └── package.json
├── frontend/
│   ├── index.html              # Formulario de registro
│   └── admin.html              # Panel de administración
├── .env.example                # Plantilla de variables de entorno
├── .gitignore
└── README.md
```

## 🚀 Instalación

### Requisitos Previos

- Node.js 16 o superior
- npm o yarn
- Cuenta de email (Gmail, SendGrid, Mailgun, etc.)

### Pasos de Instalación

1. **Clonar el repositorio**
```bash
git clone <repo-url>
cd general_devs
```

2. **Instalar dependencias del backend**
```bash
cd backend
npm install
```

3. **Configurar variables de entorno**
```bash
# Copiar el archivo de ejemplo
cp ../.env.example ../.env

# Editar el archivo .env con tus valores
nano ../.env  # o usar tu editor preferido
```

4. **Configurar Email (Gmail como ejemplo)**

Para usar Gmail:
- Ve a tu cuenta de Google
- Activa la verificación en 2 pasos
- Genera una "Contraseña de aplicación" en: https://myaccount.google.com/apppasswords
- Usa esa contraseña en `EMAIL_PASSWORD` del archivo `.env`

Ejemplo de configuración en `.env`:
```env
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=tu-email@gmail.com
EMAIL_PASSWORD=xxxx-xxxx-xxxx-xxxx  # Contraseña de aplicación
EMAIL_FROM=Event Registration <tu-email@gmail.com>
```

5. **Configurar los detalles del evento**

Edita el archivo `.env` con la información de tu evento:
```env
EVENT_NAME=Mi Evento Increíble
EVENT_DATE=2025-12-31T19:00:00
EVENT_LOCATION=Calle Principal #123, Ciudad
EVENT_DESCRIPTION=¡Únete a nosotros para una noche inolvidable!
```

6. **Configurar contraseña de administrador**
```env
ADMIN_PASSWORD=mi-password-seguro-123
```

## ▶️ Uso

### Modo Desarrollo

```bash
cd backend
npm run dev
```

El servidor se iniciará en `http://localhost:3000`

### Modo Producción

```bash
cd backend
npm start
```

## 🌐 Endpoints

### Público

- `GET /` - Formulario de registro
- `GET /admin` - Panel de administración (requiere contraseña)
- `POST /api/register` - Registrar nuevo asistente
- `GET /api/confirm/:token` - Confirmar asistencia
- `GET /api/cancel/:token` - Cancelar asistencia
- `GET /api/wallet/:id` - Obtener ticket móvil
- `GET /api/statistics` - Estadísticas públicas del evento
- `GET /health` - Health check

### Administración (requiere autenticación)

- `GET /api/attendees?password=xxx` - Lista completa de asistentes
- `POST /api/send-reminders` - Enviar recordatorios manualmente

## 📧 Flujo de Emails

### 1. Email de Confirmación
Enviado inmediatamente después del registro:
- ✅ Confirmación de registro exitoso
- 📅 Detalles del evento (fecha, hora, ubicación)
- 🎫 Código QR personalizado
- 📱 Botón para guardar en Wallet
- ❌ Enlace para cancelar

### 2. Email de Recordatorio
Enviado automáticamente 1 día antes del evento (9:00 AM):
- ⏰ Recordatorio del evento
- 🎫 Código QR (por si lo perdieron)
- ✅ Botón para confirmar asistencia
- ❌ Botón para cancelar si no pueden asistir

### 3. Email de Cancelación
Enviado cuando un asistente cancela:
- ✅ Confirmación de cancelación
- 💭 Mensaje de despedida

## 🤖 Recordatorios Automáticos

### Cron Job Automático

El sistema verifica diariamente a las 9:00 AM si el evento es mañana. Si es así, envía recordatorios a todos los asistentes registrados que no hayan recibido el recordatorio aún.

Para cambiar la hora o timezone:

Edita `backend/server.js`:
```javascript
cron.schedule('0 9 * * *', () => {  // Formato: minuto hora * * *
  // ...
}, {
  timezone: "America/Mexico_City"  // Cambia a tu timezone
});
```

### Envío Manual

También puedes enviar recordatorios manualmente desde el panel de administración o ejecutando:

```bash
cd backend
npm run reminder
```

## 📱 Mobile Wallet

El sistema genera tickets HTML optimizados para móviles que pueden guardarse en la pantalla de inicio:

**iOS (Safari)**:
1. Abrir el ticket desde el email
2. Tocar el botón "Compartir"
3. Seleccionar "Agregar a pantalla de inicio"

**Android (Chrome)**:
1. Abrir el ticket desde el email
2. Tocar el menú (⋮)
3. Seleccionar "Agregar a pantalla de inicio"

### Apple Wallet y Google Wallet (Avanzado)

Para producción, puedes configurar passes nativos:

**Apple Wallet**:
- Requiere Apple Developer Account ($99/año)
- Generar certificado Pass Type ID
- Configurar variables en `.env`:
  ```env
  APPLE_PASS_TYPE_ID=pass.com.tucompania.evento
  APPLE_TEAM_ID=TU_TEAM_ID
  APPLE_CERTIFICATE_PATH=./certificates/pass.p12
  APPLE_CERTIFICATE_PASSWORD=password
  ```

**Google Wallet**:
- Requiere Google Cloud Project
- Habilitar Google Wallet API
- Crear Service Account
- Configurar variables en `.env`:
  ```env
  GOOGLE_ISSUER_ID=tu-issuer-id
  GOOGLE_SERVICE_ACCOUNT_EMAIL=account@project.iam.gserviceaccount.com
  GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY_PATH=./certificates/google.json
  ```

## 👨‍💼 Panel de Administración

Accede a `http://localhost:3000/admin` e ingresa la contraseña configurada en `.env`.

### Funcionalidades

- 📊 **Estadísticas**: Total registrados, confirmados, cancelados
- 📋 **Lista de Asistentes**: Ver todos los registrados con filtros
- 🔍 **Búsqueda**: Buscar por nombre o email
- 🏷️ **Filtros**: Ver por estado (todos, pendientes, confirmados, cancelados)
- 📧 **Enviar Recordatorios**: Disparar recordatorios manualmente
- 📥 **Exportar CSV**: Descargar lista completa en CSV
- 🔄 **Actualizar**: Refrescar datos en tiempo real

## 🗄️ Base de Datos

El sistema usa SQLite para desarrollo. Los datos se almacenan en `backend/database.sqlite`.

### Tabla: attendees

| Campo | Tipo | Descripción |
|-------|------|-------------|
| id | INTEGER | ID único |
| first_name | TEXT | Nombre |
| last_name | TEXT | Apellido |
| email | TEXT | Email (único) |
| registration_date | DATETIME | Fecha de registro |
| status | TEXT | Estado: registered, confirmed, cancelled |
| confirmation_token | TEXT | Token para confirmar |
| cancellation_token | TEXT | Token para cancelar |
| qr_code | TEXT | QR code en base64 |
| reminder_sent | INTEGER | 0 o 1 |
| confirmed_at | DATETIME | Fecha de confirmación |
| cancelled_at | DATETIME | Fecha de cancelación |

### Migrar a PostgreSQL (Producción)

Para producción se recomienda PostgreSQL:

1. Instalar pg: `npm install pg`
2. Cambiar configuración de base de datos en `backend/database.js`
3. Actualizar `DATABASE_PATH` a connection string de PostgreSQL

## 🚀 Despliegue

### Opciones de Hosting

**Backend + Frontend**:
- Railway.app (recomendado - incluye PostgreSQL gratis)
- Heroku (con addon PostgreSQL)
- Render.com
- DigitalOcean App Platform
- AWS Elastic Beanstalk
- Google Cloud Run

### Ejemplo: Despliegue en Railway

1. Crear cuenta en https://railway.app
2. Crear nuevo proyecto desde GitHub
3. Agregar PostgreSQL addon
4. Configurar variables de entorno en Railway
5. Deploy automático desde GitHub

### Variables de Entorno en Producción

Asegúrate de configurar TODAS las variables del archivo `.env.example` en tu plataforma de hosting.

## 🔒 Seguridad

- ✅ Las contraseñas de admin no se almacenan en la base de datos
- ✅ Tokens únicos para cada acción (confirmación/cancelación)
- ✅ Validación de emails
- ✅ CORS configurado
- ✅ Rate limiting recomendado para producción
- ⚠️ No incluir `.env` en el repositorio
- ⚠️ Usar HTTPS en producción
- ⚠️ Cambiar `ADMIN_PASSWORD` en producción

## 🛠️ Desarrollo

### Estructura de la API

```javascript
// Registrar asistente
POST /api/register
Body: { firstName, lastName, email }

// Obtener asistentes (admin)
GET /api/attendees?password=xxx

// Confirmar asistencia
GET /api/confirm/:token

// Cancelar asistencia
GET /api/cancel/:token

// Obtener wallet pass
GET /api/wallet/:id

// Enviar recordatorios (admin)
POST /api/send-reminders
Headers: { X-Admin-Password: xxx }
```

### Agregar Nuevos Campos

1. Actualizar schema en `backend/database.js`
2. Agregar campos al formulario en `frontend/index.html`
3. Actualizar validación en `backend/routes/api.js`
4. Actualizar emails en `backend/services/email.js`

## 📝 Licencia

MIT License - Úsalo libremente para tus eventos

## 🤝 Contribuir

Las contribuciones son bienvenidas. Por favor:
1. Fork el proyecto
2. Crea una rama para tu feature
3. Commit tus cambios
4. Push a la rama
5. Abre un Pull Request

## 📞 Soporte

Para problemas o preguntas, abre un issue en el repositorio.

## ✨ Roadmap

- [ ] Autenticación con OAuth para admin
- [ ] Múltiples eventos en la misma instancia
- [ ] Capacidad máxima de asistentes
- [ ] Lista de espera
- [ ] Personalización de emails con templates
- [ ] Integración con servicios de calendario
- [ ] Escaneo de QR codes para check-in
- [ ] Aplicación móvil nativa
- [ ] Integración con plataformas de pago
- [ ] Multi-idioma

## 🙏 Agradecimientos

Construido con:
- Express.js
- SQLite3
- Nodemailer
- QRCode
- Node-cron

---

Hecho con ❤️ para la comunidad de eventos
