-- ═══════════════════════════════════════════════════════════
-- LinguaMaster – Supabase Schema
-- გაუშვი Supabase Dashboard → SQL Editor-ში
-- ═══════════════════════════════════════════════════════════

-- ── Tables ──────────────────────────────────────────────────
create table public.profiles (
  id          uuid references auth.users(id) on delete cascade primary key,
  username    text unique not null,
  is_admin    boolean default false,
  current_lang text default 'english',
  sessions    int default 0,
  streak      int default 0,
  chat_correct int default 0,
  chat_total  int default 0,
  photo_url   text,
  created_at  timestamptz default now()
);

create table public.word_progress (
  user_id    uuid references auth.users(id) on delete cascade not null,
  word_id    text not null,
  lang       text not null,
  mastery    int default 0 check (mastery between 0 and 100),
  updated_at timestamptz default now(),
  primary key (user_id, word_id, lang)
);

create table public.chat_messages (
  id         uuid default gen_random_uuid() primary key,
  user_id    uuid references auth.users(id) on delete set null,
  username   text not null,
  text       text not null,
  is_bot     boolean default false,
  word_id    text,
  created_at timestamptz default now()
);

create table public.activity (
  user_id     uuid references auth.users(id) on delete cascade not null,
  day_of_week int not null check (day_of_week between 0 and 6),
  week_start  date not null,
  value       int default 0 check (value between 0 and 100),
  primary key (user_id, day_of_week, week_start)
);

-- ── Grammar: backend persistence ─────────────────────────────
-- The grammar content is rendered from the versioned curriculum data.
-- User state, progress, bookmarks, notes and practice statistics live in Supabase.

create table public.grammar_progress (
  user_id       uuid references auth.users(id) on delete cascade not null,
  lang          text not null,
  category      text not null,
  topic         text not null,
  status        text not null default 'new' check (status in ('new', 'learning', 'review', 'mastered')),
  mastery       int not null default 0 check (mastery between 0 and 100),
  times_viewed  int not null default 0 check (times_viewed >= 0),
  correct_count int not null default 0 check (correct_count >= 0),
  wrong_count   int not null default 0 check (wrong_count >= 0),
  last_seen_at  timestamptz,
  updated_at    timestamptz not null default now(),
  primary key (user_id, lang, category, topic)
);

create table public.grammar_bookmarks (
  user_id    uuid references auth.users(id) on delete cascade not null,
  lang       text not null,
  category   text not null,
  topic      text not null,
  created_at timestamptz not null default now(),
  primary key (user_id, lang, category, topic)
);

create table public.grammar_notes (
  id         uuid default gen_random_uuid() primary key,
  user_id    uuid references auth.users(id) on delete cascade not null,
  lang       text not null,
  category   text not null,
  topic      text not null,
  note       text not null,
  updated_at timestamptz not null default now(),
  unique (user_id, lang, category, topic)
);

create table public.grammar_sessions (
  id            uuid default gen_random_uuid() primary key,
  user_id       uuid references auth.users(id) on delete cascade not null,
  lang          text not null,
  category      text not null,
  topic         text not null,
  started_at    timestamptz not null default now(),
  completed_at  timestamptz,
  score         int check (score between 0 and 100),
  duration_sec  int check (duration_sec >= 0)
);

create index grammar_progress_user_lang_idx on public.grammar_progress(user_id, lang);
create index grammar_bookmarks_user_lang_idx on public.grammar_bookmarks(user_id, lang);
create index grammar_notes_user_lang_idx on public.grammar_notes(user_id, lang);
create index grammar_sessions_user_lang_idx on public.grammar_sessions(user_id, lang);

-- ── Row Level Security ────────────────────────────────────────
alter table public.profiles enable row level security;
alter table public.word_progress enable row level security;
alter table public.chat_messages enable row level security;
alter table public.activity enable row level security;
alter table public.grammar_progress enable row level security;
alter table public.grammar_bookmarks enable row level security;
alter table public.grammar_notes enable row level security;
alter table public.grammar_sessions enable row level security;

-- profiles: ყველა კითხულობს, owner-ი ცვლის
create policy "profiles_select" on public.profiles for select using (true);
create policy "profiles_insert" on public.profiles for insert with check (auth.uid() = id);
create policy "profiles_update" on public.profiles for update using (auth.uid() = id);

-- word_progress: მხოლოდ owner
create policy "wp_all" on public.word_progress for all using (auth.uid() = user_id);

-- chat: ყველა კითხულობს, authenticated წერს
create policy "chat_select" on public.chat_messages for select using (true);
create policy "chat_insert" on public.chat_messages for insert with check (auth.uid() is not null);
create policy "chat_delete_admin" on public.chat_messages for delete using (
  exists (select 1 from public.profiles where id = auth.uid() and is_admin = true)
);

-- activity: მხოლოდ owner
create policy "act_all" on public.activity for all using (auth.uid() = user_id);

-- grammar: მხოლოდ საკუთარი სასწავლო მონაცემები
create policy "grammar_progress_owner" on public.grammar_progress
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "grammar_bookmarks_owner" on public.grammar_bookmarks
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "grammar_notes_owner" on public.grammar_notes
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "grammar_sessions_owner" on public.grammar_sessions
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ── Trigger: პროფილი auto-create რეგისტრაციაზე ──────────────
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer as $$
declare
  uname text;
begin
  uname := coalesce(
    new.raw_user_meta_data->>'username',
    split_part(new.email, '@', 1)
  );
  insert into public.profiles (id, username, is_admin)
  values (new.id, uname, uname = 'admin')
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute procedure public.handle_new_user();

-- ── RPC: atomic counters ──────────────────────────────────────
create or replace function public.inc_session(uid uuid)
returns void language sql security definer as $$
  update public.profiles set sessions = sessions + 1 where id = uid;
$$;

create or replace function public.inc_chat(uid uuid, correct bool)
returns void language sql security definer as $$
  update public.profiles
  set
    chat_correct = chat_correct + (case when correct then 1 else 0 end),
    chat_total   = chat_total + 1
  where id = uid;
$$;

create or replace function public.inc_activity(uid uuid, dow int, wstart date)
returns void language sql security definer as $$
  insert into public.activity (user_id, day_of_week, week_start, value)
  values (uid, dow, wstart, 10)
  on conflict (user_id, day_of_week, week_start)
  do update set value = least(100, activity.value + 10);
$$;

-- ── Realtime for chat ─────────────────────────────────────────
alter publication supabase_realtime add table public.chat_messages;
