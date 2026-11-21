-- Засварын хүсэлтэд "Нэрээ нууцлах" (canvas: WebRequest).
-- anonymous = 1 бол илгээгчийн нэрийг зөвхөн СӨХ-ийн дарга (admins.position = 'chairman') харна,
-- бусад ажилтанд тоот, гарчиг л харагдана (засвар хийхэд тоот хэрэгтэй).
ALTER TABLE requests ADD COLUMN anonymous INTEGER NOT NULL DEFAULT 0;
