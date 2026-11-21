-- Оршин суугчийн бүртгэл утсаар (verify.mn — reverse SMS)
--   Ажилтан тоот бүрт утас бүртгэнэ (users мөр: unit_id + phone, нууц үггүй).
--   Оршин суугч тэр утсаараа 144773 руу код илгээж баталгаажуулаад нууц үгээ тохируулна.
--   Нэг тоотод олон утас байж болно. Оршин суугч "1-01 тоот" гэж харагдана (users.name = тоот).
--   Имэйл оршин суугчдад ашиглагдахгүй.

CREATE TABLE phone_verifications (
  id TEXT PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  phone TEXT NOT NULL,
  session_id TEXT NOT NULL,
  code TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'verified', 'used', 'expired')),
  expires_at TEXT NOT NULL,
  verified_at TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now', '+8 hours'))
);
CREATE INDEX phone_verifications_phone_index ON phone_verifications (phone, created_at);

-- Утасны дугаарыг нэг хэлбэрт (8 орон, зай/зураас/976-гүй) — нэвтрэх, баталгаажуулахад ингэж хайдаг
UPDATE users SET phone = replace(replace(replace(replace(phone, ' ', ''), '-', ''), '+', ''), '(', '') WHERE phone IS NOT NULL;
UPDATE users SET phone = substr(phone, 4) WHERE phone LIKE '976________';

-- СӨХ-тэй хувийн чат хүнээс тоот руу шилжинэ: 'soh:<users.id>' → 'soh:<units.id>'
-- (шилжүүлэхгүй бол өрөөний дугаар өөр тоотынх болж, бусдын хувийн чатыг харах эрсдэлтэй)
UPDATE chat_messages SET room = 'soh:' || (SELECT unit_id FROM users WHERE users.id = CAST(substr(chat_messages.room, 5) AS INTEGER))
  WHERE room LIKE 'soh:%' AND (SELECT unit_id FROM users WHERE users.id = CAST(substr(chat_messages.room, 5) AS INTEGER)) IS NOT NULL;
DELETE FROM chat_messages WHERE room LIKE 'soh:%' AND (SELECT unit_id FROM users WHERE users.id = CAST(substr(room, 5) AS INTEGER)) IS NULL;
DELETE FROM chat_reads WHERE room LIKE 'soh:%';

-- Хуурамч (demo) өгөгдлийг шинэ бүтцэд оруулна: утасгүй эсвэл тоотгүй хэрэглэгчийг хасаж,
-- үлдсэнийг тоотоор нэрлэнэ, имэйлийг арилгана.
DELETE FROM users WHERE phone IS NULL OR unit_id IS NULL;
UPDATE users SET name = (SELECT code FROM units WHERE units.id = users.unit_id) || ' тоот', email = NULL;
