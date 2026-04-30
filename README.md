# MediConnect

Plataforma web para gestión de citas médicas dirigida a consultorios y médicos independientes.

---

## Estructura del proyecto

```
mediconnect/
├── backend/          # Node.js + Express + TypeScript (API REST)
└── frontend/         # Vite + React + TypeScript + SCSS
```

---

## Backend — Setup

### 1. Instalar dependencias
```bash
cd backend
npm install
```

### 2. Variables de entorno
```bash
cp .env.example .env
# Edita .env con tus credenciales
```

Variables requeridas:
| Variable | Descripción |
|---|---|
| `MONGODB_URI` | URI de MongoDB Atlas |
| `SESSION_SECRET` | Clave secreta para sesiones (min 32 chars) |
| `JWT_SECRET` | Clave para JWT |
| `GOOGLE_CLIENT_ID` | Google OAuth Client ID |
| `GOOGLE_CLIENT_SECRET` | Google OAuth Client Secret |
| `EMAIL_USER` | Correo Gmail para envíos |
| `EMAIL_PASS` | App password de Gmail |
| `STRIPE_SECRET_KEY` | Clave secreta de Stripe |
| `STRIPE_PRICE_ID` | ID del precio mensual en Stripe |
| `CLIENT_URL` | URL del frontend (e.g. http://localhost:5173) |

### 3. Ejecutar en desarrollo
```bash
npm run dev
```

La API corre en `http://localhost:5000`
Documentación Swagger: `http://localhost:5000/api/docs`

---

## Frontend — Setup

### 1. Instalar dependencias
```bash
cd frontend
npm install
```

### 2. Variables de entorno
```bash
cp .env.example .env
# .env ya tiene los valores por defecto para desarrollo local
```

### 3. Ejecutar en desarrollo
```bash
npm run dev
```

La app corre en `http://localhost:5173`

---

## Rutas de la app

| Ruta | Rol | Descripción |
|---|---|---|
| `/login` | Todos | Inicio de sesión |
| `/register` | Todos | Registro de cuenta |
| `/patient/dashboard` | Paciente | Panel principal |
| `/patient/doctors` | Paciente | Buscar doctores |
| `/patient/appointments` | Paciente | Mis citas |
| `/patient/records` | Paciente | Historial médico |
| `/patient/chat` | Paciente | Chat con doctores |
| `/doctor/dashboard` | Doctor | Panel principal |
| `/doctor/appointments` | Doctor | Gestión de citas |
| `/doctor/patients` | Doctor | Lista de pacientes |
| `/doctor/chat` | Doctor | Chat con pacientes |
| `/doctor/subscription` | Doctor | Suscripción Pro |
| `/admin/dashboard` | Admin | Panel de admin |

---

## API Endpoints principales

### Auth
```
POST   /api/auth/register
POST   /api/auth/login
POST   /api/auth/logout
GET    /api/auth/me
GET    /api/auth/google
GET    /api/auth/google/callback
```

### Doctors
```
GET    /api/doctors                 
GET    /api/doctors/:id
GET    /api/doctors/specializations   
PUT    /api/doctors/profile      
POST   /api/doctors/availability   
GET    /api/doctors/my-patients      
```

### Appointments
```
POST   /api/appointments      
GET    /api/appointments/my       
GET    /api/appointments/slots       
PATCH  /api/appointments/:id/status  
```

### Medical Records
```
POST   /api/records 
GET    /api/records/my                
GET    /api/records/patient/:patientId  
PUT    /api/records/:id                
```

### Chat
```
GET    /api/chat/conversations                        
POST   /api/chat/conversations                      
GET    /api/chat/conversations/:id/messages          
```

### Admin
```
GET    /api/admin/stats
GET    /api/admin/users
GET    /api/admin/doctors/pending
PATCH  /api/admin/doctors/:id/approve
PATCH  /api/admin/users/:id/toggle
```

### Payments
```
POST   /api/payments/checkout  
GET    /api/payments/status     
POST   /api/payments/webhook  
```

---

## WebSockets (Socket.IO)

| Evento | Dirección | Descripción |
|---|---|---|
| `join:user` | Client→Server | Unirse a sala personal |
| `join:conversation` | Client→Server | Unirse a sala de chat |
| `chat:send` | Client→Server | Enviar mensaje |
| `chat:message` | Server→Client | Nuevo mensaje |
| `appointment:new` | Server→Client | Nueva cita (doctor) |
| `appointment:statusUpdate` | Server→Client | Cambio de estado |
| `video:call-request` | Client→Server | Solicitar videollamada |
| `video:offer` | Client→Server | WebRTC offer |
| `video:answer` | Client→Server | WebRTC answer |
| `video:ice-candidate` | Client→Server | ICE candidate |
| `video:end` | Client→Server | Terminar llamada |

---

## Stack tecnológico

**Backend**
- Node.js + Express + TypeScript
- MongoDB Atlas + Mongoose
- Passport.js (Local + Google OAuth)
- Socket.IO (chat + WebRTC signaling)
- Nodemailer (correos transaccionales)
- Stripe (suscripciones)
- Multer (subida de archivos)
- Swagger (documentación)

**Frontend**
- Vite + React 18 + TypeScript
- SCSS Modules con design tokens
- React Router v6
- Zustand (estado global)
- Axios (cliente HTTP)
- Socket.IO Client
- React Hook Form + Zod
- date-fns + lucide-react
- react-hot-toast

---

## Deploy

### Backend
1. Crear Web Service en Render
2. Build command: `npm run build`
3. Start command: `npm start`
4. Agregar todas las variables de entorno

### Frontend
1. Crear Static Site en Vercel
2. Build command: `npm run build`
3. Publish directory: `dist`
4. Agregar: `VITE_API_URL=https://tu-api.onrender.com/api`

---

## Diseño

- **Tipografía:** Playfair Display (headings) + Source Sans 3 (body)
- **Color principal:** Deep Forest Green `#1a6b5c`
- **Acento:** Warm Amber `#e8a44a`
- **SCSS Modules** con tokens centralizados en `_variables.scss`
