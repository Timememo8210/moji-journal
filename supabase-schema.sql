-- Moji (墨记) Database Schema for Supabase
-- Run this in the Supabase SQL Editor

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Journal entries
create table entries (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null default '',
  content text not null default '',
  raw_content text,
  mood text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Media attachments
create table media (
  id uuid primary key default uuid_generate_v4(),
  entry_id uuid not null references entries(id) on delete cascade,
  type text not null default 'image',
  url text not null,
  caption text,
  position int not null default 0,
  created_at timestamptz not null default now()
);

-- Indexes
create index idx_entries_user_id on entries(user_id);
create index idx_entries_created_at on entries(created_at desc);
create index idx_media_entry_id on media(entry_id);

-- Enable Row Level Security
alter table entries enable row level security;
alter table media enable row level security;

-- RLS Policies: users can only access their own entries
create policy "Users can view own entries"
  on entries for select
  using (auth.uid() = user_id);

create policy "Users can insert own entries"
  on entries for insert
  with check (auth.uid() = user_id);

create policy "Users can update own entries"
  on entries for update
  using (auth.uid() = user_id);

create policy "Users can delete own entries"
  on entries for delete
  using (auth.uid() = user_id);

-- Media policies: access media for entries the user owns
create policy "Users can view own media"
  on media for select
  using (
    exists (
      select 1 from entries
      where entries.id = media.entry_id
      and entries.user_id = auth.uid()
    )
  );

create policy "Users can insert own media"
  on media for insert
  with check (
    exists (
      select 1 from entries
      where entries.id = media.entry_id
      and entries.user_id = auth.uid()
    )
  );

create policy "Users can delete own media"
  on media for delete
  using (
    exists (
      select 1 from entries
      where entries.id = media.entry_id
      and entries.user_id = auth.uid()
    )
  );

-- Storage bucket for images
-- Run in Supabase dashboard: create a bucket called 'journal-media'
-- Set it to private; use signed URLs for access

-- Auto-set user_id on insert
create or replace function set_user_id()
returns trigger as $$
begin
  new.user_id := auth.uid();
  return new;
end;
$$ language plpgsql security definer;

create trigger entries_set_user_id
  before insert on entries
  for each row
  execute function set_user_id();
