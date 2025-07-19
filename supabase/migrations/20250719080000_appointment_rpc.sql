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
RETURNS uuid -- returns appointment ID
LANGUAGE PLPGSQL SECURITY DEFINER
AS $$
DECLARE
  appt_id uuid := gen_random_uuid();
  slot_record record;
BEGIN
  -- Get slot details in transaction
  SELECT * INTO slot_record FROM doctor_availability_slots
  WHERE id = _slot AND is_booked = false
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Slot already booked or does not exist';
  END IF;

  -- Mark slot as booked
  UPDATE doctor_availability_slots
  SET is_booked = true
  WHERE id = _slot;

  -- Create appointment
  INSERT INTO appointments(id, patient_id, doctor_id, scheduled_at, status, slot_id)
  VALUES (
    appt_id,
    _patient,
    slot_record.doctor_id,
    slot_record.start_ts,
    'awaiting_payment',
    _slot
  );

  RETURN appt_id;
END;
$$;

-- Create doctor availability slots for a given week
CREATE OR REPLACE FUNCTION generate_weekly_slots(_doctor uuid, _start_date date, _weeks integer)
RETURNS void
LANGUAGE PLPGSQL
AS $$
DECLARE
  current_day date := _start_date;
  end_date date := _start_date + (_weeks * 7);
  slot_start timestamp;
  slot_end timestamp;
BEGIN
  WHILE current_day <= end_date LOOP
    -- Skip weekends (0=Sunday, 6=Saturday)
    IF EXTRACT(DOW FROM current_day) BETWEEN 1 AND 5 THEN
      -- Generate slots from 8AM to 5PM with 30-minute intervals
      FOR hour IN 8..16 LOOP
        -- First half-hour slot (e.g., 8:00-8:30)
        slot_start := current_day + make_interval(hours => hour);
        slot_end := slot_start + interval '30 minutes';
        
        INSERT INTO doctor_availability_slots (doctor_id, start_ts, end_ts, is_booked)
        VALUES (_doctor, slot_start, slot_end, false)
        ON CONFLICT DO NOTHING;
        
        -- Second half-hour slot (e.g., 8:30-9:00) - but not for the last hour
        IF hour < 16 THEN
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
