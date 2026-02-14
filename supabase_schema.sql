
-- ---------------------------------------------------------
-- EMS Database Schema (B.Laban Enterprise System)
-- انسخ هذا الكود وضعه في Supabase SQL Editor ثم اضغط Run
-- ---------------------------------------------------------

-- 1. Enable UUID extension
create extension if not exists "uuid-ossp";

-- 2. System Configuration Table
create table public.system_config (
  id int primary key default 1,
  config jsonb,
  updated_at timestamp with time zone default timezone('utc'::text, now())
);

-- 3. Users Table
create table public.users (
  id text primary key, -- Text to support custom IDs like 'adm-demo'
  name text not null,
  username text unique,
  password text,
  role text not null,
  branch_id text,
  avatar text,
  phone text,
  created_at timestamp with time zone default timezone('utc'::text, now())
);

-- 4. Branches Table
create table public.branches (
  id text primary key,
  name text not null,
  location text,
  lat float,
  lng float,
  manager_id text,
  phone text,
  created_at timestamp with time zone default timezone('utc'::text, now())
);

-- 5. Spare Parts Inventory
create table public.spare_parts (
  id text primary key default uuid_generate_v4(),
  name text not null,
  sku text,
  price numeric default 0,
  quantity int default 0,
  min_level int default 5,
  category text,
  created_at timestamp with time zone default timezone('utc'::text, now())
);

-- 6. Reports (Maintenance Requests)
create table public.reports (
  id text primary key,
  branch_id text,
  branch_name text,
  created_by_user_id text,
  created_by_name text,
  
  -- Core Fields
  status text default 'NEW',
  priority text default 'NORMAL',
  machine_type text,
  description text,
  
  -- Assignment
  assigned_technician_id text,
  assigned_technician_name text,
  
  -- Dynamic Data (JSONB is powerful for flexible forms)
  dynamic_answers jsonb default '[]'::jsonb,
  dynamic_data jsonb default '{}'::jsonb,
  
  -- Evidence & Location
  location_coords jsonb,
  images_before text[] default array[]::text[],
  images_after text[] default array[]::text[],
  
  -- Financials
  cost numeric default 0,
  parts_usage_list jsonb default '[]'::jsonb,
  
  -- Notes
  admin_notes text,
  
  -- Timestamps
  created_at timestamp with time zone default timezone('utc'::text, now()),
  updated_at timestamp with time zone default timezone('utc'::text, now()),
  completed_at timestamp with time zone
);

-- ---------------------------------------------------------
-- Enable Realtime (Live Updates)
-- ---------------------------------------------------------
alter publication supabase_realtime add table public.reports;

-- ---------------------------------------------------------
-- Security Policies (RLS) - Disable for Development Mode
-- في الإنتاج يجب تفعيل RLS وكتابة سياسات أمان صارمة
-- ---------------------------------------------------------
alter table public.system_config enable row level security;
create policy "Public Access Config" on public.system_config for all using (true);

alter table public.users enable row level security;
create policy "Public Access Users" on public.users for all using (true);

alter table public.branches enable row level security;
create policy "Public Access Branches" on public.branches for all using (true);

alter table public.spare_parts enable row level security;
create policy "Public Access Parts" on public.spare_parts for all using (true);

alter table public.reports enable row level security;
create policy "Public Access Reports" on public.reports for all using (true);
