# DR Database — Supabase Setup Guide

## What Supabase does
Supabase is a free cloud database. Once connected, ALL staff will see the SAME data in real time — add a candidate on your phone, Fred sees it on his laptop immediately.

---

## Step 1 — Create your Supabase project

1. Go to **https://supabase.com** and click **Start your project**
2. Sign up with your GitHub account (the one you already created)
3. Click **New project**
4. Fill in:
   - **Name**: `dr-database`
   - **Database password**: make a strong password and save it somewhere safe
   - **Region**: choose **East Africa (Cape Town)** or nearest
5. Click **Create new project** — wait about 2 minutes

---

## Step 2 — Get your API keys

1. In your Supabase dashboard, click **Settings** (gear icon, left sidebar)
2. Click **API**
3. Copy two things:
   - **Project URL** — looks like `https://abcxyz.supabase.co`
   - **anon public key** — long string starting with `eyJ...`
4. Open `app.js` and paste them at the top:
   ```
   const SUPABASE_URL      = 'https://abcxyz.supabase.co';   ← your URL
   const SUPABASE_ANON_KEY = 'eyJ...';                        ← your anon key
   ```

---

## Step 3 — Create the database tables

1. In Supabase, click **SQL Editor** (left sidebar)
2. Click **New query**
3. Paste the SQL below and click **Run**:

```sql
-- Professional candidates table
-- NOTE: date columns are TEXT, not DATE, because some entries contain
-- text labels like "CV SELECTION" or "INTERVIEW" instead of actual dates.
CREATE TABLE pro_candidates (
  id          BIGSERIAL PRIMARY KEY,
  company_id  TEXT NOT NULL,
  name        TEXT NOT NULL,
  pp          TEXT,
  phone       TEXT,
  position    TEXT,
  company     TEXT,
  country     TEXT,
  stage       TEXT DEFAULT 'PENDING OFFER LETTER',
  submitted   TEXT,
  interview   TEXT,
  ol          TEXT,
  mol         TEXT,
  visa        TEXT,
  travel      TEXT,
  commission  NUMERIC,
  paid        NUMERIC,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- LB candidates table
CREATE TABLE lb_candidates (
  id            BIGSERIAL PRIMARY KEY,
  company_id    TEXT NOT NULL,
  name          TEXT NOT NULL,
  phone         TEXT,
  "ppStatus"    TEXT DEFAULT 'APPLIED',
  "travelStatus" TEXT DEFAULT 'NOT YET',
  "travelDate"  TEXT,
  "toRefund"    NUMERIC DEFAULT 0,
  "r1Date"      TEXT,
  "r1Amt"       NUMERIC DEFAULT 0,
  "r2Date"      TEXT,
  "r2Amt"       NUMERIC DEFAULT 0,
  notes         TEXT,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

-- Documents storage (Google Drive links)
-- key format: "<company_id>:<doc_key>"
CREATE TABLE documents (
  key   TEXT PRIMARY KEY,
  data  JSONB
);

-- Activity timelines
-- key format: "<company_id>:<timeline_key>"
CREATE TABLE timelines (
  key     TEXT PRIMARY KEY,
  entries JSONB
);

-- App settings (custom stages etc.)
-- key format: "<company_id>:<setting_key>"
CREATE TABLE app_settings (
  key   TEXT PRIMARY KEY,
  value JSONB
);

-- Row Level Security — each company only sees its own data.
-- The app uses Supabase Auth; company_id is stored in app_metadata.
ALTER TABLE pro_candidates ENABLE ROW LEVEL SECURITY;
ALTER TABLE lb_candidates  ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents      ENABLE ROW LEVEL SECURITY;
ALTER TABLE timelines      ENABLE ROW LEVEL SECURITY;
ALTER TABLE app_settings   ENABLE ROW LEVEL SECURITY;

-- Candidates: enforce company_id matches the authenticated user's company
CREATE POLICY "Company isolation" ON pro_candidates
  FOR ALL USING (company_id = (auth.jwt()->'app_metadata'->>'company_id'))
  WITH CHECK (company_id = (auth.jwt()->'app_metadata'->>'company_id'));

CREATE POLICY "Company isolation" ON lb_candidates
  FOR ALL USING (company_id = (auth.jwt()->'app_metadata'->>'company_id'))
  WITH CHECK (company_id = (auth.jwt()->'app_metadata'->>'company_id'));

-- Documents/timelines/settings: key must start with the user's company_id prefix
CREATE POLICY "Company isolation" ON documents
  FOR ALL USING (key LIKE ((auth.jwt()->'app_metadata'->>'company_id') || ':%'))
  WITH CHECK (key LIKE ((auth.jwt()->'app_metadata'->>'company_id') || ':%'));

CREATE POLICY "Company isolation" ON timelines
  FOR ALL USING (key LIKE ((auth.jwt()->'app_metadata'->>'company_id') || ':%'))
  WITH CHECK (key LIKE ((auth.jwt()->'app_metadata'->>'company_id') || ':%'));

CREATE POLICY "Company isolation" ON app_settings
  FOR ALL USING (key LIKE ((auth.jwt()->'app_metadata'->>'company_id') || ':%'))
  WITH CHECK (key LIKE ((auth.jwt()->'app_metadata'->>'company_id') || ':%'));

-- If you have existing data without company_id, run this after creating the column:
-- UPDATE pro_candidates SET company_id = 'destiny-recruitment-consults' WHERE company_id IS NULL;
-- UPDATE lb_candidates  SET company_id = 'destiny-recruitment-consults' WHERE company_id IS NULL;
```

4. You should see **"Success. No rows returned"** — that means it worked.

---

## Step 4 — Deploy updated files to GitHub/Vercel

1. Go to your GitHub repository (`dr-database`)
2. Upload/replace these 3 files:
   - `index.html` (new version)
   - `app.js` (new version — with your Supabase URL and key already filled in)
   - `data.js` (same as before — no changes)
3. Vercel will auto-redeploy in ~60 seconds

---

## Step 5 — First login seeds the data

When you log in for the first time after connecting Supabase:
- The app checks if the database is empty
- If empty, it automatically imports all 37 professional + 98 LB candidates
- From then on, all changes are saved to Supabase in real time

---

## Staff passwords (for reference)
| Name       | Username   | Password      |
|------------|------------|---------------|
| Fred       | fred       | Destiny@2025  |
| Robert     | robert     | Robert@2025   |
| Doreen     | doreen     | Doreen@2025   |
| Maxwell    | maxwell    | Maxwell@2025  |
| Consolata  | consolata  | Consol@2025   |

**Recovery code** (for forgot password): `DR-RESET-2025`

---

## Troubleshooting

**App shows "Loading…" forever** → Your Supabase URL or key is wrong in app.js. Double-check Step 2.

**"Save failed" toast** → Check your internet connection, or the RLS policies in Supabase (Step 3).

**Data not showing after first login** → Click the Dashboard tab manually, or refresh the page.
