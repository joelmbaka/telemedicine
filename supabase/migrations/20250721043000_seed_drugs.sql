-- +migrate Up
-- Seed initial drugs catalogue
INSERT INTO public.drugs (id, name, description, unit_price_cents, stock_qty, image_url)
VALUES
  (gen_random_uuid(), 'Paracetamol 500mg', 'Pain and fever reducer', 500, 1000, NULL),
  (gen_random_uuid(), 'Ibuprofen 200mg', 'NSAID pain reliever and anti-inflammatory', 700, 800, NULL),
  (gen_random_uuid(), 'Amoxicillin 250mg', 'Broad-spectrum antibiotic', 1200, 500, NULL),
  (gen_random_uuid(), 'Cetirizine 10mg', 'Antihistamine for allergy relief', 650, 600, NULL),
  (gen_random_uuid(), 'Omeprazole 20mg', 'Proton-pump inhibitor for acid reflux', 1500, 400, NULL);
