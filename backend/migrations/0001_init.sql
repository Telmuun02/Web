-- СӨХ Hub — D1 (SQLite) анхны бүтэц
-- MySQL дээрх 15 knex migration-ий эцсийн төлөвийг нэг файлд буулгав.
-- Огноо-цагийг Монголын цагаар (UTC+8) 'YYYY-MM-DD HH:MM:SS' текстээр хадгална.
-- enum → CHECK, tinyint(1) → INTEGER 0/1, decimal → REAL.

CREATE TABLE buildings (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  address TEXT NOT NULL,
  district TEXT,
  khoroo TEXT,
  built_year INTEGER,
  phone TEXT,
  bank_name TEXT,
  bank_account TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now', '+8 hours')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now', '+8 hours'))
);

CREATE TABLE admins (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  phone TEXT UNIQUE,
  email TEXT UNIQUE,
  password_hash TEXT,
  position TEXT NOT NULL DEFAULT 'staff' CHECK (position IN ('chairman', 'accountant', 'technician', 'staff')),
  hired_at TEXT,
  active INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT (datetime('now', '+8 hours')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now', '+8 hours'))
);

CREATE TABLE entrances (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  building_id INTEGER NOT NULL REFERENCES buildings (id) ON DELETE RESTRICT,
  number INTEGER NOT NULL,
  floors INTEGER,
  has_elevator INTEGER NOT NULL DEFAULT 1,
  door_code TEXT,
  leader_id INTEGER REFERENCES users (id) ON DELETE SET NULL,
  manager_id INTEGER REFERENCES admins (id) ON DELETE RESTRICT,
  created_at TEXT NOT NULL DEFAULT (datetime('now', '+8 hours')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now', '+8 hours')),
  UNIQUE (building_id, number)
);

CREATE TABLE units (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  entrance_id INTEGER NOT NULL REFERENCES entrances (id) ON DELETE RESTRICT,
  code TEXT NOT NULL,
  floor INTEGER,
  area_m2 REAL,
  created_at TEXT NOT NULL DEFAULT (datetime('now', '+8 hours')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now', '+8 hours')),
  UNIQUE (entrance_id, code)
);

CREATE TABLE users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  unit_id INTEGER REFERENCES units (id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  phone TEXT UNIQUE,
  email TEXT UNIQUE,
  password_hash TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now', '+8 hours')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now', '+8 hours'))
);
CREATE INDEX users_unit_id_index ON users (unit_id);

CREATE TABLE invoices (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  unit_id INTEGER NOT NULL REFERENCES units (id) ON DELETE RESTRICT,
  period TEXT NOT NULL,
  amount INTEGER NOT NULL,
  due_date TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'unpaid' CHECK (status IN ('unpaid', 'partial', 'paid')),
  created_at TEXT NOT NULL DEFAULT (datetime('now', '+8 hours')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now', '+8 hours')),
  UNIQUE (unit_id, period)
);
CREATE INDEX invoices_period_status_index ON invoices (period, status);

CREATE TABLE invoice_lines (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  invoice_id INTEGER NOT NULL REFERENCES invoices (id) ON DELETE CASCADE,
  position INTEGER NOT NULL,
  name TEXT NOT NULL,
  amount INTEGER NOT NULL,
  UNIQUE (invoice_id, position)
);

CREATE TABLE payments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  invoice_id INTEGER NOT NULL REFERENCES invoices (id) ON DELETE RESTRICT,
  amount INTEGER NOT NULL,
  method TEXT NOT NULL DEFAULT 'bank' CHECK (method IN ('cash', 'bank', 'qpay', 'card')),
  paid_at TEXT NOT NULL DEFAULT (datetime('now', '+8 hours')),
  note TEXT,
  recorded_by INTEGER REFERENCES admins (id) ON DELETE RESTRICT,
  created_at TEXT NOT NULL DEFAULT (datetime('now', '+8 hours')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now', '+8 hours'))
);
CREATE INDEX payments_invoice_id_index ON payments (invoice_id);
CREATE INDEX payments_paid_at_index ON payments (paid_at);
CREATE INDEX payments_recorded_by_index ON payments (recorded_by);

CREATE TABLE requests (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  unit_id INTEGER REFERENCES units (id) ON DELETE SET NULL,
  created_by INTEGER REFERENCES users (id) ON DELETE SET NULL,
  assigned_to INTEGER REFERENCES admins (id) ON DELETE RESTRICT,
  category TEXT NOT NULL CHECK (category IN ('plumbing', 'electrical', 'cleaning', 'elevator', 'other')),
  title TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'resolved', 'rejected')),
  resolved_at TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now', '+8 hours')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now', '+8 hours'))
);
CREATE INDEX requests_status_category_index ON requests (status, category);
CREATE INDEX requests_unit_id_index ON requests (unit_id);

CREATE TABLE polls (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  created_by INTEGER REFERENCES admins (id) ON DELETE RESTRICT,
  title TEXT NOT NULL,
  description TEXT,
  threshold_percent INTEGER NOT NULL DEFAULT 50,
  starts_at TEXT NOT NULL DEFAULT (datetime('now', '+8 hours')),
  ends_at TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now', '+8 hours')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now', '+8 hours'))
);

CREATE TABLE poll_options (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  poll_id INTEGER NOT NULL REFERENCES polls (id) ON DELETE CASCADE,
  label TEXT NOT NULL,
  position INTEGER NOT NULL DEFAULT 0,
  UNIQUE (id, poll_id)
);
CREATE INDEX poll_options_poll_id_index ON poll_options (poll_id);

CREATE TABLE poll_votes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  poll_id INTEGER NOT NULL REFERENCES polls (id) ON DELETE CASCADE,
  option_id INTEGER NOT NULL,
  unit_id INTEGER NOT NULL REFERENCES units (id) ON DELETE RESTRICT,
  user_id INTEGER REFERENCES users (id) ON DELETE SET NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now', '+8 hours')),
  UNIQUE (poll_id, unit_id),
  FOREIGN KEY (option_id, poll_id) REFERENCES poll_options (id, poll_id) ON DELETE CASCADE
);

CREATE TABLE announcements (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  created_by INTEGER REFERENCES admins (id) ON DELETE RESTRICT,
  entrance_id INTEGER REFERENCES entrances (id) ON DELETE RESTRICT,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  sms INTEGER NOT NULL DEFAULT 0,
  important INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now', '+8 hours')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now', '+8 hours'))
);
CREATE INDEX announcements_created_at_index ON announcements (created_at);

CREATE TABLE meetings (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  description TEXT,
  starts_at TEXT NOT NULL,
  ends_at TEXT NOT NULL,
  location TEXT NOT NULL DEFAULT 'Онлайн',
  online INTEGER NOT NULL DEFAULT 1,
  created_by INTEGER REFERENCES admins (id) ON DELETE RESTRICT,
  created_at TEXT NOT NULL DEFAULT (datetime('now', '+8 hours')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now', '+8 hours'))
);
CREATE INDEX meetings_starts_at_index ON meetings (starts_at);

CREATE TABLE meeting_agenda (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  meeting_id INTEGER NOT NULL REFERENCES meetings (id) ON DELETE CASCADE,
  position INTEGER NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  poll_id INTEGER REFERENCES polls (id) ON DELETE SET NULL,
  UNIQUE (meeting_id, position)
);

CREATE TABLE expenses (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  period TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('salary', 'utilities', 'elevator', 'cleaning', 'electricity', 'repair', 'other')),
  title TEXT NOT NULL,
  amount INTEGER NOT NULL,
  spent_at TEXT NOT NULL,
  recorded_by INTEGER REFERENCES admins (id) ON DELETE RESTRICT,
  created_at TEXT NOT NULL DEFAULT (datetime('now', '+8 hours')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now', '+8 hours'))
);
CREATE INDEX expenses_period_index ON expenses (period);
