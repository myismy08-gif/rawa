-- ==========================================
-- NAHJ Trainers Application (Supabase)
-- - Minimal friction: NO required fields
-- - Public can submit applications (INSERT)
-- - CV upload is optional
-- - Admins can view/filter/update applications
-- ==========================================

-- 1) Trainers applications table
create table if not exists public.trainers (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),

  full_name text,
  phone text,
  email text,
  city text,
  specialization text,
  years_experience int,
  bio text,
  linkedin_url text,
  website_url text,

  cv_path text,         -- path in Storage bucket "cvs"
  status text not null default 'new'
);

-- 2) Admins table (maps to auth.users.id)
create table if not exists public.admins (
  user_id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

-- 3) Enable RLS
alter table public.trainers enable row level security;
alter table public.admins enable row level security;

-- 4) Public can INSERT applications (no required fields)
drop policy if exists "Public can insert trainer requests" on public.trainers;
create policy "Public can insert trainer requests"
on public.trainers
for insert
to public
with check (true);

-- 5) Only admins can SELECT / UPDATE / DELETE applications
drop policy if exists "Admins can read trainer requests" on public.trainers;
create policy "Admins can read trainer requests"
on public.trainers
for select
to authenticated
using (exists (select 1 from public.admins a where a.user_id = auth.uid()));

drop policy if exists "Admins can update trainer requests" on public.trainers;
create policy "Admins can update trainer requests"
on public.trainers
for update
to authenticated
using (exists (select 1 from public.admins a where a.user_id = auth.uid()))
with check (exists (select 1 from public.admins a where a.user_id = auth.uid()));

drop policy if exists "Admins can delete trainer requests" on public.trainers;
create policy "Admins can delete trainer requests"
on public.trainers
for delete
to authenticated
using (exists (select 1 from public.admins a where a.user_id = auth.uid()));

-- 6) admins table read only for admins
drop policy if exists "Admins can read admins" on public.admins;
create policy "Admins can read admins"
on public.admins
for select
to authenticated
using (exists (select 1 from public.admins a where a.user_id = auth.uid()));

-- ==========================================
-- STORAGE (CV upload)
-- 1) Create a bucket named: cvs
--    Set it to PRIVATE (recommended)
-- 2) Then run these policies:
-- ==========================================

-- Public can upload to bucket "cvs"
drop policy if exists "Public can upload CVs" on storage.objects;
create policy "Public can upload CVs"
on storage.objects
for insert
to public
with check (bucket_id = 'cvs');

-- Admins can read/download CVs
drop policy if exists "Admins can read CVs" on storage.objects;
create policy "Admins can read CVs"
on storage.objects
for select
to authenticated
using (
  bucket_id = 'cvs'
  and exists (select 1 from public.admins a where a.user_id = auth.uid())
);

-- Admins can delete CVs (optional)
drop policy if exists "Admins can delete CVs" on storage.objects;
create policy "Admins can delete CVs"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'cvs'
  and exists (select 1 from public.admins a where a.user_id = auth.uid())
);
