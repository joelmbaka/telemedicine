-- +migrate Up
-- RPC to issue prescription and its items in one transaction
CREATE OR REPLACE FUNCTION issue_prescription(
  _appointment uuid,
  _items jsonb  -- expects array of {drug_id, qty, dosage, price_cents}
)
RETURNS uuid
LANGUAGE plpgsql SECURITY DEFINER
AS $$
DECLARE
  presc_id uuid := gen_random_uuid();
  appt_record RECORD;
  itm jsonb;
BEGIN
  -- ensure appointment exists and fetch doctor / patient
  SELECT * INTO appt_record FROM appointments WHERE id = _appointment;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Appointment % not found', _appointment;
  END IF;

  -- create prescription row (draft)
  INSERT INTO prescriptions(id, appointment_id, doctor_id, patient_id, status, issued_at)
  VALUES (presc_id, _appointment, appt_record.doctor_id, appt_record.patient_id, 'issued', now());

  -- insert items
  FOR itm IN SELECT * FROM jsonb_array_elements(_items)
  LOOP
    INSERT INTO prescription_items(id, prescription_id, drug_id, qty, dosage_instructions, price_cents)
    VALUES (
      gen_random_uuid(), presc_id,
      (itm->>'drug_id')::uuid,
      (itm->>'qty')::int,
      itm->>'dosage',
      (itm->>'price_cents')::int
    );
  END LOOP;

  -- mark appointment complete automatically (optional)
  UPDATE appointments SET status = 'complete', updated_at = now() WHERE id = _appointment;

  RETURN presc_id;
END;
$$;

