-- Зарлалаар хурал зарлах: зарлал хуралтай холбогдоно (Хуралд орох товч), хурал нэг орцных эсвэл бүх байрных
-- Хурал устахад зарлал үлдэж, холбоос хоосорно. Орц устахад хурал бүх байрных болно

ALTER TABLE announcements ADD COLUMN meeting_id INTEGER REFERENCES meetings (id) ON DELETE SET NULL;
ALTER TABLE meetings ADD COLUMN entrance_id INTEGER REFERENCES entrances (id) ON DELETE SET NULL;
