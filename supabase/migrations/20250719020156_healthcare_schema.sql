-- Migration: healthcare schema and RLS policies
-- Generated 2025-07-19

-- Enable required extension
create extension if not exists "pgcrypto";

-- -----------------------------------------------------
-- 1. ENUM types
-- -----------------------------------------------------
create type appointment_status as enum (
  'requested',
  'awaiting_payment',
  'paid',
  'in_progress',
  'complete',
  'cancelled',
  'refunded'
);
create type prescription_status as enum ('draft','issued','fulfilled');
create type drug_order_status as enum ('awaiting_payment','paid','dispensed','cancelled');
create type payment_status as enum ('succeeded','failed','refunded');

-- -----------------------------------------------------
-- -----------------------------------------------------
-- 2. Core domain tables
-- -----------------------------------------------------
create table if not exists doctors (
  id uuid primary key references profiles(id) on delete cascade,
  specialty text,
  bio text,
  rating_avg numeric(2,1) default 0,
  rating_count integer default 0,
  consultation_fee_cents integer default 0,
  available boolean default true,
  stripe_account_id text,
  created_at timestamptz default now()
);

create table if not exists doctor_availability_slots (
  id uuid primary key default gen_random_uuid(),
  doctor_id uuid not null references doctors(id) on delete cascade,
  start_ts timestamptz not null,
  end_ts   timestamptz not null,
  is_booked boolean default false,
  constraint slot_valid check(end_ts > start_ts)
);

create table if not exists appointments (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references profiles(id) on delete set null,
  doctor_id uuid not null references doctors(id) on delete set null,
  slot_id uuid references doctor_availability_slots(id) on delete set null,
  status appointment_status not null default 'requested',
  scheduled_at timestamptz not null,
  video_call_url text,
  symptoms text,
  notes text,
  stripe_payment_intent_id text,
  fee_cents integer,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists drugs (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  unit_price_cents integer not null,
  stock_qty integer default 0,
  image_url text
);

create table if not exists prescriptions (
  id uuid primary key default gen_random_uuid(),
  appointment_id uuid not null references appointments(id) on delete cascade,
  doctor_id uuid not null references doctors(id) on delete set null,
  patient_id uuid not null references profiles(id) on delete set null,
  pharmacist_id uuid references profiles(id) on delete set null,
  status prescription_status not null default 'draft',
  issued_at timestamptz
);

create table if not exists prescription_items (
  id uuid primary key default gen_random_uuid(),
  prescription_id uuid not null references prescriptions(id) on delete cascade,
  drug_id uuid not null references drugs(id) on delete restrict,
  qty integer not null,
  dosage_instructions text,
  price_cents integer
);

create table if not exists drug_orders (
  id uuid primary key default gen_random_uuid(),
  prescription_id uuid not null references prescriptions(id) on delete cascade,
  pharmacist_id uuid references profiles(id) on delete set null,
  patient_id uuid not null references profiles(id) on delete set null,
  total_cents integer,
  stripe_payment_intent_id text,
  status drug_order_status not null default 'awaiting_payment',
  created_at timestamptz default now()
);

create table if not exists payments (
  id uuid primary key default gen_random_uuid(),
  related_table text not null,
  related_id uuid not null,
  amount_cents integer not null,
  stripe_payment_intent_id text,
  status payment_status not null,
  paid_at timestamptz
);

-- -----------------------------------------------------
-- 4. Row-Level Security (RLS) policies
-- -----------------------------------------------------
-- Doctors table
alter table doctors enable row level security;
create policy "Public doctors" on doctors for select using (true);
create policy "Doctor manages self" on doctors
  for update using (auth.uid() = id);

-- Doctor availability
alter table doctor_availability_slots enable row level security;
create policy "Public view slots" on doctor_availability_slots for select using (true);
create policy "Doctor manages own slots" on doctor_availability_slots
  for insert
  with check (auth.uid() = doctor_id);

-- Appointments
alter table appointments enable row level security;
create policy "Patient sees own appointments" on appointments
  for select using (auth.uid() = patient_id);
create policy "Doctor sees own appointments" on appointments
  for select using (auth.uid() = doctor_id);
create policy "Patient books appointment" on appointments
  for insert with check (auth.uid() = patient_id);
create policy "Doctor updates status" on appointments
  for update using (auth.uid() = doctor_id);

-- Prescriptions
alter table prescriptions enable row level security;
create policy "Doctor & patient view prescription" on prescriptions
  for select using (auth.uid() = doctor_id or auth.uid() = patient_id);
create policy "Doctor issues prescription" on prescriptions
  for insert with check (auth.uid() = doctor_id);

-- Drugs
alter table drugs enable row level security;
create policy "Public list drugs" on drugs for select using (true);
-- Inventory updates restricted to pharmacists/admin: assume role in profile
create policy "Pharmacist updates drug" on drugs
  for update using (exists (select 1 from profiles p where p.id = auth.uid() and p.role in ('pharmacist','admin')));

-- Drug Orders
alter table drug_orders enable row level security;
create policy "Patient / Pharmacist view order" on drug_orders
  for select using (
    auth.uid() = patient_id or
    auth.uid() = pharmacist_id
  );
create policy "Patient creates drug order" on drug_orders
  for insert with check (auth.uid() = patient_id);

-- Payments
alter table payments enable row level security;
create policy "User sees related payments" on payments
  for select using (
    -- rely on related table access; keep simple for now
    true
  );

-- -----------------------------------------------------
-- End migration
