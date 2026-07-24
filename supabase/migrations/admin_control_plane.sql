-- Admin control plane for full moderation and content control.
-- Run in Supabase SQL Editor after the base schema.

-- ── Profile moderation fields ──────────────────────────────────
alter table public.profiles
  add column if not exists chat_blocked boolean not null default false,
  add column if not exists account_hidden boolean not null default false,
  add column if not exists deleted_at timestamptz;

update public.profiles
set chat_blocked = coalesce(chat_blocked, false),
    account_hidden = coalesce(account_hidden, false);

-- ── Global settings ────────────────────────────────────────────
create table if not exists public.site_settings (
  key text primary key,
  value jsonb not null default '{}'::jsonb,
  updated_by uuid references auth.users(id) on delete set null,
  updated_at timestamptz not null default now()
);

insert into public.site_settings (key, value)
values
  ('maintenance_mode', '{"enabled": false}'::jsonb),
  ('content_moderation', '{"enabled": true}'::jsonb),
  ('broadcast_banner', '{"enabled": false, "text": ""}'::jsonb)
on conflict (key) do nothing;

-- ── Generic content flags/overrides ────────────────────────────
create table if not exists public.content_overrides (
  id uuid default gen_random_uuid() primary key,
  entity_type text not null, -- word, grammar_topic, lesson, quiz, chat_message, user, course
  entity_id text not null,
  action text not null check (action in ('hide', 'show', 'lock', 'unlock', 'block', 'unblock', 'delete', 'restore', 'edit')),
  payload jsonb not null default '{}'::jsonb,
  reason text,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);

create index if not exists content_overrides_entity_idx on public.content_overrides(entity_type, entity_id);
create index if not exists content_overrides_created_idx on public.content_overrides(created_at desc);

-- ── Audit log ──────────────────────────────────────────────────
create table if not exists public.admin_audit_log (
  id uuid default gen_random_uuid() primary key,
  admin_id uuid references auth.users(id) on delete set null,
  action text not null,
  entity_type text,
  entity_id text,
  details jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists admin_audit_log_created_idx on public.admin_audit_log(created_at desc);
create index if not exists admin_audit_log_action_idx on public.admin_audit_log(action);

-- ── RLS for new tables ────────────────────────────────────────
alter table public.site_settings enable row level security;
alter table public.content_overrides enable row level security;
alter table public.admin_audit_log enable row level security;

-- Helper condition: admin role is stored in profiles.is_admin.
create policy "site_settings_admin_all" on public.site_settings
  for all
  using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.is_admin))
  with check (exists (select 1 from public.profiles p where p.id = auth.uid() and p.is_admin));

create policy "content_overrides_admin_all" on public.content_overrides
  for all
  using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.is_admin))
  with check (exists (select 1 from public.profiles p where p.id = auth.uid() and p.is_admin));

create policy "admin_audit_admin_select" on public.admin_audit_log
  for select
  using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.is_admin));

create policy "admin_audit_admin_insert" on public.admin_audit_log
  for insert
  with check (exists (select 1 from public.profiles p where p.id = auth.uid() and p.is_admin));

-- ── Admin access for existing tables ───────────────────────────
-- profiles: admin can manage all user records
create policy if not exists "profiles_admin_update" on public.profiles
  for update
  using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.is_admin))
  with check (exists (select 1 from public.profiles p where p.id = auth.uid() and p.is_admin));

create policy if not exists "profiles_admin_delete" on public.profiles
  for delete
  using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.is_admin));

-- word_progress
create policy if not exists "wp_admin_all" on public.word_progress
  for all
  using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.is_admin))
  with check (exists (select 1 from public.profiles p where p.id = auth.uid() and p.is_admin));

-- activity
create policy if not exists "activity_admin_all" on public.activity
  for all
  using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.is_admin))
  with check (exists (select 1 from public.profiles p where p.id = auth.uid() and p.is_admin));

-- chat_messages
create policy if not exists "chat_admin_all" on public.chat_messages
  for all
  using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.is_admin))
  with check (exists (select 1 from public.profiles p where p.id = auth.uid() and p.is_admin));

-- grammar tables
create policy if not exists "grammar_progress_admin_all" on public.grammar_progress
  for all
  using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.is_admin))
  with check (exists (select 1 from public.profiles p where p.id = auth.uid() and p.is_admin));

create policy if not exists "grammar_bookmarks_admin_all" on public.grammar_bookmarks
  for all
  using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.is_admin))
  with check (exists (select 1 from public.profiles p where p.id = auth.uid() and p.is_admin));

create policy if not exists "grammar_notes_admin_all" on public.grammar_notes
  for all
  using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.is_admin))
  with check (exists (select 1 from public.profiles p where p.id = auth.uid() and p.is_admin));

create policy if not exists "grammar_sessions_admin_all" on public.grammar_sessions
  for all
  using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.is_admin))
  with check (exists (select 1 from public.profiles p where p.id = auth.uid() and p.is_admin));

-- Helpful view for admin stats
create or replace view public.admin_overview as
select
  (select count(*) from public.profiles) as total_users,
  (select coalesce(sum(xp), 0) from public.profiles) as total_xp,
  (select count(*) from public.profiles where coalesce(last_active, created_at)::date = current_date) as active_today,
  (select count(*) from public.chat_messages) as total_messages,
  (select count(*) from public.profiles where chat_blocked = true) as blocked_users,
  (select count(*) from public.profiles where is_admin = true) as admins;
