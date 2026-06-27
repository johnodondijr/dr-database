-- Optional Supabase Auth cleanup template.
-- Replace the example email and company name before running.

DELETE FROM auth.users
WHERE email = 'old-username@dreco.local';

UPDATE auth.users
SET raw_app_meta_data = jsonb_set(
  COALESCE(raw_app_meta_data, '{}'::jsonb),
  '{company_name}',
  '"Correct Company Name"'::jsonb,
  true
)
WHERE email = 'admin-username@dreco.local';
