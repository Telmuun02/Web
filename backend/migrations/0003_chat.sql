-- Чат: орцны групп ба оршин суугч ↔ СӨХ хувийн чат
-- room:
--   'entrance:<entrances.id>' — тухайн орцны оршин суугчид + ажилтнууд (уншина, нууна)
--   'soh:<users.id>'          — нэг оршин суугч ба СӨХ-ийн бүх ажилтан
-- sender_type: 'user' (оршин суугч) | 'admin' (ажилтан). hidden = 1 — ажилтан нуусан (зүй бус)
-- chat_reads: хүн бүр өрөө бүрт хаана хүртэл уншсан (уншаагүйн тоонд)
-- Realtime: шинэ/нуусан мессеж change_log-оор дамжиж WebSocket-оор шууд хүрнэ (lib/realtime/changes.js)

CREATE TABLE chat_messages (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  room TEXT NOT NULL,
  sender_type TEXT NOT NULL CHECK (sender_type IN ('user', 'admin')),
  sender_id INTEGER NOT NULL,
  body TEXT NOT NULL,
  hidden INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now', '+8 hours'))
);
CREATE INDEX chat_messages_room_index ON chat_messages (room, id);

CREATE TABLE chat_reads (
  room TEXT NOT NULL,
  reader_type TEXT NOT NULL CHECK (reader_type IN ('user', 'admin')),
  reader_id INTEGER NOT NULL,
  last_read_id INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (room, reader_type, reader_id)
);

CREATE TRIGGER chat_messages_ai AFTER INSERT ON chat_messages
BEGIN
  INSERT INTO change_log (tbl, row_id, unit_id, op) VALUES ('chat_messages', NEW.id, NULL, 'insert');
END;
CREATE TRIGGER chat_messages_au AFTER UPDATE ON chat_messages
BEGIN
  INSERT INTO change_log (tbl, row_id, unit_id, op) VALUES ('chat_messages', NEW.id, NULL, 'update');
END;
