-- ═══════════════════════════════════════════
--  DinoDeutsch — Memory System Schema
--  Chạy file này trong Supabase SQL Editor
-- ═══════════════════════════════════════════

-- 1. Bộ nhớ học viên (1 row per user)
create table if not exists user_memory (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid references auth.users(id) on delete cascade,
  level        text default 'A1',
  xp           int  default 0,
  learned_words int default 0,
  weak_topics  text[] default '{}',    -- vd: ['Dativ','Perfekt','Artikel']
  strong_topics text[] default '{}',   -- vd: ['Zahlen','Begrüßung']
  common_errors text[] default '{}',   -- vd: ['nhầm sein/haben','quên Artikel']
  notes        text default '',        -- ghi chú tự do của bot
  last_seen    timestamptz default now(),
  created_at   timestamptz default now(),
  unique(user_id)
);

-- 2. Lịch sử chat (lưu để load lại phiên trước)
create table if not exists chat_messages (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid references auth.users(id) on delete cascade,
  role       text check (role in ('user','assistant')),
  content    text not null,
  topic      text,
  xp_gained  int default 0,
  created_at timestamptz default now()
);
create index if not exists chat_messages_user_idx on chat_messages(user_id, created_at desc);

-- 3. Log lỗi để phân tích (tùy chọn)
create table if not exists error_log (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid references auth.users(id) on delete cascade,
  error_type text,
  detail     text,
  fixed      boolean default false,
  created_at timestamptz default now()
);

-- ── RLS (Row Level Security) ──
alter table user_memory   enable row level security;
alter table chat_messages enable row level security;
alter table error_log     enable row level security;

-- Mỗi user chỉ đọc/ghi data của mình
create policy "own memory"   on user_memory   for all using (auth.uid() = user_id);
create policy "own messages" on chat_messages for all using (auth.uid() = user_id);
create policy "own errors"   on error_log     for all using (auth.uid() = user_id);

-- ── Helper function: upsert memory ──
create or replace function upsert_memory(
  p_user_id      uuid,
  p_xp_add       int default 0,
  p_weak         text[] default null,
  p_strong       text[] default null,
  p_errors       text[] default null,
  p_notes        text   default null,
  p_level        text   default null,
  p_words_add    int    default 0
) returns void language plpgsql as $$
begin
  insert into user_memory (user_id, xp, weak_topics, strong_topics, common_errors, notes, level, learned_words)
  values (p_user_id, p_xp_add, coalesce(p_weak,'{}'), coalesce(p_strong,'{}'), coalesce(p_errors,'{}'), coalesce(p_notes,''), coalesce(p_level,'A1'), p_words_add)
  on conflict (user_id) do update set
    xp            = user_memory.xp + p_xp_add,
    learned_words = user_memory.learned_words + p_words_add,
    weak_topics   = case when p_weak   is not null then p_weak   else user_memory.weak_topics   end,
    strong_topics = case when p_strong is not null then p_strong else user_memory.strong_topics end,
    common_errors = case when p_errors is not null then p_errors else user_memory.common_errors end,
    notes         = case when p_notes  is not null then p_notes  else user_memory.notes         end,
    level         = case when p_level  is not null then p_level  else user_memory.level         end,
    last_seen     = now();
end;
$$;
