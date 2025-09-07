-- Migration: link skill_cards to categories via FKs, backfill, and add consistency trigger
-- Generated 2025-08-30

-- 1) Add FK columns (nullable for gradual rollout)
alter table if exists public.skill_cards
  add column if not exists category_id uuid references public.skill_categories(id) on delete set null,
  add column if not exists subcategory_id uuid references public.skill_subcategories(id) on delete set null;

-- 2) Indexes for filtering
create index if not exists idx_skill_cards_category_id on public.skill_cards(category_id);
create index if not exists idx_skill_cards_subcategory_id on public.skill_cards(subcategory_id);

-- 3) Backfill category_id from legacy text column where possible
update public.skill_cards sc
set category_id = c.id
from public.skill_categories c
where sc.category is not null
  and sc.category_id is null
  and sc.category = c.key;

-- 4) Trigger to ensure subcategory belongs to category, and to auto-fill category from subcategory
create or replace function public.ensure_skill_cards_category_consistency()
returns trigger
language plpgsql
as $$
declare
  v_sub_cat uuid;
begin
  if NEW.subcategory_id is not null then
    select category_id into v_sub_cat from public.skill_subcategories where id = NEW.subcategory_id;
    if v_sub_cat is null then
      raise exception 'Invalid subcategory_id %', NEW.subcategory_id;
    end if;

    if NEW.category_id is null then
      NEW.category_id := v_sub_cat;
    elsif NEW.category_id <> v_sub_cat then
      raise exception 'subcategory_id % does not belong to category_id %', NEW.subcategory_id, NEW.category_id;
    end if;
  end if;
  return NEW;
end;
$$;

drop trigger if exists trg_skill_cards_category_consistency on public.skill_cards;
create trigger trg_skill_cards_category_consistency
before insert or update on public.skill_cards
for each row execute function public.ensure_skill_cards_category_consistency();
