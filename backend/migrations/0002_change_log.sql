-- Realtime: хүснэгтүүдийн өөрчлөлтийг change_log-д тэмдэглэнэ (PostgreSQL-ийн NOTIFY-ийн оронд)
-- INSERT/UPDATE/DELETE бүрт trigger нэг мөр нэмнэ: аль хүснэгт, аль мөр, аль тоотод хамаатай, ямар үйлдэл.
-- lib/realtime/ үүнийг уншиж WebSocket-оор ажилтан, оршин суугчдад дамжуулна.
-- requests-ийн төлөв өөрчлөгдөхөд тусдаа 'status' үйлдэл бичнэ (оршин суугчид мэдэгдэл явуулахад).
-- change_log сүүлийн 1000 мөрөөс илүүг өөрөө устгана.

CREATE TABLE change_log (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  tbl TEXT NOT NULL,
  row_id INTEGER,
  unit_id INTEGER,
  op TEXT NOT NULL,
  at TEXT NOT NULL DEFAULT (datetime('now', '+8 hours'))
);

CREATE TRIGGER change_log_prune AFTER INSERT ON change_log
BEGIN
  DELETE FROM change_log WHERE id <= NEW.id - 1000;
END;

CREATE TRIGGER buildings_ai AFTER INSERT ON buildings
BEGIN
  INSERT INTO change_log (tbl, row_id, unit_id, op) VALUES ('buildings', NEW.id, NULL, 'insert');
END;
CREATE TRIGGER buildings_au AFTER UPDATE ON buildings
BEGIN
  INSERT INTO change_log (tbl, row_id, unit_id, op) VALUES ('buildings', NEW.id, NULL, 'update');
END;
CREATE TRIGGER buildings_ad AFTER DELETE ON buildings
BEGIN
  INSERT INTO change_log (tbl, row_id, unit_id, op) VALUES ('buildings', OLD.id, NULL, 'delete');
END;

CREATE TRIGGER entrances_ai AFTER INSERT ON entrances
BEGIN
  INSERT INTO change_log (tbl, row_id, unit_id, op) VALUES ('entrances', NEW.id, NULL, 'insert');
END;
CREATE TRIGGER entrances_au AFTER UPDATE ON entrances
BEGIN
  INSERT INTO change_log (tbl, row_id, unit_id, op) VALUES ('entrances', NEW.id, NULL, 'update');
END;
CREATE TRIGGER entrances_ad AFTER DELETE ON entrances
BEGIN
  INSERT INTO change_log (tbl, row_id, unit_id, op) VALUES ('entrances', OLD.id, NULL, 'delete');
END;

CREATE TRIGGER units_ai AFTER INSERT ON units
BEGIN
  INSERT INTO change_log (tbl, row_id, unit_id, op) VALUES ('units', NEW.id, NEW.id, 'insert');
END;
CREATE TRIGGER units_au AFTER UPDATE ON units
BEGIN
  INSERT INTO change_log (tbl, row_id, unit_id, op) VALUES ('units', NEW.id, NEW.id, 'update');
END;
CREATE TRIGGER units_ad AFTER DELETE ON units
BEGIN
  INSERT INTO change_log (tbl, row_id, unit_id, op) VALUES ('units', OLD.id, OLD.id, 'delete');
END;

CREATE TRIGGER users_ai AFTER INSERT ON users
BEGIN
  INSERT INTO change_log (tbl, row_id, unit_id, op) VALUES ('users', NEW.id, NEW.unit_id, 'insert');
END;
CREATE TRIGGER users_au AFTER UPDATE ON users
BEGIN
  INSERT INTO change_log (tbl, row_id, unit_id, op) VALUES ('users', NEW.id, NEW.unit_id, 'update');
END;
CREATE TRIGGER users_ad AFTER DELETE ON users
BEGIN
  INSERT INTO change_log (tbl, row_id, unit_id, op) VALUES ('users', OLD.id, OLD.unit_id, 'delete');
END;

CREATE TRIGGER admins_ai AFTER INSERT ON admins
BEGIN
  INSERT INTO change_log (tbl, row_id, unit_id, op) VALUES ('admins', NEW.id, NULL, 'insert');
END;
CREATE TRIGGER admins_au AFTER UPDATE ON admins
BEGIN
  INSERT INTO change_log (tbl, row_id, unit_id, op) VALUES ('admins', NEW.id, NULL, 'update');
END;
CREATE TRIGGER admins_ad AFTER DELETE ON admins
BEGIN
  INSERT INTO change_log (tbl, row_id, unit_id, op) VALUES ('admins', OLD.id, NULL, 'delete');
END;

CREATE TRIGGER invoices_ai AFTER INSERT ON invoices
BEGIN
  INSERT INTO change_log (tbl, row_id, unit_id, op) VALUES ('invoices', NEW.id, NEW.unit_id, 'insert');
END;
CREATE TRIGGER invoices_au AFTER UPDATE ON invoices
BEGIN
  INSERT INTO change_log (tbl, row_id, unit_id, op) VALUES ('invoices', NEW.id, NEW.unit_id, 'update');
END;
CREATE TRIGGER invoices_ad AFTER DELETE ON invoices
BEGIN
  INSERT INTO change_log (tbl, row_id, unit_id, op) VALUES ('invoices', OLD.id, OLD.unit_id, 'delete');
END;

CREATE TRIGGER payments_ai AFTER INSERT ON payments
BEGIN
  INSERT INTO change_log (tbl, row_id, unit_id, op) VALUES ('payments', NEW.id, (SELECT unit_id FROM invoices WHERE id = NEW.invoice_id), 'insert');
END;
CREATE TRIGGER payments_au AFTER UPDATE ON payments
BEGIN
  INSERT INTO change_log (tbl, row_id, unit_id, op) VALUES ('payments', NEW.id, (SELECT unit_id FROM invoices WHERE id = NEW.invoice_id), 'update');
END;
CREATE TRIGGER payments_ad AFTER DELETE ON payments
BEGIN
  INSERT INTO change_log (tbl, row_id, unit_id, op) VALUES ('payments', OLD.id, (SELECT unit_id FROM invoices WHERE id = OLD.invoice_id), 'delete');
END;

CREATE TRIGGER requests_ai AFTER INSERT ON requests
BEGIN
  INSERT INTO change_log (tbl, row_id, unit_id, op) VALUES ('requests', NEW.id, NEW.unit_id, 'insert');
END;
CREATE TRIGGER requests_au AFTER UPDATE ON requests
BEGIN
  INSERT INTO change_log (tbl, row_id, unit_id, op) VALUES ('requests', NEW.id, NEW.unit_id, 'update');
END;
CREATE TRIGGER requests_ad AFTER DELETE ON requests
BEGIN
  INSERT INTO change_log (tbl, row_id, unit_id, op) VALUES ('requests', OLD.id, OLD.unit_id, 'delete');
END;

CREATE TRIGGER polls_ai AFTER INSERT ON polls
BEGIN
  INSERT INTO change_log (tbl, row_id, unit_id, op) VALUES ('polls', NEW.id, NULL, 'insert');
END;
CREATE TRIGGER polls_au AFTER UPDATE ON polls
BEGIN
  INSERT INTO change_log (tbl, row_id, unit_id, op) VALUES ('polls', NEW.id, NULL, 'update');
END;
CREATE TRIGGER polls_ad AFTER DELETE ON polls
BEGIN
  INSERT INTO change_log (tbl, row_id, unit_id, op) VALUES ('polls', OLD.id, NULL, 'delete');
END;

CREATE TRIGGER poll_votes_ai AFTER INSERT ON poll_votes
BEGIN
  INSERT INTO change_log (tbl, row_id, unit_id, op) VALUES ('poll_votes', NEW.id, NEW.unit_id, 'insert');
END;
CREATE TRIGGER poll_votes_au AFTER UPDATE ON poll_votes
BEGIN
  INSERT INTO change_log (tbl, row_id, unit_id, op) VALUES ('poll_votes', NEW.id, NEW.unit_id, 'update');
END;
CREATE TRIGGER poll_votes_ad AFTER DELETE ON poll_votes
BEGIN
  INSERT INTO change_log (tbl, row_id, unit_id, op) VALUES ('poll_votes', OLD.id, OLD.unit_id, 'delete');
END;

CREATE TRIGGER announcements_ai AFTER INSERT ON announcements
BEGIN
  INSERT INTO change_log (tbl, row_id, unit_id, op) VALUES ('announcements', NEW.id, NULL, 'insert');
END;
CREATE TRIGGER announcements_au AFTER UPDATE ON announcements
BEGIN
  INSERT INTO change_log (tbl, row_id, unit_id, op) VALUES ('announcements', NEW.id, NULL, 'update');
END;
CREATE TRIGGER announcements_ad AFTER DELETE ON announcements
BEGIN
  INSERT INTO change_log (tbl, row_id, unit_id, op) VALUES ('announcements', OLD.id, NULL, 'delete');
END;

CREATE TRIGGER meetings_ai AFTER INSERT ON meetings
BEGIN
  INSERT INTO change_log (tbl, row_id, unit_id, op) VALUES ('meetings', NEW.id, NULL, 'insert');
END;
CREATE TRIGGER meetings_au AFTER UPDATE ON meetings
BEGIN
  INSERT INTO change_log (tbl, row_id, unit_id, op) VALUES ('meetings', NEW.id, NULL, 'update');
END;
CREATE TRIGGER meetings_ad AFTER DELETE ON meetings
BEGIN
  INSERT INTO change_log (tbl, row_id, unit_id, op) VALUES ('meetings', OLD.id, NULL, 'delete');
END;

CREATE TRIGGER expenses_ai AFTER INSERT ON expenses
BEGIN
  INSERT INTO change_log (tbl, row_id, unit_id, op) VALUES ('expenses', NEW.id, NULL, 'insert');
END;
CREATE TRIGGER expenses_au AFTER UPDATE ON expenses
BEGIN
  INSERT INTO change_log (tbl, row_id, unit_id, op) VALUES ('expenses', NEW.id, NULL, 'update');
END;
CREATE TRIGGER expenses_ad AFTER DELETE ON expenses
BEGIN
  INSERT INTO change_log (tbl, row_id, unit_id, op) VALUES ('expenses', OLD.id, NULL, 'delete');
END;

CREATE TRIGGER requests_status AFTER UPDATE OF status ON requests
WHEN OLD.status IS NOT NEW.status
BEGIN
  INSERT INTO change_log (tbl, row_id, unit_id, op) VALUES ('requests', NEW.id, NEW.unit_id, 'status');
END;
