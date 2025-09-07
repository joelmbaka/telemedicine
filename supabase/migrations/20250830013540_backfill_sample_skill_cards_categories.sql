-- Migration: backfill specific sample skill_cards with categories/subcategories
-- Generated 2025-08-30
-- Notes:
-- - We set subcategory_id by key; the trigger `ensure_skill_cards_category_consistency`
--   will auto-fill category_id to the subcategory's category.
-- - Idempotent: only updates when the stored subcategory differs.

-- 1) Tumor Board Leadership -> Oncology / medical_oncology
update public.skill_cards sc
set subcategory_id = ss.id
from public.skill_subcategories ss
where sc.id = '8051fa2f-e3fb-4723-a195-9187b18fd8ed'
  and ss.key = 'medical_oncology'
  and (sc.subcategory_id is distinct from ss.id);

-- 2) Palliative Pain Management -> PMR / pain
update public.skill_cards sc
set subcategory_id = ss.id
from public.skill_subcategories ss
where sc.id = '328b61e2-871f-4cdc-9890-1149beb16a05'
  and ss.key = 'pain'
  and (sc.subcategory_id is distinct from ss.id);

-- 3) Chemotherapy Administration -> Oncology / medical_oncology
update public.skill_cards sc
set subcategory_id = ss.id
from public.skill_subcategories ss
where sc.id = '57908129-563b-4c93-b080-55a2fef09ac1'
  and ss.key = 'medical_oncology'
  and (sc.subcategory_id is distinct from ss.id);
