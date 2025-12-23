-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- 1. Buildings
create table public.buildings (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  address text,
  created_at timestamptz default now()
);

alter table public.buildings enable row level security;

-- 2. Units (Apartments)
create table public.units (
  id uuid primary key default uuid_generate_v4(),
  building_id uuid references public.buildings(id) on delete cascade not null,
  floor text not null,
  apartment_number text not null,
  created_at timestamptz default now()
);

alter table public.units enable row level security;

-- 3. Invited Residents (Whauitelist)
create table public.invited_residents (
  id uuid primary key default uuid_generate_v4(),
  building_id uuid references public.buildings(id) on delete cascade not null,
  phone text not null, -- Normalized phone number
  name text not null,
  role text default 'resident' check (role in ('resident', 'committee')),
  created_at timestamptz default now(),
  unique(building_id, phone)
);

alter table public.invited_residents enable row level security;

-- 4. Profiles (Users)
create table public.profiles (
  id uuid primary key references auth.users on delete cascade,
  phone text unique not null,
  full_name text,
  building_id uuid references public.buildings(id),
  unit_id uuid references public.units(id),
  role text default 'resident' check (role in ('resident', 'committee')),
  avatar_url text,
  created_at timestamptz default now()
);

alter table public.profiles enable row level security;

-- 5. User Settings
create table public.user_settings (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  theme_mode text default 'light' check (theme_mode in ('light', 'dark')),
  push_issues boolean default true,
  push_announcements boolean default true,
  push_status_updates boolean default true,
  announcements_last_seen_at timestamptz not null default '1970-01-01T00:00:00Z',
  updated_at timestamptz default now()
);

alter table public.user_settings enable row level security;

-- 6. Issues
create table public.issues (
  id uuid primary key default uuid_generate_v4(),
  building_id uuid references public.buildings(id) on delete cascade not null,
  reporter_id uuid references public.profiles(id) on delete set null,
  category text not null, -- elevator, electricity, water, cleaning, other
  description text not null,
  location text, -- lobby, floor, parking, roof
  status text default 'open' check (status in ('open', 'in_progress', 'resolved')),
  created_at timestamptz default now()
);

alter table public.issues enable row level security;

-- 6b. Issue Report Categories (for Create Issue screen)
create table public.issue_report (
  id uuid primary key default uuid_generate_v4(),
  name text not null unique,
  sort_order int not null default 0,
  created_at timestamptz default now()
);

alter table public.issue_report enable row level security;

-- 7. Issue Media
create table public.issue_media (
  id uuid primary key default uuid_generate_v4(),
  issue_id uuid references public.issues(id) on delete cascade not null,
  url text not null,
  type text default 'image',
  created_at timestamptz default now()
);

alter table public.issue_media enable row level security;

-- 8. Issue Updates (Timeline/History)
create table public.issue_updates (
  id uuid primary key default uuid_generate_v4(),
  issue_id uuid references public.issues(id) on delete cascade not null,
  author_id uuid references public.profiles(id) on delete set null,
  new_status text check (new_status in ('open', 'in_progress', 'resolved')),
  comment text,
  created_at timestamptz default now()
);

alter table public.issue_updates enable row level security;

-- 9. Announcements
create table public.announcements (
  id uuid primary key default uuid_generate_v4(),
  building_id uuid references public.buildings(id) on delete cascade not null,
  author_id uuid references public.profiles(id) on delete set null,
  title text not null,
  content text not null,
  is_pinned boolean default false,
  created_at timestamptz default now()
);

alter table public.announcements enable row level security;

-- 10. Push Tokens
create table public.push_tokens (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references public.profiles(id) on delete cascade not null,
  token text not null,
  device_type text,
  created_at timestamptz default now(),
  unique(user_id, token)
);

alter table public.push_tokens enable row level security;

-- RLS Policies

-- Profiles: Users can view profiles in their building. Users can update their own profile.
create policy "View profiles in same building"
  on public.profiles for select
  using (building_id in (select building_id from public.profiles where id = auth.uid()));

create policy "Users can update own profile"
  on public.profiles for update
  using (auth.uid() = id);

create policy "Users can insert own profile"
  on public.profiles for insert
  with check (auth.uid() = id);

-- Buildings: Users can view their own building.
create policy "View own building"
  on public.buildings for select
  using (id in (select building_id from public.profiles where id = auth.uid()));

-- Units: Users can view units in their building.
create policy "View units in same building"
  on public.units for select
  using (building_id in (select building_id from public.profiles where id = auth.uid()));

-- Issue Report Categories: Authenticated users can read categories (read-only)
create policy "Read issue report categories"
  on public.issue_report for select
  using (auth.role() = 'authenticated');

-- Invited Residents:
-- Committee can view/insert invited residents for their building.
-- New users need to check if they are invited (this is tricky with RLS if they don't have a profile yet).
-- Solution: Use a secure function or allow read by phone number for auth process.
-- For MVP: Allow public read of invited_residents but rely on phone number knowledge.
-- Better: Create a stored procedure `check_invitation(phone)` with security definer.
-- For simplicity here:
create policy "Committee can manage invites"
  on public.invited_residents for all
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid()
      and building_id = public.invited_residents.building_id
      and role = 'committee'
    )
  );

-- Helper function to check invitation safely
create or replace function check_is_invited(phone_number text)
returns json
language plpgsql
security definer
as $$
declare
  invite_record record;
begin
  select * into invite_record from public.invited_residents where phone = phone_number limit 1;
  if found then
    return row_to_json(invite_record);
  else
    return null;
  end if;
end;
$$;

-- Issues:
-- View: Residents of building
-- Insert: Residents of building
-- Update: Committee (status), Author (description/media?)
create policy "View issues in building"
  on public.issues for select
  using (building_id in (select building_id from public.profiles where id = auth.uid()));

create policy "Create issues in building"
  on public.issues for insert
  with check (building_id in (select building_id from public.profiles where id = auth.uid()));

create policy "Committee can update issues"
  on public.issues for update
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid()
      and building_id = public.issues.building_id
      and role = 'committee'
    )
  );

-- Issue Updates: Same as issues
create policy "View issue updates in building"
  on public.issue_updates for select
  using (
    issue_id in (
      select id from public.issues
      where building_id in (select building_id from public.profiles where id = auth.uid())
    )
  );

create policy "Create issue update"
  on public.issue_updates for insert
  with check (
    issue_id in (
      select id from public.issues
      where building_id in (select building_id from public.profiles where id = auth.uid())
    )
  );

-- Issue Media: Same building as issue
create policy "View issue media in building"
  on public.issue_media for select
  using (
    issue_id in (
      select id from public.issues
      where building_id in (select building_id from public.profiles where id = auth.uid())
    )
  );

create policy "Insert issue media in building"
  on public.issue_media for insert
  with check (
    issue_id in (
      select id from public.issues
      where building_id in (select building_id from public.profiles where id = auth.uid())
    )
  );

-- Announcements:
-- View: Residents
-- Manage: Committee
create policy "View announcements in building"
  on public.announcements for select
  using (building_id in (select building_id from public.profiles where id = auth.uid()));

create policy "Committee can insert announcements"
  on public.announcements for insert
  with check (
    exists (
      select 1 from public.profiles
      where id = auth.uid()
      and building_id = public.announcements.building_id
      and role = 'committee'
    )
  );

create policy "Committee can update announcements"
  on public.announcements for update
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid()
      and building_id = public.announcements.building_id
      and role = 'committee'
    )
  );

create policy "Committee can delete announcements"
  on public.announcements for delete
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid()
      and building_id = public.announcements.building_id
      and role = 'committee'
    )
  );

-- User Settings: Only owner
create policy "Read own settings"
  on public.user_settings for select
  using (user_id = auth.uid());

create policy "Insert own settings"
  on public.user_settings for insert
  with check (user_id = auth.uid());

create policy "Update own settings"
  on public.user_settings for update
  using (user_id = auth.uid());

create policy "Delete own settings"
  on public.user_settings for delete
  using (user_id = auth.uid());

-- Push Tokens: Only owner
create policy "Manage own push tokens"
  on public.push_tokens for all
  using (user_id = auth.uid());

-- Storage Policies (Buckets need to be created in Supabase Dashboard: 'issue-images')
-- Policy for storage.objects:
-- Authenticated users can upload to 'issue-images'
-- Authenticated users can read from 'issue-images'

-- Recommended storage.objects RLS policies for issue images bucket.
-- Run these in Supabase SQL Editor (Storage schema is managed by Supabase).
--
-- Note: If you set the bucket 'issue-images' to Public in the dashboard, the SELECT policy
-- is less critical for displaying images via public URLs, but it is still useful for signed URLs.

create policy "Read issue images"
  on storage.objects for select
  using (bucket_id = 'issue-images');

create policy "Upload issue images"
  on storage.objects for insert
  with check (bucket_id = 'issue-images');

create policy "Update issue images"
  on storage.objects for update
  using (bucket_id = 'issue-images');

create policy "Delete issue images"
  on storage.objects for delete
  using (bucket_id = 'issue-images');

