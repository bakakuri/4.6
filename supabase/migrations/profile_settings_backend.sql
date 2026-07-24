-- Persist user settings in backend instead of localStorage.
-- Run once in Supabase SQL Editor for existing databases.

alter table public.profiles
  add column if not exists theme_mode text not null default 'dark',
  add column if not exists font_size text not null default 'md',
  add column if not exists notif_enabled boolean not null default false,
  add column if not exists grammar_goal text not null default 'balanced',
  add column if not exists daily_grammar_target integer not null default 30;

update public.profiles
set theme_mode = coalesce(theme_mode, 'dark'),
    font_size = coalesce(font_size, 'md'),
    notif_enabled = coalesce(notif_enabled, false),
    grammar_goal = coalesce(grammar_goal, 'balanced'),
    daily_grammar_target = coalesce(daily_grammar_target, 30);

alter table public.profiles
  alter column theme_mode set default 'dark',
  alter column font_size set default 'md',
  alter column notif_enabled set default false,
  alter column grammar_goal set default 'balanced',
  alter column daily_grammar_target set default 30;
