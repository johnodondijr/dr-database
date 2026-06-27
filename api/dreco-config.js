function splitCountries(value) {
  return String(value || '')
    .split(',')
    .map(country => country.trim())
    .filter(Boolean);
}

module.exports = async function handler(req, res) {
  res.setHeader('access-control-allow-methods', 'GET, OPTIONS');
  res.setHeader('access-control-allow-headers', 'content-type');
  res.setHeader('cache-control', 'no-store');
  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  const countries = splitCountries(process.env.DRECO_GENERAL_JOBS_COUNTRIES);
  const retiredUsernames = splitCountries(process.env.DRECO_RETIRED_USERNAMES).map(name => name.toLowerCase());
  const blockedAdminAliases = splitCountries(process.env.DRECO_BLOCKED_ADMIN_ALIASES).map(name => name.toLowerCase());
  return res.status(200).json({
    supabase: {
      url: process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || '',
      anonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || '',
    },
    defaultCompany: {
      id: process.env.DRECO_DEFAULT_COMPANY_ID || 'dreco-workspace',
      name: process.env.DRECO_DEFAULT_COMPANY_NAME || 'Dreco Workspace',
      generalJobsCountries: countries.length ? countries : ['General'],
    },
    defaultAdminUsername: process.env.DRECO_DEFAULT_ADMIN_USERNAME || 'admin',
    retiredUsernames,
    blockedAdminAliases,
  });
};
