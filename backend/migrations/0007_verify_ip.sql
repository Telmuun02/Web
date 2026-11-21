-- Утас баталгаажуулалтад IP хадгална — нэг IP-ээс цагт хэт олон оролдлого хийхийг хязгаарлана
ALTER TABLE phone_verifications ADD COLUMN ip TEXT NOT NULL DEFAULT '';
CREATE INDEX phone_verifications_ip_index ON phone_verifications (ip, created_at);
