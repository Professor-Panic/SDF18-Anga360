-- Trip linking. The API runs these on start-up (ensure_schema in app.py), so you only need
-- this file if you'd rather apply it by hand.

-- An invite now carries the trip it is for, and which role it invites.
ALTER TABLE invites
  ADD COLUMN IF NOT EXISTS flight_number varchar,
  ADD COLUMN IF NOT EXISTS flight_date   date,
  ADD COLUMN IF NOT EXISTS origin        varchar(3),
  ADD COLUMN IF NOT EXISTS destination   varchar(3),
  ADD COLUMN IF NOT EXISTS role          varchar;   -- 'picker-upper' | 'driver'

ALTER TABLE linked_trip_data ALTER COLUMN created_at SET DEFAULT now();
ALTER TABLE linked_trip_data ALTER COLUMN receiver_id DROP NOT NULL;  -- NULL = everyone on the trip

-- linked_trip_data.payload examples (receiver_id NULL = everyone on the trip):
--   {"type":"status","status":"landed"}
--   {"type":"status","status":"out"}
--   {"type":"location","kind":"flight","lat":-1.31,"lon":36.92,"source":"opensky"}
--   {"type":"location","kind":"personal","lat":-1.28,"lon":36.82,"accuracy_m":18}
--   {"type":"flight_visibility","hidden":true}   (traveller only)
