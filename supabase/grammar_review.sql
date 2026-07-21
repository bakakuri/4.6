-- Grammar 2.0: mistake bank and spaced review

create table if not exists public.grammar_mistakes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  lang text not null,
  category text not null,
  topic text not null,
  exercise_id text not null,
  question text not null,
  user_answer text,
  correct_answer text not null,
  explanation text,
  mistake_count integer not null default 1,
  last_mistake_at timestamptz not null default now(),
  next_review_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(user_id, lang, topic, exercise_id)
);

create index if not exists grammar_mistakes_review_idx
  on public.grammar_mistakes(user_id, lang, next_review_at);

alter table public.grammar_mistakes enable row level security;

drop policy if exists "Users can view own grammar mistakes" on public.grammar_mistakes;
create policy "Users can view own grammar mistakes"
  on public.grammar_mistakes for select
  using (auth.uid() = user_id);

drop policy if exists "Users can insert own grammar mistakes" on public.grammar_mistakes;
create policy "Users can insert own grammar mistakes"
  on public.grammar_mistakes for insert
  with check (auth.uid() = user_id);

drop policy if exists "Users can update own grammar mistakes" on public.grammar_mistakes;
create policy "Users can update own grammar mistakes"
  on public.grammar_mistakes for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "Users can delete own grammar mistakes" on public.grammar_mistakes;
create policy "Users can delete own grammar mistakes"
  on public.grammar_mistakes for delete
  using (auth.uid() = user_id);
