# CLAUDE.md — AI Assistant Guide for stash-to-project

## Project Overview

**stash-to-project** is a crochet assistant web app (Spanish UI) that uses the Anthropic Claude API to help users manage their yarn inventory (*stash*), receive AI-powered project suggestions, and generate full crochet patterns with streaming output. It is a Next.js 14 App Router application backed by Supabase (PostgreSQL + Auth).

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 14 (App Router) |
| UI | React 18, inline CSS-in-JS, CSS variables |
| Database | Supabase (PostgreSQL with RLS) |
| Auth | Supabase OAuth2 (Google + GitHub) |
| AI | Anthropic Claude API (`claude-sonnet-4-20250514`) |
| PWA | Service Worker (`public/sw.js`) + `manifest.json` |
| Package manager | npm |

---

## Repository Structure

```
stash-to-project/
├── app/                          # Next.js App Router
│   ├── api/                      # Server-side API routes (API key lives here)
│   │   ├── analyze-stash/route.js      # POST — Claude stash analysis
│   │   ├── generate-pattern/route.js   # POST — streaming pattern generation (SSE)
│   │   └── generate-pattern-full/route.js  # POST — non-streaming (mobile compat)
│   ├── stash/page.jsx            # /stash route
│   ├── patrones/page.jsx         # /patrones route
│   ├── perfiles/page.jsx         # /perfiles route
│   ├── layout.jsx                # Root layout (Nav + main)
│   ├── page.jsx                  # Landing / login page
│   └── globals.css               # CSS custom properties (design tokens)
├── components/                   # Reusable React components
│   ├── Nav.jsx                   # Top navigation bar
│   ├── StashToProject.jsx        # Yarn inventory + Claude project suggestions (~620 lines)
│   ├── PatternGenerator.jsx      # Pattern generation with streaming (~890 lines)
│   ├── SizeProfiles.jsx          # CRUD for body measurement profiles
│   └── PATCH_NOTES.md            # Internal dev notes
├── lib/
│   ├── supabase.js               # Supabase singleton client
│   ├── claudePrompts.js          # All Claude prompt builders (centralized)
│   └── profileUtils.js           # Measurement helpers + field definitions
├── sql/
│   └── 001_initial_schema.sql    # Full DB schema with RLS policies
├── public/
│   ├── manifest.json             # PWA manifest
│   └── sw.js                     # Service worker (cache-first strategy)
├── scripts/
│   └── generate-icons.js         # Generates PWA icons from SVG via sharp
├── next.config.js                # Image domain allowlist
├── jsconfig.json                 # Path alias: @/* → project root
├── package.json
└── .env.local.example            # Required environment variables
```

---

## Environment Variables

Create `.env.local` from `.env.local.example`:

```env
NEXT_PUBLIC_SUPABASE_URL=       # Supabase project URL (safe to expose)
NEXT_PUBLIC_SUPABASE_ANON_KEY=  # Supabase anon key (safe to expose)
ANTHROPIC_API_KEY=              # NEVER prefix with NEXT_PUBLIC_ — server-side only
```

> **Security rule**: `ANTHROPIC_API_KEY` must never be exposed to the client. It is only used inside `app/api/` route handlers.

---

## Development Workflow

```bash
npm install          # Install dependencies
npm run dev          # Start dev server at http://localhost:3000
npm run build        # Production build
npm start            # Serve production build
npm run lint         # ESLint check
```

---

## Database Schema (Supabase)

Run `sql/001_initial_schema.sql` against your Supabase project to create all tables. Row Level Security (RLS) is enabled on every table — users can only access rows where `user_id = auth.uid()`.

| Table | Key Columns | Purpose |
|-------|------------|---------|
| `yarns` | id, user_id, name, weight, fiber, color_name, color_hex, meters, skeins | Yarn inventory |
| `saved_projects` | id, user_id, emoji, name, description, difficulty, yarns_needed (JSONB), stitches (JSONB) | Saved AI project suggestions |
| `size_profiles` | id, user_id, name, relation, avatar_emoji, measurements (numeric), size_standard, notes | Body measurement profiles |
| `saved_patterns` | id, user_id, title, garment, skill_level, yarn_weight, hook_size, style, content (markdown) | Archived generated patterns |

**DB conventions:**
- Always query with `.select("*")` before chaining `.eq()` filters.
- Order results by `created_at` for consistency.
- `size_profiles.updated_at` is auto-updated via a trigger.

---

## AI Integration

### Claude API Usage

All Claude calls use `claude-sonnet-4-20250514`. The two prompt builders live in `lib/claudePrompts.js`:

- **`buildStashAnalysisPrompt(yarns, skillLevel)`** — returns a prompt that asks Claude to suggest 4 crochet projects from the yarn inventory. Response must be valid JSON (array of project objects).
- **`buildPatternPrompt(options)`** — returns a prompt for a complete crochet pattern in markdown. Used with streaming.

### API Routes

| Route | Method | Streaming | Description |
|-------|--------|-----------|-------------|
| `/api/analyze-stash` | POST | No | Analyzes yarn stash, returns `{ projects: [...] }` |
| `/api/generate-pattern` | POST | Yes (SSE) | Streams pattern markdown to client |
| `/api/generate-pattern-full` | POST | No | Full pattern as JSON (for React Native) |

**Pattern streaming** proxies the raw Anthropic SSE stream. The client reads it with `ReadableStream` / `getReader()`.

When modifying prompts: edit only `lib/claudePrompts.js` — do not hardcode prompts in route handlers or components.

---

## Naming Conventions

| Artifact | Convention | Example |
|----------|-----------|---------|
| Components | PascalCase | `StashToProject.jsx` |
| Functions / hooks | camelCase | `buildPatternPrompt` |
| Constants arrays | UPPER_SNAKE_CASE | `YARN_WEIGHTS`, `SKILL_LEVELS` |
| CSS custom properties | `--kebab-case` | `--rust`, `--paper` |
| DB table columns | `snake_case` | `color_hex`, `created_at` |
| Route files | Next.js convention | `app/api/analyze-stash/route.js` |

---

## Styling Conventions

- **No external CSS framework** — all styling is inline (JSX `style` prop) or in `<style>` tags appended at the bottom of component files.
- **Design tokens** are in `app/globals.css` as CSS custom properties:
  - `--rust` (#B85C38) — primary accent
  - `--ink` (#12100E) — text
  - `--paper` (#F7F3EC) — background
  - `--cream` (#EDE8DE) — surface
- **Typography**: Cormorant Garamond (serif) for headings, Outfit (sans-serif) for body.
- **Responsive breakpoints**: 480px (mobile) and 900px (tablet/desktop split).
- Do not introduce a CSS framework or Tailwind without discussion — consistency matters.

---

## Component Patterns

- Large components (`StashToProject`, `PatternGenerator`) define sub-components and helper functions inline at the top of the file. Keep this pattern.
- Auth state is detected via `supabase.auth.getSession()` + `onAuthStateChange()` in `useEffect`.
- No global state manager (Redux, Zustand, Context) — local `useState` only.
- Supabase client is imported from `lib/supabase.js` (singleton — never create a new client inline).

---

## Path Aliases

The `@/*` alias resolves to the project root (configured in `jsconfig.json`). Always use it for imports:

```js
// Correct
import { buildPatternPrompt } from '@/lib/claudePrompts'
import supabase from '@/lib/supabase'

// Avoid relative paths across directories
import supabase from '../../lib/supabase'
```

---

## PWA

- `public/manifest.json` — PWA metadata.
- `public/sw.js` — cache-first service worker registered by `app/layout.jsx`.
- `scripts/generate-icons.js` — run with `node scripts/generate-icons.js` to regenerate PWA icons (requires `sharp`).

---

## Authentication Flow

1. User clicks OAuth button on `/` (landing page).
2. Supabase redirects to Google/GitHub and back.
3. Session is stored by Supabase; components read it via `supabase.auth.getSession()`.
4. All protected components render an `AuthScreen` if no session is found.
5. Sign-out via `supabase.auth.signOut()` in `Nav.jsx`.

---

## Key Things to Avoid

- **Never** add `NEXT_PUBLIC_` prefix to `ANTHROPIC_API_KEY`.
- **Never** call the Anthropic API directly from client-side code; always route through `app/api/`.
- **Never** bypass RLS policies or query Supabase tables without `user_id` filtering.
- **Do not** add external CSS frameworks (Tailwind, MUI, etc.) without explicit approval.
- **Do not** create a new Supabase client — always use the singleton from `lib/supabase.js`.
- **Do not** hardcode prompts in route handlers; put them in `lib/claudePrompts.js`.

---

## Deployment

The project is designed for **Vercel**. Set the three environment variables in the Vercel dashboard (not the CLI). The `ANTHROPIC_API_KEY` must be a server-only environment variable (no `NEXT_PUBLIC_` prefix).

```bash
vercel deploy
```

---

## User-Facing Routes

| Path | Component | Description |
|------|-----------|-------------|
| `/` | `app/page.jsx` | Landing / OAuth login |
| `/stash` | `StashToProject` | Yarn inventory + AI project suggestions |
| `/patrones` | `PatternGenerator` | AI pattern generation with streaming |
| `/perfiles` | `SizeProfiles` | Body measurement profile manager |
