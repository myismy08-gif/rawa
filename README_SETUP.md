# Nahj – Trainer Applications (Supabase)

هذا المجلد يضيف:
- join_trainer.html  (نموذج تقديم مدرب + رفع CV)
- admin_dashboard.html (لوحة تحكم للمشرف: بحث/فلترة/تحديث حالة + تحميل CV)
- supabase_config.js (إعدادات Supabase – ضعي URL و ANON KEY)

---

## 1) إعداد Supabase (مرة واحدة)

### A) جداول + سياسات (SQL)
افتحي Supabase Dashboard > SQL Editor وشغّلي هذا السكربت:

```sql
-- Extensions
create extension if not exists "pgcrypto";

-- 1) جدول الطلبات
create table if not exists public.trainer_applications (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  full_name text not null,
  email text not null,
  phone text not null,
  city text,
  specialization text not null,
  years_experience int,
  bio text,
  linkedin_url text,
  website_url text,
  delivery_modes text[] not null default '{}'::text[],
  languages text[] not null default '{}'::text[],
  cv_path text not null,
  status text not null default 'new',
  reviewed_at timestamptz,
  notes text
);

-- 2) جدول المشرفين
create table if not exists public.admins (
  user_id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

-- 3) دالة للتحقق من المشرف
create or replace function public.is_admin(uid uuid)
returns boolean
language sql
stable
as $$
  select exists(select 1 from public.admins a where a.user_id = uid);
$$;

-- 4) RLS
alter table public.trainer_applications enable row level security;
alter table public.admins enable row level security;

-- Public: يسمح فقط بإضافة طلب (Insert) من نموذج الموقع
drop policy if exists "public_insert_applications" on public.trainer_applications;
create policy "public_insert_applications"
on public.trainer_applications
for insert
to anon
with check (status = 'new');

-- Admins: قراءة/تحديث الطلبات
drop policy if exists "admins_select_applications" on public.trainer_applications;
create policy "admins_select_applications"
on public.trainer_applications
for select
to authenticated
using (public.is_admin(auth.uid()));

drop policy if exists "admins_update_applications" on public.trainer_applications;
create policy "admins_update_applications"
on public.trainer_applications
for update
to authenticated
using (public.is_admin(auth.uid()))
with check (public.is_admin(auth.uid()));

-- Admins table: فقط المشرفين يقدرون يقرؤون (للتشخيص)
drop policy if exists "admins_select_admins" on public.admins;
create policy "admins_select_admins"
on public.admins
for select
to authenticated
using (public.is_admin(auth.uid()));
```

### B) Storage Bucket
1) Storage > Create bucket
- Name: `trainer-cv`
- Public: OFF (Private)

ثم SQL policies للـ Storage (في SQL Editor):

```sql
-- Policies for storage.objects (RLS)
alter table storage.objects enable row level security;

-- السماح للزائر (anon) يرفع ملف داخل applications/<uuid>/...
drop policy if exists "anon_upload_trainer_cv" on storage.objects;
create policy "anon_upload_trainer_cv"
on storage.objects
for insert
to anon
with check (
  bucket_id = 'trainer-cv'
  and name like 'applications/%'
);

-- السماح للمشرف يقرأ الملفات
drop policy if exists "admin_read_trainer_cv" on storage.objects;
create policy "admin_read_trainer_cv"
on storage.objects
for select
to authenticated
using (
  bucket_id = 'trainer-cv'
  and public.is_admin(auth.uid())
);
```

> ملاحظة: لو تبين تمنعين أي شخص يرفع غير PDF/DOC/DOCX أو حد حجم، الأفضل يكون عبر Edge Function (اختياري).

### C) Auth للمشرف
Auth > Users > Add user
- Email + Password

بعد إنشاء المستخدم، انسخي الـ UUID حقه
ثم SQL:

```sql
insert into public.admins(user_id) values ('UUID_HERE');
```

---

## 2) ربط الموقع
1) افتحي `supabase_config.js` وحطي:
- SUPABASE_URL
- SUPABASE_ANON_KEY

2) استبدلي روابط "انضم كمدرب" في الموقع لتصير:
- join_trainer.html

---

## 3) تشغيل
- ارفعي الملفات على GitHub Pages (أو الاستضافة الحالية)
- افتحي join_trainer.html للتقديم
- افتحي admin_dashboard.html للدخول وعرض الطلبات
