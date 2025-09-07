-- Migration: drop legacy text column from skill_cards
-- Generated 2025-08-30

-- 1) Drop legacy index on text category, if it exists
DROP INDEX IF EXISTS public.idx_skill_cards_category;

-- 2) Drop the legacy text column
ALTER TABLE IF EXISTS public.skill_cards
  DROP COLUMN IF EXISTS category;
