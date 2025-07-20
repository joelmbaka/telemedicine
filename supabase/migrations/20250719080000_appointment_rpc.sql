-- +migrate Up

-- Get available slots for a doctor on a specific day
CREATE OR REPLACE FUNCTION get_free_slots(_doctor uuid, _day date)
RETURNS TABLE(id uuid, start_time timestamptz)
LANGUAGE SQL SECURITY DEFINER
AS $$
  SELECT id, start_ts AS start_time
  FROM doctor_availability_slots
  WHERE doctor_id = _doctor
    AND is_booked = false
    AND start_ts::date = _day;
$$;

-- Book a slot atomically
CREATE OR REPLACE FUNCTION book_slot(_slot uuid, _patient uuid)
RETURNS TABLE(id uuid, fee_cents integer) -- returns appointment ID and fee
LANGUAGE PLPGSQL SECURITY DEFINER
AS $$
DECLARE
  appt_id uuid := gen_random_uuid();
  slot_record record;
  fee integer;
BEGIN
  -- Get slot details in transaction
  SELECT * INTO slot_record FROM doctor_availability_slots
  WHERE id = _slot AND is_booked = false
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Slot already booked or does not exist';
  END IF;

  -- Get doctor's fee
  SELECT consultation_fee_cents INTO fee
  FROM doctors WHERE id = slot_record.doctor_id;

  -- Mark slot as booked
  UPDATE doctor_availability_slots
  SET is_booked = true
  WHERE id = _slot;

  -- Create appointment
  INSERT INTO appointments(id, patient_id, doctor_id, scheduled_at, status, slot_id, fee_cents)
  VALUES (
    appt_id,
    _patient,
    slot_record.doctor_id,
    slot_record.start_ts,
    'awaiting_payment',
    _slot,
    fee
  );

  RETURN QUERY SELECT appt_id, fee;
END;
$$;

CREATE OR REPLACE FUNCTION generate_weekly_slots(_doctor uuid, _start_date date, _weeks integer)
RETURNS void
LANGUAGE PLPGSQL
AS $$
DECLARE
  current_day date;
  end_date date;
  slot_start timestamptz;
  slot_end timestamptz;
  day_of_week integer;
  days_until_monday integer;
BEGIN
  -- Calculate next Monday (or today if it's already Monday)
  day_of_week := EXTRACT(ISODOW FROM _start_date);
  days_until_monday := CASE 
    WHEN day_of_week = 1 THEN 0  -- Already Monday
    ELSE (8 - day_of_week)::int % 7  -- Days until next Monday
  END;
  
  current_day := _start_date + (days_until_monday * interval '1 day');
  end_date := current_day + (_weeks * 7);
  
  WHILE current_day <= end_date LOOP
    -- Skip weekends (0=Sunday, 6=Saturday)
    IF EXTRACT(ISODOW FROM current_day) BETWEEN 1 AND 5 THEN
      -- Generate slots from 8AM to 5PM with 30-minute intervals
      FOR hour IN 8..16 LOOP  -- 8AM to 4PM
        -- First half-hour slot (e.g., 8:00-8:30)
        slot_start := make_timestamptz(
          EXTRACT(YEAR FROM current_day)::int,
          EXTRACT(MONTH FROM current_day)::int,
          EXTRACT(DAY FROM current_day)::int,
          hour, 0, 0,
          'Africa/Nairobi'
        );
        slot_end := slot_start + interval '30 minutes';
        
        INSERT INTO doctor_availability_slots (doctor_id, start_ts, end_ts, is_booked)
        VALUES (_doctor, slot_start, slot_end, false)
        ON CONFLICT DO NOTHING;
        
        -- Second half-hour slot (e.g., 8:30-9:00) - including 4:30-5:00
        IF hour < 16 OR (hour = 16) THEN
          slot_start := slot_start + interval '30 minutes';
          slot_end := slot_end + interval '30 minutes';
          
          INSERT INTO doctor_availability_slots (doctor_id, start_ts, end_ts, is_booked)
          VALUES (_doctor, slot_start, slot_end, false)
          ON CONFLICT DO NOTHING;
        END IF;
      END LOOP;
    END IF;
    current_day := current_day + 1;
  END LOOP;
END;
$$;

-- +migrate Down
DROP FUNCTION IF EXISTS get_free_slots(uuid, date);
DROP FUNCTION IF EXISTS book_slot(uuid, uuid);
DROP FUNCTION IF EXISTS generate_weekly_slots(uuid, date, integer);
