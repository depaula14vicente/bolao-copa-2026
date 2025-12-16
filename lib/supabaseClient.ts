import { createClient } from '@supabase/supabase-js';

// Substitua pelas suas credenciais do Supabase
// Você pode encontrar essas informações em Project Settings > API
const SUPABASE_URL = 'https://jmditehkalveqvdajnio.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImptZGl0ZWhrYWx2ZXF2ZGFqbmlvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU3OTU3MjksImV4cCI6MjA4MTM3MTcyOX0.TZLDc8nG949eLiAAOYslNsyBcaHtrN3vB6QknfDOf0s';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// --- SQL OBRIGATÓRIO (RODE NO SUPABASE SQL EDITOR) ---
// Use este script para corrigir as tabelas e permissões.
// Ele remove políticas antigas antes de criar novas para evitar erros.

/*
-- 1. TABELAS (Cria se não existirem)
create table if not exists public.profiles (
  id uuid references auth.users on delete cascade not null primary key,
  email text,
  username text unique,
  name text,
  phone text,
  avatar text,
  role text default 'user',
  paid boolean default false,
  created_at timestamptz default now()
);

create table if not exists public.matches (
  id text primary key,
  team_a text not null,
  team_b text not null,
  date_time text,
  group_name text,
  location text,
  is_brazil boolean default false,
  official_score_a int,
  official_score_b int,
  created_at timestamptz default now()
);

create table if not exists public.bets (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users not null,
  match_id text references public.matches(id),
  score_a int not null,
  score_b int not null,
  created_at timestamptz default now(),
  unique(user_id, match_id)
);

-- 2. RECRIAR TABELA DE APOSTAS EXTRAS (Garante estrutura correta)
drop table if exists public.extra_bets cascade;
create table public.extra_bets (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users not null,
  slug text not null,
  value text,
  created_at timestamptz default now(),
  unique(user_id, slug)
);

-- 3. HABILITAR RLS
alter table public.profiles enable row level security;
alter table public.matches enable row level security;
alter table public.bets enable row level security;
alter table public.extra_bets enable row level security;

-- 4. POLÍTICAS DE SEGURANÇA (Primeiro DROP, depois CREATE)

-- Profiles
drop policy if exists "Public profiles are viewable by everyone" on public.profiles;
create policy "Public profiles are viewable by everyone" on public.profiles for select using (true);

drop policy if exists "Users can update own profile" on public.profiles;
create policy "Users can update own profile" on public.profiles for update using (auth.uid() = id);

drop policy if exists "Users can insert own profile" on public.profiles;
create policy "Users can insert own profile" on public.profiles for insert with check (auth.uid() = id);

drop policy if exists "Admins can update everything" on public.profiles;
create policy "Admins can update everything" on public.profiles for update using (exists (select 1 from public.profiles where id = auth.uid() and role = 'admin'));

-- Matches
drop policy if exists "Matches are viewable by everyone" on public.matches;
create policy "Matches are viewable by everyone" on public.matches for select using (true);

drop policy if exists "Authenticated users can insert matches" on public.matches;
create policy "Authenticated users can insert matches" on public.matches for insert with check (auth.role() = 'authenticated');

drop policy if exists "Authenticated users can update matches" on public.matches;
create policy "Authenticated users can update matches" on public.matches for update using (auth.role() = 'authenticated');

-- Bets
drop policy if exists "Bets are viewable by everyone" on public.bets;
create policy "Bets are viewable by everyone" on public.bets for select using (true);

drop policy if exists "Users can manage own bets" on public.bets;
create policy "Users can manage own bets" on public.bets for all using (auth.uid() = user_id);

-- Extra Bets
drop policy if exists "Everyone can view extra bets" on public.extra_bets;
create policy "Everyone can view extra bets" on public.extra_bets for select using (true);

drop policy if exists "Users can manage their own extra bets" on public.extra_bets;
create policy "Users can manage their own extra bets" on public.extra_bets for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- 5. TRIGGER (Cadastro Automático)
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, username, name, role, paid)
  values (
    new.id, 
    new.email, 
    new.raw_user_meta_data->>'username', 
    new.raw_user_meta_data->>'name', 
    'user',
    false
  )
  on conflict (id) do nothing;
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
*/

export type DatabaseBet = {
  id: string;
  user_id: string;
  match_id: string;
  score_a: number;
  score_b: number;
  created_at: string;
};