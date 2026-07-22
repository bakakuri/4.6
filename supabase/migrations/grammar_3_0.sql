-- Grammar 3.0 migration. Run this file separately in Supabase SQL Editor.
-- Safe for an existing database. It adds missing columns instead of relying only on CREATE TABLE IF NOT EXISTS.
-- Do NOT rerun the full schema.sql on an existing database.

create table if not exists public.grammar_mistakes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  lang text not null,
  category text not null,
  topic text not null,
  exercise_id text not null,
  exercise_type text not null default 'multiple_choice',
  question text not null,
  user_answer text,
  correct_answer text not null,
  explanation text,
  mistake_count integer not null default 1,
  review_count integer not null default 0,
  next_review_at timestamptz not null default now(),
  last_answered_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(user_id, lang, topic, exercise_id)
);

-- Existing installations may already have grammar_mistakes without the newer columns.
-- CREATE TABLE IF NOT EXISTS does not modify an existing table, which is why the previous
-- migration could leave exercise_type missing. PostgreSQL, humanity's favorite paperwork system.
alter table public.grammar_mistakes add column if not exists exercise_type text;
alter table public.grammar_mistakes add column if not exists review_count integer;
alter table public.grammar_mistakes add column if not exists next_review_at timestamptz;
alter table public.grammar_mistakes add column if not exists last_answered_at timestamptz;
alter table public.grammar_mistakes add column if not exists created_at timestamptz;
alter table public.grammar_mistakes add column if not exists updated_at timestamptz;

update public.grammar_mistakes
set exercise_type = 'multiple_choice'
where exercise_type is null;

update public.grammar_mistakes
set review_count = 0
where review_count is null;

update public.grammar_mistakes
set next_review_at = now()
where next_review_at is null;

update public.grammar_mistakes
set last_answered_at = now()
where last_answered_at is null;

update public.grammar_mistakes
set created_at = now()
where created_at is null;

update public.grammar_mistakes
set updated_at = now()
where updated_at is null;

alter table public.grammar_mistakes alter column exercise_type set default 'multiple_choice';
alter table public.grammar_mistakes alter column review_count set default 0;
alter table public.grammar_mistakes alter column next_review_at set default now();
alter table public.grammar_mistakes alter column last_answered_at set default now();
alter table public.grammar_mistakes alter column created_at set default now();
alter table public.grammar_mistakes alter column updated_at set default now();

create index if not exists grammar_mistakes_due_idx on public.grammar_mistakes(user_id, lang, next_review_at);
alter table public.grammar_mistakes enable row level security;
drop policy if exists grammar_mistakes_select on public.grammar_mistakes;
drop policy if exists grammar_mistakes_insert on public.grammar_mistakes;
drop policy if exists grammar_mistakes_update on public.grammar_mistakes;
drop policy if exists grammar_mistakes_delete on public.grammar_mistakes;
create policy grammar_mistakes_select on public.grammar_mistakes for select to authenticated using (auth.uid() = user_id);
create policy grammar_mistakes_insert on public.grammar_mistakes for insert to authenticated with check (auth.uid() = user_id);
create policy grammar_mistakes_update on public.grammar_mistakes for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy grammar_mistakes_delete on public.grammar_mistakes for delete to authenticated using (auth.uid() = user_id);

create table if not exists public.grammar_daily_challenges (
  user_id uuid not null references auth.users(id) on delete cascade,
  challenge_date date not null default current_date,
  target integer not null default 5,
  completed integer not null default 0,
  xp integer not null default 0,
  completed_at timestamptz,
  primary key(user_id, challenge_date)
);

alter table public.grammar_daily_challenges enable row level security;
drop policy if exists grammar_daily_challenges_all on public.grammar_daily_challenges;
create policy grammar_daily_challenges_all on public.grammar_daily_challenges for all to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);

create table if not exists public.grammar_achievements (
  user_id uuid not null references auth.users(id) on delete cascade,
  achievement_id text not null,
  unlocked_at timestamptz not null default now(),
  primary key(user_id, achievement_id)
);

alter table public.grammar_achievements enable row level security;
drop policy if exists grammar_achievements_all on public.grammar_achievements;
create policy grammar_achievements_all on public.grammar_achievements for all to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Optional safe repair for the existing progress table.
alter table public.grammar_progress enable row level security;
drop policy if exists grammar_progress_select on public.grammar_progress;
drop policy if exists grammar_progress_insert on public.grammar_progress;
drop policy if exists grammar_progress_update on public.grammar_progress;
drop policy if exists grammar_progress_delete on public.grammar_progress;
create policy grammar_progress_select on public.grammar_progress for select to authenticated using (auth.uid() = user_id);
create policy grammar_progress_insert on public.grammar_progress for insert to authenticated with check (auth.uid() = user_id);
create policy grammar_progress_update on public.grammar_progress for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy grammar_progress_delete on public.grammar_progress for delete to authenticated using (auth.uid() = user_id);