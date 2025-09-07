-- Migration: create skill_categories and skill_subcategories, and seed allowed values
-- Generated 2025-08-30

-- 1) Tables
create table if not exists public.skill_categories (
  id uuid primary key default gen_random_uuid(),
  key text not null unique,
  name text not null,
  emoji text,
  created_at timestamptz default now()
);

create table if not exists public.skill_subcategories (
  id uuid primary key default gen_random_uuid(),
  key text not null unique,
  name text not null,
  category_id uuid not null references public.skill_categories(id) on delete cascade,
  created_at timestamptz default now()
);

-- 2) Indexes
create index if not exists idx_skill_subcategories_category_id on public.skill_subcategories(category_id);

-- 3) RLS (read-only public)
alter table public.skill_categories enable row level security;
alter table public.skill_subcategories enable row level security;

create policy "Public read categories" on public.skill_categories for select using (true);
create policy "Public read subcategories" on public.skill_subcategories for select using (true);

-- 4) Seed categories
insert into public.skill_categories (key, name, emoji) values
  ('primary_care','Primary Care','🩺'),
  ('pediatrics','Pediatrics','🧒'),
  ('cardiology','Cardiology','❤️'),
  ('dermatology','Dermatology','🧴'),
  ('neurology','Neurology','🧠'),
  ('psychiatry','Psychiatry','🧩'),
  ('orthopedics','Orthopedics','🦴'),
  ('obgyn','OB/GYN','🤰'),
  ('endocrinology','Endocrinology','🧬'),
  ('gastroenterology','Gastroenterology','🩻'),
  ('pulmonology','Pulmonology','🌬️'),
  ('oncology','Oncology','🎗️'),
  ('rheumatology','Rheumatology','🦠'),
  ('urology','Urology','💧'),
  ('ophthalmology','Ophthalmology','👁️'),
  ('ent','ENT','👂'),
  ('infectious_disease','Infectious Disease','🧫'),
  ('allergy_immunology','Allergy & Immunology','🤧'),
  ('nephrology','Nephrology','🩸'),
  ('pmr','Physical Med & Rehab','🏃')
  on conflict (key) do nothing;

-- 5) Seed subcategories (each statement uses category key lookup)
insert into public.skill_subcategories (key, name, category_id)
select 'family_medicine','Family Medicine', id from public.skill_categories where key='primary_care'
  on conflict (key) do nothing;
insert into public.skill_subcategories (key, name, category_id)
select 'internal_medicine','Internal Medicine', id from public.skill_categories where key='primary_care'
  on conflict (key) do nothing;
insert into public.skill_subcategories (key, name, category_id)
select 'geriatrics','Geriatrics', id from public.skill_categories where key='primary_care'
  on conflict (key) do nothing;
insert into public.skill_subcategories (key, name, category_id)
select 'general_practice','General Practice', id from public.skill_categories where key='primary_care'
  on conflict (key) do nothing;

insert into public.skill_subcategories (key, name, category_id)
select 'neonatology','Neonatology', id from public.skill_categories where key='pediatrics'
  on conflict (key) do nothing;
insert into public.skill_subcategories (key, name, category_id)
select 'adolescent_medicine','Adolescent Medicine', id from public.skill_categories where key='pediatrics'
  on conflict (key) do nothing;
insert into public.skill_subcategories (key, name, category_id)
select 'peds_cardiology','Pediatric Cardiology', id from public.skill_categories where key='pediatrics'
  on conflict (key) do nothing;
insert into public.skill_subcategories (key, name, category_id)
select 'peds_endocrinology','Pediatric Endocrinology', id from public.skill_categories where key='pediatrics'
  on conflict (key) do nothing;

insert into public.skill_subcategories (key, name, category_id)
select 'interventional','Interventional', id from public.skill_categories where key='cardiology'
  on conflict (key) do nothing;
insert into public.skill_subcategories (key, name, category_id)
select 'electrophysiology','Electrophysiology', id from public.skill_categories where key='cardiology'
  on conflict (key) do nothing;
insert into public.skill_subcategories (key, name, category_id)
select 'heart_failure','Heart Failure', id from public.skill_categories where key='cardiology'
  on conflict (key) do nothing;
insert into public.skill_subcategories (key, name, category_id)
select 'echocardiography','Echocardiography', id from public.skill_categories where key='cardiology'
  on conflict (key) do nothing;

insert into public.skill_subcategories (key, name, category_id)
select 'cosmetic','Cosmetic', id from public.skill_categories where key='dermatology'
  on conflict (key) do nothing;
insert into public.skill_subcategories (key, name, category_id)
select 'pediatric_derm','Pediatric Derm', id from public.skill_categories where key='dermatology'
  on conflict (key) do nothing;
insert into public.skill_subcategories (key, name, category_id)
select 'dermatopathology','Dermatopathology', id from public.skill_categories where key='dermatology'
  on conflict (key) do nothing;
insert into public.skill_subcategories (key, name, category_id)
select 'medical_derm','Medical Derm', id from public.skill_categories where key='dermatology'
  on conflict (key) do nothing;

insert into public.skill_subcategories (key, name, category_id)
select 'epilepsy','Epilepsy', id from public.skill_categories where key='neurology'
  on conflict (key) do nothing;
insert into public.skill_subcategories (key, name, category_id)
select 'stroke','Stroke', id from public.skill_categories where key='neurology'
  on conflict (key) do nothing;
insert into public.skill_subcategories (key, name, category_id)
select 'movement_disorders','Movement Disorders', id from public.skill_categories where key='neurology'
  on conflict (key) do nothing;
insert into public.skill_subcategories (key, name, category_id)
select 'headache','Headache', id from public.skill_categories where key='neurology'
  on conflict (key) do nothing;

insert into public.skill_subcategories (key, name, category_id)
select 'adult','Adult', id from public.skill_categories where key='psychiatry'
  on conflict (key) do nothing;
insert into public.skill_subcategories (key, name, category_id)
select 'child_adolescent','Child & Adolescent', id from public.skill_categories where key='psychiatry'
  on conflict (key) do nothing;
insert into public.skill_subcategories (key, name, category_id)
select 'geriatric_psych','Geriatric', id from public.skill_categories where key='psychiatry'
  on conflict (key) do nothing;
insert into public.skill_subcategories (key, name, category_id)
select 'addiction','Addiction', id from public.skill_categories where key='psychiatry'
  on conflict (key) do nothing;

insert into public.skill_subcategories (key, name, category_id)
select 'sports_medicine','Sports Medicine', id from public.skill_categories where key='orthopedics'
  on conflict (key) do nothing;
insert into public.skill_subcategories (key, name, category_id)
select 'spine','Spine', id from public.skill_categories where key='orthopedics'
  on conflict (key) do nothing;
insert into public.skill_subcategories (key, name, category_id)
select 'hand','Hand', id from public.skill_categories where key='orthopedics'
  on conflict (key) do nothing;
insert into public.skill_subcategories (key, name, category_id)
select 'joint_replacement','Joint Replacement', id from public.skill_categories where key='orthopedics'
  on conflict (key) do nothing;

insert into public.skill_subcategories (key, name, category_id)
select 'maternal_fetal','Maternal-Fetal', id from public.skill_categories where key='obgyn'
  on conflict (key) do nothing;
insert into public.skill_subcategories (key, name, category_id)
select 'reproductive_endocrinology','Reproductive Endocrinology', id from public.skill_categories where key='obgyn'
  on conflict (key) do nothing;
insert into public.skill_subcategories (key, name, category_id)
select 'gyn_oncology','Gynecologic Oncology', id from public.skill_categories where key='obgyn'
  on conflict (key) do nothing;
insert into public.skill_subcategories (key, name, category_id)
select 'urogynecology','Urogynecology', id from public.skill_categories where key='obgyn'
  on conflict (key) do nothing;

insert into public.skill_subcategories (key, name, category_id)
select 'diabetes','Diabetes', id from public.skill_categories where key='endocrinology'
  on conflict (key) do nothing;
insert into public.skill_subcategories (key, name, category_id)
select 'thyroid','Thyroid', id from public.skill_categories where key='endocrinology'
  on conflict (key) do nothing;
insert into public.skill_subcategories (key, name, category_id)
select 'metabolic_bone','Metabolic Bone', id from public.skill_categories where key='endocrinology'
  on conflict (key) do nothing;

insert into public.skill_subcategories (key, name, category_id)
select 'hepatology','Hepatology', id from public.skill_categories where key='gastroenterology'
  on conflict (key) do nothing;
insert into public.skill_subcategories (key, name, category_id)
select 'ibd','Inflammatory Bowel Disease', id from public.skill_categories where key='gastroenterology'
  on conflict (key) do nothing;
insert into public.skill_subcategories (key, name, category_id)
select 'advanced_endoscopy','Advanced Endoscopy', id from public.skill_categories where key='gastroenterology'
  on conflict (key) do nothing;

insert into public.skill_subcategories (key, name, category_id)
select 'sleep_medicine','Sleep Medicine', id from public.skill_categories where key='pulmonology'
  on conflict (key) do nothing;
insert into public.skill_subcategories (key, name, category_id)
select 'critical_care','Critical Care', id from public.skill_categories where key='pulmonology'
  on conflict (key) do nothing;
insert into public.skill_subcategories (key, name, category_id)
select 'asthma_copd','Asthma/COPD', id from public.skill_categories where key='pulmonology'
  on conflict (key) do nothing;

insert into public.skill_subcategories (key, name, category_id)
select 'medical_oncology','Medical Oncology', id from public.skill_categories where key='oncology'
  on conflict (key) do nothing;
insert into public.skill_subcategories (key, name, category_id)
select 'radiation_oncology','Radiation Oncology', id from public.skill_categories where key='oncology'
  on conflict (key) do nothing;
insert into public.skill_subcategories (key, name, category_id)
select 'surgical_oncology','Surgical Oncology', id from public.skill_categories where key='oncology'
  on conflict (key) do nothing;

insert into public.skill_subcategories (key, name, category_id)
select 'autoimmune','Autoimmune', id from public.skill_categories where key='rheumatology'
  on conflict (key) do nothing;
insert into public.skill_subcategories (key, name, category_id)
select 'lupus','Lupus', id from public.skill_categories where key='rheumatology'
  on conflict (key) do nothing;
insert into public.skill_subcategories (key, name, category_id)
select 'arthritis','Arthritis', id from public.skill_categories where key='rheumatology'
  on conflict (key) do nothing;

insert into public.skill_subcategories (key, name, category_id)
select 'female_urology','Female Urology', id from public.skill_categories where key='urology'
  on conflict (key) do nothing;
insert into public.skill_subcategories (key, name, category_id)
select 'endourology','Endourology', id from public.skill_categories where key='urology'
  on conflict (key) do nothing;
insert into public.skill_subcategories (key, name, category_id)
select 'urologic_oncology','Urologic Oncology', id from public.skill_categories where key='urology'
  on conflict (key) do nothing;

insert into public.skill_subcategories (key, name, category_id)
select 'retina','Retina', id from public.skill_categories where key='ophthalmology'
  on conflict (key) do nothing;
insert into public.skill_subcategories (key, name, category_id)
select 'glaucoma','Glaucoma', id from public.skill_categories where key='ophthalmology'
  on conflict (key) do nothing;
insert into public.skill_subcategories (key, name, category_id)
select 'cornea','Cornea', id from public.skill_categories where key='ophthalmology'
  on conflict (key) do nothing;
insert into public.skill_subcategories (key, name, category_id)
select 'pediatric_oph','Pediatric Ophthalmology', id from public.skill_categories where key='ophthalmology'
  on conflict (key) do nothing;

insert into public.skill_subcategories (key, name, category_id)
select 'otology','Otology', id from public.skill_categories where key='ent'
  on conflict (key) do nothing;
insert into public.skill_subcategories (key, name, category_id)
select 'rhinology','Rhinology', id from public.skill_categories where key='ent'
  on conflict (key) do nothing;
insert into public.skill_subcategories (key, name, category_id)
select 'laryngology','Laryngology', id from public.skill_categories where key='ent'
  on conflict (key) do nothing;
insert into public.skill_subcategories (key, name, category_id)
select 'head_neck','Head & Neck', id from public.skill_categories where key='ent'
  on conflict (key) do nothing;

insert into public.skill_subcategories (key, name, category_id)
select 'hiv','HIV', id from public.skill_categories where key='infectious_disease'
  on conflict (key) do nothing;
insert into public.skill_subcategories (key, name, category_id)
select 'tropical_medicine','Tropical Medicine', id from public.skill_categories where key='infectious_disease'
  on conflict (key) do nothing;
insert into public.skill_subcategories (key, name, category_id)
select 'antimicrobial_stewardship','Antimicrobial Stewardship', id from public.skill_categories where key='infectious_disease'
  on conflict (key) do nothing;

insert into public.skill_subcategories (key, name, category_id)
select 'adult_allergy','Adult Allergy', id from public.skill_categories where key='allergy_immunology'
  on conflict (key) do nothing;
insert into public.skill_subcategories (key, name, category_id)
select 'peds_allergy','Pediatric Allergy', id from public.skill_categories where key='allergy_immunology'
  on conflict (key) do nothing;
insert into public.skill_subcategories (key, name, category_id)
select 'asthma','Asthma', id from public.skill_categories where key='allergy_immunology'
  on conflict (key) do nothing;

insert into public.skill_subcategories (key, name, category_id)
select 'dialysis','Dialysis', id from public.skill_categories where key='nephrology'
  on conflict (key) do nothing;
insert into public.skill_subcategories (key, name, category_id)
select 'transplant','Transplant', id from public.skill_categories where key='nephrology'
  on conflict (key) do nothing;
insert into public.skill_subcategories (key, name, category_id)
select 'hypertension','Hypertension', id from public.skill_categories where key='nephrology'
  on conflict (key) do nothing;

insert into public.skill_subcategories (key, name, category_id)
select 'sports','Sports', id from public.skill_categories where key='pmr'
  on conflict (key) do nothing;
insert into public.skill_subcategories (key, name, category_id)
select 'pain','Pain', id from public.skill_categories where key='pmr'
  on conflict (key) do nothing;
insert into public.skill_subcategories (key, name, category_id)
select 'neurorehab','Neurorehab', id from public.skill_categories where key='pmr'
  on conflict (key) do nothing;
