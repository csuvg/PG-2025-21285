# Plataforma Web Inteligente para la Gestión y Optimización de Orientación Vocacional

![Version](https://img.shields.io/badge/version-1.0.0-blue)
![License](https://img.shields.io/badge/license-ISC-green)
![Node](https://img.shields.io/badge/node-v18+-brightgreen)

## 📋 Descripción

**MiraiWeb** es una plataforma web inteligente diseñada para revolucionar la orientación vocacional mediante tecnología de IA. La plataforma facilita la gestión integral del proceso de orientación, permitiendo que administrativos, directores y docentes tomen decisiones informadas basadas en análisis profundos y recomendaciones personalizadas.

### Problema que Resuelve
- ❌ Falta de herramientas modernas para orientación vocacional
- ❌ Decisiones vocacionales basadas en información limitada
- ❌ Dificultad en monitorear el progreso de estudiantes
- ❌ Ausencia de análisis predictivos en la elección de carrera

### Soluciones Implementadas
- ✅ Análisis inteligente con IA (Google Gemini)
- ✅ Dashboard personalizado por rol (Admin, Director, Docente)
- ✅ Recomendaciones vocacionales basadas en aptitudes
- ✅ Sistema de foros para intercambio de experiencias
- ✅ Testimonios de egresados
- ✅ Generación de reportes en PDF
- ✅ Chat inteligente por rol
- ✅ Información sobre carreras disponibles

## 🚀 Características Principales

### Para Administradores
- Dashboard global con analíticas completas
- Gestión de usuarios y roles
- Monitoreo de toda la plataforma
- Chat administrativo con IA
- Acceso a todos los datos del sistema

### Para Directores
- Dashboard con analíticas de instituciones
- Visualización de tendencias vocacionales
- Chat especializado para directores
- Reportes de orientación
- Seguimiento de estudiantes

### Para Docentes
- Acceso a analíticas por grupo
- Identificación de estudiantes con dudas vocacionales
- Chat de orientación docente
- Gestión de ideas de proyectos
- Interacción con estudiantes


## 🛠️ Tecnologías Utilizadas

### Backend
- **Node.js** - Runtime de JavaScript
- **Express** - Framework web minimalista
- **Google Gemini API** - IA para análisis y recomendaciones
- **CORS** - Manejo de cross-origin requests
- **dotenv** - Gestión de variables de entorno
- **Axios** - Cliente HTTP

### Frontend
- **React** - Librería UI
- **TypeScript** - Lenguaje tipado
- **Vite** - Bundler rápido
- **Tailwind CSS** - Framework CSS
- **Mantine** - Componentes UI avanzados
- **Recharts** - Visualización de datos
- **Clerk** - Autenticación y gestión de usuarios
- **React Query** - Gestión de estado asincrónico
- **React Router** - Enrutamiento

## 📋 Requisitos Previos

Antes de instalar el proyecto, asegúrate de tener:

- **Node.js** v18 o superior
- **npm** v10+ o **yarn** v4+
- **Git** instalado
- **Clave API de Google Gemini** (obtén la en [Google AI Studio](https://aistudio.google.com/app/apikey))

## 📦 Instalación

### 1. Clonar el Repositorio

```bash
git clone https://github.com/GarciaAlegria/PG-2025-21285.git
cd PG-2025-21285
```

### 2. Configurar Backend

```bash
cd src/Backend_MiraiWeb

# Instalar dependencias
npm install

# Copiar archivo de configuración
cp .env.example .env

# Editar .env con tus credenciales
# Necesitas añadir:
# - GEMINI_API_KEY=tu_clave_api_aqui
# - PORT=4000 (opcional, por defecto es 4000)
```

**Variables de entorno para Backend (.env):**
```
GEMINI_API_KEY=tu_clave_api_de_google_gemini
PORT=4000
```

### 3. Configurar Frontend

```bash
cd ../Frontend_MiraiWeb

# Instalar dependencias
npm install

# Crear archivo de configuración (si es necesario)
# cp .env.example .env
```

## 🚀 Ejecución

### Iniciar Backend

```bash
cd src/Backend_MiraiWeb
yarn dev
```

El backend estará disponible en `http://localhost:4000`

### Iniciar Frontend

En otra terminal:

```bash
cd src/Frontend_MiraiWeb
npm run dev
```

El frontend estará disponible en `http://localhost:5173` (Vite por defecto)

### Ejecución Simultánea (Recomendado)

Abre dos terminales y ejecuta en cada una:

**Terminal 1 - Backend:**
```bash
cd src/Backend_MiraiWeb
yarn dev
```

**Terminal 2 - Frontend:**
```bash
cd src/Frontend_MiraiWeb
npm run dev
```

## 🏗️ Estructura del Proyecto

```
PG-2025-21285/
├── src/
│   ├── Backend_MiraiWeb/
│   │   ├── src/
│   │   │   ├── index.js                 # Punto de entrada
│   │   │   ├── controllers/             # Lógica de negocios
│   │   │   │   ├── analiticts.controller.js
│   │   │   │   ├── chatadmin.controller.js
│   │   │   │   ├── ideas.controller.js
│   │   │   │   └── ...
│   │   │   └── routes/                  # Definición de rutas
│   │   │       ├── analitics.routes.js
│   │   │       ├── chatadmin.routes.js
│   │   │       └── ...
│   │   ├── package.json
│   │   └── .env.example
│   │
│   └── Frontend_MiraiWeb/
│       ├── src/
│       │   ├── App.tsx
│       │   ├── main.tsx
│       │   ├── pages/                   # Páginas principales
│       │   │   ├── analiticas/
│       │   │   ├── login/
│       │   │   ├── register/
│       │   │   └── ...
│       │   ├── hooks/                   # Hooks personalizados
│       │   ├── routes/
│       │   └── utils/
│       ├── package.json
│       ├── vite.config.ts
│       └── tailwind.config.ts
├── docs/
│   └── informe_final.pdf               # Informe del proyecto
├── demo/
│   └── demo.mp4
└── README.md
```

## 📡 Endpoints Principales del Backend

### Analíticas
- `GET /api/analytics` - Obtener analíticas generales
- `GET /api/analytics/director` - Analíticas por director
- `GET /api/analytics/docente` - Analíticas por docente

### Chat
- `POST /api/chat/admin` - Chat para administradores
- `POST /api/chat/director` - Chat para directores
- `POST /api/chat/docente` - Chat para docentes

### Ideas
- `GET /api/ideas` - Listar ideas
- `POST /api/ideas` - Crear idea
- `GET /api/ideas/:id` - Obtener idea por ID

### Orientación Vocacional
- `GET /api/vocational` - Información vocacional
- `POST /api/insights` - Obtener insights vocacionales

## 🔐 Variables de Entorno

### Backend (.env)
```env
# API de Google Gemini (Requerido)
GEMINI_API_KEY=tu_clave_api_aqui

# Puerto del servidor (Opcional)
PORT=4000

# URL del Frontend (Opcional)
FRONTEND_URL=http://localhost:5173
```

Para obtener la clave API de Google Gemini:
1. Ve a [Google AI Studio](https://aistudio.google.com/app/apikey)
2. Inicia sesión con tu cuenta Google
3. Haz clic en "Create API Key"
4. Copia la clave generada
5. Pégala en tu archivo `.env`

## 📚 Uso de la Plataforma

### Flujo de Administrador
1. Iniciar sesión
2. Acceder a dashboard de analíticas
3. Ver tendencias de estudiantes
4. Usar chat inteligente para orientación
5. Generar reportes
6. Enviar insights a estudiantes
7. Foros, testimonios y gestion vocacional acceso completo

### Flujo de Docente
1. Iniciar sesión
2. Acceder a dashboard de analíticas
3. Ver tendencias de estudiantes
4. Usar chat inteligente para orientación
5. Generar reportes
6. Enviar insights a estudiantes

### Flujo de Director
1. Iniciar sesión
2. Ver analíticas de la institución
3. Monitorear tendencias vocacionales
4. Acceder a reportes detallados
5. Usar chat para consultas

## 🐛 Solución de Problemas

### El backend no inicia
```bash
# Verificar que Node.js está instalado
node --version

# Verificar dependencias
npm install

# Verificar variables de entorno
cat .env
```

### Error: "GEMINI_API_KEY no está configurada"
- Asegúrate de copiar `.env.example` a `.env`
- Verifica que la clave API esté configurada correctamente
- Obtén una nueva clave en [Google AI Studio](https://aistudio.google.com/app/apikey)

### El frontend no conecta al backend
- Verifica que el backend está ejecutándose en `http://localhost:4000`
- Comprueba la configuración de CORS
- Abre la consola del navegador para ver errores específicos

### Error de CORS
Asegúrate de que el backend tiene CORS habilitado correctamente en `index.js`

## 📊 Comandos Disponibles

### Backend
```bash
yarn dev     # Iniciar servidor en modo desarrollo
```

### Frontend
```bash
npm run dev      # Iniciar servidor Vite
npm run build    # Compilar para producción
```

## 🔄 Flujo de Trabajo

```
Docente y Director
    ↓
Registrarse/Login (Clerk Auth)
    ↓
Completar Orientación Vocacional
    ↓
Sistema IA (Gemini) analiza
    ↓
Recomendaciones Personalizadas
    ↓
Dashboard + Chat + Recursos
```

## 👥 Roles y Permisos

| Rol | Analíticas | Chat | Gestión | Reportes |
|-----|-----------|------|---------|----------|
| Admin | ✅ Global | ✅ Sí | ✅ Sí | ✅ Sí |
| Director | ✅ Institución | ✅ Sí | ✅ Limitados | ✅ Sí |
| Docente | ✅ Grupo | ✅ Sí | ✅ Limitados | ✅ Limitados |

## 📝 Documentación Adicional

- 📄 **Informe Final**: Ver `docs/informe_final.pdf`
- 🎨 **Mockups**: Ver `demo/demo.mp4`
- 💻 **API Documentation**: README.md

## 📧 Contacto y Soporte

**Proyecto de Graduación - 2025**
- **Carnet**: 21285
- **Autor**: García Alegría
- **Repositorio**: [GitHub - PG-2025-21285](https://github.com/GarciaAlegria/PG-2025-21285)


## 🙏 Agradecimientos

- Google por la API de Gemini
- Mantine por los componentes UI
- React y la comunidad del desarrollo web
- Equipo de apoyo en el proceso de graduación

---

**Última actualización**: Noviembre 2025

*Nota: Este proyecto fue desarrollado como trabajo de graduación y utiliza la API gratuita de Google Gemini. Para producción, considera las limitaciones y costos de la API.*
