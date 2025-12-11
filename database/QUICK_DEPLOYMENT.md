# ⚡ Quick Deployment Guide - Supabase

## 📋 **FILES TO PASTE INTO SUPABASE (IN ORDER)**

Copy and paste these 9 files into Supabase SQL Editor **in this exact order**:

```
0. 00-base-schema.sql          ⚠️ RUN THIS FIRST!
1. setup.sql
2. onboarding-schema.sql
3. forum-features-schema.sql   ⚠️ Must run before class-schedule-schema.sql
4. class-schedule-schema.sql
5. events-schema.sql
6. complete-schema-additions-fixed.sql
7. revised-features-fixed.sql
8. SECURITY_FIXES.sql
```

---

## ✅ **WHAT'S FIXED**

All security vulnerabilities have been fixed:
- ✅ All functions validate user access
- ✅ All tables require authentication
- ✅ Admin role properly secured
- ✅ Input validation added
- ✅ Length constraints added
- ✅ RLS policies complete

---

## 🚀 **QUICK START**

1. Open Supabase → SQL Editor
2. Copy file #1 → Paste → Run
3. Copy file #2 → Paste → Run
4. ... (repeat for all 8 files)
5. Set up admin user (see below)
6. Done! ✅

---

## 👤 **SET UP ADMIN USER**

After all files are run:

```sql
-- Find your user ID
SELECT id, email FROM auth.users WHERE email = 'your-email@example.com';

-- Make yourself admin (replace with your user ID)
UPDATE public.profiles 
SET role = 'admin' 
WHERE id = 'your-user-id-here';
```

---

## ✅ **VERIFY IT WORKED**

```sql
-- Should return your user with role = 'admin'
SELECT id, email, role FROM public.profiles WHERE role = 'admin';

-- Should show tables created
SELECT COUNT(*) FROM information_schema.tables 
WHERE table_schema = 'public' AND table_name LIKE '%relationships%';
```

---

**That's it! Your database is ready for production.** 🎉

For detailed instructions, see `DEPLOYMENT_GUIDE.md`

