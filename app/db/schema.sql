CREATE TABLE IF NOT EXISTS atoms (
  id            TEXT PRIMARY KEY,
  name          TEXT NOT NULL,
  symbol        TEXT NOT NULL,
  mass          NUMERIC(10,4) NOT NULL,
  protons       INTEGER NOT NULL,
  neutrons      INTEGER NOT NULL,
  electrons     INTEGER NOT NULL,
  atom_type     TEXT NOT NULL,
  state_variant TEXT,
  image         TEXT NOT NULL DEFAULT ''
);

CREATE TABLE IF NOT EXISTS molecules (
  id         TEXT PRIMARY KEY,
  name       TEXT NOT NULL,
  formula    TEXT NOT NULL,
  molar_mass NUMERIC(10,4) NOT NULL,
  phase      TEXT NOT NULL,
  variant    TEXT,
  image      TEXT NOT NULL DEFAULT ''
);

CREATE INDEX IF NOT EXISTS idx_atoms_type ON atoms (atom_type);
CREATE INDEX IF NOT EXISTS idx_molecules_phase ON molecules (phase);

CREATE TABLE IF NOT EXISTS users (
  id            SERIAL PRIMARY KEY,
  first_name    TEXT NOT NULL,
  last_name     TEXT NOT NULL,
  email         TEXT NOT NULL,
  password_hash TEXT NOT NULL,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS users_email_lower_idx ON users (LOWER(email));

CREATE TABLE IF NOT EXISTS orders (
  id         SERIAL PRIMARY KEY,
  user_id    INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  first_name TEXT NOT NULL,
  last_name  TEXT NOT NULL,
  email      TEXT NOT NULL,
  phone      TEXT NOT NULL,
  address    TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS order_items (
  id       SERIAL PRIMARY KEY,
  order_id INTEGER NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  item_id  TEXT NOT NULL,
  name     TEXT NOT NULL,
  variant  TEXT NOT NULL,
  quantity INTEGER NOT NULL CHECK (quantity > 0)
);
CREATE INDEX IF NOT EXISTS idx_orders_user ON orders (user_id);
