-- Өөрөө бүртгүүлэх: хэн ч утсаараа (verify.mn SMS) бүртгүүлж болно.
-- Ажилтны бүртгээгүй дугаар бол баталгаажсаны дараа тоотгүй (unit_id = NULL) хэрэглэгч үүснэ —
-- ажилтан "Холбогдоогүй бүртгэл"-ээс тоотод холбосны дараа нэвтэрнэ.
-- Тиймээс phone_verifications.user_id хоосон байж болно (хэрэглэгч хараахан үүсээгүй).
-- (Энэ хүснэгт 0005-д үүсч, одоогоор зөвхөн түр баталгаажуулалт хадгалдаг тул дахин үүсгэнэ)

DROP TABLE phone_verifications;

CREATE TABLE phone_verifications (
  id TEXT PRIMARY KEY,
  user_id INTEGER REFERENCES users (id) ON DELETE CASCADE,
  phone TEXT NOT NULL,
  session_id TEXT NOT NULL,
  code TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'verified', 'used', 'expired')),
  expires_at TEXT NOT NULL,
  verified_at TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now', '+8 hours'))
);
CREATE INDEX phone_verifications_phone_index ON phone_verifications (phone, created_at);
