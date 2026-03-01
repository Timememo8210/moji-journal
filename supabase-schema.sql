-- Moji (墨记) Database Schema for Supabase
-- Run this in the Supabase SQL Editor

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Journal entries
create table entries (
  id uuid primary key default uuid_generate_v4(),
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
create index idx_entries_created_at on entries(created_at desc);
create index idx_media_entry_id on media(entry_id);

-- RLS policies (enable after setting up auth)
alter table entries enable row level security;
alter table media enable row level security;

-- Allow authenticated users full access
create policy "Authenticated users can manage entries"
  on entries for all
  using (auth.role() = 'authenticated');

create policy "Authenticated users can manage media"
  on media for all
  using (auth.role() = 'authenticated');

-- Storage bucket for images
-- Run in Supabase dashboard: create a bucket called 'journal-media' (public)
