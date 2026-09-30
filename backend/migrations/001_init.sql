-- ClinicFlow initial schema
CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE EXTENSION IF NOT EXISTS pg_trgm;

CREATE TYPE user_role AS ENUM ('admin', 'staff');
CREATE TYPE appointment_status AS ENUM ('pending', 'confirmed', 'cancelled');

CREATE TABLE users (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name     TEXT NOT NULL CHECK (char_length(full_name) BETWEEN 2 AND 100),
  email         TEXT NOT NULL UNIQUE CHECK (email = lower(email)),
  password_hash TEXT NOT NULL,
  role          user_role NOT NULL DEFAULT 'staff',
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE patients (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name   TEXT NOT NULL CHECK (char_length(full_name) BETWEEN 2 AND 100),
  cin         TEXT NOT NULL UNIQUE CHECK (cin ~ '^[A-Z0-9]{4,20}$'),
  phone       TEXT NOT NULL,
  birth_date  DATE NOT NULL CHECK (birth_date >= DATE '1900-01-01' AND birth_date <= CURRENT_DATE),
  address     TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE appointments (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id       UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  appointment_date TIMESTAMPTZ NOT NULL,
  status           appointment_status NOT NULL DEFAULT 'pending',
  reason           TEXT NOT NULL CHECK (char_length(reason) BETWEEN 3 AND 200),
  notes            TEXT CHECK (notes IS NULL OR char_length(notes) <= 1000),
  created_by       UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Patient search: ILIKE '%term%' on name and CIN (trigram GIN handles infix matches)
CREATE INDEX idx_patients_full_name_trgm ON patients USING gin (full_name gin_trgm_ops);
CREATE INDEX idx_patients_cin_trgm ON patients USING gin (cin gin_trgm_ops);

-- Appointment access patterns
-- (patient_id, appointment_date): patient details list + 30-minute conflict check
CREATE INDEX idx_appointments_patient_date ON appointments (patient_id, appointment_date);
-- appointment_date: day filter and "today" count (range scans)
CREATE INDEX idx_appointments_date ON appointments (appointment_date);
-- status: status filter and pending/confirmed counts
CREATE INDEX idx_appointments_status ON appointments (status);
-- created_by: FK lookups when checking ON DELETE RESTRICT
CREATE INDEX idx_appointments_created_by ON appointments (created_by);
