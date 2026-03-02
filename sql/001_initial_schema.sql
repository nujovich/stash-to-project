-- ============================================
-- MIGRATION 001 — Tablas base
-- Ejecutar en: Supabase Dashboard > SQL Editor
-- ============================================

-- Stash de hilos
create table public.yarns (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  name text,
  weight text not null,
  fiber text not null,
  color_name text not null,
  color_hex text not null,
  meters integer not null,
  skeins integer not null default 1,
  created_at timestamptz default now()
);

-- Proyectos favoritos (generados por Claude)
create table public.saved_projects (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  emoji text,
  name text not null,
  description text,
  difficulty text,
  estimated_time text,
  yarns_needed jsonb,
  stitches jsonb,
  tip text,
  created_at timestamptz default now()
);

-- Perfiles de talla
create table public.size_profiles (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  name text not null,
  relation text,
  avatar_emoji text default '🧍',
  chest numeric, waist numeric, hips numeric, head numeric,
  shoulder_width numeric, arm_length numeric, torso_length numeric,
  wrist numeric, foot_length numeric, height numeric,
  size_standard text, size_shoes text, size_hat text,
  notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Patrones guardados (generados por Claude)
create table public.saved_patterns (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  title text not null,
  garment text,
  skill_level text,
  yarn_weight text,
  hook_size text,
  style text,
  content text not null,   -- el patrón completo en markdown
  created_at timestamptz default now()
);

-- ============================================
-- Row Level Security (RLS)
-- ============================================

alter table public.yarns enable row level security;
alter table public.saved_projects enable row level security;
alter table public.size_profiles enable row level security;
alter table public.saved_patterns enable row level security;

-- yarns
create policy "own yarns select" on public.yarns for select using (auth.uid() = user_id);
create policy "own yarns insert" on public.yarns for insert with check (auth.uid() = user_id);
create policy "own yarns update" on public.yarns for update using (auth.uid() = user_id);
create policy "own yarns delete" on public.yarns for delete using (auth.uid() = user_id);

-- saved_projects
create policy "own projects select" on public.saved_projects for select using (auth.uid() = user_id);
create policy "own projects insert" on public.saved_projects for insert with check (auth.uid() = user_id);
create policy "own projects delete" on public.saved_projects for delete using (auth.uid() = user_id);

-- size_profiles
create policy "own profiles select" on public.size_profiles for select using (auth.uid() = user_id);
create policy "own profiles insert" on public.size_profiles for insert with check (auth.uid() = user_id);
create policy "own profiles update" on public.size_profiles for update using (auth.uid() = user_id);
create policy "own profiles delete" on public.size_profiles for delete using (auth.uid() = user_id);

-- saved_patterns
create policy "own patterns select" on public.saved_patterns for select using (auth.uid() = user_id);
create policy "own patterns insert" on public.saved_patterns for insert with check (auth.uid() = user_id);
create policy "own patterns delete" on public.saved_patterns for delete using (auth.uid() = user_id);

-- ============================================
-- Trigger updated_at para size_profiles
-- ============================================

create or replace function update_updated_at()
returns trigger as $$
begin new.updated_at = now(); return new; end;
$$ language plpgsql;

create trigger size_profiles_updated_at
  before update on public.size_profiles
  for each row execute function update_updated_at();
