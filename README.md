# 🧶 Stash to Project

Aplicación de crochet con IA — gestiona tu stash, genera patrones personalizados y administra perfiles de talla.

## Stack

- **Next.js 14** (App Router)
- **Supabase** — base de datos, autenticación OAuth
- **Claude API** (Anthropic) — generación de patrones y análisis de stash

---

## Setup rápido

### 1. Instalar dependencias

```bash
npm install
```

### 2. Variables de entorno

```bash
cp .env.local.example .env.local
```

Edita `.env.local` con tus credenciales:

```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...
ANTHROPIC_API_KEY=sk-ant-api03-...
```

### 3. Base de datos en Supabase

1. Crea un proyecto en [supabase.com](https://supabase.com)
2. Ve a **SQL Editor** y ejecuta el contenido de `sql/001_initial_schema.sql`
3. Copia tu **Project URL** y **anon public key** desde Settings → API

### 4. OAuth (Google y GitHub)

#### Google
1. Ve a [console.cloud.google.com](https://console.cloud.google.com)
2. Crea proyecto → APIs & Services → Credentials → OAuth 2.0 Client ID
3. Authorized redirect URI: `https://<tu-proyecto>.supabase.co/auth/v1/callback`
4. En Supabase → Authentication → Providers → Google: pega Client ID y Secret

#### GitHub
1. Ve a GitHub → Settings → Developer Settings → OAuth Apps → New OAuth App
2. Authorization callback URL: `https://<tu-proyecto>.supabase.co/auth/v1/callback`
3. En Supabase → Authentication → Providers → GitHub: pega Client ID y Secret

### 5. Correr en desarrollo

```bash
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000)

---

## Estructura del proyecto

```
crochet-app/
├── app/
│   ├── layout.jsx              # Layout raíz con Nav
│   ├── globals.css             # Variables CSS y estilos globales
│   ├── page.jsx                # Landing / Login
│   ├── stash/
│   │   └── page.jsx            # Gestión del stash de hilos
│   ├── patrones/
│   │   └── page.jsx            # Generador de patrones con IA
│   ├── perfiles/
│   │   └── page.jsx            # Perfiles de talla
│   └── api/
│       ├── generate-pattern/
│       │   └── route.js        # Proxy seguro → Claude (streaming)
│       └── analyze-stash/
│           └── route.js        # Proxy seguro → Claude (JSON)
├── components/
│   ├── Nav.jsx                 # Navegación principal
│   ├── StashToProject.jsx      # Feature: gestión de hilos + análisis
│   ├── PatternGenerator.jsx    # Feature: generador de patrones
│   └── SizeProfiles.jsx        # Feature: perfiles de talla
├── lib/
│   ├── supabase.js             # Cliente Supabase singleton
│   ├── claudePrompts.js        # Todos los prompts centralizados
│   └── profileUtils.js         # Helpers para perfiles de talla
└── sql/
    └── 001_initial_schema.sql  # Migración inicial (ejecutar en Supabase)
```

---

## Features

| Feature | Descripción |
|---|---|
| 🧶 Mi Stash | Registra hilos con fibra, peso, color y cantidad |
| ✦ Sugerencias | Claude analiza tu stash y sugiere 4 proyectos posibles |
| ✦ Generador | Genera patrones completos paso a paso con streaming |
| 📐 Tallas | Perfiles de medidas reutilizables para ti y para otras personas |
| ♥ Favoritos | Guarda proyectos y patrones generados |

---

## Próximas funciones sugeridas

- [ ] Exportar patrón a PDF imprimible
- [ ] Compartir patrón vía link público
- [ ] Reconocimiento de imagen de hilos (foto → datos automáticos)
- [ ] Calculadora de conversiones de hilo

---

## Deploy en Vercel

```bash
# Instala Vercel CLI
npm i -g vercel

# Deploy
vercel

# Configura las env vars en vercel.com → Project → Settings → Environment Variables
```

Recuerda: `ANTHROPIC_API_KEY` va solo como variable de entorno del servidor (no `NEXT_PUBLIC_`).
