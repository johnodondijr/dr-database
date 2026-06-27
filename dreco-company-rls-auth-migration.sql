-- Dreco company-scoped RLS migration
-- Run this only after Dreco users are backed by Supabase Auth and each
-- auth user has app_metadata.company_id set to their company/workspace id.
--
-- If you are migrating existing records, replace dreco-workspace below with
-- the existing workspace/company id before running.

ALTER TABLE pro_candidates
  ADD COLUMN IF NOT EXISTS company_id TEXT;

ALTER TABLE lb_candidates
  ADD COLUMN IF NOT EXISTS company_id TEXT;

ALTER TABLE lb_candidates
  ADD COLUMN IF NOT EXISTS country TEXT DEFAULT 'General';

ALTER TABLE documents
  ADD COLUMN IF NOT EXISTS company_id TEXT;

ALTER TABLE timelines
  ADD COLUMN IF NOT EXISTS company_id TEXT;

ALTER TABLE app_settings
  ADD COLUMN IF NOT EXISTS company_id TEXT;

UPDATE pro_candidates
SET company_id = 'dreco-workspace'
WHERE company_id IS NULL;

UPDATE lb_candidates
SET company_id = 'dreco-workspace'
WHERE company_id IS NULL;

UPDATE lb_candidates
SET country = 'General'
WHERE country IS NULL OR country = '';

UPDATE documents
SET company_id = split_part(key, ':', 1)
WHERE key LIKE '%:%'
  AND company_id IS NULL;

UPDATE documents
SET company_id = 'dreco-workspace'
WHERE company_id IS NULL;

UPDATE timelines
SET company_id = split_part(key, ':', 1)
WHERE key LIKE '%:%'
  AND company_id IS NULL;

UPDATE timelines
SET company_id = 'dreco-workspace'
WHERE company_id IS NULL;

UPDATE app_settings
SET company_id = split_part(key, ':', 1)
WHERE key LIKE '%:%'
  AND company_id IS NULL;

UPDATE app_settings
SET company_id = 'dreco-workspace'
WHERE company_id IS NULL;

CREATE INDEX IF NOT EXISTS pro_candidates_company_id_idx
  ON pro_candidates(company_id);

CREATE INDEX IF NOT EXISTS lb_candidates_company_id_idx
  ON lb_candidates(company_id);

CREATE INDEX IF NOT EXISTS lb_candidates_company_country_idx
  ON lb_candidates(company_id, country);

CREATE INDEX IF NOT EXISTS documents_company_id_idx
  ON documents(company_id);

CREATE INDEX IF NOT EXISTS timelines_company_id_idx
  ON timelines(company_id);

CREATE INDEX IF NOT EXISTS app_settings_company_id_idx
  ON app_settings(company_id);

ALTER TABLE pro_candidates ENABLE ROW LEVEL SECURITY;
ALTER TABLE lb_candidates ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE timelines ENABLE ROW LEVEL SECURITY;
ALTER TABLE app_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow all" ON pro_candidates;
DROP POLICY IF EXISTS "Allow all" ON lb_candidates;
DROP POLICY IF EXISTS "Allow all" ON documents;
DROP POLICY IF EXISTS "Allow all" ON timelines;
DROP POLICY IF EXISTS "Allow all" ON app_settings;

DROP POLICY IF EXISTS "Company members can manage professional candidates" ON pro_candidates;
DROP POLICY IF EXISTS "Company members can manage general jobs candidates" ON lb_candidates;
DROP POLICY IF EXISTS "Company members can manage documents" ON documents;
DROP POLICY IF EXISTS "Company members can manage timelines" ON timelines;
DROP POLICY IF EXISTS "Company members can manage app settings" ON app_settings;

CREATE POLICY "Company members can manage professional candidates"
ON pro_candidates
FOR ALL
TO authenticated
USING (
  company_id = ((SELECT auth.jwt()) -> 'app_metadata' ->> 'company_id')
)
WITH CHECK (
  company_id = ((SELECT auth.jwt()) -> 'app_metadata' ->> 'company_id')
);

CREATE POLICY "Company members can manage general jobs candidates"
ON lb_candidates
FOR ALL
TO authenticated
USING (
  company_id = ((SELECT auth.jwt()) -> 'app_metadata' ->> 'company_id')
)
WITH CHECK (
  company_id = ((SELECT auth.jwt()) -> 'app_metadata' ->> 'company_id')
);

CREATE POLICY "Company members can manage documents"
ON documents
FOR ALL
TO authenticated
USING (
  company_id = ((SELECT auth.jwt()) -> 'app_metadata' ->> 'company_id')
)
WITH CHECK (
  company_id = ((SELECT auth.jwt()) -> 'app_metadata' ->> 'company_id')
);

CREATE POLICY "Company members can manage timelines"
ON timelines
FOR ALL
TO authenticated
USING (
  company_id = ((SELECT auth.jwt()) -> 'app_metadata' ->> 'company_id')
)
WITH CHECK (
  company_id = ((SELECT auth.jwt()) -> 'app_metadata' ->> 'company_id')
);

CREATE POLICY "Company members can manage app settings"
ON app_settings
FOR ALL
TO authenticated
USING (
  company_id = ((SELECT auth.jwt()) -> 'app_metadata' ->> 'company_id')
)
WITH CHECK (
  company_id = ((SELECT auth.jwt()) -> 'app_metadata' ->> 'company_id')
);
