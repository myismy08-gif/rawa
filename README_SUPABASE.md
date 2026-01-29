# نظام "انضم كمدرب" + لوحة تحكم (Supabase)

## الهدف
- استبانة تقديم مدربين سهلة جدًا (بدون أي حقول إلزامية)
- رفع CV اختياري
- لوحة تحكم للمشرفين لعرض وفرز الطلبات حسب التخصص/المدينة/الحالة + تنزيل CV

---

## 1) إعداد Supabase
### A) أنشئي مشروع جديد
Supabase -> New project

### B) أنشئي Bucket للـ CV
Storage -> Create bucket
- name: cvs
- Private: ON

### C) نفذي SQL
SQL Editor -> New query -> شغّلي ملف:
- `supabase_schema.sql`

### D) أنشئي حساب مشرف
Authentication -> Users -> Add user (Email/Password)
ثم خذي UID (UUID) وأضيفيه كـ Admin:

```sql
insert into public.admins (user_id)
values ('PUT_ADMIN_UUID_HERE');
```

> مهم: لازم UUID الحقيقي من Auth Users (لا تكتبين نص).

---

## 2) ربط الموقع بالمفاتيح
من Supabase:
Project Settings -> API
- Project URL
- anon public key

ثم في ملف `supabase_config.js` بدّلي:
- SUPABASE_URL
- SUPABASE_ANON_KEY

---

## 3) رفع الملفات للريبو (GitHub Pages)
ارفعي الملفات التالية في نفس مكان index.html:
- join_trainer.html
- admin_dashboard.html
- supabase_config.js
- join_trainer_submit.js
- admin_dashboard.js
- supabase_schema.sql (للاحتفاظ فقط)

---

## 4) الروابط
- نموذج المدربين: `join_trainer.html`
- لوحة التحكم: `admin_dashboard.html`

> لوحة التحكم تحتاج دخول مشرف.

---

## ملاحظات
- كل حقول الاستبانة اختيارية.
- لو Bucket خاص (Private)، التنزيل يتم عبر Signed URL لمدة 60 ثانية.
