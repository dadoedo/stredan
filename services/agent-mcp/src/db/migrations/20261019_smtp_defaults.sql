-- Hetzner blocks outbound ports 25 and 465. Port 587 with STARTTLS works.
-- SET DEFAULT changes only the default for future inserts. Existing
-- email_accounts rows keep the smtp_port and smtp_secure values they have.
ALTER TABLE email_accounts ALTER COLUMN smtp_port SET DEFAULT 587;
ALTER TABLE email_accounts ALTER COLUMN smtp_secure SET DEFAULT false;
