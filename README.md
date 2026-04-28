# FSS CRM — Setup Guide

## Kya milega is app mein
- Field boy ka mobile app (Android Chrome mein khuulta hai, koi install nahi)
- GPS location verify — party ke address se match
- Photo proof — date/time/GPS watermark ke saath
- Area-wise daily planning
- Admin dashboard — live visit tracking, GPS alerts, photo gallery
- Orders aur sales tracking

---

## Step 1: Supabase setup (5 minute)

1. [supabase.com](https://supabase.com) pe login karo
2. New project banao (naam: `fss-crm`, database password save karo)
3. Project ready hone ke baad left sidebar → **SQL Editor**
4. `SUPABASE_SETUP.sql` file open karo (is folder mein hai)
5. Sab content copy karo → SQL Editor mein paste karo → **Run** dabao
6. Settings → API → copy karo:
   - `Project URL` → `NEXT_PUBLIC_SUPABASE_URL`
   - `anon public key` → `NEXT_PUBLIC_SUPABASE_ANON_KEY`

---

## Step 2: Users banao

### Admin user (aap):
1. Supabase → **Authentication** → **Users** → **Add user**
2. Email: `nitin@fss.com`, Password: (strong password)
3. SQL Editor mein run karo:
```sql
update public.profiles set name = 'Nitin', role = 'admin' 
where id = 'USER_ID_HERE';  -- Auth Users page se copy karo
```

### Field boy user:
1. Same tarah add karo: `fieldboy1@fss.com`
2. SQL Editor:
```sql
update public.profiles set name = 'Raju', role = 'field', phone = '9811234567'
where id = 'FIELD_BOY_USER_ID_HERE';
```

---

## Step 3: Vercel deploy (3 minute)

1. Is folder ko GitHub pe push karo (ya ZIP upload)
2. [vercel.com](https://vercel.com) → **New Project** → GitHub repo select karo
3. **Environment Variables** mein add karo:
   ```
   NEXT_PUBLIC_SUPABASE_URL = https://xxxxx.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY = eyJhbGci...
   ```
4. **Deploy** dabao — 2 minute mein live ho jaayega!

---

## Step 4: Field boy ko app dena

1. Vercel se app URL milega (e.g. `https://fss-crm.vercel.app`)
2. Field boy ke phone pe Chrome mein URL open karo
3. Login karke Chrome menu → **"Add to Home Screen"** → Done!
4. Ab phone pe FSS CRM icon dikhai dega, bilkul app jaisi feel

---

## Parties ka GPS coordinates kaise add karein

Google Maps pe party ki shop dhundho:
1. Location pe tap karo
2. Neeche latitude, longitude dikhai dega (e.g. `28.6378, 77.2773`)
3. Admin panel → Parties → Party edit karo → Lat/Lng daalo

500 meter ke andar GPS verified hoga, zyada door hoga toh admin ko alert milega.

---

## App URLs
- Admin dashboard: `/admin/dashboard`
- Field boy home: `/field/home`
- Login: `/login`

---

## Folder structure
```
fss-crm/
├── app/
│   ├── admin/
│   │   ├── dashboard/    ← Admin live view, GPS alerts
│   │   ├── parties/      ← Party add/manage
│   │   ├── plans/        ← Area-wise schedule assign
│   │   ├── visits/       ← All visits + photo gallery
│   │   └── orders/       ← Sales tracking
│   ├── field/
│   │   ├── home/         ← Field boy today's list
│   │   ├── checkin/      ← GPS + photo + visit form
│   │   └── schedule/     ← Weekly area plan
│   └── login/
├── lib/
│   ├── supabase.ts       ← DB client + types
│   └── utils.ts          ← GPS, photo watermark, helpers
└── SUPABASE_SETUP.sql    ← Run this first!
```
