ALTER TABLE pro_candidates
  ADD COLUMN IF NOT EXISTS company_id TEXT;

ALTER TABLE lb_candidates
  ADD COLUMN IF NOT EXISTS company_id TEXT;

ALTER TABLE lb_candidates
  ADD COLUMN IF NOT EXISTS country TEXT DEFAULT 'General';

CREATE INDEX IF NOT EXISTS pro_candidates_company_id_idx
  ON pro_candidates(company_id);

CREATE INDEX IF NOT EXISTS lb_candidates_company_id_idx
  ON lb_candidates(company_id);

CREATE INDEX IF NOT EXISTS lb_candidates_company_country_idx
  ON lb_candidates(company_id, country);

-- For an existing deployment, set old records to the correct workspace id.
-- Example:
-- UPDATE pro_candidates SET company_id = 'your-company-id' WHERE company_id IS NULL;
-- UPDATE lb_candidates SET company_id = 'your-company-id' WHERE company_id IS NULL;
