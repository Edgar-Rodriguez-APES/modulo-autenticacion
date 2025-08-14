# Technology Stack & Build System

## Core Technologies

### Frontend Framework
- **React 18** with **Vite** as build tool
- **JavaScript/JSX** (no TypeScript)
- **ES Modules** (`"type": "module"` in package.json)

### Styling & UI
- **Tailwind CSS** with custom design system
- **Headless UI** for accessible components
- **Heroicons** for iconography
- **@tailwindcss/forms** and **@tailwindcss/typography** plugins
- **Inter font** from Google Fonts

### State Management & Data
- **Context API** with `useReducer` for global state
- **React Query (@tanstack/react-query)** for server state and caching
- **React Hook Form** for form handling
- **Zod** for validation schemas

### Routing & Navigation
- **React Router v6** for client-side routing
- **BrowserRouter** configuration

### HTTP & API
- **Axios** for HTTP requests with interceptors
- Custom API client with automatic token refresh
- Error handling utilities for consistent API responses

### Internationalization
- **React i18next** for translations
- **i18next-browser-languagedetector** for language detection
- Support for Spanish (default), English, and Portuguese

### Utilities
- **clsx** for conditional CSS classes
- **date-fns** for date manipulation

### Development Tools
- **ESLint** for code linting
- **Prettier** for code formatting
- **PostCSS** with **Autoprefixer**

## Build System & Commands

### Development
```bash
npm run dev          # Start development server (Vite)
```

### Production
```bash
npm run build        # Build for production
npm run preview      # Preview production build locally
```

### Deployment
```bash
npm run deploy       # Deploy to AWS Amplify
```

## Configuration Files

### Vite Configuration
- Path aliases configured (`@`, `@components`, `@pages`, etc.)
- Manual chunk splitting for vendor libraries
- Source maps enabled for production

### Tailwind Configuration
- Custom color palette with primary, secondary, success, danger variants
- Custom animations (fade-in, slide-up, pulse-slow)
- Inter font family configuration

## Environment Variables
- Use `.env` file (copy from `.env.example`)
- Vite environment variables prefixed with `VITE_`
- API base URL: `VITE_API_BASE_URL`

## Deployment Platform
- **AWS Amplify** for hosting and CI/CD
- Automatic deployments from git repository