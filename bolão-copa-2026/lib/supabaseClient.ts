import { createClient } from '@supabase/supabase-js';

// Substitua pelas suas credenciais do Supabase
// Você pode encontrar essas informações em Project Settings > API
const SUPABASE_URL = 'https://jmditehkalveqvdajnio.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImptZGl0ZWhrYWx2ZXF2ZGFqbmlvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU3OTU3MjksImV4cCI6MjA4MTM3MTcyOX0.TZLDc8nG949eLiAAOYslNsyBcaHtrN3vB6QknfDOf0s';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// --- INSTRUÇÕES OBRIGATÓRIAS PARA O BANCO DE DADOS (SQL EDITOR) ---
// Copie e execute TUDO abaixo no SQL Editor do Supabase para corrigir os erros de tabela e permissão.

/*
-- 1. Limpeza (Opcional - remove tabelas antigas se existirem para recriar do zero)
-- drop trigger if exists on_auth_user_created on auth.users;
-- drop function if exists public.handle_new_user;
-- drop table if exists public.bets;
-- drop table if exists public.extra_bets;
-- drop table if exists public.matches;
-- drop table if exists public.profiles;

-- 2. Tabela de Perfis
create table if not exists public.profiles (
  id uuid references auth.users on delete cascade not null primary key,
  username text unique not null,
  name text not null,
  email text,
  phone text,
  role text default 'user',
  paid boolean default false,
  avatar text,
  updated_at timestamptz default now()
);

alter table public.profiles enable row level security;
create policy "Perfis públicos são visíveis por todos" on public.profiles for select using (true);
create policy "Usuários podem atualizar seu próprio perfil" on public.profiles for update using (auth.uid() = id);
create policy "Usuários podem inserir seu próprio perfil" on public.profiles for insert with check (auth.uid() = id);

-- !!! IMPORTANTE: Permissão para Admin atualizar outros usuários (Aprovar Pagamento) !!!
create policy "Admins podem atualizar todos os perfis" on public.profiles for update using (
  exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
);

-- 3. Tabela de Jogos
create table if not exists public.matches (
  id text primary key,
  team_a text not null,
  team_b text not null,
  date_time text not null,
  group_name text not null,
  location text,
  official_score_a int,
  official_score_b int,
  is_brazil boolean default false
);

alter table public.matches enable row level security;
create policy "Jogos são visíveis por todos" on public.matches for select using (true);
create policy "Admins podem inserir jogos" on public.matches for insert with check (exists (select 1 from public.profiles where id = auth.uid() and role = 'admin'));
create policy "Admins podem atualizar jogos" on public.matches for update using (exists (select 1 from public.profiles where id = auth.uid() and role = 'admin'));

-- 4. Tabela de Apostas
create table if not exists public.bets (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users not null,
  match_id text references public.matches(id) not null,
  score_a int not null,
  score_b int not null,
  created_at timestamptz default now(),
  unique(user_id, match_id)
);

alter table public.bets enable row level security;
create policy "Apostas são visíveis por todos" on public.bets for select using (true);
create policy "Usuários podem inserir suas apostas" on public.bets for insert with check (auth.uid() = user_id);
create policy "Usuários podem atualizar suas apostas" on public.bets for update using (auth.uid() = user_id);

-- 5. Tabela de Apostas Extras
create table if not exists public.extra_bets (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users not null,
  slug text not null,
  value text,
  created_at timestamptz default now(),
  unique(user_id, slug)
);

alter table public.extra_bets enable row level security;
create policy "Apostas extras são visíveis por todos" on public.extra_bets for select using (true);
create policy "Usuários podem inserir suas apostas extras" on public.extra_bets for insert with check (auth.uid() = user_id);
create policy "Usuários podem atualizar suas apostas extras" on public.extra_bets for update using (auth.uid() = user_id);

-- 6. AUTOMATIZAÇÃO (TRIGGER) - CRUCIAL PARA EVITAR ERROS DE CADASTRO
-- Esta função cria o perfil automaticamente assim que o usuário é criado no Auth
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, email, username, name, role, paid)
  values (
    new.id,
    new.email,
    new.raw_user_meta_data ->> 'username',
    new.raw_user_meta_data ->> 'name',
    'user',
    false
  );
  return new;
end;
$$;

-- Remove o trigger antigo se existir para evitar duplicação
drop trigger if exists on_auth_user_created on auth.users;

-- Cria o trigger
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

export type DatabaseMatch = {
  id: string;
  team_a: string;
  team_b: string;
  date_time: string;
  group_name: string;
  location: string;
  official_score_a: number | null;
  official_score_b: number | null;
  is_brazil: boolean;
};
