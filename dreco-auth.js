const AUTH_EMAIL_DOMAIN = 'dreco.local';
const DEFAULT_COMPANY_ID = 'destiny-recruitment-consults';
const DEFAULT_COMPANY_NAME = 'Destiny Recruit Consults';

function slugify(value) {
  return String(value || '').toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 64);
}

function authEmail(username) {
  return `${String(username || '').trim().toLowerCase()}@${AUTH_EMAIL_DOMAIN}`;
}

function cleanUsername(value) {
  return String(value || '').trim().toLowerCase();
}

async function supabaseAdminFetch(path, options = {}) {
  const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) {
    throw new Error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY environment variable.');
  }
  const response = await fetch(`${url.replace(/\/$/, '')}${path}`, {
    ...options,
    headers: {
      apikey: serviceKey,
      authorization: `Bearer ${serviceKey}`,
      'content-type': 'application/json',
      ...(options.headers || {}),
    },
  });
  const text = await response.text();
  const data = text ? JSON.parse(text) : null;
  if (!response.ok) {
    throw new Error(data?.msg || data?.message || data?.error_description || data?.error || 'Supabase request failed.');
  }
  return data;
}

async function getCallerUser(req) {
  const token = String(req.headers.authorization || '').replace(/^Bearer\s+/i, '').trim();
  if (!token) return null;
  const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const response = await fetch(`${url.replace(/\/$/, '')}/auth/v1/user`, {
    headers: {
      apikey: serviceKey,
      authorization: `Bearer ${token}`,
    },
  });
  if (!response.ok) return null;
  return response.json();
}

function accountFromUser(user) {
  const meta = user.app_metadata || {};
  return {
    authUserId: user.id,
    role: meta.role === 'admin' ? 'admin' : 'staff',
    display: meta.display || meta.username || user.email,
    companyId: meta.company_id,
    companyName: meta.company_name,
    generalJobsCountries: Array.isArray(meta.general_jobs_countries) && meta.general_jobs_countries.length
      ? meta.general_jobs_countries
      : ['Lebanon', 'Oman', 'Saudi Arabia'],
  };
}

async function createAuthUser({ username, password, display, role, companyId, companyName, generalJobsCountries }) {
  const user = await supabaseAdminFetch('/auth/v1/admin/users', {
    method: 'POST',
    body: JSON.stringify({
      email: authEmail(username),
      password,
      email_confirm: true,
      user_metadata: {
        username,
        display,
      },
      app_metadata: {
        username,
        display,
        role,
        company_id: companyId,
        company_name: companyName,
        general_jobs_countries: generalJobsCountries,
      },
    }),
  });
  return accountFromUser(user);
}

module.exports = async function handler(req, res) {
  res.setHeader('access-control-allow-methods', 'POST, OPTIONS');
  res.setHeader('access-control-allow-headers', 'content-type, authorization');
  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {});
    const action = body.action;
    const username = cleanUsername(body.username);
    const password = String(body.password || '');
    const display = String(body.display || '').trim();

    if (!/^[a-z0-9._-]{3,32}$/.test(username)) throw new Error('Username must be 3-32 letters, numbers, dots, underscores, or hyphens.');
    if (!display) throw new Error('Display name is required.');
    if (password.length < 6) throw new Error('Password must be at least 6 characters.');

    if (action === 'create_workspace') {
      let companyName = String(body.companyName || '').trim();
      if (!companyName) throw new Error('Company name is required.');
      const companyId = slugify(companyName);
      if (companyId === DEFAULT_COMPANY_ID) companyName = DEFAULT_COMPANY_NAME;
      const account = await createAuthUser({
        username,
        password,
        display,
        role: 'admin',
        companyId,
        companyName,
        generalJobsCountries: ['Lebanon', 'Oman', 'Saudi Arabia'],
      });
      return res.status(200).json({ account });
    }

    if (action === 'create_user') {
      const caller = await getCallerUser(req);
      const meta = caller?.app_metadata || {};
      if (!caller || meta.role !== 'admin' || !meta.company_id) throw new Error('Only authenticated company admins can add users.');
      const role = body.role === 'admin' ? 'admin' : 'staff';
      const account = await createAuthUser({
        username,
        password,
        display,
        role,
        companyId: meta.company_id,
        companyName: meta.company_name,
        generalJobsCountries: Array.isArray(meta.general_jobs_countries) ? meta.general_jobs_countries : ['Lebanon', 'Oman', 'Saudi Arabia'],
      });
      return res.status(200).json({ account });
    }

    throw new Error('Unknown auth action.');
  } catch (err) {
    return res.status(400).json({ error: err.message || 'Auth request failed.' });
  }
};
