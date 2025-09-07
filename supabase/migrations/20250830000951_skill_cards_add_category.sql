-- Migration: add category to skill_cards for browsing/filtering
-- Generated 2025-08-30

-- Safely add a new nullable category column for skills
alter table if exists skill_cards
  add column if not exists category text;

-- Helpful index for filtering by category
create index if not exists idx_skill_cards_category on skill_cards(category);
