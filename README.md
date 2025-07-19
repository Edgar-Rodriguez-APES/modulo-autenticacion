# Technoagentes - Frontend

Plataforma multitenant de agentes AI para logística inteligente.

## 🚀 Tecnologías

- **React 18** + **Vite** - Framework y build tool
- **Tailwind CSS** - Styling ultraminimalista
- **React Router** - Navegación SPA
- **React Query** - Estado del servidor y cache
- **React i18next** - Internacionalización (ES/EN/PT)
- **Headless UI** - Componentes accesibles
- **AWS Amplify** - Hosting y deploy

## 📦 Instalación

```bash
# Instalar dependencias
npm install

# Configurar variables de entorno
cp .env.example .env

# Iniciar servidor de desarrollo
npm run dev
```

## 🏗️ Estructura del Proyecto

```
src/
├── components/          # Componentes reutilizables
│   ├── ui/             # Componentes UI base
│   └── layout/         # Componentes de layout
├── pages/              # Páginas principales
├── context/            # Contextos de React
├── hooks/              # Custom hooks
├── utils/              # Utilidades y helpers
├── i18n/               # Configuración de idiomas
└── assets/             # Assets estáticos
```

## 🌐 Funcionalidades

### ✅ Implementado (Fase 1)
- [x] Setup base del proyecto
- [x] Sistema de internacionalización (ES/EN/PT)
- [x] Componentes UI fundamentales
- [x] Landing page responsive
- [x] Sistema de autenticación (mock)
- [x] Dashboard principal
- [x] Interfaz de chat básica

### 🚧 En Desarrollo
- [ ] Registro multi-step
- [ ] Integración con backend real
- [ ] Sistema de pagos
- [ ] Gestión de usuarios
- [ ] Chat en tiempo real

## 🎨 Design System

### Colores
- **Primary**: Blue-600 (#2563eb)
- **Secondary**: Slate-500 (#64748b)
- **Success**: Emerald-600 (#059669)
- **Danger**: Red-600 (#dc2626)

### Tipografía
- **Font**: Inter (Google Fonts)
- **Scales**: text-sm, text-base, text-lg, text-xl, text-2xl, text-3xl

## 🚀 Scripts Disponibles

```bash
npm run dev          # Servidor de desarrollo
npm run build        # Build para producción
npm run preview      # Preview del build
npm run deploy       # Deploy a AWS Amplify
```

## 🌍 Idiomas Soportados

- 🇪🇸 **Español** (por defecto)
- 🇺🇸 **English**
- 🇧🇷 **Português**

## 📱 Responsive Design

- **Mobile**: 320px - 768px
- **Tablet**: 768px - 1024px
- **Desktop**: 1024px+

## 🔐 Autenticación

Sistema de autenticación con:
- Login/logout
- Registro multi-step
- Recuperación de contraseña
- Gestión de sesiones
- Permisos por rol (Master/Member)

## 🤖 Agentes AI

- **Feedo**: Gestión logística
- **Forecaster**: Predicciones y análisis

## 📊 Estado del Desarrollo

**Progreso actual**: Fase 1 completada (Días 1-2)
**Próximo**: Fase 2 - Landing page y autenticación avanzada

---

Desarrollado con ❤️ para optimizar la logística con IA