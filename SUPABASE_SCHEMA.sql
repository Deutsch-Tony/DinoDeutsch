create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text unique,
  full_name text,
  avatar_url text,
  provider text default 'email',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.user_vocab_state (
  user_id uuid not null references auth.users(id) on delete cascade,
  vocab_id text not null,
  level text not null,
  topic text not null,
  word text not null,
  favorite boolean not null default false,
  progress text not null default 'new' check (progress in ('new', 'learned', 'review')),
  updated_at timestamptz not null default now(),
  primary key (user_id, vocab_id)
);

alter table public.profiles enable row level security;
alter table public.user_vocab_state enable row level security;

drop policy if exists "profiles_select_own" on public.profiles;
create policy "profiles_select_own"
on public.profiles
for select
to authenticated
using (auth.uid() = id);

drop policy if exists "profiles_insert_own" on public.profiles;
create policy "profiles_insert_own"
on public.profiles
for insert
to authenticated
with check (auth.uid() = id);

drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own"
on public.profiles
for update
to authenticated
using (auth.uid() = id)
with check (auth.uid() = id);

drop policy if exists "vocab_state_select_own" on public.user_vocab_state;
create policy "vocab_state_select_own"
on public.user_vocab_state
for select
to authenticated
using (auth.uid() = user_id);

drop policy if exists "vocab_state_insert_own" on public.user_vocab_state;
create policy "vocab_state_insert_own"
on public.user_vocab_state
for insert
to authenticated
with check (auth.uid() = user_id);

drop policy if exists "vocab_state_update_own" on public.user_vocab_state;
create policy "vocab_state_update_own"
on public.user_vocab_state
for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create or replace function public.handle_profile_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists profiles_set_updated_at on public.profiles;
create trigger profiles_set_updated_at
before update on public.profiles
for each row
execute function public.handle_profile_updated_at();
