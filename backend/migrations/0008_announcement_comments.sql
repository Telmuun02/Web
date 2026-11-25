-- Зарлалын сэтгэгдэл: оршин суугч (user) ба ажилтан (admin) хоёулаа бичнэ
-- author_type + author_id: users.id эсвэл admins.id. Зарлал устахад сэтгэгдэл нь хамт устана
-- Realtime: change_log-оор шинэ сэтгэгдэл нээлттэй байгаа хүмүүст шууд харагдана

CREATE TABLE announcement_comments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  announcement_id INTEGER NOT NULL REFERENCES announcements(id) ON DELETE CASCADE,
  author_type TEXT NOT NULL CHECK (author_type IN ('user', 'admin')),
  author_id INTEGER NOT NULL,
  body TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now', '+8 hours'))
);
CREATE INDEX announcement_comments_index ON announcement_comments (announcement_id, id);

CREATE TRIGGER announcement_comments_ai AFTER INSERT ON announcement_comments
BEGIN
  INSERT INTO change_log (tbl, row_id, unit_id, op) VALUES ('announcement_comments', NEW.id, NULL, 'insert');
END;
CREATE TRIGGER announcement_comments_ad AFTER DELETE ON announcement_comments
BEGIN
  INSERT INTO change_log (tbl, row_id, unit_id, op) VALUES ('announcement_comments', OLD.id, NULL, 'delete');
END;
