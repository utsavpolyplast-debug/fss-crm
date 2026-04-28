-- ============================================================
-- FSS CRM — Supabase SQL Setup
-- Supabase SQL Editor mein yeh sab run karo (ek baar mein)
-- ============================================================

-- 1. PROFILES TABLE (extends auth.users)
create table public.profiles (
  id uuid references auth.users(id) on delete cascade primary key,
  name text not null,
  role text not null check (role in ('admin', 'field')),
  phone text,
  home_area text default 'East Delhi',
  created_at timestamptz default now()
);
alter table public.profiles enable row level security;
create policy "Users can read all profiles" on public.profiles for select using (auth.role() = 'authenticated');
create policy "Users can update own profile" on public.profiles for update using (auth.uid() = id);

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public
as $$
begin
  insert into public.profiles (id, name, role, phone)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)),
    coalesce(new.raw_user_meta_data->>'role', 'field'),
    new.raw_user_meta_data->>'phone'
  );
  return new;
end;
$$;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();


-- 2. PARTIES TABLE
create table public.parties (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  contact_person text,
  mobile text,
  city text not null,
  area text not null,
  address text,
  lat double precision,
  lng double precision,
  type text not null check (type in ('Existing Buyer', 'Ahaar Lead', 'New Lead')),
  status text not null default 'Follow-up' check (status in ('Active', 'Follow-up', 'Cold', 'Converted')),
  products_interested text,
  priority integer default 5,
  assigned_to uuid references public.profiles(id),
  notes text,
  created_at timestamptz default now()
);
alter table public.parties enable row level security;
create policy "All authenticated users can read parties" on public.parties for select using (auth.role() = 'authenticated');
create policy "Admin can insert parties" on public.parties for insert with check (
  exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
);
create policy "Admin can update parties" on public.parties for update using (
  exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
);
-- Field boys can update party status
create policy "Field can update status" on public.parties for update using (auth.role() = 'authenticated')
  with check (true);


-- 3. VISITS TABLE
create table public.visits (
  id uuid default gen_random_uuid() primary key,
  party_id uuid references public.parties(id) not null,
  user_id uuid references public.profiles(id) not null,
  visit_date date not null,
  checkin_time timestamptz default now(),
  gps_lat double precision,
  gps_lng double precision,
  gps_verified boolean default false,
  gps_distance_meters integer default 0,
  photo_url text,
  outcome text not null check (outcome in ('Order Placed','Follow-up','Not Interested','Sample Given','Meeting Done')),
  items_discussed text,
  remarks text,
  next_followup_date date,
  created_at timestamptz default now()
);
alter table public.visits enable row level security;
create policy "Field boys can insert own visits" on public.visits for insert with check (auth.uid() = user_id);
create policy "Users can read all visits" on public.visits for select using (auth.role() = 'authenticated');
create policy "Field can read own visits" on public.visits for select using (auth.uid() = user_id);


-- 4. ORDERS TABLE
create table public.orders (
  id uuid default gen_random_uuid() primary key,
  party_id uuid references public.parties(id) not null,
  visit_id uuid references public.visits(id),
  user_id uuid references public.profiles(id) not null,
  order_date date not null,
  item text not null,
  qty_cartons integer default 0,
  rate_per_carton numeric(10,2) default 0,
  total_amount numeric(10,2) default 0,
  payment_status text default 'Pending' check (payment_status in ('Pending','Partial','Received')),
  remarks text,
  created_at timestamptz default now()
);
alter table public.orders enable row level security;
create policy "Authenticated can insert orders" on public.orders for insert with check (auth.uid() = user_id);
create policy "All authenticated can read orders" on public.orders for select using (auth.role() = 'authenticated');
create policy "Admin can update orders" on public.orders for update using (
  exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
);


-- 5. AREA PLANS TABLE
create table public.area_plans (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) not null,
  plan_date date not null,
  area text not null,
  party_ids uuid[] not null default '{}',
  notes text,
  created_by uuid references public.profiles(id),
  created_at timestamptz default now(),
  unique(user_id, plan_date)
);
alter table public.area_plans enable row level security;
create policy "Field can read own plans" on public.area_plans for select using (auth.uid() = user_id);
create policy "Admin can read all plans" on public.area_plans for select using (
  exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
);
create policy "Admin can insert plans" on public.area_plans for insert with check (
  exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
);
create policy "Admin can update plans" on public.area_plans for update using (
  exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
);


-- ============================================================
-- STORAGE BUCKET for visit photos
-- ============================================================
insert into storage.buckets (id, name, public) values ('visit-photos', 'visit-photos', true);
create policy "Authenticated can upload photos" on storage.objects
  for insert with check (bucket_id = 'visit-photos' and auth.role() = 'authenticated');
create policy "Photos are publicly readable" on storage.objects
  for select using (bucket_id = 'visit-photos');


-- ============================================================
-- SAMPLE DATA — test ke liye (optional, delete kar sakte ho)
-- ============================================================
-- Note: Pehle admin user banao Supabase Auth mein, phir yeh run karo
-- Admin user ka UUID neeche replace karo

-- Example parties (Delhi areas)
insert into public.parties (name, contact_person, mobile, city, area, address, lat, lng, type, status, products_interested, priority) values
('Sharma Traders', 'Ramesh Sharma', '9811234567', 'Delhi', 'East Delhi', 'Shop 12, Laxmi Nagar Market', 28.6378, 77.2773, 'Existing Buyer', 'Active', 'Oval 500ml, Bucket 5L', 1),
('Gupta Kitchen Store', 'Suresh Gupta', '9898765432', 'Delhi', 'East Delhi', 'Preet Vihar Main Market', 28.6479, 77.2969, 'Ahaar Lead', 'Follow-up', 'Round containers, Sipper', 2),
('Star Kitchen World', 'Priya Jain', '9876001122', 'Delhi', 'East Delhi', 'Mayur Vihar Phase 1', 28.6079, 77.2952, 'Ahaar Lead', 'Follow-up', 'Oval 500ml, Rec containers', 3),
('Mehta Plastics', 'Vijay Mehta', '9911223344', 'Gurgaon', 'Gurgaon', 'Sector 14, Gurgaon', 28.4595, 77.0266, 'New Lead', 'Cold', 'RO series', 4),
('Delhi HoReCa Supplies', 'Anil Kumar', '9955443322', 'Delhi', 'Central Delhi', 'Paharganj Market', 28.6436, 77.2131, 'New Lead', 'Follow-up', 'Oval 1L, Sipper XL', 2),
('Noida Kitchen Hub', 'Kavita Singh', '9812345099', 'Noida', 'Noida', 'Sector 18 Market, Noida', 28.5706, 77.3219, 'Existing Buyer', 'Active', 'Sipper, Oval 1L', 1);
