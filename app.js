// *Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â
// SUPABASE CONFIG - replace with your project values
// *Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â
const SUPABASE_URL      = 'https://pizirpyvkxzghvxlipzc.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBpemlycHl2a3h6Z2h2eGxpcHpjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODEzNDgyOTIsImV4cCI6MjA5NjkyNDI5Mn0.MPaIYYhStetM3Wxre2SlF3xO1VfXeb9QxsMm9nyqrZA';
const HAS_SUPABASE_CONFIG =
  SUPABASE_URL &&
  SUPABASE_ANON_KEY &&
  !SUPABASE_URL.includes('YOUR_') &&
  !SUPABASE_ANON_KEY.includes('YOUR_');
const db = HAS_SUPABASE_CONFIG && window.supabase
  ? window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
  : null;
const LOCAL_STORE_KEY = 'dreco_local_store_v1';
const LOCAL_STAFF_KEY = 'dreco_staff_accounts_v1';
const CLOUD_ACCOUNTS_KEY = 'dreco_accounts_v2';
const AUTH_API_PATH = '/api/dreco-auth';
const AUTH_EMAIL_DOMAIN = 'dreco.local';
const DEFAULT_COMPANY = {
  id: 'destiny-recruitment-consults',
  name: 'Destiny Recruit Consults',
  generalJobsCountries: ['Lebanon','Oman','Saudi Arabia'],
};
const DEFAULT_ADMIN_USERNAME = 'johnfred';
const DEFAULT_ADMIN_BLOCKED_ALIASES = ['john_fred','john-fred','john.fred'];
const LEGACY_DESTINY_USERS = ['fred','robert','doreen','maxwell','consolata',...DEFAULT_ADMIN_BLOCKED_ALIASES];
const LEGACY_DESTINY_HASHES = {
  fred: '5c6afc95abc51f229a78063cb8e582f4e7ab0198cfb30b47be8e015879e81e49',
  robert: '0dfd05497b2dfbe6c66f70a108aae220eae2fc5259b1b9c3902d4df58d9b9004',
  doreen: 'd11a421078a81e9751c62a48627b340d68f5d760647293f8719963ff44b2b327',
  maxwell: '97ba06b052118b7bd451b7b0bdc8d6aa9aad347fe2f4768f93c25c0a0d181050',
  consolata: 'b0a93dc7415fc8bb713a780060bd8796aeacd1814fc712d49868ba25674e0643',
};

// *Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â
// STAFF ACCOUNTS
// *Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â
const STAFF_ACCOUNTS = {
  johnfred: { passwordSalt: 'd66ed843dec2214091d4dcc1723179ef', passwordHash: '5c6afc95abc51f229a78063cb8e582f4e7ab0198cfb30b47be8e015879e81e49', role: 'admin', display: 'John Fred', companyId: DEFAULT_COMPANY.id, companyName: DEFAULT_COMPANY.name, generalJobsCountries: DEFAULT_COMPANY.generalJobsCountries },
};
const RECOVERY_CODE = 'DR-RESET-2025';

function normalizeAccount(username, account = {}) {
  let companyName = (account.companyName || DEFAULT_COMPANY.name).trim();
  const companyId = account.companyId || slugify(companyName) || DEFAULT_COMPANY.id;
  if (companyId === DEFAULT_COMPANY.id) companyName = DEFAULT_COMPANY.name;
  const legacyCountry = account.generalJobsCountry || String(account.generalJobsLabel || '').replace(/\s+Jobs$/i,'');
  const generalJobsCountries = Array.isArray(account.generalJobsCountries) && account.generalJobsCountries.length
    ? account.generalJobsCountries
    : (legacyCountry ? [legacyCountry] : DEFAULT_COMPANY.generalJobsCountries);
  const normalized = {
    role: account.role || 'staff',
    display: account.display || username,
    companyId,
    companyName,
    authUserId: account.authUserId || '',
    passwordHash: account.passwordHash || '',
    passwordSalt: account.passwordSalt || '',
    generalJobsCountries: [...new Set(generalJobsCountries.map(c => String(c || '').trim()).filter(Boolean))],
  };
  if (account.password && !normalized.passwordHash) normalized.password = account.password;
  return normalized;
}
function normalizeAllAccounts() {
  Object.keys(STAFF_ACCOUNTS).forEach(username => {
    STAFF_ACCOUNTS[username] = normalizeAccount(username, STAFF_ACCOUNTS[username]);
  });
}
function cleanupLegacyDestinyUsers() {
  const legacyAdmin = STAFF_ACCOUNTS.fred;
  let migratedLegacyFred = false;
  if (!STAFF_ACCOUNTS[DEFAULT_ADMIN_USERNAME] && legacyAdmin && (legacyAdmin.companyId || DEFAULT_COMPANY.id) === DEFAULT_COMPANY.id) {
    STAFF_ACCOUNTS[DEFAULT_ADMIN_USERNAME] = {
      ...legacyAdmin,
      role: 'admin',
      display: 'John Fred',
      companyId: DEFAULT_COMPANY.id,
      companyName: DEFAULT_COMPANY.name,
      generalJobsCountries: legacyAdmin.generalJobsCountries || DEFAULT_COMPANY.generalJobsCountries,
    };
    migratedLegacyFred = true;
  }
  LEGACY_DESTINY_USERS.forEach(username => {
    const account = STAFF_ACCOUNTS[username];
    const isDefaultCompany = account && (account.companyId || DEFAULT_COMPANY.id) === DEFAULT_COMPANY.id;
    const isOldSeedAccount = account && (account.password || account.passwordHash === LEGACY_DESTINY_HASHES[username]);
    const isBlockedAdminAlias = DEFAULT_ADMIN_BLOCKED_ALIASES.includes(username);
    if (isDefaultCompany && (isOldSeedAccount || isBlockedAdminAlias || (username === 'fred' && migratedLegacyFred))) delete STAFF_ACCOUNTS[username];
  });
  if (STAFF_ACCOUNTS[DEFAULT_ADMIN_USERNAME]) {
    STAFF_ACCOUNTS[DEFAULT_ADMIN_USERNAME] = normalizeAccount(DEFAULT_ADMIN_USERNAME, {
      ...STAFF_ACCOUNTS[DEFAULT_ADMIN_USERNAME],
      role: 'admin',
      display: STAFF_ACCOUNTS[DEFAULT_ADMIN_USERNAME].display || 'John Fred',
      companyId: DEFAULT_COMPANY.id,
      companyName: STAFF_ACCOUNTS[DEFAULT_ADMIN_USERNAME].companyName || DEFAULT_COMPANY.name,
    });
  }
}
function slugify(value) {
  return String(value || '').toLowerCase().trim().replace(/[^a-z0-9]+/g,'-').replace(/^-+|-+$/g,'').slice(0,64);
}
function getAuthEmail(username) {
  return `${String(username || '').trim().toLowerCase()}@${AUTH_EMAIL_DOMAIN}`;
}
function accountFromAuthUser(user, fallbackUsername = '') {
  const meta = user?.app_metadata || {};
  return normalizeAccount(meta.username || fallbackUsername || String(user?.email || '').replace(/@.*/,''), {
    authUserId: user?.id,
    role: meta.role || 'staff',
    display: meta.display || meta.username || fallbackUsername,
    companyId: meta.company_id,
    companyName: meta.company_name,
    generalJobsCountries: meta.general_jobs_countries,
  });
}
async function postAuthAction(payload, accessToken = '') {
  const response = await fetch(AUTH_API_PATH, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      ...(accessToken ? { authorization: `Bearer ${accessToken}` } : {}),
    },
    body: JSON.stringify(payload),
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error || 'Auth service request failed.');
  return data;
}
async function signInWithSupabaseAuth(username, password) {
  if (!db?.auth) return null;
  const { data, error } = await db.auth.signInWithPassword({
    email: getAuthEmail(username),
    password,
  });
  if (error || !data?.user) return null;
  const account = accountFromAuthUser(data.user, username);
  return { account, session: data.session };
}
function makePasswordSalt() {
  const bytes = new Uint8Array(16);
  if (window.crypto?.getRandomValues) {
    window.crypto.getRandomValues(bytes);
  } else {
    for (let i = 0; i < bytes.length; i += 1) bytes[i] = Math.floor(Math.random() * 256);
  }
  return Array.from(bytes, byte => byte.toString(16).padStart(2, '0')).join('');
}
async function sha256Hex(value) {
  if (!window.crypto?.subtle) throw new Error('Secure password hashing requires HTTPS or localhost.');
  const data = new TextEncoder().encode(value);
  const digest = await window.crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(digest), byte => byte.toString(16).padStart(2, '0')).join('');
}
async function setAccountPassword(account, password) {
  const salt = makePasswordSalt();
  account.passwordSalt = salt;
  account.passwordHash = await sha256Hex(`${salt}:${password}`);
  delete account.password;
}
async function verifyAccountPassword(account, password) {
  if (!account) return { ok: false, migrated: false };
  if (account.passwordHash && account.passwordSalt) {
    const hash = await sha256Hex(`${account.passwordSalt}:${password}`);
    return { ok: hash === account.passwordHash, migrated: false };
  }
  if (account.password && account.password === password) {
    await setAccountPassword(account, password);
    return { ok: true, migrated: true };
  }
  return { ok: false, migrated: false };
}
async function loadStaffAccounts() {
  normalizeAllAccounts();
  cleanupLegacyDestinyUsers();
  try {
    const saved = safeLocalGet(LOCAL_STAFF_KEY);
    if (saved) Object.assign(STAFF_ACCOUNTS, JSON.parse(saved));
    normalizeAllAccounts();
    cleanupLegacyDestinyUsers();
  } catch (err) {
    console.warn('Saved staff accounts could not be loaded:', err);
  }
  if (db) {
    try {
      const { data, error } = await db.from('app_settings').select('value').eq('key', CLOUD_ACCOUNTS_KEY).maybeSingle();
      if (error) throw error;
      if (data?.value) Object.assign(STAFF_ACCOUNTS, data.value);
      normalizeAllAccounts();
      cleanupLegacyDestinyUsers();
      safeLocalSet(LOCAL_STAFF_KEY, JSON.stringify(STAFF_ACCOUNTS));
    } catch (err) {
      console.warn('Cloud staff accounts could not be loaded:', err);
    }
  }
}
async function saveStaffAccounts() {
  normalizeAllAccounts();
  cleanupLegacyDestinyUsers();
  safeLocalSet(LOCAL_STAFF_KEY, JSON.stringify(STAFF_ACCOUNTS));
  if (db) {
    try {
      await db.from('app_settings').upsert({ key: CLOUD_ACCOUNTS_KEY, value: STAFF_ACCOUNTS }, { onConflict: 'key' });
    } catch (err) {
      console.warn('Cloud staff accounts could not be saved:', err);
    }
  }
}

function safeLocalGet(key) {
  try { return localStorage.getItem(key); } catch { return null; }
}
function safeLocalSet(key, value) {
  try { localStorage.setItem(key, value); } catch { /* file pages may block storage */ }
}
function safeSessionGet(key) {
  try { return sessionStorage.getItem(key); } catch { return null; }
}
function safeSessionSet(key, value) {
  try { sessionStorage.setItem(key, value); } catch { /* login still works without session restore */ }
}
function safeSessionRemove(key) {
  try { sessionStorage.removeItem(key); } catch { /* ignore */ }
}

// *Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â
// STATE
// *Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â
let currentUser   = null;
let currentCompany = { ...DEFAULT_COMPANY };
let proDB         = [];
let lbDB          = [];
let allDocs       = {};
let allTimelines  = {};
let proStages     = ['PENDING OFFER LETTER','PENDING MOL','PENDING VISA','PENDING TRAVEL','TRAVELLED'];
let lbStages      = ['NOT YET','TRAVELLED','NOT TRAVELLED'];
let drecoExpenses = JSON.parse(safeLocalGet('dreco_expenses') || '[]');
let drecoEvents   = JSON.parse(safeLocalGet('dreco_events') || '[]');
let drecoAudit    = JSON.parse(safeLocalGet('dreco_audit') || '[]');
let editingEventId = null;
let pendingStageType = null;
let pendingStageSelect = null;
let financePeriod = 'month';
let proPage       = 1;
let lbPage        = 1;
let editingProId  = null;
let editingLbId   = null;
let docsTarget    = null;
const PER_PAGE    = 20;
const EXCEL_EPOCH = new Date(1899, 11, 30);

// pill filter state
window.proStagePillFilter = '';
window.lbTravelPillFilter = '';
window.lbPPFilter         = '';
window.generalCountryFilter = '';
let kanbanSource = 'pro';
let calSource = 'pro';
let calDate = new Date();
let appStorageMode = db ? 'cloud' : 'local';
let lastSyncError = '';

function getCompanyId() {
  return currentUser?.companyId || currentCompany.id || DEFAULT_COMPANY.id;
}
function getCompanyName() {
  return currentUser?.companyName || currentCompany.name || DEFAULT_COMPANY.name;
}
function getGeneralCountries() {
  return currentUser?.generalJobsCountries || currentCompany.generalJobsCountries || DEFAULT_COMPANY.generalJobsCountries;
}
function getActiveGeneralCountry() {
  const countries = getGeneralCountries();
  if (!window.generalCountryFilter || !countries.includes(window.generalCountryFilter)) {
    window.generalCountryFilter = countries[0] || 'General';
  }
  return window.generalCountryFilter;
}
function getCompanyScopedKey(key) {
  return `${getCompanyId()}:${key}`;
}
function stripCompanyScopedKey(key) {
  const prefix = `${getCompanyId()}:`;
  return String(key || '').startsWith(prefix) ? String(key).slice(prefix.length) : key;
}
function setCurrentWorkspace(account) {
  const normalized = normalizeAccount('', account || {});
  currentCompany = {
    id: normalized.companyId,
    name: normalized.companyName,
    generalJobsCountries: normalized.generalJobsCountries,
  };
  if (!currentCompany.generalJobsCountries.includes(window.generalCountryFilter)) {
    window.generalCountryFilter = currentCompany.generalJobsCountries[0] || '';
  }
}
function updateWorkspaceLabels() {
  const mappings = [
    ['#nav-lb .nav-item-label', 'General Jobs'],
    ['#nav-lb', 'General Jobs', 'data-title'],
    ['#bnav-lb span', 'General'],
    ['#lb-section .panel-title', 'General Jobs candidates'],
    ['#lb-modal-title', 'Add General Jobs candidate'],
  ];
  mappings.forEach(([selector, value, attr]) => {
    const el = document.querySelector(selector);
    if (!el) return;
    if (attr) el.setAttribute(attr, value); else el.textContent = value;
  });
  renderGeneralCountryTabs();
}
function renderGeneralCountryTabs() {
  const el = document.getElementById('general-country-tabs');
  if (!el) return;
  const active = getActiveGeneralCountry();
  el.innerHTML = getGeneralCountries().map(country =>
    `<button class="country-tab ${country===active?'active':''}" onclick="setGeneralCountry('${escJSString(country)}')">${escHTML(country)}</button>`
  ).join('') + `<button class="country-tab country-tab-add" onclick="addGeneralCountry()" title="Add country"><i class="ti ti-plus"></i></button>`;
}
function setGeneralCountry(country) {
  window.generalCountryFilter = country;
  lbPage = 1;
  renderGeneralCountryTabs();
  renderLB();
}
async function addGeneralCountry() {
  const input=document.getElementById('quick-country-name');
  const err=document.getElementById('quick-country-error');
  if(input) input.value='';
  if(err){ err.textContent=''; err.style.display='none'; }
  document.getElementById('quick-country-modal')?.classList.add('open');
}
async function submitQuickCountry(){
  const input=document.getElementById('quick-country-name');
  const err=document.getElementById('quick-country-error');
  const fail=msg=>{ if(err){ err.textContent=msg; err.style.display='block'; } };
  const name=(input?.value||'').trim();
  if(!name) return fail('Country name is required.');
  const countries=getGeneralCountries();
  if(!countries.some(c=>c.toLowerCase()===name.toLowerCase())) countries.push(name);
  window.generalCountryFilter=countries.find(c=>c.toLowerCase()===name.toLowerCase())||name;
  await persistWorkspaceCountries(countries);
  closeModal('quick-country-modal');
  renderGeneralCountryTabs(); renderSettingsCountries(); renderLB(); renderDash();
}
async function persistWorkspaceCountries(countries) {
  const clean = [...new Set(countries.map(c => String(c || '').trim()).filter(Boolean))];
  const companyId = getCompanyId();
  Object.keys(STAFF_ACCOUNTS).forEach(username => {
    if ((STAFF_ACCOUNTS[username].companyId || DEFAULT_COMPANY.id) === companyId) {
      STAFF_ACCOUNTS[username].generalJobsCountries = clean;
    }
  });
  currentUser = {...currentUser, generalJobsCountries: clean};
  setCurrentWorkspace(currentUser);
  safeSessionSet('dr_user', JSON.stringify(currentUser));
  await saveStaffAccounts();
}

function getDefaultLocalStore() {
  const isDefaultCompany = getCompanyId() === DEFAULT_COMPANY.id;
  return {
    pro: isDefaultCompany ? JSON.parse(JSON.stringify(PRO_SEED)).map(normalizeProRecord) : [],
    lb: isDefaultCompany ? JSON.parse(JSON.stringify(LB_SEED)).map(normalizeLBRecord) : [],
    docs: {},
    timelines: {},
    proStages: [...proStages],
    lbStages: [...lbStages],
  };
}
function toNumOrNull(v) {
  return v===''||v===null||v===undefined ? null : Number(v);
}
function normalizeProRecord(r={}) {
  return {
    id:r.id,
    company_id:r.company_id||r.companyId||getCompanyId(),
    name:(r.name||'').toString().toUpperCase(),
    pp:(r.pp||'').toString().toUpperCase(),
    phone:r.phone||'',
    position:(r.position||'').toString().toUpperCase(),
    company:(r.company||'').toString().toUpperCase(),
    country:r.country||'',
    stage:r.stage||proStages[0],
    submitted:normalizeDateField(r.submitted),
    interview:r.interview||null,
    ol:normalizeDateField(r.ol),
    mol:normalizeDateField(r.mol),
    visa:normalizeDateField(r.visa),
    travel:normalizeDateField(r.travel),
    commission:toNumOrNull(r.commission),
    paid:toNumOrNull(r.paid),
  };
}
function normalizeLBRecord(r={}) {
  return {
    id:r.id,
    company_id:r.company_id||r.companyId||getCompanyId(),
    country:(r.country||r.destination_country||DEFAULT_COMPANY.generalJobsCountries[0]||'Lebanon').toString(),
    name:(r.name||'').toString().toUpperCase(),
    phone:r.phone||'',
    ppStatus:r.ppStatus||r.pp_status||'APPLIED',
    travelStatus:r.travelStatus||r.travel_status||lbStages[0],
    travelDate:normalizeDateField(r.travelDate||r.travel_date),
    toRefund:Number(r.toRefund||r.to_refund)||0,
    r1Date:normalizeDateField(r.r1Date||r.r1_date),
    r1Amt:Number(r.r1Amt||r.r1_amt)||0,
    r2Date:normalizeDateField(r.r2Date||r.r2_date),
    r2Amt:Number(r.r2Amt||r.r2_amt)||0,
    notes:r.notes||'',
  };
}
function getStorageLabel() {
  if (appStorageMode === 'cloud') return 'Supabase cloud sync';
  return lastSyncError ? 'Local mode - cloud unavailable' : 'Local browser storage';
}
function loadLocalStore() {
  try {
    const raw = safeLocalGet(`${LOCAL_STORE_KEY}_${getCompanyId()}`);
    if (!raw) return getDefaultLocalStore();
    const parsed={ ...getDefaultLocalStore(), ...JSON.parse(raw) };
    parsed.pro=(parsed.pro||[]).map(normalizeProRecord);
    parsed.lb=(parsed.lb||[]).map(normalizeLBRecord);
    return parsed;
  } catch (err) {
    console.warn('Local store could not be read, using seed data:', err);
    return getDefaultLocalStore();
  }
}
function saveLocalStore() {
  safeLocalSet(`${LOCAL_STORE_KEY}_${getCompanyId()}`, JSON.stringify({
    pro: proDB,
    lb: lbDB,
    docs: allDocs,
    timelines: allTimelines,
    proStages,
    lbStages,
  }));
}
function nextLocalId(rows) {
  return rows.reduce((max, row) => Math.max(max, Number(row.id) || 0), 0) + 1;
}

// *Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â
// LOADING
// *Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â
function showLoading(msg = 'Loading...') {
  const el = document.getElementById('loading-text'); if (el) el.textContent = msg;
  document.getElementById('loading-overlay').classList.add('show');
}
function hideLoading() { document.getElementById('loading-overlay').classList.remove('show'); }

// *Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â
// SIDEBAR TOGGLE
// *Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â
function toggleSidebar() {
  document.getElementById('sidebar').classList.toggle('collapsed');
}

// *Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â
// AUTH
// *Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â
function togglePassword() {
  const inp = document.getElementById('pw-input');
  const btn = document.getElementById('pw-toggle');
  if (inp.type === 'password') { inp.type='text'; btn.innerHTML='<i class="ti ti-eye-off"></i>'; }
  else                         { inp.type='password'; btn.innerHTML='<i class="ti ti-eye"></i>'; }
}
function setLoginBusy(isBusy) {
  const btn = document.getElementById('login-submit');
  const label = btn?.querySelector('.lp-submit-label');
  ['username-input','pw-input'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.disabled = isBusy;
  });
  if (!btn) return;
  btn.disabled = isBusy;
  btn.classList.toggle('is-loading', isBusy);
  btn.classList.remove('is-success');
  if (label) label.textContent = isBusy ? 'Signing in...' : 'Sign in';
}
function setLoginSuccessState() {
  const btn = document.getElementById('login-submit');
  const label = btn?.querySelector('.lp-submit-label');
  if (!btn) return;
  btn.classList.remove('is-loading');
  btn.classList.add('is-success');
  if (label) label.textContent = 'Signed in';
}
function initLoginInteractions() {
  const pw = document.getElementById('pw-input');
  const hint = document.getElementById('caps-lock-hint');
  if (pw && hint) {
    const updateCapsHint = e => {
      const isOn = !!e.getModifierState?.('CapsLock');
      hint.classList.toggle('show', isOn);
    };
    pw.addEventListener('keydown', updateCapsHint);
    pw.addEventListener('keyup', updateCapsHint);
    pw.addEventListener('blur', () => hint.classList.remove('show'));
  }
  const media = document.querySelector('.lp-media');
  const hero = document.querySelector('.lp-hero-object');
  if (media && hero) {
    media.addEventListener('mousemove', e => {
      const rect = media.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width - .5) * 8;
      const y = ((e.clientY - rect.top) / rect.height - .5) * 8;
      hero.style.setProperty('--hero-x', `${x.toFixed(1)}px`);
      hero.style.setProperty('--hero-y', `${y.toFixed(1)}px`);
    });
    media.addEventListener('mouseleave', () => {
      hero.style.setProperty('--hero-x', '0px');
      hero.style.setProperty('--hero-y', '0px');
    });
  }
  document.querySelectorAll('.lp-preview-kpi strong').forEach(el => {
    const raw = (el.textContent || '').trim();
    const numeric = Number(raw.replace(/[^\d.]/g, ''));
    if (!Number.isFinite(numeric) || !/^\d+(\.\d+)?[MK]?$/.test(raw)) return;
    const suffix = raw.replace(/[\d.]/g, '');
    const start = performance.now();
    const duration = 650;
    const render = now => {
      const progress = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - progress, 3);
      const value = numeric * eased;
      el.textContent = suffix ? `${value.toFixed(1)}${suffix}` : String(Math.round(value));
      if (progress < 1) requestAnimationFrame(render);
      else el.textContent = raw;
    };
    requestAnimationFrame(render);
  });
}
function setAuthMode(mode = 'login') {
  const screen = document.getElementById('login-screen');
  if (!screen) return;
  screen.classList.remove('auth-mode-login','auth-mode-signup','auth-mode-recovery');
  screen.classList.add(`auth-mode-${mode}`);
}
function showForgotPassword() {
  document.getElementById('login-main').style.display='none';
  document.getElementById('signup-section').style.display='none';
  document.getElementById('forgot-section').style.display='block';
}
function hideForgotPassword() {
  document.getElementById('forgot-section').style.display='none';
  document.getElementById('signup-section').style.display='none';
  document.getElementById('login-main').style.display='block';
  const ri=document.getElementById('recovery-code-input'); if(ri) ri.value='';
  const fe=document.getElementById('forgot-error'); if(fe) fe.style.display='none';
  const fr=document.getElementById('forgot-result'); if(fr) fr.style.display='none';
}
function submitForgotPassword() {
  const code=(document.getElementById('recovery-code-input').value||'').trim();
  const errEl=document.getElementById('forgot-error');
  const resEl=document.getElementById('forgot-result');
  if (code!==RECOVERY_CODE) {
    errEl.textContent='Incorrect recovery code.'; errEl.style.display='block'; resEl.style.display='none'; return;
  }
  errEl.style.display='none';
  resEl.innerHTML='<strong style="color:var(--green)">Recovery code accepted.</strong>'+
    '<div style="margin-top:6px;color:var(--text-2)">For security, staff passwords are no longer displayed in the browser. Ask the administrator to reset the account from the profile/settings workflow or update the staff account list directly.</div>';
  resEl.style.display='block';
}
function showSignup() {
  document.getElementById('login-main').style.display='none';
  document.getElementById('forgot-section').style.display='none';
  document.getElementById('signup-section').style.display='block';
  const err=document.getElementById('signup-error'); if(err) err.style.display='none';
}
function hideSignup() {
  document.getElementById('signup-section').style.display='none';
  document.getElementById('forgot-section').style.display='none';
  document.getElementById('login-main').style.display='block';
}

function setUserDisplay(display, role) {
  const parts=display.replace(/[^a-zA-Z ]/g,'').trim().split(' ');
  const initials=parts.length>=2?(parts[0][0]+parts[parts.length-1][0]).toUpperCase():display.substring(0,2).toUpperCase();
  ['user-chip','sidebar-user-name'].forEach(id=>{ const el=document.getElementById(id); if(el) el.textContent=display; });
  ['topbar-avatar','sidebar-avatar'].forEach(id=>{ const el=document.getElementById(id); if(el) el.textContent=initials; });
  const rEl=document.getElementById('sidebar-user-role');
  if(rEl) rEl.textContent=(role==='admin'?'Administrator':'Staff');
  const orgEl=document.querySelector('.suc-org');
  if(orgEl) orgEl.textContent=getCompanyName();
  updateWorkspaceLabels();
}

async function doSignup() {
  await loadStaffAccounts();
  const companyName=(document.getElementById('signup-company').value||'').trim();
  const display=(document.getElementById('signup-name').value||'').trim();
  const username=(document.getElementById('signup-username').value||'').trim().toLowerCase();
  const password=(document.getElementById('signup-password').value||'').trim();
  const errEl=document.getElementById('signup-error');
  const fail=msg=>{ errEl.textContent=msg; errEl.style.display='block'; };
  if(!companyName) return fail('Company name is required.');
  if(!display) return fail('Your name is required.');
  if(!/^[a-z0-9._-]{3,32}$/.test(username)) return fail('Username must be 3-32 letters, numbers, dots, underscores, or hyphens.');
  const companyId=slugify(companyName);
  const generalJobsCountries=['Lebanon','Oman','Saudi Arabia'];
  const isDefaultAdminBootstrap = username === DEFAULT_ADMIN_USERNAME && companyId === DEFAULT_COMPANY.id && !STAFF_ACCOUNTS[username]?.authUserId;
  if(STAFF_ACCOUNTS[username] && !isDefaultAdminBootstrap) return fail('That username is already taken.');
  if(password.length<6) return fail('Password must be at least 6 characters.');
  let authBacked = false;
  if (db?.auth) {
    try {
      const authResult = await postAuthAction({ action:'create_workspace', companyName, display, username, password });
      STAFF_ACCOUNTS[username]=normalizeAccount(username, authResult.account);
      await signInWithSupabaseAuth(username, password);
      authBacked = true;
    } catch (err) {
      console.warn('Supabase Auth workspace creation unavailable; using local account registry:', err);
    }
  }
  if (!authBacked) {
    STAFF_ACCOUNTS[username]=normalizeAccount(username,{role:'admin',display,companyId,companyName,generalJobsCountries});
    try {
      await setAccountPassword(STAFF_ACCOUNTS[username], password);
    } catch (err) {
      delete STAFF_ACCOUNTS[username];
      return fail(err.message || 'Password could not be secured. Use HTTPS and try again.');
    }
  }
  await saveStaffAccounts();
  errEl.style.display='none';
  const account = STAFF_ACCOUNTS[username];
  currentUser={username,role:account.role,display:account.display,companyId:account.companyId,companyName:account.companyName,generalJobsCountries:account.generalJobsCountries,authUserId:account.authUserId};
  setCurrentWorkspace(currentUser);
  safeSessionSet('dr_user',JSON.stringify(currentUser));
  document.getElementById('login-screen').style.display='none';
  document.getElementById('app').style.display='block';
  document.getElementById('bottom-nav')?.classList.add('visible');
  setUserDisplay(display,'admin');
  appStorageMode = db ? 'cloud' : 'local';
  loadAllData();
}

async function doLogin() {
  await loadStaffAccounts();
  const username=(document.getElementById('username-input').value||'').trim().toLowerCase();
  const password=(document.getElementById('pw-input').value||'').trim();
  const errEl=document.getElementById('login-error');
  const fail = msg => {
    errEl.textContent = msg;
    errEl.style.display = 'block';
    setLoginBusy(false);
  };
  setLoginBusy(true);
  errEl.style.display='none';
  if (DEFAULT_ADMIN_BLOCKED_ALIASES.includes(username)) {
    fail(`Use ${DEFAULT_ADMIN_USERNAME} to sign in.`);
    return;
  }
  try {
    const authLogin = await signInWithSupabaseAuth(username, password);
    if (authLogin?.account) {
      STAFF_ACCOUNTS[username]=normalizeAccount(username, authLogin.account);
      await saveStaffAccounts();
      errEl.style.display='none';
      setLoginSuccessState();
      currentUser={username,role:authLogin.account.role,display:authLogin.account.display,companyId:authLogin.account.companyId,companyName:authLogin.account.companyName,generalJobsCountries:authLogin.account.generalJobsCountries,authUserId:authLogin.account.authUserId};
      setCurrentWorkspace(currentUser);
      safeSessionSet('dr_user',JSON.stringify(currentUser));
      document.getElementById('login-screen').style.display='none';
      document.getElementById('app').style.display='block';
      document.getElementById('bottom-nav')?.classList.add('visible');
      setUserDisplay(authLogin.account.display, authLogin.account.role);
      appStorageMode = db ? 'cloud' : 'local';
      loadAllData();
      return;
    }
  } catch (err) {
    console.warn('Supabase Auth login unavailable; trying local account registry:', err);
  }
  const account=STAFF_ACCOUNTS[username];
  let passwordCheck = { ok: false, migrated: false };
  try {
    passwordCheck = await verifyAccountPassword(account, password);
  } catch (err) {
    fail(err.message || 'Login failed.');
    return;
  }
  if (!passwordCheck.ok) { fail('Incorrect username or password.'); return; }
  if (passwordCheck.migrated) await saveStaffAccounts();
  errEl.style.display='none';
  setLoginSuccessState();
  currentUser={username,role:account.role,display:account.display,companyId:account.companyId,companyName:account.companyName,generalJobsCountries:account.generalJobsCountries};
  setCurrentWorkspace(currentUser);
  safeSessionSet('dr_user',JSON.stringify(currentUser));
  document.getElementById('login-screen').style.display='none';
  document.getElementById('app').style.display='block';
  document.getElementById('bottom-nav')?.classList.add('visible');
  setUserDisplay(account.display, account.role);
  appStorageMode = db ? 'cloud' : 'local';
  loadAllData();
}
function doLogout() {
  if (db?.auth) db.auth.signOut().catch(err => console.warn('Supabase sign out failed:', err));
  safeSessionRemove('dr_user'); currentUser=null;
  document.getElementById('app').style.display='none';
  document.getElementById('bottom-nav')?.classList.remove('visible');
  document.getElementById('login-screen').style.display='flex';
  document.getElementById('pw-input').value='';
  document.getElementById('username-input').value='';
  document.getElementById('login-error').style.display='none';
  setLoginBusy(false);
  hideForgotPassword();
}

window.addEventListener('DOMContentLoaded', async () => {
  await loadStaffAccounts();
  initLoginInteractions();
  const saved=safeSessionGet('dr_user');
  if (saved) {
    try {
      const parsed=JSON.parse(saved);
      const account=STAFF_ACCOUNTS[parsed.username];
      if(!account) throw new Error('Unknown saved user');
      currentUser={username:parsed.username,role:account.role,display:account.display,companyId:account.companyId,companyName:account.companyName,generalJobsCountries:account.generalJobsCountries};
      setCurrentWorkspace(currentUser);
      safeSessionSet('dr_user',JSON.stringify(currentUser));
      document.getElementById('login-screen').style.display='none';
      document.getElementById('app').style.display='block';
      document.getElementById('bottom-nav')?.classList.add('visible');
      setUserDisplay(currentUser.display, currentUser.role);
      appStorageMode = db ? 'cloud' : 'local';
      loadAllData();
    } catch { safeSessionRemove('dr_user'); }
  }
  rebuildStageSelects();
  ['pro-modal','lb-modal','docs-modal','settings-modal','help-modal'].forEach(id=>{
    const el=document.getElementById(id);
    if(el) el.addEventListener('click',e=>{ if(e.target===el) closeModal(id); });
  });
  document.getElementById('profile-dropdown')?.addEventListener('click',e=>e.stopPropagation());
  bindModalSummaries();
});

// *Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â
// DATA LOADING
// *Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â
async function loadAllData() {
  if (!useCloud()) {
    appStorageMode='local';
    const local = loadLocalStore();
    proDB = local.pro;
    lbDB = local.lb;
    allDocs = local.docs;
    allTimelines = local.timelines;
    proStages = local.proStages;
    lbStages = local.lbStages;
    rebuildStageSelects();
    restoreUserFilters();
    hideLoading();
    switchTab('dash');
    return;
  }
  showLoading('Loading candidates...');
  try {
    const companyId = getCompanyId();
    const proQuery = db.from('pro_candidates').select('*').order('id');
    const lbQuery = db.from('lb_candidates').select('*').order('id');
    const docsQuery = db.from('documents').select('*');
    const timelinesQuery = db.from('timelines').select('*');
    if (companyId === DEFAULT_COMPANY.id) {
      proQuery.or(`company_id.eq.${companyId},company_id.is.null`);
      lbQuery.or(`company_id.eq.${companyId},company_id.is.null`);
    } else {
      proQuery.eq('company_id', companyId);
      lbQuery.eq('company_id', companyId);
      docsQuery.like('key', `${companyId}:%`);
      timelinesQuery.like('key', `${companyId}:%`);
    }
    const [proRes,lbRes,docsRes,tlRes,stagesRes]=await Promise.all([
      proQuery,
      lbQuery,
      docsQuery,
      timelinesQuery,
      db.from('app_settings').select('*'),
    ]);
    appStorageMode='cloud';
    lastSyncError='';
    if (proRes.data&&proRes.data.length>0) proDB=proRes.data.map(normalizeProRecord); else if(companyId===DEFAULT_COMPANY.id) await seedProData(); else proDB=[];
    if (lbRes.data&&lbRes.data.length>0)   lbDB=lbRes.data.map(normalizeLBRecord);   else if(companyId===DEFAULT_COMPANY.id) await seedLBData(); else lbDB=[];
    allDocs={};
    allTimelines={};
    if (docsRes.data)   docsRes.data.forEach(r=>{ if(companyId===DEFAULT_COMPANY.id&&!String(r.key).includes(':')) allDocs[r.key]=r.data; else if(String(r.key).startsWith(`${companyId}:`)) allDocs[stripCompanyScopedKey(r.key)]=r.data; });
    if (tlRes.data)     tlRes.data.forEach(r=>{ if(companyId===DEFAULT_COMPANY.id&&!String(r.key).includes(':')) allTimelines[r.key]=r.entries; else if(String(r.key).startsWith(`${companyId}:`)) allTimelines[stripCompanyScopedKey(r.key)]=r.entries; });
    if (stagesRes.data) {
      const ps=stagesRes.data.find(r=>r.key===getCompanyScopedKey('pro_stages')) || stagesRes.data.find(r=>r.key==='pro_stages'&&companyId===DEFAULT_COMPANY.id);
      const ls=stagesRes.data.find(r=>r.key===getCompanyScopedKey('lb_stages')) || stagesRes.data.find(r=>r.key==='lb_stages'&&companyId===DEFAULT_COMPANY.id);
      if (ps) proStages=ps.value;
      if (ls) lbStages=ls.value;
    }
  } catch(err) {
    console.warn('Supabase error, falling back to local data:',err);
    appStorageMode='local';
    lastSyncError=err.message||'Supabase connection failed';
    const local=loadLocalStore();
    proDB=local.pro;
    lbDB=local.lb;
    allDocs=local.docs;
    allTimelines=local.timelines;
    proStages=local.proStages;
    lbStages=local.lbStages;
    showToast('Cloud sync unavailable. Using local mode.','error');
  }
  rebuildStageSelects();
  restoreUserFilters();
  hideLoading();
  switchTab('dash');
}

function normalizeDateField(v) {
  if (v===''||v===null||v===undefined) return null;
  if (typeof v==='number') return xlToISO(v);
  return v;
}
async function seedProData() {
  const seed=JSON.parse(JSON.stringify(PRO_SEED)).map(r=>{
    ['submitted','interview','ol','mol','visa','travel'].forEach(f=>r[f]=normalizeDateField(r[f]));
    if(r.commission==='') r.commission=null; if(r.paid==='') r.paid=null; r.company_id=getCompanyId(); delete r.id; return r;
  });
  const {data,error}=await db.from('pro_candidates').insert(seed).select();
  if(data&&data.length) proDB=data.map(normalizeProRecord); else { console.warn('Seed insert failed',error); proDB=JSON.parse(JSON.stringify(PRO_SEED)).map(normalizeProRecord); }
}
async function seedLBData() {
  const seed=JSON.parse(JSON.stringify(LB_SEED)).map(r=>{
    ['travelDate','r1Date','r2Date'].forEach(f=>r[f]=normalizeDateField(r[f])); r.company_id=getCompanyId(); r.country='Lebanon'; delete r.id; return r;
  });
  const {data,error}=await db.from('lb_candidates').insert(seed).select();
  if(data&&data.length) lbDB=data.map(normalizeLBRecord); else { console.warn('Seed insert failed',error); lbDB=JSON.parse(JSON.stringify(LB_SEED)).map(normalizeLBRecord); }
}

// *Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â
// SAVE STATUS
// *Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â
function setSaveStatus(s) {
  const dot=document.getElementById('save-dot');
  const lbl=document.getElementById('save-label');
  if (!dot||!lbl) return;
  dot.className='save-dot'+(s==='saving'?' saving':'');
  lbl.textContent=s==='saving'?'Saving...':`${appStorageMode==='cloud'?'Cloud saved':'Local saved'} ${new Date().toLocaleTimeString('en-GB',{hour:'2-digit',minute:'2-digit'})}`;
}

// *Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â
// SUPABASE WRITES
// *Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â
function useCloud() { return db && appStorageMode==='cloud'; }
async function dbInsert(table, rec) {
  const ts={...rec, company_id:getCompanyId()}; delete ts.id;
  const {data,error}=await db.from(table).insert(ts).select().single();
  if(error) throw error;
  return data;
}
async function dbUpdate(table, id, rec) {
  const ts={...rec, company_id:getCompanyId()}; delete ts.id;
  let query=db.from(table).update(ts).eq('id',id);
  if(getCompanyId()!==DEFAULT_COMPANY.id) query=query.eq('company_id',getCompanyId());
  const {error}=await query;
  if(error) throw error;
}
async function dbDelete(table, id) {
  let query=db.from(table).delete().eq('id',id);
  if(getCompanyId()!==DEFAULT_COMPANY.id) query=query.eq('company_id',getCompanyId());
  const {error}=await query;
  if(error) throw error;
}
function fallBackToLocal(err) {
  console.error(err);
  appStorageMode='local';
  lastSyncError=err.message||'Supabase write failed';
  saveLocalStore();
  showToast('Cloud save failed. Saved locally instead.','error');
}
async function saveProRecord(rec) {
  setSaveStatus('saving');
  if (!useCloud()) {
    saveLocalStore();
    setSaveStatus('saved');
    return;
  }
  const tempId=rec.id;
  try {
    if (editingProId) {
      await dbUpdate('pro_candidates',rec.id,rec);
    } else {
      const data=await dbInsert('pro_candidates',rec);
      if (data) {
        const oldId=rec.id;
        rec.id=data.id;
        const i=proDB.findIndex(x=>x.id==oldId); if(i>-1) proDB[i].id=data.id;
        if(allTimelines[`pro_${tempId}`]){allTimelines[`pro_${rec.id}`]=allTimelines[`pro_${tempId}`];delete allTimelines[`pro_${tempId}`];}
        renderPro();
      }
    }
    await saveTimeline(`pro_${rec.id}`);
    setSaveStatus('saved');
  } catch(e){ fallBackToLocal(e); setSaveStatus('saved'); }
}
async function saveLBRecord(rec) {
  setSaveStatus('saving');
  if (!useCloud()) {
    saveLocalStore();
    setSaveStatus('saved');
    return;
  }
  const tempId=rec.id;
  try {
    if (editingLbId) {
      await dbUpdate('lb_candidates',rec.id,rec);
    } else {
      const data=await dbInsert('lb_candidates',rec);
      if (data) {
        const oldId=rec.id;
        rec.id=data.id;
        const i=lbDB.findIndex(x=>x.id==oldId); if(i>-1) lbDB[i].id=data.id;
        if(allTimelines[`lb_${tempId}`]){allTimelines[`lb_${rec.id}`]=allTimelines[`lb_${tempId}`];delete allTimelines[`lb_${tempId}`];}
        renderLB();
      }
    }
    await saveTimeline(`lb_${rec.id}`);
    setSaveStatus('saved');
  } catch(e){ fallBackToLocal(e); setSaveStatus('saved'); }
}
async function deleteProRecord(id){ setSaveStatus('saving'); if(!useCloud()){ saveLocalStore(); setSaveStatus('saved'); return; } try{ await dbDelete('pro_candidates',id); setSaveStatus('saved'); }catch(e){fallBackToLocal(e);setSaveStatus('saved');} }
async function deleteLBRecord(id){ setSaveStatus('saving'); if(!useCloud()){ saveLocalStore(); setSaveStatus('saved'); return; } try{ await dbDelete('lb_candidates',id); setSaveStatus('saved'); }catch(e){fallBackToLocal(e);setSaveStatus('saved');} }
async function saveDocsToDB(key,data){ setSaveStatus('saving'); if(!useCloud()){ saveLocalStore(); setSaveStatus('saved'); return; } try{ const {error}=await db.from('documents').upsert({key:getCompanyScopedKey(key),data,company_id:getCompanyId()},{onConflict:'key'}); if(error) throw error; setSaveStatus('saved'); }catch(e){fallBackToLocal(e);setSaveStatus('saved');} }
async function saveTimeline(key){ if(!allTimelines[key]) return; if(!useCloud()){ saveLocalStore(); return; } try{ const {error}=await db.from('timelines').upsert({key:getCompanyScopedKey(key),entries:allTimelines[key],company_id:getCompanyId()},{onConflict:'key'}); if(error) throw error; }catch(e){fallBackToLocal(e);} }
async function saveStages(){
  setSaveStatus('saving');
  if(!useCloud()){ saveLocalStore(); setSaveStatus('saved'); return; }
  try{ const {error}=await db.from('app_settings').upsert([{key:getCompanyScopedKey('pro_stages'),value:proStages,company_id:getCompanyId()},{key:getCompanyScopedKey('lb_stages'),value:lbStages,company_id:getCompanyId()}],{onConflict:'key'}); if(error) throw error; setSaveStatus('saved'); }
  catch(e){fallBackToLocal(e);setSaveStatus('saved');}
}

// *Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â
// TIMELINE
// *Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â
function addTimeline(type,id,action){
  const key=`${type}_${id}`;
  if(!allTimelines[key]) allTimelines[key]=[];
  allTimelines[key].unshift({action,user:currentUser?currentUser.display:'System',ts:new Date().toISOString()});
  if(allTimelines[key].length>50) allTimelines[key].length=50;
}
function renderTimelineHTML(type,id){
  const items=allTimelines[`${type}_${id}`]||[];
  if(!items.length) return '<div class="tl-empty">No activity yet.</div>';
  return items.map(item=>{
    const d=new Date(item.ts);
    const ds=d.toLocaleDateString('en-GB',{day:'2-digit',month:'short',year:'2-digit'});
    const ts=d.toLocaleTimeString('en-GB',{hour:'2-digit',minute:'2-digit'});
    return `<div class="tl-item-modal"><div class="tl-dot-modal"></div><div><div class="tl-action-modal">${escHTML(item.action)}</div><div class="tl-meta-modal">${escHTML(item.user)} &middot; ${ds} ${ts}</div></div></div>`;
  }).join('');
}

// *Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â
// HELPERS
// *Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â
function xlToISO(n){ if(!n||isNaN(n)) return ''; return new Date(EXCEL_EPOCH.getTime()+n*86400000).toISOString().split('T')[0]; }
function escHTML(v){
  return String(v ?? '').replace(/[&<>"']/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
}
function escJSString(v){
  return String(v ?? '').replace(/\\/g,'\\\\').replace(/'/g,"\\'").replace(/"/g,'&quot;').replace(/[\r\n]+/g,' ');
}
function fmtDate(v){
  if(!v) return '&mdash;';
  const s=typeof v==='number'?xlToISO(v):v; if(!s) return '&mdash;';
  try{ const d=new Date(s); if(isNaN(d)) return escHTML(s); return d.toLocaleDateString('en-GB',{day:'2-digit',month:'short',year:'2-digit'}); }catch{return escHTML(s);}
}
function toInput(v){ if(!v) return ''; return typeof v==='number'?xlToISO(v):v; }
function getRefundStatus(r){
  if((r.ppStatus||r.pp_status)==='HAD PP') return 'N/A';
  const notes=(r.notes||'').trim().toUpperCase();
  if(notes==='RETURNED') return 'RETURNED';
  const toRef=Number(r.toRefund||r.to_refund)||0;
  if(!toRef) return 'N/A';
  const paid=(Number(r.r1Amt||r.r1_amt)||0)+(Number(r.r2Amt||r.r2_amt)||0);
  return paid>=toRef?'complete':'incomplete';
}
function isInProcessPro(r){ return ['PENDING OFFER LETTER','PENDING MOL','PENDING VISA','PENDING TRAVEL'].includes(r.stage); }
function isInProcessLB(r){ return (r.ppStatus||r.pp_status)!=='HAD PP'&&(r.travelStatus||r.travel_status)==='NOT YET'; }
function stageBadge(s){
  const map={'PENDING OFFER LETTER':'b-pol','PENDING MOL':'b-mol','PENDING VISA':'b-visa','PENDING TRAVEL':'b-travel','TRAVELLED':'b-travelled'};
  return `<span class="badge ${map[s]||'b-na'}">${escHTML(s)}</span>`;
}
function travelBadge(s){
  const map={'TRAVELLED':'b-travelled','NOT YET':'b-notyet','NOT TRAVELLED':'b-nottravelled'};
  return `<span class="badge ${map[s]||'b-na'}">${escHTML(s)}</span>`;
}
function refundBadge(s){
  const map={complete:'b-complete',incomplete:'b-incomplete',RETURNED:'b-returned','N/A':'b-na'};
  return `<span class="badge ${map[s]||'b-na'}">${escHTML(s)}</span>`;
}
function ppBadge(s){
  const map={'APPLIED':'b-applied','NOT APPLIED':'b-notapplied','HAD PP':'b-hadpp','PUSHED':'b-pushed'};
  return `<span class="badge ${map[s]||'b-na'}">${s ? escHTML(s) : '&mdash;'}</span>`;
}

// *Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â
// TABS + MODALS
// *Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â
function switchTab(t){
  const tabs=['dash','pro','lb','kanban','travel','calendar','commissions','repayments','expenses','reports','team','settings','help'];
  tabs.forEach(x=>{
    const nav=document.getElementById('nav-'+x); if(nav) nav.classList.toggle('active',x===t);
    const sec=document.getElementById(x+'-section'); if(sec) sec.style.display=x===t?'':'none';
  });
  setBottomNav(t);
  if (typeof closeProfileDropdown === 'function') closeProfileDropdown();
  const titles={dash:'Dashboard',pro:'Professional Jobs',lb:'General Jobs',kanban:'Pipeline Board',travel:'Travel',calendar:'Calendar',commissions:'Commissions',repayments:'Repayments',expenses:'Expenses',reports:'Reports',team:'Team',settings:'Settings',help:'Help & Support'};
  const titleEl=document.getElementById('topbar-title'); if(titleEl) titleEl.textContent=titles[t]||'';
  if(t==='dash') renderDash();
  if(t==='pro')  { rebuildProPills(); renderPro(); }
  if(t==='lb')   renderLB();
  if(t==='kanban') renderKanban();
  if(t==='travel') renderTravel();
  if(t==='calendar') renderCalendar();
  if(t==='commissions') renderCommissions();
  if(t==='repayments') renderRepayments();
  if(t==='expenses') renderExpenses();
  if(t==='reports') renderReports();
  if(t==='team') renderTeam();
  if(t==='settings') renderSettingsPage();
  if(t==='help') renderHelpPage();
}
function setBottomNav(t){
  document.querySelectorAll('.bottom-nav-item').forEach(btn=>btn.classList.remove('active'));
  const active=document.getElementById('bnav-'+t);
  if(active){
    active.classList.add('active');
    const nav=document.getElementById('bottom-nav');
    if(nav && nav.classList.contains('visible')){
      active.scrollIntoView({behavior:'smooth', inline:'center', block:'nearest'});
    }
  }
}
function setKanbanSource(src,btn){
  kanbanSource=src;
  document.querySelectorAll('#kanban-source-tabs .pill-tab').forEach(b=>b.classList.remove('active'));
  if(btn) btn.classList.add('active');
  const title=document.getElementById('kanban-title');
  const addBtn=document.getElementById('kanban-add-btn');
  if(title) title.textContent=src==='pro'?'Professional Pipeline Board':'General Jobs Board';
  if(addBtn) addBtn.setAttribute('onclick',src==='pro'?'openProForm()':'openLBForm()');
  renderKanban();
}
function renderKanban(){
  const board=document.getElementById('kanban-board'); if(!board) return;
  const stages=kanbanSource==='pro'?proStages:lbStages;
  const rows=kanbanSource==='pro'?proDB:lbDB;
  board.innerHTML=stages.map(stage=>{
    const items=rows.filter(r=>(kanbanSource==='pro'?r.stage:(r.travelStatus||r.travel_status))===stage);
    const cards=items.length?items.map(r=>{
      const meta=kanbanSource==='pro'
        ? `${r.position||'No position'}  |  ${r.company||'No company'}`
        : `${r.ppStatus||r.pp_status||'Passport'}  |  ${getRefundStatus(r)}`;
      const footer=kanbanSource==='pro'
        ? `<span class="kanban-card-country">${r.country||'-'}</span><span class="kanban-card-comm">${r.commission?'KES '+Number(r.commission).toLocaleString():''}</span>`
        : `<span class="kanban-card-country">${r.phone||'-'}</span><span class="kanban-card-comm">${moneyUSD(Number(r.toRefund||r.to_refund)||0)}</span>`;
      return `<div class="kanban-card" onclick="${kanbanSource==='pro'?'editPro':'editLB'}(${r.id})">
        <div class="kanban-card-name">${r.name}</div>
        <div class="kanban-card-meta"><i class="ti ti-id"></i>${meta}</div>
        <div class="kanban-card-footer">${footer}</div>
      </div>`;
    }).join(''):'<div class="kanban-empty">No candidates</div>';
    return `<div class="kanban-col">
      <div class="kanban-col-header"><div class="kanban-col-title">${stage}</div><div class="kanban-col-count">${items.length}</div></div>
      ${cards}
    </div>`;
  }).join('');
}
function setCalSource(src,btn){
  calSource=src;
  document.querySelectorAll('#cal-source-tabs .pill-tab').forEach(b=>b.classList.remove('active'));
  if(btn) btn.classList.add('active');
  renderCalendar();
}
function calNav(delta){
  calDate=new Date(calDate.getFullYear(),calDate.getMonth()+delta,1);
  renderCalendar();
}
function collectCalendarEvents(){
  const events=[];
  if(calSource==='pro'){
    proDB.forEach(r=>{
      [['interview','Interview','cal-ev-interview'],['ol','Offer letter','cal-ev-ol'],['mol','MOL','cal-ev-mol'],['visa','Visa','cal-ev-visa'],['travel','Travel','cal-ev-travel']].forEach(([field,label,cls])=>{
        const date=toInput(r[field]);
        if(date) events.push({date,label:`${label}: ${r.name}`,cls,open:`editPro(${r.id})`});
      });
    });
  } else {
    lbDB.forEach(r=>{
      const date=toInput(r.travelDate||r.travel_date);
      if(date) events.push({date,label:`Travel: ${r.name}`,cls:'cal-ev-lb',open:`editLB(${r.id})`});
    });
  }
  return events;
}
function renderCalendar(){
  const grid=document.getElementById('cal-grid'); if(!grid) return;
  const label=document.getElementById('cal-month-label');
  const year=calDate.getFullYear(), month=calDate.getMonth();
  if(label) label.textContent=calDate.toLocaleDateString('en-GB',{month:'short',year:'numeric'});
  const first=new Date(year,month,1);
  const start=new Date(year,month,1-((first.getDay()+6)%7));
  const today=new Date().toISOString().split('T')[0];
  const events=collectCalendarEvents();
  let days='';
  for(let i=0;i<42;i++){
    const d=new Date(start); d.setDate(start.getDate()+i);
    const iso=d.toISOString().split('T')[0];
    const dayEvents=events.filter(e=>e.date===iso).slice(0,3);
    days+=`<div class="cal-day ${d.getMonth()!==month?'other-month':''} ${iso===today?'today':''}">
      <div class="cal-day-num">${d.getDate()}</div>
      ${dayEvents.map(e=>`<div class="cal-event ${e.cls}" onclick="${e.open}">${e.label}</div>`).join('')}
    </div>`;
  }
  grid.innerHTML=`<div class="cal-header-row">${['Mon','Tue','Wed','Thu','Fri','Sat','Sun'].map(d=>`<div class="cal-header-cell">${d}</div>`).join('')}</div><div class="cal-grid-body">${days}</div>`;
}
function renderReports(){
  const wrap=document.getElementById('reports-content'); if(!wrap) return;
  const proTravelled=proDB.filter(r=>r.stage==='TRAVELLED').length;
  const lbTravelled=lbDB.filter(r=>(r.travelStatus||r.travel_status)==='TRAVELLED').length;
  const totalComm=proDB.reduce((sum,r)=>sum+(Number(r.commission)||0),0);
  const totalPaid=proDB.reduce((sum,r)=>sum+(Number(r.paid)||0),0);
  const refundOpen=lbDB.filter(r=>getRefundStatus(r)==='incomplete').length;
  const proActionCount=proDB.filter(proNeedsAction).length;
  const lbActionCount=lbDB.filter(lbNeedsAction).length;
  const missingDocs=proDB.filter(r=>!hasDocs('pro',r.id)).length+lbDB.filter(r=>!hasDocs('lb',r.id)).length;
  const stalledStages=proStages.map(stage=>({stage,count:proDB.filter(r=>r.stage===stage).length})).sort((a,b)=>b.count-a.count)[0];
  const money=n=>'KES '+Number(n||0).toLocaleString();
  const short=s=>{
    const v=String(s||'-').replace(/^PENDING\s+/,'').trim();
    return v.length>11?v.slice(0,10)+'...':v;
  };
  const palette=['#5347CE','#887CFD','#4896FE','#16C8C7','#DDEBFF','#EFEEFF','#E8FAF7','#F8FAFC'];
  const chartBars=(items,max,colorFn)=>items.map((item,i)=>{
    const pct=max?Math.max(8,Math.round((item.value/max)*100)):8;
    const color=colorFn?colorFn(item,i):palette[i%palette.length];
    return `<div class="report-bar-wrap" title="${item.label}: ${item.value}">
      <div class="report-bar" style="height:${pct}%;--bar-height:${pct}%;--bar-color:${color}"></div>
      <div class="report-bar-count">${item.value}</div>
      <div class="report-bar-label">${short(item.short||item.label)}</div>
    </div>`;
  }).join('');
  const legend=items=>`<div class="chart-legend">${items.map((item,i)=>`<span class="chart-legend-item"><span class="legend-dot" style="background:${item.color||palette[i%palette.length]}"></span>${item.label}</span>`).join('')}</div>`;

  const stageData=proStages.map((stage,i)=>({
    label:stage,
    short:stage.replace('PENDING ',''),
    value:proDB.filter(r=>r.stage===stage).length,
    color:palette[i%palette.length]
  })).filter(x=>x.value>0);
  const maxStage=Math.max(1,...stageData.map(x=>x.value));

  const positionMap={};
  proDB.forEach(r=>{
    const key=(r.position||'Unassigned').trim()||'Unassigned';
    if(!positionMap[key]) positionMap[key]={position:key,total:0,travelled:0,inProcess:0,billed:0,paid:0};
    positionMap[key].total++;
    if(r.stage==='TRAVELLED') positionMap[key].travelled++;
    else positionMap[key].inProcess++;
    positionMap[key].billed+=Number(r.commission)||0;
    positionMap[key].paid+=Number(r.paid)||0;
  });
  const positionStats=Object.values(positionMap).sort((a,b)=>b.total-a.total||a.position.localeCompare(b.position));
  const positionChart=positionStats.slice(0,8).map((row,i)=>({label:row.position,short:row.position,value:row.total,color:palette[i%4]}));
  const maxPosition=Math.max(1,...positionChart.map(x=>x.value));

  const monthLabels=['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  const monthData=monthLabels.map((m,i)=>({label:m,short:m,value:0,color:'#DDE8D8'}));
  proDB.forEach(r=>{
    const raw=toInput(r.travel||r.visa||r.ol||r.submitted);
    if(raw){
      const d=new Date(raw);
      if(!Number.isNaN(d.getTime())) monthData[d.getMonth()].value++;
    }
  });
  const maxMonth=Math.max(1,...monthData.map(x=>x.value));
  const conversion=proDB.length?Math.round((proTravelled/proDB.length)*100):0;
  const tableRows=positionStats.length?positionStats.map(row=>{
    const conv=row.total?Math.round((row.travelled/row.total)*100):0;
    return `<tr>
      <td class="name-cell">${row.position}</td>
      <td>${row.total}</td>
      <td>${row.travelled}</td>
      <td>${row.inProcess}</td>
      <td>${money(row.billed)}</td>
      <td>${money(row.paid)}</td>
      <td><span class="conversion-pill ${conv>=50?'high':'low'}">${conv}%</span></td>
    </tr>`;
  }).join(''):`<tr><td colspan="7"><div class="empty">No position data yet</div></td></tr>`;

  wrap.innerHTML=`<div class="action-grid">
    <div class="action-card warn"><i class="ti ti-alert-triangle"></i><div><strong>${proActionCount}</strong><span>Professional records need attention: missing docs, pending travel, or outstanding balance.</span></div></div>
    <div class="action-card danger"><i class="ti ti-receipt-refund"></i><div><strong>${lbActionCount}</strong><span>General Jobs records need attention, including ${refundOpen} open balances.</span></div></div>
    <div class="action-card good"><i class="ti ti-file-check"></i><div><strong>${missingDocs}</strong><span>Candidate records are missing document links across both pipelines.</span></div></div>
  </div>
  <div class="reports-grid">
    <div class="report-card">
      <div class="report-card-title"><i class="ti ti-chart-pie"></i>Stage Distribution</div>
      <div class="report-subtitle">Professional candidates by current placement stage</div>
      <div class="report-chart">${chartBars(stageData.length?stageData:[{label:'No data',value:0,color:'#ECEDE6'}],maxStage,(item)=>item.color)}</div>
      ${legend(stageData)}
      <div class="report-note">Largest stage: ${stalledStages?`${stalledStages.stage} (${stalledStages.count})`:'No stage data yet'}</div>
    </div>
    <div class="report-card">
      <div class="report-card-title"><i class="ti ti-briefcase"></i>Position Breakdown</div>
      <div class="report-subtitle">Top positions by candidate volume</div>
      <div class="report-chart">${chartBars(positionChart.length?positionChart:[{label:'No data',value:0,color:'#ECEDE6'}],maxPosition,(item)=>item.color)}</div>
      <div class="report-note">${positionStats.slice(0,5).map(r=>`${r.position}: ${r.total}`).join('  |  ')||'No position records yet'}</div>
    </div>
    <div class="report-card">
      <div class="report-card-title"><i class="ti ti-trending-up"></i>Monthly Trend</div>
      <div class="report-subtitle">Activity by month using travel, visa, offer, or submitted dates</div>
      <div class="report-chart">${chartBars(monthData,maxMonth,(item,i)=>item.value?palette[i%4]:'#EEF1F5')}</div>
    </div>
    <div class="report-card">
      <div class="report-card-title"><i class="ti ti-coin"></i>Revenue Summary</div>
      <div class="rev-grid">
        <div class="rev-cell"><div class="rev-cell-val">${money(totalComm)}</div><div class="rev-cell-label">Total Commission Billed</div></div>
        <div class="rev-cell"><div class="rev-cell-val green">${money(totalPaid)}</div><div class="rev-cell-label">Commission Collected</div></div>
        <div class="rev-cell"><div class="rev-cell-val amber">${money(totalComm-totalPaid)}</div><div class="rev-cell-label">Outstanding</div></div>
        <div class="rev-cell"><div class="rev-cell-val">${conversion}%</div><div class="rev-cell-label">Conversion Rate</div></div>
      </div>
      <div class="report-note">${lbTravelled} General Jobs travelled  |  ${refundOpen} open balances</div>
    </div>
    <div class="report-card report-wide">
      <div class="report-card-title"><i class="ti ti-table"></i>Position-Wise Summary</div>
      <div class="table-scroll">
        <table class="report-table">
          <thead><tr><th>Position</th><th>Total</th><th>Travelled</th><th>In Process</th><th>Commission Billed</th><th>Commission Collected</th><th>Conversion %</th></tr></thead>
          <tbody>${tableRows}</tbody>
        </table>
      </div>
    </div>
  </div>`;
}
function exportReportPDF(){
  renderReports();
  window.print();
}
function openSettings(){ closeProfileDropdown(); switchTab('settings'); }
function renderSettingsCountries() {
  const card = document.getElementById('settings-countries-card');
  const list = document.getElementById('settings-countries-list');
  const err = document.getElementById('settings-country-error');
  if (err) { err.textContent = ''; err.style.display = 'none'; }
  if (!card || !list) return;
  const isAdmin = currentUser?.role === 'admin';
  card.style.display = isAdmin ? 'flex' : 'none';
  if (!isAdmin) return;
  const countries = getGeneralCountries();
  list.innerHTML = countries.map(country => `
    <span style="display:inline-flex;align-items:center;gap:6px;border:1px solid var(--border);border-radius:999px;background:#F8FAFC;padding:7px 9px;font-size:12px;font-weight:800;color:var(--ink)">
      ${escHTML(country)}
      <button type="button" onclick="removeSettingsCountry('${escJSString(country)}')" title="Remove ${escHTML(country)}" style="border:0;background:transparent;color:var(--text-3);cursor:pointer;padding:0;display:inline-flex;align-items:center">
        <i class="ti ti-x"></i>
      </button>
    </span>
  `).join('') || '<div class="empty" style="padding:12px">No countries configured</div>';
}
async function addSettingsCountry() {
  if (currentUser?.role !== 'admin') { showToast('Only admins can manage countries','error'); return; }
  const input = document.getElementById('settings-new-country');
  const err = document.getElementById('settings-country-error');
  const name = (input?.value || '').trim();
  const fail = msg => { if (err) { err.textContent = msg; err.style.display = 'block'; } };
  if (!name) return fail('Country name is required.');
  const countries = getGeneralCountries();
  if (countries.some(c => c.toLowerCase() === name.toLowerCase())) return fail('That country already exists.');
  const next = [...countries, name];
  window.generalCountryFilter = name;
  await persistWorkspaceCountries(next);
  if (input) input.value = '';
  renderSettingsCountries();
  renderGeneralCountryTabs();
  renderLB();
  renderDash();
  showToast('Country added','success');
}
async function removeSettingsCountry(country) {
  if (currentUser?.role !== 'admin') { showToast('Only admins can manage countries','error'); return; }
  const countries = getGeneralCountries();
  if (countries.length <= 1) { showToast('Keep at least one country','error'); return; }
  const hasRecords = lbDB.some(r => (r.country || DEFAULT_COMPANY.generalJobsCountries[0] || 'Lebanon') === country);
  if (hasRecords && !confirm(`${country} has General Jobs records. Remove the tab anyway? Records will not be deleted.`)) return;
  const next = countries.filter(c => c !== country);
  if (window.generalCountryFilter === country) window.generalCountryFilter = next[0] || '';
  await persistWorkspaceCountries(next);
  renderSettingsCountries();
  renderGeneralCountryTabs();
  renderLB();
  renderDash();
  showToast('Country removed','success');
}
function getCompanyUsers() {
  const companyId = getCompanyId();
  return Object.entries(STAFF_ACCOUNTS)
    .filter(([, account]) => (account.companyId || DEFAULT_COMPANY.id) === companyId)
    .sort(([a], [b]) => a.localeCompare(b));
}
function renderCompanyUsers() {
  const card = document.getElementById('settings-users-card');
  const list = document.getElementById('settings-users-list');
  const err = document.getElementById('new-user-error');
  if (err) { err.textContent = ''; err.style.display = 'none'; }
  if (!card || !list) return;
  const isAdmin = currentUser?.role === 'admin';
  card.style.display = isAdmin ? 'flex' : 'none';
  if (!isAdmin) return;
  const users = getCompanyUsers();
  list.innerHTML = users.map(([username, account]) => `
    <div style="display:flex;align-items:center;justify-content:space-between;gap:10px;border:1px solid var(--border);border-radius:10px;padding:9px 10px;background:#F8FAFC">
      <div style="min-width:0">
        <div style="font-size:13px;font-weight:800;color:var(--ink);white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${escHTML(account.display || username)}</div>
        <div style="font-size:11px;color:var(--text-3)">@${escHTML(username)}</div>
      </div>
      <span style="font-size:10px;font-weight:800;text-transform:uppercase;color:${account.role === 'admin' ? 'var(--nexus-purple)' : 'var(--text-3)'}">${account.role === 'admin' ? 'Admin' : 'Staff'}</span>
    </div>
  `).join('') || '<div class="empty" style="padding:12px">No users yet</div>';
}
async function createCompanyUser() {
  if (currentUser?.role !== 'admin') { showToast('Only admins can add users','error'); return; }
  const display = (document.getElementById('new-user-display')?.value || '').trim();
  const username = (document.getElementById('new-user-username')?.value || '').trim().toLowerCase();
  const role = document.getElementById('new-user-role')?.value === 'admin' ? 'admin' : 'staff';
  const password = (document.getElementById('new-user-password')?.value || '').trim();
  const errEl = document.getElementById('new-user-error');
  const fail = msg => {
    if (errEl) { errEl.textContent = msg; errEl.style.display = 'block'; }
  };
  if (!display) return fail('Display name is required.');
  if (!/^[a-z0-9._-]{3,32}$/.test(username)) return fail('Username must be 3-32 letters, numbers, dots, underscores, or hyphens.');
  if (STAFF_ACCOUNTS[username]) return fail('That username is already taken.');
  if (password.length < 6) return fail('Temporary password must be at least 6 characters.');
  if (db?.auth) {
    try {
      const { data: sessionData } = await db.auth.getSession();
      const token = sessionData?.session?.access_token;
      if (token) {
        const authResult = await postAuthAction({ action:'create_user', display, username, password, role }, token);
        STAFF_ACCOUNTS[username] = normalizeAccount(username, authResult.account);
        await saveStaffAccounts();
        ['new-user-display','new-user-username','new-user-password'].forEach(id => {
          const el = document.getElementById(id); if (el) el.value = '';
        });
        const roleEl = document.getElementById('new-user-role'); if (roleEl) roleEl.value = 'staff';
        if (errEl) { errEl.textContent = ''; errEl.style.display = 'none'; }
        renderCompanyUsers();
        showToast('User added','success');
        return;
      }
    } catch (err) {
      console.warn('Supabase Auth user creation unavailable; using local account registry:', err);
    }
  }
  STAFF_ACCOUNTS[username] = normalizeAccount(username, {
    role,
    display,
    companyId: getCompanyId(),
    companyName: getCompanyName(),
    generalJobsCountries: getGeneralCountries(),
  });
  try {
    await setAccountPassword(STAFF_ACCOUNTS[username], password);
    await saveStaffAccounts();
  } catch (err) {
    delete STAFF_ACCOUNTS[username];
    return fail(err.message || 'User could not be created.');
  }
  ['new-user-display','new-user-username','new-user-password'].forEach(id => {
    const el = document.getElementById(id); if (el) el.value = '';
  });
  const roleEl = document.getElementById('new-user-role'); if (roleEl) roleEl.value = 'staff';
  if (errEl) { errEl.textContent = ''; errEl.style.display = 'none'; }
  renderCompanyUsers();
  showToast('User added','success');
}
async function saveWorkspaceSettings(){
  const companyName=(document.getElementById('settings-company-name')?.value||'').trim();
  if(!companyName){ showToast('Company name is required','error'); return; }
  const companyId=getCompanyId();
  Object.keys(STAFF_ACCOUNTS).forEach(username=>{
    if((STAFF_ACCOUNTS[username].companyId||DEFAULT_COMPANY.id)===companyId){
      STAFF_ACCOUNTS[username].companyName=companyName;
    }
  });
  currentUser={...currentUser,companyName};
  setCurrentWorkspace(currentUser);
  safeSessionSet('dr_user',JSON.stringify(currentUser));
  await saveStaffAccounts();
  setUserDisplay(currentUser.display,currentUser.role);
  renderDash(); renderLB(); renderReports();
  showToast('Workspace updated','success');
}
function openHelp(){ closeProfileDropdown(); switchTab('help'); }
function downloadBackup(){
  const backup={
    exportedAt:new Date().toISOString(),
    storageMode:appStorageMode,
    pro:proDB,
    lb:lbDB,
    docs:allDocs,
    timelines:allTimelines,
    proStages,
    lbStages,
    staffAccounts:STAFF_ACCOUNTS,
  };
  const a=Object.assign(document.createElement('a'),{
    href:URL.createObjectURL(new Blob([JSON.stringify(backup,null,2)],{type:'application/json'})),
    download:`Dreco_Backup_${new Date().toISOString().split('T')[0]}.json`
  });
  a.click();
  showToast('Backup downloaded','success');
}
function restoreBackupFromFile(file){
  if(!file) return;
  if(!confirm('Restore this backup into the current browser workspace? This replaces the records currently loaded in Dreco.')) return;
  const reader=new FileReader();
  reader.onload=()=>{
    try{
      const data=JSON.parse(reader.result);
      proDB=(data.pro||[]).map(normalizeProRecord);
      lbDB=(data.lb||[]).map(normalizeLBRecord);
      allDocs=data.docs||{};
      allTimelines=data.timelines||{};
      proStages=Array.isArray(data.proStages)&&data.proStages.length?data.proStages:[...proStages];
      lbStages=Array.isArray(data.lbStages)&&data.lbStages.length?data.lbStages:[...lbStages];
      if(data.staffAccounts&&typeof data.staffAccounts==='object'){
        Object.assign(STAFF_ACCOUNTS,data.staffAccounts);
        saveStaffAccounts();
      }
      appStorageMode='local';
      lastSyncError='Backup restored locally. Download a new backup or reconnect cloud sync when ready.';
      saveLocalStore();
      rebuildStageSelects(); rebuildProPills();
      closeModal('settings-modal');
      switchTab('dash');
      setSaveStatus('saved');
      showToast('Backup restored locally','success');
    }catch(err){
      console.error(err);
      showToast('Backup restore failed. Check the JSON file.','error');
    }
  };
  reader.readAsText(file);
}
function resetAllFilters(){
  window.proStagePillFilter='';
  window.lbTravelPillFilter='';
  window.lbPPFilter='';
  ['global-search','pro-search','lb-search'].forEach(id=>{ const el=document.getElementById(id); if(el) el.value=''; });
  ['pro-company-f','pro-position-f','pro-action-f','lb-refund-f','lb-action-f'].forEach(id=>{ const el=document.getElementById(id); if(el) el.value=''; });
  document.querySelectorAll('#pro-stage-pills .pill-tab,#lb-travel-pills .pill-tab,#lb-pp-pills .pill-tab').forEach(btn=>btn.classList.remove('active'));
  document.querySelector('#lb-travel-pills .pill-tab')?.classList.add('active');
  document.querySelector('#lb-pp-pills .pill-tab')?.classList.add('active');
  rebuildProPills();
  proPage=1; lbPage=1;
  renderPro(); renderLB();
  showToast('Filters cleared','success');
}
function resetSavedFilters(){
  try{ localStorage.removeItem(userFilterKey()); }catch(e){ /* ignore */ }
  showToast('Filters reset','success');
}
function switchModalTab(modal,tab,btn){
  const tabs=modal==='pro'?['details','pipeline','commission','timeline']:['details','refunds','timeline'];
  tabs.forEach(tt=>{ const el=document.getElementById(`${modal}-tab-${tt}`); if(el) el.style.display=tt===tab?'':'none'; });
  btn.closest('.modal-tabs').querySelectorAll('.modal-tab').forEach(b=>b.classList.remove('active'));
  btn.classList.add('active');
}
function closeModal(id){ const el=document.getElementById(id); if(el) el.classList.remove('open'); }

function moneyKES(v){ return 'KES '+Number(v||0).toLocaleString(); }
function moneyUSD(v){ return '$'+Number(v||0).toLocaleString(); }
function proBalance(r){ return (Number(r.commission)||0)-(Number(r.paid)||0); }
function proNeedsAction(r){
  const stage=r.stage||'';
  return !hasDocs('pro',r.id) || (stage!=='TRAVELLED'&&!toInput(r.travel)) || proBalance(r)>0;
}
function lbNeedsAction(r){
  return !hasDocs('lb',r.id) || getRefundStatus(r)==='incomplete' || ((r.travelStatus||r.travel_status)==='NOT YET');
}
function validateProRecord(rec) {
  if(!rec.name) return 'Full name is required.';
  if(!rec.stage) return 'Current stage is required.';
  if(rec.commission!==null && rec.commission<0) return 'Commission cannot be negative.';
  if(rec.paid!==null && rec.paid<0) return 'Amount paid cannot be negative.';
  if(rec.commission!==null && rec.paid!==null && rec.paid>rec.commission) return 'Amount paid cannot exceed commission billed.';
  return '';
}
function validateLBRecord(rec) {
  if(!rec.name) return 'Full name is required.';
  if(!rec.ppStatus) return 'Passport status is required.';
  if(!rec.travelStatus) return 'Travel status is required.';
  if(rec.toRefund<0 || rec.r1Amt<0 || rec.r2Amt<0) return 'Refund amounts cannot be negative.';
  if(rec.r1Amt+rec.r2Amt>rec.toRefund && rec.ppStatus!=='HAD PP') return 'Refunded amount cannot exceed amount to refund.';
  return '';
}
function recordChanges(before={},after={},fields=[]) {
  return fields
    .filter(([key])=>String(before[key]??'')!==String(after[key]??''))
    .map(([key,label])=>`${label}: "${before[key]??'-'}" to "${after[key]??'-'}"`);
}
function renderProSummary(r){
  const el=document.getElementById('pro-summary'); if(!el) return;
  const isNew=!r;
  const rec=r||{name:'New professional candidate',pp:'Passport pending',position:'Position not set',company:'Company not set',stage:proStages[0]||'PENDING OFFER LETTER',commission:0,paid:0};
  const bal=proBalance(rec);
  el.innerHTML=`<div class="candidate-summary-main">
    <div class="candidate-summary-name">${rec.name||'New professional candidate'}</div>
    <div class="candidate-summary-meta">
      <span><i class="ti ti-id"></i>${rec.pp||'No passport'}</span>
      <span><i class="ti ti-briefcase"></i>${rec.position||'No position'}</span>
      <span><i class="ti ti-building"></i>${rec.company||'No company'}</span>
      <span class="summary-status">${stageBadge(rec.stage||'PENDING OFFER LETTER')}</span>
    </div>
  </div>
  <div class="candidate-summary-kpis">
    <div class="candidate-kpi"><strong>${isNew?'-':moneyKES(rec.commission)}</strong><span>Billed</span></div>
    <div class="candidate-kpi"><strong>${isNew?'-':moneyKES(Math.max(0,bal))}</strong><span>Balance</span></div>
  </div>`;
}
function renderLBSummary(r){
  const el=document.getElementById('lb-summary'); if(!el) return;
  const isNew=!r;
  const rec=r||{name:'New General Jobs candidate',phone:'No phone',ppStatus:'APPLIED',travelStatus:lbStages[0]||'NOT YET',toRefund:0,r1Amt:0,r2Amt:0};
  const paid=(Number(rec.r1Amt||rec.r1_amt)||0)+(Number(rec.r2Amt||rec.r2_amt)||0);
  const owed=Number(rec.toRefund||rec.to_refund)||0;
  el.innerHTML=`<div class="candidate-summary-main">
    <div class="candidate-summary-name">${rec.name||'New General Jobs candidate'}</div>
    <div class="candidate-summary-meta">
      <span><i class="ti ti-phone"></i>${rec.phone||'No phone'}</span>
      <span class="summary-status">${ppBadge(rec.ppStatus||rec.pp_status||'APPLIED')}</span>
      <span class="summary-status">${travelBadge(rec.travelStatus||rec.travel_status||'NOT YET')}</span>
      <span class="summary-status">${refundBadge(isNew?'N/A':getRefundStatus(rec))}</span>
    </div>
  </div>
  <div class="candidate-summary-kpis">
    <div class="candidate-kpi"><strong>${isNew?'-':moneyUSD(owed)}</strong><span>To refund</span></div>
    <div class="candidate-kpi"><strong>${isNew?'-':moneyUSD(Math.max(0,owed-paid))}</strong><span>Balance</span></div>
  </div>`;
}
function readProFormSummary(){
  return {
    name:document.getElementById('pf-name')?.value||'New professional candidate',
    pp:document.getElementById('pf-pp')?.value||'',
    position:document.getElementById('pf-position')?.value||'',
    company:document.getElementById('pf-company')?.value||'',
    stage:document.getElementById('pf-stage')?.value||proStages[0],
    commission:Number(document.getElementById('pf-comm')?.value)||0,
    paid:Number(document.getElementById('pf-paid')?.value)||0,
  };
}
function readLBFormSummary(){
  return {
    name:document.getElementById('lf-name')?.value||'New General Jobs candidate',
    phone:document.getElementById('lf-phone')?.value||'',
    ppStatus:document.getElementById('lf-pp')?.value||'APPLIED',
    travelStatus:document.getElementById('lf-travel')?.value||lbStages[0],
    toRefund:Number(document.getElementById('lf-torefund')?.value)||0,
    r1Amt:Number(document.getElementById('lf-r1amt')?.value)||0,
    r2Amt:Number(document.getElementById('lf-r2amt')?.value)||0,
  };
}
function bindModalSummaries(){
  ['pf-name','pf-pp','pf-position','pf-company','pf-stage','pf-comm','pf-paid'].forEach(id=>{
    const el=document.getElementById(id); if(el){ el.addEventListener('input',()=>renderProSummary(readProFormSummary())); el.addEventListener('change',()=>renderProSummary(readProFormSummary())); }
  });
  ['lf-name','lf-phone','lf-pp','lf-travel','lf-torefund','lf-r1amt','lf-r2amt'].forEach(id=>{
    const el=document.getElementById(id); if(el){ el.addEventListener('input',()=>renderLBSummary(readLBFormSummary())); el.addEventListener('change',()=>renderLBSummary(readLBFormSummary())); }
  });
}

// *Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â
// STAGES + PILLS
// *Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â
function rebuildStageSelects(){
  const proSel=document.getElementById('pf-stage');
  if(proSel) proSel.innerHTML=proStages.map(s=>`<option value="${s}">${s}</option>`).join('')+`<option value="__add_new__">+ Add new stage...</option>`;
  const lbSel=document.getElementById('lf-travel');
  if(lbSel)  lbSel.innerHTML=lbStages.map(s=>`<option value="${s}">${s}</option>`).join('')+`<option value="__add_new__">+ Add new status...</option>`;
}
function rebuildProPills(){
  const wrap=document.getElementById('pro-stage-pills'); if(!wrap) return;
  const cur=window.proStagePillFilter||'';
  wrap.innerHTML=`<button class="pill-tab ${cur===''?'active':''}" onclick="setProStagePill('',this)">All</button>`
    +proStages.map(s=>`<button class="pill-tab ${cur===s?'active':''}" onclick="setProStagePill('${s.replace(/'/g,"\\'")}',this)">${s.replace('PENDING ','')}</button>`).join('');
}
function setProStagePill(val,btn){
  window.proStagePillFilter=val;
  document.querySelectorAll('#pro-stage-pills .pill-tab').forEach(b=>b.classList.remove('active'));
  if(btn) btn.classList.add('active');
  renderPro();
}
// Combined LB pill filter handler for both travel and pp pill rows
function setLBPill(type,val,btn){
  if(type==='travel'){
    window.lbTravelPillFilter=val;
    document.querySelectorAll('#lb-travel-pills .pill-tab').forEach(b=>b.classList.remove('active'));
  } else {
    window.lbPPFilter=val;
    document.querySelectorAll('#lb-pp-pills .pill-tab').forEach(b=>b.classList.remove('active'));
  }
  if(btn) btn.classList.add('active');
  renderLB();
}
function handleStageSelectChange(type,selectEl){
  if(selectEl.value!=='__add_new__'){ selectEl.dataset.prev=selectEl.value; return; }
  pendingStageType=type;
  pendingStageSelect=selectEl;
  const previous=selectEl.dataset.prev||(type==='pro'?proStages[0]:lbStages[0]);
  selectEl.value=previous;
  openStageModal(type);
}
function addCustomStage(type){
  pendingStageType=type;
  pendingStageSelect=null;
  openStageModal(type);
}
function openStageModal(type){
  const modal=document.getElementById('quick-stage-modal');
  const input=document.getElementById('quick-stage-name');
  const err=document.getElementById('quick-stage-error');
  const heading=document.getElementById('quick-stage-heading');
  if(input) input.value='';
  if(err){ err.textContent=''; err.style.display='none'; }
  if(heading) heading.textContent=type==='pro'?'Add Professional Jobs stage':'Add General Jobs travel status';
  modal?.classList.add('open');
}
function submitQuickStage(){
  const type=pendingStageType||'pro';
  const input=document.getElementById('quick-stage-name');
  const err=document.getElementById('quick-stage-error');
  const fail=msg=>{ if(err){ err.textContent=msg; err.style.display='block'; } };
  const name=(input?.value||'').trim().toUpperCase();
  if(!name) return fail('Name is required.');
  if(type==='pro'){
    if(proStages.includes(name)) return fail('That stage already exists.');
    const insertAt=Math.max(0,proStages.indexOf('TRAVELLED'));
    proStages.splice(insertAt,0,name);
  }else{
    if(lbStages.includes(name)) return fail('That status already exists.');
    lbStages.push(name);
  }
  rebuildStageSelects(); rebuildProPills(); saveStages();
  if(pendingStageSelect){ pendingStageSelect.value=name; pendingStageSelect.dataset.prev=name; }
  closeModal('quick-stage-modal');
  pendingStageType=null; pendingStageSelect=null;
  showToast(`"${name}" added`,'success');
}

// Global search
function onGlobalSearch(){
  const q=document.getElementById('global-search').value;
  saveUserFilters({globalSearch:q});
  const ps=document.getElementById('pro-search'); const ls=document.getElementById('lb-search');
  if(ps) ps.value=q; if(ls) ls.value=q;
  const active=document.querySelector('.nav-item.active');
  if(active&&active.id==='nav-pro') renderPro();
  else if(active&&active.id==='nav-lb') renderLB();
}

// *Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â
// DASHBOARD
// *Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â
function renderDash(){
  const proTravelled=proDB.filter(r=>r.stage==='TRAVELLED').length;
  const proInProcess=proDB.filter(isInProcessPro).length;
  let totalComm=0,totalPaid=0;
  proDB.forEach(r=>{ if(r.commission) totalComm+=Number(r.commission); if(r.paid) totalPaid+=Number(r.paid); });

  const lbTravelled=lbDB.filter(r=>(r.travelStatus||r.travel_status)==='TRAVELLED').length;
  const lbInProcess=lbDB.filter(isInProcessLB).length;
  let lbOwed=0,lbPaid=0,lbFees=0;
  lbDB.forEach(r=>{
    const ts=r.travelStatus||r.travel_status;
    const pp=r.ppStatus||r.pp_status;
    const notes=(r.notes||'').trim().toUpperCase();
    if(ts==='TRAVELLED'&&pp!=='HAD PP'&&notes!=='RETURNED'){
      const toR=Number(r.toRefund||r.to_refund)||0;
      const paid=(Number(r.r1Amt||r.r1_amt)||0)+(Number(r.r2Amt||r.r2_amt)||0);
      lbOwed+=toR; lbPaid+=paid; lbFees+=paid;
    }
  });

  const lbIncomplete=lbDB.filter(r=>(r.travelStatus||r.travel_status)==='TRAVELLED'&&getRefundStatus(r)==='incomplete').length;
  const totalCandidates=proDB.length+lbDB.length;
  const totalInProcess=proInProcess+lbInProcess;
  const totalTravelled=proTravelled+lbTravelled;
  const companyName=typeof getCompanyName==='function' ? getCompanyName() : 'Destiny Recruitment Consults';
  const firstName=currentUser?.display?.split(' ')[0] || 'John';

  const workspaceEl=document.getElementById('topbar-workspace-name');
  if(workspaceEl) workspaceEl.textContent=companyName;

  const stageColors=['#5A49F8','#3B82F6','#5DD6C4','#FB9A65','#DDE2EC'];
  const stageData=[
    {label:'Offer', value:proDB.filter(r=>r.stage==='PENDING OFFER LETTER').length, icon:'ti-file-description', color:stageColors[0]},
    {label:'MOL', value:proDB.filter(r=>r.stage==='PENDING MOL').length, icon:'ti-building-bank', color:stageColors[1]},
    {label:'Visa', value:proDB.filter(r=>r.stage==='PENDING VISA').length, icon:'ti-id-badge-2', color:stageColors[2]},
    {label:'Finance', value:proDB.filter(r=>proBalance(r)>0).length, icon:'ti-wallet', color:stageColors[3]},
    {label:'Travelled', value:proTravelled, icon:'ti-plane-departure', color:stageColors[4]}
  ];
  const stageTotal=Math.max(stageData.reduce((sum,item)=>sum+item.value,0),1);

  const pendingTravel=proDB.filter(r=>r.stage==='PENDING TRAVEL');
  const upcoming=(pendingTravel.length?pendingTravel:proDB.filter(r=>r.stage!=='TRAVELLED')).slice(0,3);
  const upcomingHTML=upcoming.length?upcoming.map((r,i)=>`<div class="ref-travel-item">
    <div class="ref-travel-icon"><i class="ti ti-plane"></i></div>
    <div><div class="ref-travel-name">${escHTML(r.name)}</div><div class="ref-travel-meta">${escHTML(r.company||'-')} | ${escHTML(r.position||'-')}</div></div>
    <div class="ref-travel-date">${r.travel?fmtDate(r.travel):'No date'}</div>
  </div>`).join(''):'<div class="ref-empty">No upcoming travels</div>';

  const recentActivity=Object.entries(allTimelines)
    .flatMap(([key,entries])=>(entries||[]).map(e=>({...e,key})))
    .sort((a,b)=>new Date(b.ts)-new Date(a.ts)).slice(0,3);
  function timeAgo(ts){
    if(!ts) return '';
    const diff=Date.now()-new Date(ts).getTime();
    const mins=Math.floor(diff/60000);
    if(mins<60) return `${mins}m ago`;
    const hrs=Math.floor(mins/60);
    if(hrs<24) return `${hrs}h ago`;
    return `${Math.floor(hrs/24)}d ago`;
  }
  const recentHTML=recentActivity.length?recentActivity.map((item)=>{
    const initials=(item.user||'DR').split(' ').map(w=>w[0]).join('').slice(0,2).toUpperCase();
    return `<div class="ref-activity-item">
    <div class="ref-avatar-mini">${initials}</div>
    <div><div class="ref-activity-name">${escHTML(item.user||'Dreco')}</div><div class="ref-activity-meta">${escHTML(item.action||'Candidate updated')}</div></div>
    <div class="ref-activity-time">${timeAgo(item.ts)}</div>
  </div>`;
  }).join(''):`
    <div class="ref-empty" style="padding:18px;text-align:center;color:var(--text-3);font-size:12px">No activity yet — actions will appear here as candidates are added and updated.</div>`;

  const dash=document.getElementById('dash-section');
  if(!dash) return;
  dash.innerHTML=`
    <div class="ref-dashboard">
      <div class="ref-dashboard-head">
        <div><h1>Good afternoon, ${escHTML(firstName)}</h1><p>Here's what's happening in your workspace today.</p></div>
        <button class="ref-date-btn" onclick="switchTab('calendar')"><i class="ti ti-calendar"></i><span>Open calendar</span><i class="ti ti-chevron-right"></i></button>
      </div>

      <div class="ref-board-grid">
        <div class="ref-main-column">
          <div class="ref-kpi-row">
            ${renderRefKpi('Total Candidates',totalCandidates,'12%','ti-clipboard-list','#EFEAFF','','switchTab(\'pro\')')}
            ${renderRefKpi('In Process',totalInProcess,'8%','ti-briefcase','#EAF2FF','','switchTab(\'kanban\')')}
            ${renderRefKpi('Travelled',totalTravelled,'15%','ti-plane-departure','#EFEAFF','','openTravelledView()')}
            ${renderRefKpi('Professional Collected','KES '+totalPaid.toLocaleString(),'18%','ti-coin','#EAFBF3','wide','switchTab(\'reports\')')}
          </div>

          ${renderSmartAlertsHTML()}

          <section class="ref-card ref-pipeline-overview">
            <div class="ref-card-title">Pipeline Overview <i class="ti ti-info-circle"></i></div>
            <div class="ref-stage-row">
              ${stageData.map((item,i)=>`<div class="ref-stage-box"><div class="ref-stage-icon"><i class="ti ${item.icon}"></i></div><div><div class="ref-stage-label">${item.label}</div><div class="ref-stage-value">${item.value}</div></div><div class="ref-stage-percent">${Math.round(item.value/stageTotal*100)}%</div></div>${i<stageData.length-1?'<i class="ti ti-arrow-right ref-stage-arrow"></i>':''}`).join('')}
            </div>
            <div class="ref-pipe-line"><span style="width:${Math.max(6,Math.round(totalInProcess/Math.max(totalCandidates,1)*100))}%"></span></div>
            <div class="ref-pipe-foot"><span>${totalInProcess} in process</span><span>${totalTravelled} travelled</span></div>
          </section>

          <div class="ref-chart-grid">
            <section class="ref-card ref-trend-card">
              <div class="ref-card-head"><div class="ref-card-title">Pipeline Trend</div><button onclick="setTrendPeriod()">This Month <i class="ti ti-chevron-down"></i></button></div>
              <div class="ref-legend"><span><b></b>In Process</span><span><b></b>Travelled</span></div>
              <div class="ref-line-chart" onmousemove="updateTrendTooltip(event)" onmouseleave="resetTrendTooltip()">
                <svg viewBox="0 0 620 210" preserveAspectRatio="none" aria-hidden="true">
                  <defs><linearGradient id="trendFill" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#5A49F8" stop-opacity=".20"/><stop offset="1" stop-color="#5DD6C4" stop-opacity=".04"/></linearGradient></defs>
                  <path d="M0 150 C80 120 95 90 160 86 C235 82 235 112 310 92 C390 70 420 88 480 92 C545 96 570 58 620 42 L620 210 L0 210 Z" fill="url(#trendFill)"/>
                  <path d="M0 150 C80 120 95 90 160 86 C235 82 235 112 310 92 C390 70 420 88 480 92 C545 96 570 58 620 42" fill="none" stroke="#5A49F8" stroke-width="4" stroke-linecap="round"/>
                  <path d="M0 178 C80 160 105 130 170 126 C245 122 255 132 320 116 C398 96 428 118 492 114 C552 110 580 88 620 78" fill="none" stroke="#5DD6C4" stroke-width="4" stroke-linecap="round"/>
                  <line x1="318" y1="52" x2="318" y2="210" stroke="#B9C2D7" stroke-dasharray="4 6"/>
                </svg>
                <div class="ref-tooltip dynamic" id="trend-tooltip"><strong id="trend-tip-date">May 15, 2025</strong><span><b></b>In Process <em id="trend-tip-process">${totalInProcess}</em></span><span><b></b>Travelled <em id="trend-tip-travelled">${totalTravelled}</em></span></div>
                <div class="ref-axis"><span>May 12</span><span>May 13</span><span>May 14</span><span>May 15</span><span>May 16</span><span>May 17</span><span>May 18</span></div>
              </div>
            </section>

            <section class="ref-card ref-breakdown-card">
              <div class="ref-card-title">Stage Breakdown</div>
              <div class="ref-donut-wrap">
                <div class="ref-donut" style="background:${buildConic(stageData.map(x=>({count:x.value,color:x.color})),stageTotal)}"><div><strong>${totalInProcess}</strong><span>In Process</span></div></div>
                <div class="ref-donut-legend">${stageData.map(item=>`<div><span><b style="background:${item.color}"></b>${item.label}</span><strong>${item.value} (${Math.round(item.value/stageTotal*100)}%)</strong></div>`).join('')}</div>
              </div>
            </section>
          </div>

          <div class="ref-bottom-grid">
            <section class="ref-card"><div class="ref-card-title">Recent Activity</div><div class="ref-list">${recentHTML}</div></section>
            <section class="ref-card"><div class="ref-card-head"><div class="ref-card-title">Tasks</div><button onclick="switchTab('kanban')">View All</button></div><div class="ref-task-list">
              ${renderRefTask('Review pending visa documents', `${proDB.filter(r=>r.stage==='PENDING VISA').length} candidates`, 'Overdue')}
              ${renderRefTask('Follow up with MOL for candidates', `${proDB.filter(r=>r.stage==='PENDING MOL').length} candidates`, 'Due today')}
              ${renderRefTask('Confirm travel for candidates', `${pendingTravel.length} candidates`, 'Due tomorrow')}
            </div></section>
          </div>
        </div>

        <aside class="ref-side-column">
          <section class="ref-fin-card">
            <div class="ref-fin-head"><span>Financial Summary</span>${renderFinancePeriodSelect()}</div>
            <div class="ref-fin-block"><p>Professional Jobs</p><h2>KES ${totalComm.toLocaleString()}</h2><div><span>Collected</span><strong>KES ${totalPaid.toLocaleString()}</strong></div><div><span>Outstanding</span><strong>KES ${(totalComm-totalPaid).toLocaleString()}</strong></div></div>
            <div class="ref-fin-block"><p>General Jobs</p><h2>${moneyUSD(lbFees)}</h2><div><span>Collected</span><strong>${moneyUSD(lbPaid)}</strong></div><div><span>Outstanding</span><strong>${moneyUSD(lbOwed-lbPaid)}</strong></div><div><span>Open Balances</span><strong>${lbIncomplete}</strong></div></div>
            <button class="ref-fin-report" onclick="switchTab('reports')"><i class="ti ti-report-money"></i>View Financial Report<i class="ti ti-chevron-right"></i></button>
          </section>
          <section class="ref-card ref-upcoming"><div class="ref-card-head"><div class="ref-card-title">Upcoming Travels</div><button onclick="openPendingTravelView()">View All</button></div>${upcomingHTML}<button class="ref-total-link" onclick="openPendingTravelView()">Total ${pendingTravel.length} upcoming</button></section>
          <section class="ref-card ref-quick"><div class="ref-card-title">Quick Actions</div><div class="ref-quick-grid">
            <button onclick="openQuickAddCandidate()"><i class="ti ti-user-plus"></i>Add Candidate</button>
            <button onclick="createStaffAccount()"><i class="ti ti-user-plus"></i>Add User</button>
            <button onclick="openRecordPaymentPrompt('commission')"><i class="ti ti-report-money"></i>Record Payment</button>
            <button onclick="openFirstDocumentUpload()"><i class="ti ti-file-upload"></i>Upload Document</button>
          </div></section>
        </aside>
      </div>
      <button class="ref-chat-btn"><i class="ti ti-message-circle"></i></button>
    </div>`;
}

function openTravelledView(){
  window.proStagePillFilter='TRAVELLED';
  switchTab('pro');
  if (typeof rebuildProPills === 'function') rebuildProPills();
  if (typeof renderPro === 'function') renderPro();
  if (typeof showToast === 'function') showToast('Showing travelled candidates','success');
}
function openPendingTravelView(){
  window.proStagePillFilter='PENDING TRAVEL';
  switchTab('pro');
  if (typeof rebuildProPills === 'function') rebuildProPills();
  if (typeof renderPro === 'function') renderPro();
  if (typeof showToast === 'function') showToast('Showing candidates pending travel','success');
}
function openFirstDocumentUpload(){
  const pro=proDB.find(Boolean);
  if(pro){ openDocs('pro',pro.id,pro.name||'Candidate'); return; }
  const lb=lbDB.find(Boolean);
  if(lb){ openDocs('lb',lb.id,lb.name||'Candidate'); return; }
  showToast('Add a candidate before uploading documents','error');
}
function renderFinancePeriodSelect(){
  return `<span class="finance-period-menu"><select aria-label="Financial summary period" onchange="setFinancePeriod(this.value)"><option value="month" ${financePeriod==='month'?'selected':''}>This Month</option><option value="year" ${financePeriod==='year'?'selected':''}>This Year</option><option value="overall" ${financePeriod==='overall'?'selected':''}>Overall</option></select></span>`;
}
function setTrendPeriod(){ showToast('Pipeline trend is showing this month. More periods can be added once monthly history is synced.','success'); }
function updateTrendTooltip(event){
  const tip=document.getElementById('trend-tooltip');
  const chart=event.currentTarget;
  if(!tip||!chart) return;
  const rect=chart.getBoundingClientRect();
  const pct=Math.max(0,Math.min(1,(event.clientX-rect.left)/rect.width));
  const day=12+Math.round(pct*6);
  const inProcess=Math.max(1,Math.round((proDB.length+lbDB.length)*(0.35+pct*.3)));
  const travelled=Math.max(0,Math.round((proDB.filter(r=>r.stage==='TRAVELLED').length+lbDB.filter(r=>(r.travelStatus||r.travel_status)==='TRAVELLED').length)*(0.7+pct*.45)));
  document.getElementById('trend-tip-date').textContent=`May ${day}, 2025`;
  document.getElementById('trend-tip-process').textContent=inProcess;
  document.getElementById('trend-tip-travelled').textContent=travelled;
  tip.style.left=`${Math.min(Math.max(event.clientX-rect.left-70,10),rect.width-150)}px`;
  tip.style.top='64px';
  tip.style.display='block';
}
function resetTrendTooltip(){ const tip=document.getElementById('trend-tooltip'); if(tip) tip.style.display=''; }
function persistExpenses(){ safeLocalSet('dreco_expenses', JSON.stringify(drecoExpenses)); }
function persistEvents(){ safeLocalSet('dreco_events', JSON.stringify(drecoEvents)); }
function persistAudit(){ safeLocalSet('dreco_audit', JSON.stringify(drecoAudit)); }
function auditAction(area, action, detail=''){
  drecoAudit.unshift({id:String(Date.now()), area, action, detail, user:currentUser?.display||'System', ts:new Date().toISOString()});
  if(drecoAudit.length>200) drecoAudit.length=200;
  persistAudit();
}
function hasRole(role){ return currentUser?.role===role; }
function canManageFinance(){ return hasRole('admin') || hasRole('finance'); }
function requireAdminAction(label='This action'){
  if(hasRole('admin')) return true;
  showToast(`${label} is available to administrators only`,'error');
  return false;
}
function requireFinanceAction(label='This finance action'){
  if(canManageFinance()) return true;
  showToast(`${label} is available to admins and finance users only`,'error');
  return false;
}
function userFilterKey(){ return `dreco_filters_${currentUser?.username||'guest'}`; }
function saveUserFilters(next={}){
  const current=JSON.parse(safeLocalGet(userFilterKey())||'{}');
  safeLocalSet(userFilterKey(), JSON.stringify({...current,...next,savedAt:new Date().toISOString()}));
}
function restoreUserFilters(){
  const saved=JSON.parse(safeLocalGet(userFilterKey())||'{}');
  if(saved.globalSearch){
    const global=document.getElementById('global-search'); if(global) global.value=saved.globalSearch;
    const pro=document.getElementById('pro-search'); if(pro) pro.value=saved.globalSearch;
    const lb=document.getElementById('lb-search'); if(lb) lb.value=saved.globalSearch;
  }
}
function getSmartAlerts(){
  const now=Date.now(), day=86400000;
  const oldMol=proDB.filter(r=>r.stage==='PENDING MOL' && drecoDateValue(r.submitted) && now-drecoDateValue(r.submitted)>7*day);
  const oldVisa=proDB.filter(r=>r.stage==='PENDING VISA' && Math.max(drecoDateValue(r.mol),drecoDateValue(r.submitted)) && now-Math.max(drecoDateValue(r.mol),drecoDateValue(r.submitted))>10*day);
  const unpaid=proDB.filter(r=>proBalance(r)>0).sort((a,b)=>proBalance(b)-proBalance(a));
  const travel=proDB.filter(r=>r.stage==='PENDING TRAVEL');
  return [
    {label:'MOL overdue',value:oldMol.length,icon:'ti-clock-exclamation',tone:'warn',target:"switchTab('pro')"},
    {label:'Visa pending too long',value:oldVisa.length,icon:'ti-id-badge-2',tone:'violet',target:"switchTab('pro')"},
    {label:'Unpaid commissions',value:unpaid.length,icon:'ti-cash-banknote',tone:'money',target:"switchTab('commissions')"},
    {label:'Pending travel',value:travel.length,icon:'ti-plane',tone:'blue',target:'openPendingTravelView()'}
  ].filter(a=>a.value>0);
}
function renderSmartAlertsHTML(){
  const alerts=getSmartAlerts();
  if(!alerts.length) return '';
  return `<section class="smart-alert-strip">${alerts.map(a=>`<button class="smart-alert ${a.tone}" onclick="${a.target}"><i class="ti ${a.icon}"></i><span>${a.label}</span><strong>${a.value}</strong></button>`).join('')}</section>`;
}
function getCommissionTransactions(){
  return proDB.filter(r=>Number(r.paid)>0).map(r=>({candidate:r.name, ref:r.company||r.position||'Professional Jobs', amount:Number(r.paid)||0, date:latestCommissionTs(r)||drecoDateValue(r.submitted), note:getLatestTimelineText('pro',r.id)})).sort((a,b)=>b.date-a.date);
}
function getRepaymentTransactions(){
  return lbDB.filter(isTravelledLB).flatMap(r=>[
    {candidate:r.name, ref:'Installment 1', amount:Number(r.r1Amt||r.r1_amt)||0, date:drecoDateValue(r.r1Date||r.r1_date)},
    {candidate:r.name, ref:'Installment 2', amount:Number(r.r2Amt||r.r2_amt)||0, date:drecoDateValue(r.r2Date||r.r2_date)}
  ].filter(x=>x.amount>0)).sort((a,b)=>b.date-a.date);
}
function renderTransactionHistory(id, rows, currencyFn){
  const el=document.getElementById(id); if(!el) return;
  el.innerHTML=rows.length?`<div class="transaction-list">${rows.slice(0,8).map(row=>`<div class="transaction-row"><div><strong>${escHTML(row.candidate)}</strong><span>${escHTML(row.ref||'Update')}</span></div><div><b>${currencyFn(row.amount)}</b><em>${row.date?fmtDate(new Date(row.date).toISOString().slice(0,10)):'No date'}</em></div></div>`).join('')}</div>`:'<div class="mini-empty">No payment transactions yet</div>';
}
function setFinancePeriod(value){ financePeriod=value||'month'; renderDash(); }
function getLatestTimelineText(type,id){
  const item=(allTimelines[`${type}_${id}`]||[])[0];
  if(!item) return 'No updates yet';
  return `${item.action} - ${new Date(item.ts).toLocaleDateString('en-GB')}`;
}
function renderMetricCards(id,cards){
  const el=document.getElementById(id); if(!el) return;
  el.innerHTML=cards.map(c=>`<div class="metric-card ${c.cls||'mc-default'}"><div class="metric-label">${escHTML(c.label)}</div><div class="metric-val ${c.small?'sm':''}">${c.value}</div></div>`).join('');
}
function getTravelRows(){
  const pro=proDB.map(r=>({type:'pro',id:r.id,name:r.name,workflow:'Professional Jobs',company:r.company||r.country||'-',status:r.position||r.stage||'-',date:r.travel,travelled:r.stage==='TRAVELLED',airline:r.airline||'Not recorded',time:r.travelTime||'Not recorded',notes:r.travelNotes||getLatestTimelineText('pro',r.id)}));
  const lb=lbDB.map(r=>({type:'lb',id:r.id,name:r.name,workflow:'General Jobs',company:r.country||getActiveGeneralCountry(),status:r.travelStatus||r.travel_status||'-',date:r.travelDate||r.travel_date,travelled:(r.travelStatus||r.travel_status)==='TRAVELLED',airline:r.airline||'Not recorded',time:r.travelTime||'Not recorded',notes:r.notes||getLatestTimelineText('lb',r.id)}));
  return [...pro,...lb];
}
function drecoDateValue(value){
  if(!value) return 0;
  const t=new Date(value).getTime();
  return Number.isFinite(t)?t:0;
}
function latestTimelineTs(type,id){
  const list=allTimelines[`${type}_${id}`]||[];
  return list.reduce((max,item)=>Math.max(max,drecoDateValue(item.ts)),0);
}
function latestCommissionTs(row){
  return Math.max(drecoDateValue(row.paidDate||row.paid_date||row.paymentDate||row.payment_date), latestTimelineTs('pro',row.id));
}
function latestRepaymentTs(row){
  return Math.max(drecoDateValue(row.r2Date||row.r2_date), drecoDateValue(row.r1Date||row.r1_date), latestTimelineTs('lb',row.id));
}
function isTravelledLB(row){
  const status=String(row.travelStatus||row.travel_status||'').toUpperCase();
  return status==='TRAVELLED' || !!(row.travelDate||row.travel_date);
}
function populateExpenseCandidateOptions(){
  const list=document.getElementById('expense-candidate-options');
  if(!list) return;
  const names=[...proDB.map(r=>r.name),...lbDB.map(r=>r.name)].filter(Boolean);
  list.innerHTML=[...new Set(names)].sort((a,b)=>a.localeCompare(b)).map(name=>`<option value="${escHTML(name)}"></option>`).join('');
}
function renderTravel(){
  const rows=getTravelRows().sort((a,b)=>drecoDateValue(b.date)-drecoDateValue(a.date) || Number(b.travelled)-Number(a.travelled) || String(a.name||'').localeCompare(String(b.name||'')));
  const filter=document.getElementById('travel-filter')?.value||'all';
  const shown=rows.filter(r=>filter==='all'||(filter==='travelled'?r.travelled:!r.travelled));
  renderMetricCards('travel-metrics',[{label:'Travelled',value:rows.filter(r=>r.travelled).length,cls:'mc-green'},{label:'Pending travel',value:rows.filter(r=>!r.travelled&&r.date).length,cls:'mc-amber'},{label:'No travel date',value:rows.filter(r=>!r.date).length,cls:'mc-red'}]);
  const tb=document.getElementById('travel-tbody'); if(!tb) return;
  tb.innerHTML=shown.length?shown.map(r=>`<tr onclick="${r.type==='pro'?'editPro':'editLB'}(${r.id})"><td class="name-cell">${escHTML(r.name)}</td><td>${r.workflow}</td><td>${escHTML(r.company)}</td><td>${escHTML(r.status)}</td><td>${fmtDate(r.date)}</td><td>${escHTML(r.airline)}</td><td>${escHTML(r.time)}</td><td>${escHTML(r.notes)}</td></tr>`).join(''):'<tr><td colspan="8"><div class="mini-empty">No travel records found</div></td></tr>';
}
function renderCommissions(){
  const billed=proDB.reduce((sum,row)=>sum+(Number(row.commission)||0),0), paid=proDB.reduce((sum,row)=>sum+(Number(row.paid)||0),0);
  const rows=[...proDB].sort((a,b)=>latestCommissionTs(b)-latestCommissionTs(a) || Number(b.paid||0)-Number(a.paid||0));
  renderMetricCards('commission-metrics',[{label:'Billed',value:moneyKES(billed),cls:'mc-ink',small:true},{label:'Received',value:moneyKES(paid),cls:'mc-green',small:true},{label:'Outstanding',value:moneyKES(billed-paid),cls:'mc-amber',small:true}]);
  renderTransactionHistory('commission-history', getCommissionTransactions(), moneyKES);
  const tb=document.getElementById('commissions-tbody'); if(!tb) return;
  tb.innerHTML=rows.length?rows.map(r=>`<tr onclick="editPro(${r.id})"><td class="name-cell">${escHTML(r.name)}</td><td>${escHTML(r.company||'-')}</td><td>${escHTML(r.position||'-')}</td><td>${moneyKES(r.commission)}</td><td>${moneyKES(r.paid)}</td><td>${moneyKES(proBalance(r))}</td><td>${escHTML(getLatestTimelineText('pro',r.id))}</td><td><button class="action-link" onclick="event.stopPropagation();editPro(${r.id})">Update</button></td></tr>`).join(''):'<tr><td colspan="8"><div class="mini-empty">No commission records yet</div></td></tr>';
}
function renderRepayments(){
  const travelled=lbDB.filter(isTravelledLB).sort((a,b)=>latestRepaymentTs(b)-latestRepaymentTs(a));
  const owed=travelled.reduce((sum,row)=>sum+(Number(row.toRefund||row.to_refund)||0),0);
  const paid=travelled.reduce((sum,row)=>sum+(Number(row.r1Amt||row.r1_amt)||0)+(Number(row.r2Amt||row.r2_amt)||0),0);
  renderMetricCards('repayment-metrics',[{label:'Travelled clients',value:travelled.length,cls:'mc-default'},{label:'Paid',value:moneyUSD(paid),cls:'mc-green',small:true},{label:'Outstanding',value:moneyUSD(owed-paid),cls:'mc-amber',small:true}]);
  renderTransactionHistory('repayment-history', getRepaymentTransactions(), moneyUSD);
  const tb=document.getElementById('repayments-tbody'); if(!tb) return;
  tb.innerHTML=travelled.length?travelled.map(r=>{const toR=Number(r.toRefund||r.to_refund)||0,p=(Number(r.r1Amt||r.r1_amt)||0)+(Number(r.r2Amt||r.r2_amt)||0);return `<tr onclick="editLB(${r.id})"><td class="name-cell">${escHTML(r.name)}</td><td>${escHTML(r.ppStatus||r.pp_status||'-')}</td><td>${fmtDate(r.travelDate||r.travel_date)}</td><td>${moneyUSD(toR)}</td><td>${moneyUSD(p)}</td><td>${moneyUSD(toR-p)}</td><td>${fmtDate(r.r1Date||r.r1_date)} ${r.r1Amt?moneyUSD(r.r1Amt):''}<br>${fmtDate(r.r2Date||r.r2_date)} ${r.r2Amt?moneyUSD(r.r2Amt):''}</td><td><button class="action-link" onclick="event.stopPropagation();editLB(${r.id})">Update</button></td></tr>`}).join(''):'<tr><td colspan="8"><div class="mini-empty">No travelled clients with repayment records yet</div></td></tr>';
}
function renderExpenses(){
  const total=drecoExpenses.reduce((s,e)=>s+(Number(e.amount)||0),0);
  renderMetricCards('expense-metrics',[{label:'Total expenses',value:moneyKES(total),cls:'mc-red',small:true},{label:'Entries',value:drecoExpenses.length,cls:'mc-default'},{label:'This month',value:moneyKES(drecoExpenses.filter(e=>(e.date||'').slice(0,7)===new Date().toISOString().slice(0,7)).reduce((s,e)=>s+(Number(e.amount)||0),0)),cls:'mc-amber',small:true}]);
  const tb=document.getElementById('expenses-tbody'); if(!tb) return;
  tb.innerHTML=drecoExpenses.length?drecoExpenses.map(e=>`<tr><td>${fmtDate(e.date)}</td><td class="name-cell">${escHTML(e.client||'-')}</td><td>${escHTML(e.category||'-')}</td><td>${moneyKES(e.amount)}</td><td>${escHTML(e.notes||'-')}</td><td><button class="action-link" onclick="deleteExpense('${e.id}')">Delete</button></td></tr>`).join(''):'<tr><td colspan="6"><div class="mini-empty">No expenses recorded yet</div></td></tr>';
}
function renderTeam(){
  const grid=document.getElementById('team-grid'); if(!grid) return;
  const users=(typeof getCompanyUsers==='function'?getCompanyUsers():[]).map(([username,account])=>({username,...account}));
  const fallback=currentUser?[{username:currentUser.username||'user',...currentUser}]:[{display:'John Fred',role:'admin',username:'johnfred'}];
  const list=users.length?users:fallback;
  grid.innerHTML=list.map(u=>`<div class="team-card"><div class="team-card-head"><div class="team-avatar">${escHTML((u.display||u.username||'U').slice(0,2).toUpperCase())}</div><div><div class="team-name">${escHTML(u.display||u.username||'User')}</div><div class="team-role">${u.role==='admin'?'Administrator':'Staff'} @${escHTML(u.username||'user')}</div></div></div><div class="team-perms"><span>Dashboard</span><span>Professional Jobs</span><span>General Jobs</span><span>Finance</span><span>Reports</span></div></div>`).join('');
}
function renderSettingsPage(){
  const el=document.getElementById('settings-page-content'); if(!el) return;
  const syncCopy=appStorageMode==='cloud'?'Supabase cloud sync is active. Local fallback remains available if a write fails.':'Local mode is active. Configure Supabase to enable shared office sync.';
  el.innerHTML=`<div class="settings-page-card"><h3>Workspace</h3><p>Manage company identity and data mode.</p><div class="setting-row"><span>Company</span><button onclick="openSettingsModal()">Edit</button></div><div class="setting-row"><span>Storage</span><span class="settings-pill">${appStorageMode==='cloud'?'Cloud':'Local'}</span></div></div><div class="settings-page-card"><h3>Pipeline</h3><p>Adjust workflow stages and country options from their respective screens.</p><div class="setting-row"><span>Professional stages</span><button onclick="switchTab('pro')">Open</button></div><div class="setting-row"><span>General countries</span><button onclick="switchTab('lb')">Open</button></div></div><div class="settings-page-card"><h3>Team & permissions</h3><p>Add staff and review roles from the Team page.</p><div class="setting-row"><span>Team members</span><button onclick="switchTab('team')">Manage</button></div></div><div class="settings-page-card"><h3>Data</h3><p>Export backups or reset local filters.</p><div class="setting-row"><span>Backup</span><button onclick="downloadBackup()">Download</button></div><div class="setting-row"><span>Saved filters</span><button onclick="resetSavedFilters()">Reset</button></div></div><div class="settings-page-card"><h3>Sync health</h3><p>${syncCopy}</p><div class="setting-row"><span>Mode</span><span class="settings-pill">${appStorageMode==='cloud'?'Cloud first':'Local fallback'}</span></div><div class="setting-row"><span>Last sync issue</span><span>${escHTML(lastSyncError||'None')}</span></div></div><div class="settings-page-card"><h3>Audit log</h3><p>Recent system activity across candidates, finance, users, and documents.</p>${drecoAudit.slice(0,6).map(a=>`<div class="audit-row"><strong>${escHTML(a.action)}</strong><span>${escHTML(a.area)} - ${fmtDate(a.ts)}</span></div>`).join('')||'<div class="mini-empty">No audited actions yet</div>'}</div>`;
}
function openQuickAddCandidate(){
  const modal=document.getElementById('quick-add-modal');
  if(modal) modal.classList.add('open');
}
function submitQuickAddCandidate(){
  const choice=document.querySelector('input[name="quick-workflow"]:checked')?.value || 'pro';
  closeModal('quick-add-modal');
  if(choice==='lb'){ switchTab('lb'); openLBForm(); return; }
  switchTab('pro'); openProForm();
}
function createStaffAccount(){
  if(!requireAdminAction('Adding users')) return;
  switchTab('team');
  const modal=document.getElementById('quick-user-modal');
  if(!modal){ showToast('User form is unavailable','error'); return; }
  ['quick-user-display','quick-user-username','quick-user-password'].forEach(id=>{ const el=document.getElementById(id); if(el) el.value=''; });
  const role=document.getElementById('quick-user-role'); if(role) role.value='staff';
  const err=document.getElementById('quick-user-error'); if(err){ err.textContent=''; err.style.display='none'; }
  modal.classList.add('open');
}
async function submitQuickUser(){
  if (currentUser?.role !== 'admin') { showToast('Only admins can add users','error'); return; }
  const display=(document.getElementById('quick-user-display')?.value||'').trim();
  const username=(document.getElementById('quick-user-username')?.value||'').trim().toLowerCase();
  const role=document.getElementById('quick-user-role')?.value==='admin'?'admin':'staff';
  const password=(document.getElementById('quick-user-password')?.value||'').trim();
  const err=document.getElementById('quick-user-error');
  const fail=msg=>{ if(err){ err.textContent=msg; err.style.display='block'; } };
  if(!display) return fail('Display name is required.');
  if(!/^[a-z0-9._-]{3,32}$/.test(username)) return fail('Username must be 3-32 letters, numbers, dots, underscores, or hyphens.');
  if(STAFF_ACCOUNTS[username]) return fail('That username is already taken.');
  if(password.length<6) return fail('Temporary password must be at least 6 characters.');
  STAFF_ACCOUNTS[username]=normalizeAccount(username,{role,display,companyId:getCompanyId(),companyName:getCompanyName(),generalJobsCountries:getGeneralCountries()});
  try{ await setAccountPassword(STAFF_ACCOUNTS[username],password); await saveStaffAccounts(); }
  catch(e){ delete STAFF_ACCOUNTS[username]; return fail(e.message||'User could not be created.'); }
  closeModal('quick-user-modal'); renderTeam(); renderCompanyUsers(); showToast('User added','success');
}
function openRecordPaymentPrompt(type='commission'){
  if(!requireFinanceAction('Recording payments')) return;
  if(type==='repayment'){ switchTab('repayments'); showToast('Open a repayment row and update its installment fields.','success'); return; }
  switchTab('commissions'); showToast('Open a commission row and update billed or received amounts.','success');
}
function openExpensePrompt(){
  if(!requireFinanceAction('Adding expenses')) return;
  populateExpenseCandidateOptions();
  const modal=document.getElementById('quick-expense-modal');
  if(!modal){ showToast('Expense form is unavailable','error'); return; }
  const date=document.getElementById('quick-expense-date'); if(date) date.value=new Date().toISOString().slice(0,10);
  ['quick-expense-client','quick-expense-amount','quick-expense-notes'].forEach(id=>{ const el=document.getElementById(id); if(el) el.value=''; });
  const cat=document.getElementById('quick-expense-category'); if(cat) cat.value='Documents';
  const err=document.getElementById('quick-expense-error'); if(err){ err.textContent=''; err.style.display='none'; }
  modal.classList.add('open');
}
function submitQuickExpense(){
  if(!requireFinanceAction('Adding expenses')) return;
  const date=(document.getElementById('quick-expense-date')?.value||new Date().toISOString().slice(0,10));
  const client=(document.getElementById('quick-expense-client')?.value||'').trim();
  const amount=Number(document.getElementById('quick-expense-amount')?.value||0);
  const category=(document.getElementById('quick-expense-category')?.value||'Other').trim();
  const notes=(document.getElementById('quick-expense-notes')?.value||'').trim();
  const err=document.getElementById('quick-expense-error');
  const fail=msg=>{ if(err){ err.textContent=msg; err.style.display='block'; } };
  if(!client) return fail('Client or candidate name is required.');
  if(!amount || amount<0) return fail('Enter a valid amount.');
  drecoExpenses.unshift({id:String(Date.now()),date,client,amount,category,notes});
  auditAction('Expenses','Expense added',`${client} - ${moneyKES(amount)}`);
  persistExpenses(); closeModal('quick-expense-modal'); renderExpenses(); showToast('Expense recorded','success');
}
function deleteExpense(id){ if(!requireFinanceAction('Deleting expenses')) return; const item=drecoExpenses.find(e=>e.id===id); drecoExpenses=drecoExpenses.filter(e=>e.id!==id); auditAction('Expenses','Expense deleted',item?.client||''); persistExpenses(); renderExpenses(); }
function openCalendarEventPrompt(){
  editingEventId=null;
  const modal=document.getElementById('quick-event-modal');
  if(!modal){ showToast('Calendar event form is unavailable','error'); return; }
  document.getElementById('quick-event-title').value='';
  document.getElementById('quick-event-date').value=new Date().toISOString().slice(0,10);
  document.getElementById('quick-event-notes').value='';
  const del=document.getElementById('quick-event-delete'); if(del) del.style.display='none';
  const heading=document.getElementById('quick-event-heading'); if(heading) heading.textContent='Record calendar event';
  modal.classList.add('open');
}
function editCalendarEvent(id){
  const ev=drecoEvents.find(e=>e.id===id); if(!ev) return;
  editingEventId=id;
  const modal=document.getElementById('quick-event-modal'); if(!modal) return;
  document.getElementById('quick-event-title').value=ev.title||'';
  document.getElementById('quick-event-date').value=ev.date||new Date().toISOString().slice(0,10);
  document.getElementById('quick-event-notes').value=ev.notes||'';
  const del=document.getElementById('quick-event-delete'); if(del) del.style.display='inline-flex';
  const heading=document.getElementById('quick-event-heading'); if(heading) heading.textContent='Edit calendar event';
  modal.classList.add('open');
}
function submitCalendarEvent(){
  const date=(document.getElementById('quick-event-date')?.value||'').trim();
  const title=(document.getElementById('quick-event-title')?.value||'').trim();
  const notes=(document.getElementById('quick-event-notes')?.value||'').trim();
  const err=document.getElementById('quick-event-error');
  const fail=msg=>{ if(err){ err.textContent=msg; err.style.display='block'; } };
  if(!/^\d{4}-\d{2}-\d{2}$/.test(date)) return fail('Use date format YYYY-MM-DD.');
  if(!title) return fail('Event title is required.');
  if(editingEventId){
    const ev=drecoEvents.find(e=>e.id===editingEventId); if(ev){ ev.date=date; ev.title=title; ev.notes=notes; }
  }else{
    drecoEvents.unshift({id:String(Date.now()),date,title,notes});
  }
  persistEvents(); closeModal('quick-event-modal'); renderCalendar(); showToast('Calendar event saved','success');
}
function deleteCalendarEvent(){
  if(!editingEventId) return;
  drecoEvents=drecoEvents.filter(e=>e.id!==editingEventId);
  editingEventId=null; persistEvents(); closeModal('quick-event-modal'); renderCalendar(); showToast('Calendar event deleted','success');
}
function openTravelEventPrompt(){ switchTab('travel'); showToast('Open a candidate row to add airline, travel time, and notes.','success'); }
function renderHelpPage(){
  const el=document.getElementById('help-section-content'); if(!el) return;
  el.innerHTML=`<div class="settings-page-card"><h3>Daily workflow</h3><p>Use Dashboard for status, Pipeline Board for movement, Calendar for deadlines, and Reports for management review.</p><div class="setting-row"><span>Pipeline board</span><button onclick="switchTab('kanban')">Open</button></div><div class="setting-row"><span>Calendar</span><button onclick="switchTab('calendar')">Open</button></div></div><div class="settings-page-card"><h3>Records</h3><p>Professional Jobs and General Jobs are separate workflows. Travel combines both lists and sorts latest travel first.</p><div class="setting-row"><span>Professional Jobs</span><button onclick="switchTab('pro')">Open</button></div><div class="setting-row"><span>General Jobs</span><button onclick="switchTab('lb')">Open</button></div></div><div class="settings-page-card"><h3>Finance</h3><p>Commissions focus on professional job income. Repayments only track travelled general-job clients. Expenses capture money spent on clients.</p><div class="setting-row"><span>Commissions</span><button onclick="switchTab('commissions')">Open</button></div><div class="setting-row"><span>Expenses</span><button onclick="switchTab('expenses')">Open</button></div></div><div class="settings-page-card"><h3>Support note</h3><p>For shared multi-user work, keep Supabase configured. Local mode is useful for solo testing, but cloud mode is better for office use.</p><div class="setting-row"><span>Settings</span><button onclick="switchTab('settings')">Open</button></div></div>`;
}
function openSettingsModal(){ const kpis=document.getElementById('settings-kpis'); if(kpis) kpis.innerHTML=`<div class="settings-kpi"><strong>${proDB.length}</strong><span>Professional</span></div><div class="settings-kpi"><strong>${lbDB.length}</strong><span>General Jobs records</span></div><div class="settings-kpi"><strong>${Object.keys(allDocs).length}</strong><span>Doc links</span></div>`; const mode=document.getElementById('settings-storage-mode'); if(mode) mode.textContent=lastSyncError?`${getStorageLabel()}: ${lastSyncError}`:getStorageLabel(); const companyInput=document.getElementById('settings-company-name'); if(companyInput) companyInput.value=getCompanyName(); renderSettingsCountries(); renderCompanyUsers(); document.getElementById('settings-modal')?.classList.add('open'); }
function renderRefKpi(label,value,change,icon,bg,extra='',action=''){
  const onclick=action?` onclick="${action}"`:'';
  return `<div class="ref-kpi ${extra}"${onclick}><div class="ref-kpi-icon" style="background:${bg}"><i class="ti ${icon}"></i></div><div><span>${escHTML(label)}</span><strong>${escHTML(value)}</strong><em><i class="ti ti-arrow-up"></i>${escHTML(change)} <small>vs last week</small></em></div></div>`;
}
function renderRefTask(title,meta,due){
  return `<div class="ref-task"><span></span><div><strong>${escHTML(title)}</strong><small>${escHTML(meta)}</small></div><em>${escHTML(due)}</em></div>`;
}
function buildConic(items,total){
  let cursor=0;
  const stops=items.map(item=>{
    const share=total?item.count/total*100:0;
    const start=cursor;
    cursor+=share;
    return `${item.color} ${start}% ${cursor}%`;
  }).filter(Boolean).join(',');
  return `conic-gradient(${stops || '#E5E7EB 0 100%'})`;
}
// PROFESSIONAL
// *Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â
function getFilteredPro(){
  const q=(document.getElementById('pro-search')?.value||'').toLowerCase();
  const stage=window.proStagePillFilter||'';
  const comp=document.getElementById('pro-company-f')?.value||'';
  const pos=document.getElementById('pro-position-f')?.value||'';
  const action=document.getElementById('pro-action-f')?.value||'';
  return proDB.filter(r=>{
    const text=`${r.name} ${r.pp||''} ${r.company||''} ${r.position||''}`.toLowerCase();
    const outstanding=proBalance(r)>0;
    const actionMatch=!action ||
      (action==='needs-action'&&proNeedsAction(r)) ||
      (action==='outstanding'&&outstanding) ||
      (action==='no-docs'&&!hasDocs('pro',r.id));
    return (!q||text.includes(q))&&(!stage||r.stage===stage)&&(!comp||r.company===comp)&&(!pos||r.position===pos)&&actionMatch;
  });
}
function renderPro(){
  let totalComm=0,totalPaid=0;
  proDB.forEach(r=>{ if(r.commission) totalComm+=Number(r.commission); if(r.paid) totalPaid+=Number(r.paid); });
  const metricsEl=document.getElementById('pro-metrics');
  if(metricsEl) metricsEl.innerHTML=`
    <div class="metric-card mc-default"><div class="metric-label">Total</div><div class="metric-val">${proDB.length}</div></div>
    <div class="metric-card mc-amber"><div class="metric-label">In process</div><div class="metric-val amber">${proDB.filter(isInProcessPro).length}</div></div>
    <div class="metric-card mc-green"><div class="metric-label">Travelled</div><div class="metric-val green">${proDB.filter(r=>r.stage==='TRAVELLED').length}</div></div>
    <div class="metric-card mc-ink"><div class="metric-label">Commission billed</div><div class="metric-val sm">KES ${totalComm.toLocaleString()}</div></div>
    <div class="metric-card mc-sage"><div class="metric-label">Outstanding</div><div class="metric-val sm amber">KES ${(totalComm-totalPaid).toLocaleString()}</div></div>`;

  const companies=[...new Set(proDB.map(r=>r.company).filter(Boolean))].sort();
  const csel=document.getElementById('pro-company-f');
  if(csel){ const ccur=csel.value; csel.innerHTML='<option value="">All companies</option>'+companies.map(c=>`<option value="${c}"${c===ccur?' selected':''}>${c}</option>`).join(''); }
  const positions=[...new Set(proDB.map(r=>r.position).filter(Boolean))].sort();
  const psel=document.getElementById('pro-position-f');
  if(psel){ const pcur=psel.value; psel.innerHTML='<option value="">All positions</option>'+positions.map(p=>`<option value="${p}"${p===pcur?' selected':''}>${p}</option>`).join(''); }

  const data=getFilteredPro();
  const totalPages=Math.max(1,Math.ceil(data.length/PER_PAGE));
  if(proPage>totalPages) proPage=1;
  const slice=data.slice((proPage-1)*PER_PAGE,proPage*PER_PAGE);
  const tbody=document.getElementById('pro-tbody'); if(!tbody) return;
  if(!slice.length){ tbody.innerHTML=`<tr><td colspan="11"><div class="empty">No candidates found</div></td></tr>`; }
  else {
    tbody.innerHTML=slice.map((r,i)=>{
      const comm=r.commission?'KES '+Number(r.commission).toLocaleString():'&mdash;';
      const paid=r.paid?'KES '+Number(r.paid).toLocaleString():'&mdash;';
      const bal=(r.commission&&r.paid)?Number(r.commission)-Number(r.paid):null;
      const balTxt=bal!==null?'KES '+bal.toLocaleString():'&mdash;';
      const hd=hasDocs('pro',r.id);
      const name=escHTML(r.name);
      const pp=escHTML(r.pp||'');
      const position=r.position ? escHTML(r.position) : '&mdash;';
      const company=r.company ? escHTML(r.company) : '&mdash;';
      const country=r.country ? escHTML(r.country) : '&mdash;';
      const docsName=escJSString(r.name);
      return `<tr onclick="editPro(${r.id})">
        <td>${(proPage-1)*PER_PAGE+i+1}</td>
        <td><div class="name-cell">${name}</div><div class="pp-cell">${pp}</div></td>
        <td style="color:var(--text-2)">${position}</td>
        <td style="color:var(--text-2)">${company}</td>
        <td style="color:var(--text-2)">${country}</td>
        <td>${stageBadge(r.stage)}</td>
        <td>${comm}</td><td>${paid}</td>
        <td class="${bal&&bal>0?'balance-owed':''}">${balTxt}</td>
        <td onclick="event.stopPropagation()"><button class="action-btn docs" onclick="openDocs('pro',${r.id},'${docsName}')"><i class="ti ti-paperclip"></i>${hd?' <i class="ti ti-check" style="color:var(--green);font-size:10px"></i>':''}</button></td>
        <td onclick="event.stopPropagation()"><button class="action-btn del" onclick="deletePro(${r.id})"><i class="ti ti-trash"></i></button></td>
      </tr>`;
    }).join('');
  }
  renderPagination('pro-pagination',proPage,totalPages,data.length,'pro');
}

function openProForm(){
  editingProId=null;
  document.getElementById('pro-modal-title').textContent='Add professional candidate';
  ['pf-name','pf-pp','pf-phone','pf-position','pf-company','pf-country','pf-submitted','pf-interview','pf-ol','pf-mol','pf-visa','pf-travel','pf-comm','pf-paid']
    .forEach(id=>{ const el=document.getElementById(id); if(el) el.value=''; });
  const stEl=document.getElementById('pf-stage'); if(stEl){ stEl.value=proStages[0]||'PENDING OFFER LETTER'; stEl.dataset.prev=stEl.value; }
  renderProSummary(null);
  document.getElementById('pro-form-timeline').innerHTML='<div class="tl-empty">Save candidate first to see timeline.</div>';
  document.getElementById('pro-tab-details').style.display='';
  ['pipeline','commission','timeline'].forEach(t=>{ const el=document.getElementById(`pro-tab-${t}`); if(el) el.style.display='none'; });
  document.getElementById('pro-modal').querySelectorAll('.modal-tab').forEach((b,i)=>b.classList.toggle('active',i===0));
  document.getElementById('pro-modal').classList.add('open');
}
function editPro(id){
  const r=proDB.find(x=>x.id==id); if(!r) return;
  editingProId=id;
  document.getElementById('pro-modal-title').textContent='Edit - '+r.name;
  document.getElementById('pf-name').value=r.name; document.getElementById('pf-pp').value=r.pp||'';
  document.getElementById('pf-phone').value=r.phone||''; document.getElementById('pf-position').value=r.position||'';
  document.getElementById('pf-company').value=r.company||''; document.getElementById('pf-country').value=r.country||'';
  const stEl=document.getElementById('pf-stage'); if(stEl){ stEl.value=r.stage; stEl.dataset.prev=r.stage; }
  document.getElementById('pf-comm').value=r.commission||''; document.getElementById('pf-paid').value=r.paid||'';
  document.getElementById('pf-submitted').value=toInput(r.submitted); document.getElementById('pf-interview').value=toInput(r.interview);
  document.getElementById('pf-ol').value=toInput(r.ol); document.getElementById('pf-mol').value=toInput(r.mol);
  document.getElementById('pf-visa').value=toInput(r.visa); document.getElementById('pf-travel').value=toInput(r.travel);
  renderProSummary(r);
  document.getElementById('pro-form-timeline').innerHTML=renderTimelineHTML('pro',id);
  document.getElementById('pro-tab-details').style.display='';
  ['pipeline','commission','timeline'].forEach(t=>{ const el=document.getElementById(`pro-tab-${t}`); if(el) el.style.display='none'; });
  document.getElementById('pro-modal').querySelectorAll('.modal-tab').forEach((b,i)=>b.classList.toggle('active',i===0));
  document.getElementById('pro-modal').classList.add('open');
}
async function savePro(){
  const name=document.getElementById('pf-name').value.trim();
  if(!name){ showToast('Full name is required','error'); return; }
  const oldRec=editingProId?{...(proDB.find(x=>x.id==editingProId)||{})}:null;
  const oldStage=oldRec?oldRec.stage:null;
  const newStage=document.getElementById('pf-stage').value;
  const rec={
    company_id:getCompanyId(),
    name:name.toUpperCase(), pp:document.getElementById('pf-pp').value.trim().toUpperCase(),
    phone:document.getElementById('pf-phone').value.trim(), position:document.getElementById('pf-position').value.trim().toUpperCase(),
    company:document.getElementById('pf-company').value.trim().toUpperCase(), country:document.getElementById('pf-country').value.trim(),
    stage:newStage, submitted:document.getElementById('pf-submitted').value||null,
    interview:document.getElementById('pf-interview').value||null, ol:document.getElementById('pf-ol').value||null,
    mol:document.getElementById('pf-mol').value||null, visa:document.getElementById('pf-visa').value||null,
    travel:document.getElementById('pf-travel').value||null,
    commission:document.getElementById('pf-comm').value?Number(document.getElementById('pf-comm').value):null,
    paid:document.getElementById('pf-paid').value?Number(document.getElementById('pf-paid').value):null,
  };
  const validationError=validateProRecord(rec);
  if(validationError){ showToast(validationError,'error'); return; }
  if(editingProId){
    rec.id=editingProId; const i=proDB.findIndex(x=>x.id==editingProId); proDB[i]={...proDB[i],...rec};
    const changes=recordChanges(oldRec,rec,[['name','Name'],['pp','Passport'],['phone','Phone'],['position','Position'],['company','Company'],['country','Country'],['stage','Stage'],['commission','Commission'],['paid','Paid'],['travel','Travel date']]);
    addTimeline('pro',editingProId,changes.length?`Updated: ${changes.slice(0,4).join('; ')}${changes.length>4?'...':''}`:'Details reviewed');
    auditAction('Professional Jobs','Candidate updated',rec.name);
    showToast('Candidate updated ✓','success');
  } else {
    rec.id=Date.now(); proDB.push(rec);
    addTimeline('pro',rec.id,`Added - Stage: ${newStage}`);
    auditAction('Professional Jobs','Candidate added',rec.name);
    showToast('Candidate added ✓','success');
  }
  closeModal('pro-modal'); renderPro(); renderDash(); await saveProRecord(rec);
}
async function deletePro(id){
  const r=proDB.find(x=>x.id==id);
  if(!confirm(`Delete ${r?r.name:'this candidate'}? Cannot be undone.`)) return;
  proDB=proDB.filter(x=>x.id!=id); auditAction('Professional Jobs','Candidate deleted',r?.name||''); showToast('Deleted','success'); renderPro(); renderDash(); await deleteProRecord(id);
}

// *Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â
// LB JOBS
// *Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â
function getFilteredLB(){
  const q=(document.getElementById('lb-search')?.value||'').toLowerCase();
  const travel=window.lbTravelPillFilter||'';
  const pp=window.lbPPFilter||'';
  const refund=document.getElementById('lb-refund-f')?.value||'';
  const action=document.getElementById('lb-action-f')?.value||'';
  const country=getActiveGeneralCountry();
  return lbDB.filter(r=>{
    const text=`${r.name} ${r.phone||''}`.toLowerCase();
    const ts=r.travelStatus||r.travel_status||'';
    const ps=r.ppStatus||r.pp_status||'';
    const rs=getRefundStatus(r);
    const rcountry=r.country||DEFAULT_COMPANY.generalJobsCountries[0]||'Lebanon';
    const actionMatch=!action ||
      (action==='needs-action'&&lbNeedsAction(r)) ||
      (action==='incomplete-refund'&&rs==='incomplete') ||
      (action==='no-docs'&&!hasDocs('lb',r.id));
    return rcountry===country&&(!q||text.includes(q))&&(!travel||ts===travel)&&(!pp||ps===pp)&&(!refund||rs===refund)&&actionMatch;
  });
}
function renderLB(){
  renderGeneralCountryTabs();
  let lbOwed=0,lbPaid=0,lbFees=0;
  const country=getActiveGeneralCountry();
  const countryRows=lbDB.filter(r=>(r.country||DEFAULT_COMPANY.generalJobsCountries[0]||'Lebanon')===country);
  countryRows.forEach(r=>{
    const ts=r.travelStatus||r.travel_status;
    const pp=r.ppStatus||r.pp_status;
    const notes=(r.notes||'').trim().toUpperCase();
    if(ts==='TRAVELLED'&&pp!=='HAD PP'&&notes!=='RETURNED'){
      const toR=Number(r.toRefund||r.to_refund)||0;
      const paid=(Number(r.r1Amt||r.r1_amt)||0)+(Number(r.r2Amt||r.r2_amt)||0);
      lbOwed+=toR; lbPaid+=paid; lbFees+=paid;
    }
  });
  const lbIncomplete=countryRows.filter(r=>(r.travelStatus||r.travel_status)==='TRAVELLED'&&getRefundStatus(r)==='incomplete').length;
  const metricsEl=document.getElementById('lb-metrics');
  if(metricsEl) metricsEl.innerHTML=`
    <div class="metric-card mc-default"><div class="metric-label">${escHTML(country)} total</div><div class="metric-val">${countryRows.length}</div></div>
    <div class="metric-card mc-amber"><div class="metric-label">In process</div><div class="metric-val amber">${countryRows.filter(isInProcessLB).length}</div></div>
    <div class="metric-card mc-green"><div class="metric-label">Travelled</div><div class="metric-val green">${countryRows.filter(r=>(r.travelStatus||r.travel_status)==='TRAVELLED').length}</div></div>
    <div class="metric-card mc-ink"><div class="metric-label">Collected</div><div class="metric-val sm green">${moneyUSD(lbFees)}</div></div>
    <div class="metric-card mc-red"><div class="metric-label">Outstanding</div><div class="metric-val sm red">${moneyUSD(lbOwed-lbPaid)}</div></div>`;

  const data=getFilteredLB();
  const totalPages=Math.max(1,Math.ceil(data.length/PER_PAGE));
  if(lbPage>totalPages) lbPage=1;
  const slice=data.slice((lbPage-1)*PER_PAGE,lbPage*PER_PAGE);
  const tbody=document.getElementById('lb-tbody'); if(!tbody) return;
  if(!slice.length){ tbody.innerHTML=`<tr><td colspan="12"><div class="empty">No candidates found</div></td></tr>`; }
  else {
    tbody.innerHTML=slice.map((r,i)=>{
      const rs=getRefundStatus(r);
      const ts=r.travelStatus||r.travel_status||'';
      const ps=r.ppStatus||r.pp_status||'';
      const toR=Number(r.toRefund||r.to_refund)||0;
      const paid=(Number(r.r1Amt||r.r1_amt)||0)+(Number(r.r2Amt||r.r2_amt)||0);
      const bal=(rs==='N/A'||rs==='RETURNED')?'&mdash;':moneyUSD(toR-paid);
      const td=r.travelDate||r.travel_date;
      const hd=hasDocs('lb',r.id);
      const name=escHTML(r.name);
      const phone=r.phone ? escHTML(r.phone) : '&mdash;';
      const docsName=escJSString(r.name);
      return `<tr onclick="editLB(${r.id})">
        <td>${(lbPage-1)*PER_PAGE+i+1}</td>
        <td class="name-cell">${name}</td>
        <td>${phone}</td>
        <td>${ppBadge(ps)}</td>
        <td>${travelBadge(ts)}</td>
        <td>${fmtDate(td)}</td>
        <td>${rs==='N/A'?'&mdash;':moneyUSD(toR)}</td>
        <td>${rs==='N/A'?'&mdash;':moneyUSD(paid)}</td>
        <td class="${rs==='incomplete'?'balance-owed':''}">${bal}</td>
        <td>${refundBadge(rs)}</td>
        <td onclick="event.stopPropagation()"><button class="action-btn docs" onclick="openDocs('lb',${r.id},'${docsName}')"><i class="ti ti-paperclip"></i>${hd?' <i class="ti ti-check" style="color:var(--green);font-size:10px"></i>':''}</button></td>
        <td onclick="event.stopPropagation()"><button class="action-btn del" onclick="deleteLB(${r.id})"><i class="ti ti-trash"></i></button></td>
      </tr>`;
    }).join('');
  }
  renderPagination('lb-pagination',lbPage,totalPages,data.length,'lb');
}

function openLBForm(){
  editingLbId=null;
  document.getElementById('lb-modal-title').textContent=`Add General Jobs candidate - ${getActiveGeneralCountry()}`;
  ['lf-name','lf-phone','lf-tdate','lf-torefund','lf-r1date','lf-r1amt','lf-r2date','lf-r2amt','lf-notes']
    .forEach(id=>{ const el=document.getElementById(id); if(el) el.value=''; });
  document.getElementById('lf-pp').value='APPLIED';
  const tvEl=document.getElementById('lf-travel'); if(tvEl){ tvEl.value=lbStages[0]||'NOT YET'; tvEl.dataset.prev=tvEl.value; }
  renderLBSummary(null);
  document.getElementById('lb-form-timeline').innerHTML='<div class="tl-empty">Save candidate first to see timeline.</div>';
  document.getElementById('lb-tab-details').style.display='';
  ['refunds','timeline'].forEach(t=>{ const el=document.getElementById(`lb-tab-${t}`); if(el) el.style.display='none'; });
  document.getElementById('lb-modal').querySelectorAll('.modal-tab').forEach((b,i)=>b.classList.toggle('active',i===0));
  document.getElementById('lb-modal').classList.add('open');
}
function editLB(id){
  const r=lbDB.find(x=>x.id==id); if(!r) return;
  editingLbId=id;
  document.getElementById('lb-modal-title').textContent='Edit - '+r.name;
  document.getElementById('lf-name').value=r.name; document.getElementById('lf-phone').value=r.phone||'';
  document.getElementById('lf-pp').value=r.ppStatus||r.pp_status||'APPLIED';
  const tvEl=document.getElementById('lf-travel'); if(tvEl){ tvEl.value=r.travelStatus||r.travel_status||'NOT YET'; tvEl.dataset.prev=tvEl.value; }
  document.getElementById('lf-tdate').value=toInput(r.travelDate||r.travel_date);
  document.getElementById('lf-torefund').value=r.toRefund||r.to_refund||'';
  document.getElementById('lf-r1date').value=toInput(r.r1Date||r.r1_date);
  document.getElementById('lf-r1amt').value=r.r1Amt||r.r1_amt||'';
  document.getElementById('lf-r2date').value=toInput(r.r2Date||r.r2_date);
  document.getElementById('lf-r2amt').value=r.r2Amt||r.r2_amt||'';
  document.getElementById('lf-notes').value=r.notes||'';
  renderLBSummary(r);
  document.getElementById('lb-form-timeline').innerHTML=renderTimelineHTML('lb',id);
  document.getElementById('lb-tab-details').style.display='';
  ['refunds','timeline'].forEach(t=>{ const el=document.getElementById(`lb-tab-${t}`); if(el) el.style.display='none'; });
  document.getElementById('lb-modal').querySelectorAll('.modal-tab').forEach((b,i)=>b.classList.toggle('active',i===0));
  document.getElementById('lb-modal').classList.add('open');
}
async function saveLB(){
  const name=document.getElementById('lf-name').value.trim();
  if(!name){ showToast('Full name is required','error'); return; }
  const ppStatus=document.getElementById('lf-pp').value;
  const isHadPP=ppStatus==='HAD PP';
  const oldRec=editingLbId?{...(lbDB.find(x=>x.id==editingLbId)||{})}:null;
  const oldTravel=oldRec?oldRec.travelStatus:null;
  const newTravel=document.getElementById('lf-travel').value;
  const rec={
    company_id:getCompanyId(),
    country:getActiveGeneralCountry(),
    name:name.toUpperCase(), phone:document.getElementById('lf-phone').value.trim(),
    ppStatus, travelStatus:newTravel,
    travelDate:document.getElementById('lf-tdate').value||null,
    toRefund:isHadPP?0:(Number(document.getElementById('lf-torefund').value)||0),
    r1Date:document.getElementById('lf-r1date').value||null,
    r1Amt:isHadPP?0:(Number(document.getElementById('lf-r1amt').value)||0),
    r2Date:document.getElementById('lf-r2date').value||null,
    r2Amt:isHadPP?0:(Number(document.getElementById('lf-r2amt').value)||0),
    notes:document.getElementById('lf-notes').value.trim(),
  };
  const validationError=validateLBRecord(rec);
  if(validationError){ showToast(validationError,'error'); return; }
  if(editingLbId){
    rec.id=editingLbId; const i=lbDB.findIndex(x=>x.id==editingLbId); lbDB[i]={...lbDB[i],...rec};
    const changes=recordChanges(oldRec,rec,[['name','Name'],['phone','Phone'],['ppStatus','Passport'],['travelStatus','Travel'],['travelDate','Travel date'],['toRefund','To refund'],['r1Amt','1st refund'],['r2Amt','2nd refund'],['notes','Notes']]);
    addTimeline('lb',editingLbId,changes.length?`Updated: ${changes.slice(0,4).join('; ')}${changes.length>4?'...':''}`:'Details reviewed');
    auditAction('General Jobs','Candidate updated',rec.name);
    showToast('Candidate updated ✓','success');
  } else {
    rec.id=Date.now(); lbDB.push(rec);
    addTimeline('lb',rec.id,`Added - ${ppStatus}, ${newTravel}`);
    auditAction('General Jobs','Candidate added',rec.name);
    showToast('Candidate added ✓','success');
  }
  closeModal('lb-modal'); renderLB(); renderDash(); await saveLBRecord(rec);
}
async function deleteLB(id){
  const r=lbDB.find(x=>x.id==id);
  if(!confirm(`Delete ${r?r.name:'this candidate'}? Cannot be undone.`)) return;
  lbDB=lbDB.filter(x=>x.id!=id); auditAction('General Jobs','Candidate deleted',r?.name||''); showToast('Deleted','success'); renderLB(); renderDash(); await deleteLBRecord(id);
}

// *Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â
// DOCUMENTS
// *Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â
function hasDocs(type,id){ const v=allDocs[`${type}_${id}`]; return typeof v==='string'&&v.trim().length>0; }
function openDocs(type,id,name){
  docsTarget={type,id,name};
  document.getElementById('docs-modal-title').textContent=`Documents - ${name}`;
  let existing=allDocs[`${type}_${id}`]; if(typeof existing!=='string') existing='';
  const input=document.getElementById('docs-link-input');
  const openBtn=document.getElementById('docs-open-btn');
  input.value=existing; openBtn.disabled=!existing.trim(); renderDocChecklist(type,id);
  document.getElementById('docs-modal').classList.add('open');
}
function onDocsLinkInput(){ document.getElementById('docs-open-btn').disabled=!document.getElementById('docs-link-input').value.trim(); }
function openCurrentDocLink(){ const v=document.getElementById('docs-link-input').value.trim(); if(v) window.open(v,'_blank'); }
function renderDocChecklist(type,id){
  const el=document.getElementById('docs-checklist'); if(!el) return;
  const record=(type==='pro'?proDB:lbDB).find(r=>String(r.id)===String(id))||{};
  const hasFolder=!!String(allDocs[`${type}_${id}`]||'').trim();
  const items=type==='pro'
    ? [{label:'Passport',done:!!record.pp},{label:'Offer letter',done:!!record.ol},{label:'MOL',done:!!record.mol},{label:'Visa',done:!!record.visa},{label:'Travel ticket',done:!!record.travel},{label:'Drive folder',done:hasFolder}]
    : [{label:'Passport',done:String(record.ppStatus||record.pp_status||'')==='HAD PP'},{label:'Travel details',done:!!(record.travelDate||record.travel_date)},{label:'Repayment record',done:!!(record.r1Amt||record.r1_amt||record.r2Amt||record.r2_amt)},{label:'Drive folder',done:hasFolder}];
  el.innerHTML=`<div class="doc-checklist-title">Document checklist</div><div class="doc-checklist-grid">${items.map(item=>`<span class="doc-check ${item.done?'done':'missing'}"><i class="ti ${item.done?'ti-circle-check':'ti-alert-circle'}"></i>${item.label}</span>`).join('')}</div>`;
}
async function saveDocs(){
  if(!docsTarget) return;
  const {type,id}=docsTarget;
  const link=document.getElementById('docs-link-input').value.trim();
  const dbKey=`${type}_${id}`;
  allDocs[dbKey]=link;
  addTimeline(type,id,link?'Documents link updated':'Documents link removed');
  auditAction('Documents',link?'Documents link updated':'Documents link removed',docsTarget.name||'Candidate');
  closeModal('docs-modal'); showToast('Documents saved Å“"','success');
  if(type==='pro') renderPro(); else renderLB();
  await saveDocsToDB(dbKey,link);
}

// *Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â
// EXPORT CSV
// *Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â
function exportCSV(type){
  let headers,rows,filename;
  if(type==='pro'){
    headers=['#','Name','Passport','Phone','Position','Company','Country','Stage','Commission (KES)','Paid (KES)','Balance (KES)','Submitted','Interview','Offer Letter','MOL','Visa','Travel Date'];
    rows=proDB.map((r,i)=>[i+1,r.name,r.pp||'',r.phone||'',r.position||'',r.company||'',r.country||'',r.stage,
      r.commission||'',r.paid||'',(r.commission&&r.paid)?Number(r.commission)-Number(r.paid):'',
      fmtDate(r.submitted),fmtDate(r.interview),fmtDate(r.ol),fmtDate(r.mol),fmtDate(r.visa),fmtDate(r.travel)]);
    filename='Dreco_Professional';
  } else {
    headers=['#','Name','Phone','Passport Status','Travel Status','Travel Date','To Refund (USD)','Refunded (USD)','Balance (USD)','Refund Status','Notes'];
    rows=lbDB.map((r,i)=>{
      const rs=getRefundStatus(r); const toR=Number(r.toRefund||r.to_refund)||0;
      const paid=(Number(r.r1Amt||r.r1_amt)||0)+(Number(r.r2Amt||r.r2_amt)||0);
      return [i+1,r.name,r.phone||'',r.ppStatus||r.pp_status||'',r.travelStatus||r.travel_status||'',
        fmtDate(r.travelDate||r.travel_date),rs==='N/A'?'':toR,rs==='N/A'?'':paid,
        (rs==='N/A'||rs==='RETURNED')?'':toR-paid,rs,r.notes||''];
    });
    filename='Dreco_LB';
  }
  const esc=v=>`"${String(v==null?'':v).replace(/"/g,'""')}"`;
  const csv=[headers.map(esc).join(','),...rows.map(r=>r.map(esc).join(','))].join('\n');
  const a=Object.assign(document.createElement('a'),{
    href:URL.createObjectURL(new Blob([csv],{type:'text/csv'})),
    download:`${filename}_${new Date().toISOString().split('T')[0]}.csv`
  });
  a.click(); showToast('Export downloaded Å“"','success');
}

// *Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â
// PAGINATION
// *Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â
function renderPagination(elId,page,total,count,which){
  const el=document.getElementById(elId); if(!el) return;
  if(total<=1){ el.innerHTML=`<span>${count} record${count!==1?'s':''}</span><span></span>`; return; }
  let btns='';
  for(let p=1;p<=total;p++){
    if(p===1||p===total||Math.abs(p-page)<=1)
      btns+=`<button class="page-btn ${p===page?'active':''}" onclick="goPage('${which}',${p})">${p}</button>`;
    else if(Math.abs(p-page)===2) btns+=`<span style="padding:4px 2px;color:var(--text-3);font-size:11px">...</span>`;
  }
  el.innerHTML=`<span>${count} record${count!==1?'s':''}</span><div class="page-btns">${btns}</div>`;
}
function goPage(which,p){
  if(which==='pro'){ proPage=p; renderPro(); } else { lbPage=p; renderLB(); }
  document.querySelector('.content-area')?.scrollTo({top:0,behavior:'smooth'});
}

// *Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â
// TOAST
// *Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â
function showToast(msg,type=''){
  const t=document.getElementById('toast'); if(!t) return;
  const icon=type==='error'?'ti-alert-circle':'ti-circle-check';
  t.className='toast '+type;
  t.innerHTML=`<i class="ti ${icon}"></i><span>${msg}</span>`;
  void t.offsetWidth; t.classList.add('show');
  setTimeout(()=>t.classList.remove('show'),2800);
}

// *Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â
// PROFILE DROPDOWN
// *Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â*Â
function toggleProfileDropdown(e) {
  e.stopPropagation();
  const dd = document.getElementById('profile-dropdown');
  const open = dd.classList.toggle('open');
  // clear messages when opening
  if (open) {
    const msg = document.getElementById('pd-msg');
    if (msg) { msg.textContent = ''; msg.className = 'pd-msg'; }
    ['pd-display-name','pd-new-username','pd-current-pw','pd-new-pw','pd-confirm-pw'].forEach(id => {
      const el = document.getElementById(id); if (el) el.value = '';
    });
    // pre-fill username field with current
    const uEl = document.getElementById('pd-new-username');
    if (uEl && currentUser) uEl.placeholder = currentUser.username;
    const nameEl = document.getElementById('pd-display-name');
    if (nameEl && currentUser) nameEl.value = currentUser.display || '';
  }
  // rotate caret
  const caret = document.getElementById('profile-caret');
  if (caret) caret.style.transform = open ? 'rotate(180deg)' : '';
}
function closeProfileDropdown() {
  const dd = document.getElementById('profile-dropdown');
  if (dd) dd.classList.remove('open');
  const caret = document.getElementById('profile-caret');
  if (caret) caret.style.transform = '';
}
function openProfileEdit() {
  const panel=document.getElementById('pd-edit-panel');
  if(panel) panel.style.display='block';
  const msg=document.getElementById('pd-msg');
  if(msg){ msg.textContent=''; msg.className='pd-msg'; }
  const userInput=document.getElementById('pd-new-username');
  if(userInput && currentUser){ userInput.value=currentUser.username; userInput.placeholder=currentUser.username; }
  const displayInput=document.getElementById('pd-display-name');
  if(displayInput && currentUser){ displayInput.value=currentUser.display || ''; }
  ['pd-current-pw','pd-new-pw','pd-confirm-pw'].forEach(id=>{ const el=document.getElementById(id); if(el) el.value=''; });
  setTimeout(()=>userInput?.focus(),0);
}
function closeProfileEdit() {
  const panel=document.getElementById('pd-edit-panel');
  if(panel) panel.style.display='none';
  const msg=document.getElementById('pd-msg');
  if(msg){ msg.textContent=''; msg.className='pd-msg'; }
}
function openChangePassword() {
  openProfileEdit();
  setTimeout(()=>document.getElementById('pd-current-pw')?.focus(),0);
}

// close dropdown when clicking outside
document.addEventListener('click', () => {
  closeProfileDropdown();
});

async function saveProfileChanges() {
  const msgEl = document.getElementById('pd-msg');
  const newDisplay = (document.getElementById('pd-display-name').value || '').trim();
  const newUsername = (document.getElementById('pd-new-username').value || '').trim().toLowerCase();
  const currentPw   = document.getElementById('pd-current-pw').value;
  const newPw       = document.getElementById('pd-new-pw').value;
  const confirmPw   = document.getElementById('pd-confirm-pw').value;

  const showMsg = (txt, type) => {
    msgEl.textContent = txt;
    msgEl.className = 'pd-msg ' + type;
  };

  let changed = false;

  const originalUsername = currentUser.username;
  const originalAccount = STAFF_ACCOUNTS[originalUsername];
  if (!originalAccount) {
    showMsg('Current account could not be found. Sign in again.', 'err'); return;
  }

  if (newDisplay && newDisplay !== currentUser.display) {
    originalAccount.display = newDisplay;
    currentUser.display = newDisplay;
    changed = true;
  }

  // "-"- Username change "-"-
  if (newUsername && newUsername !== currentUser.username) {
    if (!/^[a-z0-9._-]{3,32}$/.test(newUsername)) {
      showMsg('Use 3-32 letters, numbers, dots, dashes, or underscores for username.', 'err'); return;
    }
    if (STAFF_ACCOUNTS[newUsername] && newUsername !== currentUser.username) {
      showMsg('That username is already taken.', 'err'); return;
    }
    // rename key in STAFF_ACCOUNTS
    STAFF_ACCOUNTS[newUsername] = { ...originalAccount };
    delete STAFF_ACCOUNTS[originalUsername];
    currentUser.username = newUsername;
    changed = true;
  }

  // "-"- Password change "-"-
  if (currentPw || newPw || confirmPw) {
    if (!currentPw) { showMsg('Enter your current password.', 'err'); return; }
    const account = STAFF_ACCOUNTS[currentUser.username];
    let passwordCheck = { ok: false };
    try {
      passwordCheck = await verifyAccountPassword(account, currentPw);
    } catch (err) {
      showMsg(err.message || 'Current password could not be verified.', 'err'); return;
    }
    if (!passwordCheck.ok) { showMsg('Current password is incorrect.', 'err'); return; }
    if (!newPw) { showMsg('Enter a new password.', 'err'); return; }
    if (newPw.length < 6) { showMsg('New password must be at least 6 characters.', 'err'); return; }
    if (newPw !== confirmPw) { showMsg('New passwords do not match.', 'err'); return; }
    try {
      await setAccountPassword(STAFF_ACCOUNTS[currentUser.username], newPw);
    } catch (err) {
      showMsg(err.message || 'New password could not be secured.', 'err'); return;
    }
    changed = true;
  }

  if (!changed) { showMsg('No changes to save.', 'err'); return; }
  safeSessionSet('dr_user', JSON.stringify(currentUser));
  await saveStaffAccounts();
  showMsg('Changes saved successfully.', 'ok');
  // clear sensitive fields
  ['pd-current-pw','pd-new-pw','pd-confirm-pw'].forEach(id => {
    const el = document.getElementById(id); if (el) el.value = '';
  });
  // refresh display
  setUserDisplay(currentUser.display, currentUser.role);
}

// "-"- Extended setUserDisplay to also fill profile dropdown "-"-
const _baseSetUserDisplay = setUserDisplay;
function setUserDisplay(display, role) {
  // original fields
  const parts = display.replace(/[^a-zA-Z ]/g, '').trim().split(' ');
  const initials = parts.length >= 2
    ? (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
    : display.substring(0, 2).toUpperCase();

  ['user-chip','sidebar-user-name'].forEach(id => {
    const el = document.getElementById(id); if (el) el.textContent = display;
  });
  ['topbar-avatar','sidebar-avatar','pd-avatar','suc-avatar'].forEach(id => {
    const el = document.getElementById(id); if (el) el.textContent = initials;
  });
  // suc-name = first name only for card
  const sucName = document.getElementById('suc-name');
  if (sucName) sucName.textContent = display;
  // sidebar role
  const rEl = document.getElementById('sidebar-user-role');
  if (rEl) rEl.textContent = role === 'admin' ? 'Administrator' : 'Staff';
  // pd name + role badge
  const pdName = document.getElementById('pd-name');
  if (pdName) pdName.textContent = display;
  const pdBadge = document.getElementById('pd-role-badge');
  const pdRoleText = document.getElementById('pd-role-text');
  if (pdBadge && pdRoleText) {
    const isAdmin = role === 'admin';
    pdBadge.className = 'pd-role-badge' + (isAdmin ? ' admin' : '');
    pdRoleText.textContent = isAdmin ? 'Administrator' : 'Staff';
  }
  const sucOrg = document.querySelector('.suc-org');
  if (sucOrg) sucOrg.textContent = getCompanyName();
  updateWorkspaceLabels();
}













// =========================================================
// DRECO OPERATIONS UI REFRESH
// Keeps Supabase/data/auth/save/edit functions from the original app.
// Replaces the internal rendering shell with Home, Pipeline, Candidates,
// Tasks, Finance, Documents, Reports, Clients, and Settings.
// =========================================================
(function(){
  const UI_TABS = ['dash','pipeline','candidates','tasks','finance','documents','reports','clients','settings'];
  const LEGACY_TABS = ['pro','lb','kanban','travel','calendar','commissions','repayments','expenses','team','help'];
  const ALL_TABS = [...UI_TABS, ...LEGACY_TABS];
  const tabTitles = {dash:'Home',pipeline:'Pipeline',candidates:'Candidates',tasks:'Tasks',finance:'Finance',documents:'Documents',reports:'Reports',clients:'Clients',settings:'Settings'};
  const tabIcons = {dash:'ti-home',pipeline:'ti-route',candidates:'ti-users',tasks:'ti-checkbox',finance:'ti-coin',documents:'ti-file-description',reports:'ti-chart-bar',clients:'ti-building-skyscraper',settings:'ti-settings'};

  function safeText(v){ return (typeof escHTML === 'function') ? escHTML(v ?? '') : String(v ?? '').replace(/[&<>"']/g, s=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[s])); }
  function initials(name){ return String(name||'DR').replace(/[^a-zA-Z ]/g,'').trim().split(/\s+/).filter(Boolean).map(x=>x[0]).join('').slice(0,2).toUpperCase() || 'DR'; }
  function moneyKES(n){ n=Number(n)||0; return 'KES ' + n.toLocaleString(); }
  function moneyUSDLocal(n){ return (typeof moneyUSD === 'function') ? moneyUSD(n) : '$' + (Number(n)||0).toLocaleString(); }
  function fmt(v){ return (typeof fmtDate === 'function') ? fmtDate(v) : (v || '—'); }
  function balancePro(r){ return (typeof proBalance === 'function') ? proBalance(r) : Math.max((Number(r.commission)||0)-(Number(r.paid)||0),0); }
  function refundStatus(r){ return (typeof getRefundStatus === 'function') ? getRefundStatus(r) : 'N/A'; }
  function candidateAvatar(name){ return `<div class="avatar-mini">${safeText(initials(name))}</div>`; }
  function stageClass(stage){ const s=String(stage||'').toLowerCase(); if(s.includes('travelled')&&!s.includes('not')) return 'green'; if(s.includes('visa')) return 'blue'; if(s.includes('mol')||s.includes('offer')) return 'orange'; if(s.includes('not')) return 'red'; return ''; }
  function stageBadge(stage){ return `<span class="stage-badge ${stageClass(stage)}">${safeText(stage || 'Not set')}</span>`; }
  function companyName(){ return (typeof getCompanyName === 'function') ? getCompanyName() : 'Destiny Recruit Consults'; }
  function currentFirstName(){ return currentUser?.display?.split(' ')?.[0] || 'John'; }
  function allCandidateRows(){
    const pro=(Array.isArray(proDB)?proDB:[]).map(r=>({type:'pro',id:r.id,name:r.name,pp:r.pp,phone:r.phone,position:r.position||'—',company:r.company||'—',country:r.country||'—',stage:r.stage||'—',submitted:r.submitted,owner:currentUser?.display||'Team',commission:Number(r.commission)||0,paid:Number(r.paid)||0,balance:balancePro(r),raw:r}));
    const lb=(Array.isArray(lbDB)?lbDB:[]).map(r=>({type:'lb',id:r.id,name:r.name,pp:r.pp||r.passport||'',phone:r.phone,position:'General Job',company:r.company||getActiveGeneralCountry?.()||'General',country:r.country||getActiveGeneralCountry?.()||'—',stage:r.travelStatus||r.travel_status||'NOT YET',submitted:r.travelDate||r.travel_date,owner:currentUser?.display||'Team',commission:Number(r.toRefund||r.to_refund)||0,paid:(Number(r.r1Amt||r.r1_amt)||0)+(Number(r.r2Amt||r.r2_amt)||0),balance:Math.max((Number(r.toRefund||r.to_refund)||0)-((Number(r.r1Amt||r.r1_amt)||0)+(Number(r.r2Amt||r.r2_amt)||0)),0),raw:r}));
    return [...pro,...lb];
  }
  function ensureRefreshSections(){
    const area=document.querySelector('.content-area'); if(!area) return;
    UI_TABS.forEach(t=>{ if(!document.getElementById(`${t}-section`)){ const div=document.createElement('div'); div.id=`${t}-section`; div.style.display='none'; area.appendChild(div); } });
  }
  function setupRefreshShell(){
    const side=document.querySelector('#app .sidebar');
    if(side && !side.dataset.refreshShell){
      side.innerHTML = `
        <div class="sidebar-top">
          <a class="sidebar-logo" onclick="switchTab('dash')" aria-label="Dreco home">
            <div class="sidebar-logo-mark"><svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M3 6C3 4.343 4.343 3 6 3h4c1.657 0 3 1.343 3 3v4c0 1.657-1.343 3-3 3H6c-1.657 0-3-1.343-3-3V6Z"/><path d="M14 14c0-1.105.895-2 2-2h4c1.105 0 2 .895 2 2v6c0 1.105-.895 2-2 2h-4c-1.105 0-2-.895-2-2v-6Z" opacity=".55"/><path d="M3 17c0-1.105.895-2 2-2h3c1.105 0 2 .895 2 2v2c0 1.105-.895 2-2 2H5c-1.105 0-2-.895-2-2v-2Z" opacity=".32"/></svg></div>
            <span class="sidebar-logo-text">DRECO</span>
          </a>
          <button class="sidebar-toggle" onclick="toggleSidebar()" type="button"><i class="ti ti-chevrons-left"></i></button>
        </div>
        <button class="sidebar-user-card sidebar-account-trigger" onclick="toggleProfileDropdown(event)" type="button">
          <div class="suc-avatar" id="suc-avatar">${safeText(initials(currentUser?.display))}</div>
          <div class="suc-info"><div class="suc-name" id="suc-name">${safeText(currentUser?.display || 'User')}</div><div class="suc-org">${safeText(companyName())}</div></div>
        </button>
        <div class="sidebar-divider"></div>
        <div class="nav-section-label">Workspace</div>
        ${['dash','pipeline','candidates','tasks'].map(navHTML).join('')}
        <div class="nav-section-label">Operations</div>
        ${['finance','documents','reports','clients'].map(navHTML).join('')}
        <div class="nav-section-label">System</div>
        ${navHTML('settings')}
        <div class="nav-spacer"></div>`;
      side.dataset.refreshShell='1';
    }
    const bnav=document.getElementById('bottom-nav');
    if(bnav && !bnav.dataset.refreshShell){
      bnav.innerHTML = UI_TABS.map(t=>`<button class="bottom-nav-item" id="bnav-${t}" onclick="switchTab('${t}')" aria-label="${tabTitles[t]}"><i class="ti ${tabIcons[t]}"></i><span>${tabTitles[t]}</span></button>`).join('');
      bnav.dataset.refreshShell='1';
    }
    ensureRefreshSections();
    const ws=document.getElementById('topbar-workspace-name'); if(ws) ws.textContent=companyName();
  }
  function navHTML(t){ return `<a class="nav-item" id="nav-${t}" data-title="${tabTitles[t]}" onclick="switchTab('${t}')"><i class="ti ${tabIcons[t]}"></i><span class="nav-item-label">${tabTitles[t]}</span></a>`; }
  function markActive(t){
    document.querySelectorAll('#app .nav-item').forEach(n=>n.classList.remove('active'));
    document.getElementById(`nav-${t}`)?.classList.add('active');
    document.querySelectorAll('.bottom-nav-item').forEach(n=>n.classList.remove('active'));
    document.getElementById(`bnav-${t}`)?.classList.add('active');
  }

  window.switchTab = function(t){
    setupRefreshShell();
    const aliases={pro:'candidates',lb:'candidates',kanban:'pipeline',calendar:'tasks',commissions:'finance',repayments:'finance',expenses:'finance',team:'settings',travel:'pipeline',help:'settings'};
    t=aliases[t] || t || 'dash';
    ALL_TABS.forEach(x=>{ const sec=document.getElementById(`${x}-section`); if(sec) sec.style.display='none'; });
    UI_TABS.forEach(x=>{ const sec=document.getElementById(`${x}-section`); if(sec) sec.style.display=(x===t)?'':'none'; });
    markActive(t);
    if(typeof closeProfileDropdown === 'function') closeProfileDropdown();
    const title=document.getElementById('topbar-title'); if(title) title.textContent=tabTitles[t] || 'Dreco';
    if(t==='dash') renderDash();
    if(t==='pipeline') renderPipelinePage();
    if(t==='candidates') renderCandidatesPage();
    if(t==='tasks') renderTasksPage();
    if(t==='finance') renderFinancePage();
    if(t==='documents') renderDocumentsPage();
    if(t==='reports') renderReportsPage();
    if(t==='clients') renderClientsPage();
    if(t==='settings') { if(typeof renderSettingsPage === 'function') renderSettingsPage(); polishSettingsPage(); }
  };

  window.renderDash = function(){
    setupRefreshShell();
    const el=document.getElementById('dash-section'); if(!el) return;
    const rows=allCandidateRows();
    const awaitingMol=(proDB||[]).filter(r=>r.stage==='PENDING MOL').length;
    const visaReady=(proDB||[]).filter(r=>r.stage==='PENDING VISA').length;
    const unpaid=rows.filter(r=>r.balance>0).length;
    const tickets=(proDB||[]).filter(r=>r.stage==='PENDING TRAVEL').length;
    const compliance=rows.filter(r=>!hasDocs?.(r.type,r.id)).length;
    const totalPaid=rows.reduce((s,r)=>s+r.paid,0);
    const travelled=rows.filter(r=>String(r.stage).toUpperCase()==='TRAVELLED').length;
    el.innerHTML=`<div class="dreco-page">
      <div class="dreco-page-head"><div><h1>Good morning, ${safeText(currentFirstName())} 👋</h1><p>Here is what needs your attention today.</p></div><div class="dreco-head-actions"><button class="dreco-btn" onclick="switchTab('tasks')"><i class="ti ti-checkbox"></i>View all tasks</button><button class="dreco-btn primary" onclick="openProForm()"><i class="ti ti-plus"></i>New Candidate</button></div></div>
      <div class="dreco-grid priority-grid">
        ${priority('ti-file-description',awaitingMol,'Awaiting MOL','High priority','#fff4de','switchTab(\'pipeline\')')}
        ${priority('ti-id-badge-2',visaReady,'Visas Ready','Ready to travel','#e9f3ff','switchTab(\'pipeline\')')}
        ${priority('ti-coin',unpaid,'Unpaid Commissions','Requires follow up','#e8f8ee','switchTab(\'finance\')')}
        ${priority('ti-plane-departure',tickets,'Tickets Pending','Awaiting issue','#f1efff','switchTab(\'pipeline\')')}
        ${priority('ti-alert-circle',compliance,'Compliance Issue','Missing documents','#feecef','switchTab(\'documents\')')}
      </div>
      <div class="dreco-card pad"><div class="dreco-card-title">Pipeline Overview <span onclick="switchTab('pipeline')" style="cursor:pointer">View pipeline →</span></div><div class="pipeline-flow">${flowStepsHTML()}</div></div>
      <div class="dreco-grid dash-two">
        <div class="dreco-card pad"><div class="dreco-card-title">Recent Activity <span>Latest changes</span></div><div class="activity-list">${recentActivityHTML()}</div></div>
        <div class="dreco-card pad"><div class="dreco-card-title">Upcoming Reminders <span>${rows.length} records</span></div><div class="task-list">${tasksHTML(5)}</div></div>
      </div>
      <div class="dreco-grid dreco-kpis" style="margin-top:14px">
        ${kpi('Candidates',rows.length,'All active records','ti-users','switchTab(\'candidates\')')}
        ${kpi('Travelled',travelled,'Completed placements','ti-plane','switchTab(\'pipeline\')')}
        ${kpi('Collected',moneyKES(totalPaid),'Recorded payments','ti-wallet','switchTab(\'finance\')')}
        ${kpi('Clients',clientRows().length,'Companies served','ti-building','switchTab(\'clients\')')}
        ${kpi('Documents',Object.values(allDocs||{}).filter(Boolean).length,'Drive links saved','ti-folder','switchTab(\'documents\')')}
      </div>
    </div>`;
  };
  function kpi(label,value,note,icon,click){ return `<div class="dreco-kpi" onclick="${click||''}"><div class="dreco-kpi-icon"><i class="ti ${icon}"></i></div><div class="dreco-kpi-label">${label}</div><div class="dreco-kpi-value">${safeText(value)}</div><div class="dreco-kpi-note">${safeText(note)}</div></div>`; }
  function priority(icon,num,label,note,bg,click){ return `<div class="priority-card" onclick="${click}"><div class="priority-icon" style="background:${bg};color:#5347CE"><i class="ti ${icon}"></i></div><strong>${safeText(num)}</strong><span>${safeText(label)}</span><small>${safeText(note)}</small></div>`; }
  function flowStepsHTML(){ const data=[['Submitted',(proDB||[]).length+(lbDB||[]).length],['Interview',(proDB||[]).filter(r=>r.interview).length],['Offer',(proDB||[]).filter(r=>r.ol||r.stage==='PENDING OFFER LETTER').length],['MOL',(proDB||[]).filter(r=>r.mol||r.stage==='PENDING MOL').length],['Visa',(proDB||[]).filter(r=>r.visa||r.stage==='PENDING VISA').length],['Travelled',allCandidateRows().filter(r=>String(r.stage).toUpperCase()==='TRAVELLED').length]]; return data.map(([l,v])=>`<div class="flow-step"><span>${l}</span><strong>${v}</strong></div>`).join(''); }
  function recentActivityHTML(){
    const entries=Object.entries(allTimelines||{}).flatMap(([key,arr])=>(arr||[]).map(e=>({...e,key}))).sort((a,b)=>new Date(b.ts||0)-new Date(a.ts||0)).slice(0,5);
    if(!entries.length) return `<div class="empty-state">Activity will appear here when your team edits candidates, payments, documents, and stages.</div>`;
    return entries.map(e=>`<div class="activity-item"><div class="activity-icon"><i class="ti ti-history"></i></div><div><div class="item-title">${safeText(e.action||'Candidate updated')}</div><div class="item-meta">by ${safeText(e.user||'Dreco')} • ${safeText(e.ts?fmt(e.ts):'')}</div></div><span class="item-pill">Activity</span></div>`).join('');
  }
  function buildTasks(){
    const tasks=[]; allCandidateRows().forEach(r=>{
      if(!hasDocs?.(r.type,r.id)) tasks.push({priority:'High',title:`Upload documents - ${r.name}`,meta:`${r.position} • ${r.company}`,action:`openDocs('${r.type}',${JSON.stringify(r.id)},'${String(r.name||'').replace(/'/g,"\\'")}')`,icon:'ti-folder-up'});
      if(r.balance>0) tasks.push({priority:'High',title:`Follow up payment - ${r.name}`,meta:`Balance ${moneyKES(r.balance)}`,action:r.type==='pro'?`editPro(${r.id})`:`editLB(${r.id})`,icon:'ti-coin'});
      if(r.type==='pro' && r.stage==='PENDING TRAVEL') tasks.push({priority:'Medium',title:`Ticket pending - ${r.name}`,meta:`${r.company} • ${r.position}`,action:`editPro(${r.id})`,icon:'ti-plane-departure'});
      if(r.type==='pro' && r.stage==='PENDING VISA') tasks.push({priority:'Medium',title:`Visa follow-up - ${r.name}`,meta:`${r.company} • ${r.position}`,action:`editPro(${r.id})`,icon:'ti-id-badge-2'});
    }); return tasks;
  }
  function tasksHTML(limit){ const tasks=buildTasks().slice(0,limit||100); if(!tasks.length) return `<div class="empty-state">No urgent tasks. Your workspace is clean.</div>`; return tasks.map(t=>`<div class="task-item" onclick="${t.action}"><div class="task-icon"><i class="ti ${t.icon}"></i></div><div><div class="item-title">${safeText(t.title)}</div><div class="item-meta">${safeText(t.meta)}</div></div><span class="item-pill">${safeText(t.priority)}</span></div>`).join(''); }

  window.renderPipelinePage = function(){
    const el=document.getElementById('pipeline-section'); if(!el) return; const stages=['PENDING OFFER LETTER','PENDING MOL','PENDING VISA','PENDING TRAVEL','TRAVELLED'];
    el.innerHTML=`<div class="dreco-page"><div class="dreco-page-head"><div><h1>Pipeline</h1><p>Move candidates through offer, MOL, visa, ticketing, and travel.</p></div><div class="dreco-head-actions"><button class="dreco-btn" onclick="renderPipelinePage()"><i class="ti ti-refresh"></i>Refresh</button><button class="dreco-btn primary" onclick="openProForm()"><i class="ti ti-plus"></i>Add Candidate</button></div></div><div class="pipeline-board">${stages.map(stage=>pipeCol(stage,(proDB||[]).filter(r=>r.stage===stage))).join('')}</div></div>`;
  };
  function pipeCol(stage,items){ return `<div class="pipe-col"><div class="pipe-col-head"><strong>${safeText(stage.replace('PENDING ',''))}</strong><span class="pipe-count">${items.length}</span></div>${items.length?items.slice(0,50).map(r=>`<div class="pipe-card" onclick="editPro(${r.id})"><div class="pipe-card-name">${safeText(r.name)}</div><div class="pipe-card-meta">${safeText(r.position||'—')}<br>${safeText(r.company||'—')}</div><div class="pipe-card-foot"><span>${safeText(r.pp||'No PP')}</span><span>${r.commission?moneyKES(r.commission):''}</span></div></div>`).join(''):`<div class="empty-state">No candidates</div>`}</div>`; }

  window.renderCandidatesPage = function(){
    const el=document.getElementById('candidates-section'); if(!el) return; const rows=filterRows();
    el.innerHTML=`<div class="dreco-page"><div class="dreco-page-head"><div><h1>Candidates</h1><p>Unified candidate list from professional and general jobs.</p></div><div class="dreco-head-actions"><button class="dreco-btn" onclick="openLBForm()"><i class="ti ti-briefcase"></i>Add General</button><button class="dreco-btn primary" onclick="openProForm()"><i class="ti ti-plus"></i>Add Professional</button></div></div><div class="toolbar"><div class="toolbar-left"><input class="dreco-input" id="candidate-search" placeholder="Search candidates..." oninput="renderCandidatesPage()" value="${safeText(document.getElementById('candidate-search')?.value||'')}"><select class="dreco-select" id="candidate-type-filter" onchange="renderCandidatesPage()"><option value="">All jobs</option><option value="pro">Professional</option><option value="lb">General</option></select><select class="dreco-select" id="candidate-stage-filter" onchange="renderCandidatesPage()"><option value="">All stages</option>${[...new Set(allCandidateRows().map(r=>r.stage).filter(Boolean))].map(s=>`<option>${safeText(s)}</option>`).join('')}</select></div><div class="toolbar-right"><button class="dreco-btn" onclick="exportCSV('pro')"><i class="ti ti-download"></i>Export Pro</button><button class="dreco-btn" onclick="exportCSV('lb')"><i class="ti ti-download"></i>Export General</button></div></div>${candidateTable(rows)}</div>`;
    const type=document.getElementById('candidate-type-filter'); if(type) type.value=sessionStorage.getItem('dreco_candidate_type')||'';
    const stage=document.getElementById('candidate-stage-filter'); if(stage) stage.value=sessionStorage.getItem('dreco_candidate_stage')||'';
  };
  function filterRows(){
    const q=String(document.getElementById('candidate-search')?.value||'').toLowerCase();
    const type=String(document.getElementById('candidate-type-filter')?.value||sessionStorage.getItem('dreco_candidate_type')||'');
    const stage=String(document.getElementById('candidate-stage-filter')?.value||sessionStorage.getItem('dreco_candidate_stage')||'');
    sessionStorage.setItem('dreco_candidate_type',type); sessionStorage.setItem('dreco_candidate_stage',stage);
    return allCandidateRows().filter(r=>(!type||r.type===type)&&(!stage||r.stage===stage)&&(!q||[r.name,r.pp,r.phone,r.position,r.company,r.country,r.stage].join(' ').toLowerCase().includes(q)));
  }
  function candidateTable(rows){ return `<div class="table-card"><div class="dreco-table-wrap"><table class="dreco-table"><thead><tr><th>Name</th><th>Job Title</th><th>Company</th><th>Stage</th><th>Submitted/Travel</th><th>Balance</th><th>Owner</th><th>Actions</th></tr></thead><tbody>${rows.map(r=>`<tr><td><div class="name-cell">${candidateAvatar(r.name)}<div><div class="item-title">${safeText(r.name)}</div><div class="item-meta">${safeText(r.pp||'No passport')}</div></div></div></td><td>${safeText(r.position)}</td><td>${safeText(r.company)}</td><td>${stageBadge(r.stage)}</td><td>${safeText(fmt(r.submitted))}</td><td>${r.balance?moneyKES(r.balance):'<span class="stage-badge green">Clear</span>'}</td><td>${safeText(r.owner)}</td><td><button class="action-mini" onclick="${r.type==='pro'?`editPro(${r.id})`:`editLB(${r.id})`}"><i class="ti ti-edit"></i>Edit</button> <button class="action-mini" onclick="openDocs('${r.type}',${JSON.stringify(r.id)},'${safeText(String(r.name).replace(/'/g,"\\'"))}')"><i class="ti ti-paperclip"></i>Docs</button></td></tr>`).join('') || `<tr><td colspan="8"><div class="empty-state">No candidates found.</div></td></tr>`}</tbody></table></div></div>`; }

  window.renderTasksPage = function(){ const el=document.getElementById('tasks-section'); if(!el) return; const tasks=buildTasks(); el.innerHTML=`<div class="dreco-page"><div class="dreco-page-head"><div><h1>Tasks</h1><p>Priority queue generated from missing documents, unpaid balances, and pending workflow stages.</p></div><div class="dreco-head-actions"><button class="dreco-btn primary" onclick="switchTab('candidates')"><i class="ti ti-users"></i>Open Candidates</button></div></div><div class="dreco-grid dreco-kpis">${kpi('Open Tasks',tasks.length,'Needs attention','ti-checkbox','')}${kpi('High Priority',tasks.filter(t=>t.priority==='High').length,'Payment/docs','ti-alert-triangle','')}${kpi('Medium Priority',tasks.filter(t=>t.priority==='Medium').length,'Stage follow up','ti-clock','')}${kpi('Missing Docs',allCandidateRows().filter(r=>!hasDocs?.(r.type,r.id)).length,'Compliance','ti-folder-x','')}${kpi('Unpaid',allCandidateRows().filter(r=>r.balance>0).length,'Finance','ti-coin','')}</div><div class="dreco-card pad"><div class="dreco-card-title">Task Queue <span>${tasks.length} items</span></div><div class="task-list">${tasksHTML(200)}</div></div></div>`; };

  window.renderFinancePage = function(){ const el=document.getElementById('finance-section'); if(!el) return; const rows=allCandidateRows(); const total=rows.reduce((s,r)=>s+r.commission,0), paid=rows.reduce((s,r)=>s+r.paid,0), bal=rows.reduce((s,r)=>s+r.balance,0); el.innerHTML=`<div class="dreco-page"><div class="dreco-page-head"><div><h1>Finance</h1><p>Track commissions, repayments, outstanding balances, and cash flow.</p></div><div class="dreco-head-actions"><button class="dreco-btn" onclick="exportCSV('pro')"><i class="ti ti-download"></i>Export</button><button class="dreco-btn primary" onclick="openProForm()"><i class="ti ti-plus"></i>New Invoice Source</button></div></div><div class="dreco-grid finance-grid">${kpi('Total Invoiced',moneyKES(total),'All candidates','ti-receipt','')}${kpi('Total Paid',moneyKES(paid),'Collected','ti-wallet','')}${kpi('Outstanding',moneyKES(bal),'Follow up','ti-alert-circle','')}${kpi('Collection Rate', total?Math.round(paid/total*100)+'%':'0%','Paid / invoiced','ti-chart-line','')}</div><div class="dreco-grid dash-two"><div class="dreco-card pad"><div class="dreco-card-title">Cash Flow <span>Visual estimate</span></div><div class="finance-chart">${[20,44,35,52,48,60,72].map(h=>`<div class="bar" style="height:${h}%"></div>`).join('')}</div></div><div class="dreco-card pad"><div class="dreco-card-title">Outstanding by Age <span>${moneyKES(bal)}</span></div><div class="task-list">${rows.filter(r=>r.balance>0).slice(0,7).map(r=>`<div class="task-item" onclick="${r.type==='pro'?`editPro(${r.id})`:`editLB(${r.id})`}"><div class="task-icon"><i class="ti ti-coin"></i></div><div><div class="item-title">${safeText(r.name)}</div><div class="item-meta">${safeText(r.company)} • ${moneyKES(r.balance)}</div></div><span class="item-pill">Unpaid</span></div>`).join('') || '<div class="empty-state">No outstanding balances.</div>'}</div></div></div><div style="margin-top:14px">${financeTable(rows)}</div></div>`; };
  function financeTable(rows){ return `<div class="table-card"><div class="dreco-table-wrap"><table class="dreco-table"><thead><tr><th>Candidate</th><th>Company</th><th>Type</th><th>Invoice</th><th>Paid</th><th>Balance</th><th>Status</th><th>Action</th></tr></thead><tbody>${rows.map(r=>`<tr><td><div class="name-cell">${candidateAvatar(r.name)}<div><div class="item-title">${safeText(r.name)}</div><div class="item-meta">${safeText(r.pp||'No passport')}</div></div></div></td><td>${safeText(r.company)}</td><td>${r.type==='pro'?'Professional':'General'}</td><td>${moneyKES(r.commission)}</td><td>${moneyKES(r.paid)}</td><td>${moneyKES(r.balance)}</td><td>${r.balance>0?'<span class="stage-badge red">Unpaid</span>':'<span class="stage-badge green">Paid</span>'}</td><td><button class="action-mini" onclick="${r.type==='pro'?`editPro(${r.id})`:`editLB(${r.id})`}">Open</button></td></tr>`).join('')}</tbody></table></div></div>`; }

  window.renderDocumentsPage = function(){ const el=document.getElementById('documents-section'); if(!el) return; const rows=allCandidateRows(); const attached=rows.filter(r=>hasDocs?.(r.type,r.id)).length; el.innerHTML=`<div class="dreco-page"><div class="dreco-page-head"><div><h1>Documents</h1><p>Manage candidate document links and compliance readiness.</p></div><div class="dreco-head-actions"><button class="dreco-btn primary" onclick="switchTab('candidates')"><i class="ti ti-upload"></i>Attach to Candidate</button></div></div><div class="dreco-grid dreco-kpis">${kpi('All Documents',attached,'Candidates with links','ti-folder-check','')}${kpi('Missing',rows.length-attached,'Needs upload','ti-folder-x','')}${kpi('Passports',(proDB||[]).filter(r=>r.pp).length,'Recorded passport numbers','ti-id','')}${kpi('Visas',(proDB||[]).filter(r=>r.visa).length,'Visa dates recorded','ti-id-badge-2','')}${kpi('Tickets',(proDB||[]).filter(r=>r.travel).length,'Travel dates recorded','ti-plane','')}</div><div class="table-card"><div class="dreco-table-wrap"><table class="dreco-table"><thead><tr><th>Candidate</th><th>Category</th><th>Company</th><th>Passport</th><th>Status</th><th>Link</th><th>Action</th></tr></thead><tbody>${rows.map(r=>{const link=allDocs?.[`${r.type}_${r.id}`]||'';return `<tr><td><div class="name-cell">${candidateAvatar(r.name)}<div><div class="item-title">${safeText(r.name)}</div><div class="item-meta">${r.type==='pro'?'Professional':'General'}</div></div></div></td><td>${safeText(r.position)}</td><td>${safeText(r.company)}</td><td>${safeText(r.pp||'—')}</td><td>${link?'<span class="stage-badge green">Uploaded</span>':'<span class="stage-badge red">Missing</span>'}</td><td>${link?`<button class="action-mini" onclick="window.open('${safeText(link)}','_blank')"><i class="ti ti-external-link"></i>Open</button>`:'—'}</td><td><button class="action-mini" onclick="openDocs('${r.type}',${JSON.stringify(r.id)},'${safeText(String(r.name).replace(/'/g,"\\'"))}')"><i class="ti ti-paperclip"></i>Manage</button></td></tr>`}).join('')}</tbody></table></div></div></div>`; };

  window.renderReportsPage = function(){ const el=document.getElementById('reports-section'); if(!el) return; const rows=allCandidateRows(); const stageCounts={}; rows.forEach(r=>stageCounts[r.stage]=(stageCounts[r.stage]||0)+1); el.innerHTML=`<div class="dreco-page"><div class="dreco-page-head"><div><h1>Reports</h1><p>Performance overview for candidates, clients, stages, and collections.</p></div><div class="dreco-head-actions"><button class="dreco-btn" onclick="exportCSV('pro')"><i class="ti ti-download"></i>Export Professional</button><button class="dreco-btn" onclick="exportCSV('lb')"><i class="ti ti-download"></i>Export General</button></div></div><div class="dreco-grid dreco-kpis">${kpi('Total Candidates',rows.length,'All records','ti-users','')}${kpi('Traveling This Month',(proDB||[]).filter(r=>r.travel).length,'With travel dates','ti-plane','')}${kpi('Success Rate',rows.length?Math.round(rows.filter(r=>String(r.stage).toUpperCase()==='TRAVELLED').length/rows.length*100)+'%':'0%','Travelled / total','ti-target','')}${kpi('Avg Processing','45 days','Estimate','ti-clock','')}${kpi('Clients',clientRows().length,'Companies','ti-building','')}</div><div class="dreco-grid dash-two"><div class="dreco-card pad"><div class="dreco-card-title">Candidates by Stage</div><div class="task-list">${Object.entries(stageCounts).map(([s,c])=>`<div class="task-item"><div class="task-icon"><i class="ti ti-chart-pie"></i></div><div><div class="item-title">${safeText(s)}</div><div class="item-meta">${c} candidates</div></div><span class="item-pill">${Math.round(c/Math.max(rows.length,1)*100)}%</span></div>`).join('')}</div></div><div class="dreco-card pad"><div class="dreco-card-title">Top Companies</div><div class="task-list">${clientRows().slice(0,7).map(c=>`<div class="task-item"><div class="task-icon"><i class="ti ti-building"></i></div><div><div class="item-title">${safeText(c.name)}</div><div class="item-meta">${c.total} candidates • ${moneyKES(c.due)} due</div></div><span class="item-pill">${c.country}</span></div>`).join('') || '<div class="empty-state">No companies yet.</div>'}</div></div></div></div>`; };

  function clientRows(){ const map=new Map(); (proDB||[]).forEach(r=>{ const name=r.company||'Unassigned'; const c=map.get(name)||{name,country:r.country||'—',active:0,total:0,due:0,manager:currentUser?.display||'Team'}; c.total++; if(r.stage!=='TRAVELLED') c.active++; c.due+=balancePro(r); map.set(name,c); }); return [...map.values()].sort((a,b)=>b.total-a.total); }
  window.renderClientsPage = function(){ const el=document.getElementById('clients-section'); if(!el) return; const clients=clientRows(); el.innerHTML=`<div class="dreco-page"><div class="dreco-page-head"><div><h1>Clients</h1><p>Companies connected to candidate placements and financial tracking.</p></div><div class="dreco-head-actions"><button class="dreco-btn primary" onclick="openProForm()"><i class="ti ti-plus"></i>Add Candidate for Client</button></div></div><div class="table-card"><div class="dreco-table-wrap"><table class="dreco-table"><thead><tr><th>Client Name</th><th>Country</th><th>Active Jobs</th><th>Total Hired</th><th>Due Amount</th><th>Relationship Manager</th><th>Action</th></tr></thead><tbody>${clients.map(c=>`<tr><td><div class="name-cell"><div class="avatar-mini"><i class="ti ti-building"></i></div><div><div class="item-title">${safeText(c.name)}</div><div class="item-meta">Client account</div></div></div></td><td>${safeText(c.country)}</td><td>${c.active}</td><td>${c.total}</td><td>${moneyKES(c.due)}</td><td>${safeText(c.manager)}</td><td><button class="action-mini" onclick="switchTab('candidates'); setTimeout(()=>{const q=document.getElementById('candidate-search'); if(q){q.value='${safeText(c.name)}'; renderCandidatesPage();}},30)">View</button></td></tr>`).join('') || '<tr><td colspan="7"><div class="empty-state">Clients appear automatically from candidate company names.</div></td></tr>'}</tbody></table></div></div></div>`; };

  function polishSettingsPage(){ const sec=document.getElementById('settings-section'); if(!sec || sec.dataset.polished) return; sec.classList.add('settings-clean'); sec.dataset.polished='1'; }

  const originalLoadAllData = window.loadAllData || (typeof loadAllData !== 'undefined' ? loadAllData : null);
  window.addEventListener('DOMContentLoaded', ()=>setTimeout(setupRefreshShell,0));
})();

// =========================================================
// DRECO FULL OPERATIONS UI V2
// Functional inner app refresh. Login screen and logo are not touched.
// Uses existing proDB, lbDB, Supabase save functions, modals, docs, timelines.
// =========================================================
(function(){
  const TABS = ['dash','pipeline','candidates','tasks','finance','documents','reports','clients','settings'];
  const ALIASES = {pro:'candidates',lb:'candidates',kanban:'pipeline',travel:'pipeline',calendar:'tasks',commissions:'finance',repayments:'finance',expenses:'finance',team:'settings',help:'settings'};
  const TITLES = {dash:'Home',pipeline:'Pipeline',candidates:'Candidates',tasks:'Tasks',finance:'Finance',documents:'Documents',reports:'Reports',clients:'Clients',settings:'Settings'};
  const ICONS = {dash:'ti-home',pipeline:'ti-route',candidates:'ti-users',tasks:'ti-checkbox',finance:'ti-coin',documents:'ti-file-description',reports:'ti-chart-bar',clients:'ti-building-skyscraper',settings:'ti-settings'};
  const PRO_FLOW = ['PENDING OFFER LETTER','PENDING MOL','PENDING VISA','PENDING TRAVEL','TRAVELLED'];
  let activeCandidateFilter = 'all';
  let activeCandidateSearch = '';
  let activePipelineSource = 'pro';

  const $ = (s,root=document)=>root.querySelector(s);
  const $$ = (s,root=document)=>Array.from(root.querySelectorAll(s));
  const html = (v='')=>String(v ?? '').replace(/[&<>"']/g, m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[m]));
  const jsStr = (v='')=>String(v ?? '').replace(/\\/g,'\\\\').replace(/'/g,"\\'").replace(/\n/g,' ');
  const initials = (name='DR')=>String(name||'DR').trim().split(/\s+/).filter(Boolean).map(x=>x[0]).join('').slice(0,2).toUpperCase() || 'DR';
  const money = n=>'KES ' + (Number(n)||0).toLocaleString();
  const date = v=>(typeof fmtDate==='function'?fmtDate(v):(v||'—'));
  const company = ()=>(typeof getCompanyName==='function'?getCompanyName():'Destiny Recruit Consults');
  const firstName = ()=>String(currentUser?.display || 'John').split(' ')[0] || 'John';
  const docsKey = r=>`${r.type}_${r.id}`;
  const docsLink = r=>allDocs?.[docsKey(r)] || '';
  const hasDocument = r=>!!String(docsLink(r)||'').trim();
  const proBal = r=>(typeof proBalance==='function'?proBalance(r):Math.max((Number(r.commission)||0)-(Number(r.paid)||0),0));
  const lbPaid = r=>(Number(r.r1Amt||r.r1_amt)||0)+(Number(r.r2Amt||r.r2_amt)||0);
  const lbDue = r=>Math.max((Number(r.toRefund||r.to_refund)||0)-lbPaid(r),0);
  const avatar = name=>`<div class="avatar-mini">${html(initials(name))}</div>`;
  const stageClass = stage=>{ const s=String(stage||'').toLowerCase(); if(s.includes('travelled')&&!s.includes('not')) return 'green'; if(s.includes('visa')) return 'blue'; if(s.includes('mol')) return 'orange'; if(s.includes('offer')) return 'purple'; if(s.includes('not')) return 'red'; return ''; };
  const badge = stage=>`<span class="stage-badge ${stageClass(stage)}">${html(stage || 'Not set')}</span>`;

  function rows(){
    const pro=(Array.isArray(proDB)?proDB:[]).map(r=>({type:'pro',id:r.id,name:r.name,pp:r.pp||'',phone:r.phone||'',position:r.position||'—',company:r.company||'—',country:r.country||'—',stage:r.stage||'—',submitted:r.submitted,owner:currentUser?.display||'Team',commission:Number(r.commission)||0,paid:Number(r.paid)||0,balance:proBal(r),raw:r}));
    const lb=(Array.isArray(lbDB)?lbDB:[]).map(r=>({type:'lb',id:r.id,name:r.name,pp:r.pp||r.passport||'',phone:r.phone||'',position:'General Job',company:r.company||r.country||'General Jobs',country:r.country||r.destination||'—',stage:r.travelStatus||r.travel_status||'NOT YET',submitted:r.travelDate||r.travel_date,owner:currentUser?.display||'Team',commission:Number(r.toRefund||r.to_refund)||0,paid:lbPaid(r),balance:lbDue(r),raw:r}));
    return [...pro,...lb];
  }
  function kpi(label,value,note,icon='ti-chart-bar',action=''){
    return `<div class="dreco-kpi" ${action?`onclick="${action}"`:''}><div class="dreco-kpi-icon"><i class="ti ${icon}"></i></div><div class="dreco-kpi-label">${html(label)}</div><div class="dreco-kpi-value">${html(value)}</div><div class="dreco-kpi-note">${html(note||'')}</div></div>`;
  }
  function setActive(tab){
    $$('#app .nav-item,.bottom-nav-item').forEach(n=>n.classList.remove('active'));
    $(`#nav-${tab}`)?.classList.add('active'); $(`#bnav-${tab}`)?.classList.add('active');
    const title=$('#topbar-title'); if(title) title.textContent=TITLES[tab]||'Dreco';
  }
  function ensureShell(){
    const app=$('#app'); if(!app) return;
    const side=$('#sidebar');
    if(side && !side.dataset.fullV2){
      side.innerHTML = `<div class="sidebar-top"><a class="sidebar-logo" onclick="switchTab('dash')"><div class="sidebar-logo-mark"><svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M3 6C3 4.343 4.343 3 6 3h4c1.657 0 3 1.343 3 3v4c0 1.657-1.343 3-3 3H6c-1.657 0-3-1.343-3-3V6Z"/><path d="M14 14c0-1.105.895-2 2-2h4c1.105 0 2 .895 2 2v6c0 1.105-.895 2-2 2h-4c-1.105 0-2-.895-2-2v-6Z" opacity=".55"/><path d="M3 17c0-1.105.895-2 2-2h3c1.105 0 2 .895 2 2v2c0 1.105-.895 2-2 2H5c-1.105 0-2-.895-2-2v-2Z" opacity=".32"/></svg></div><span class="sidebar-logo-text">DRECO</span></a><button class="sidebar-toggle" onclick="toggleSidebar()" type="button"><i class="ti ti-chevrons-left"></i></button></div><button class="sidebar-user-card sidebar-account-trigger" onclick="toggleProfileDropdown(event)" type="button"><div class="suc-avatar" id="suc-avatar">${html(initials(currentUser?.display))}</div><div class="suc-info"><div class="suc-name" id="suc-name">${html(currentUser?.display||'User')}</div><div class="suc-org">${html(company())}</div></div></button><div class="sidebar-divider"></div><div class="nav-section-label">Workspace</div>${['dash','pipeline','candidates','tasks'].map(nav).join('')}<div class="nav-section-label">Operations</div>${['finance','documents','reports','clients'].map(nav).join('')}<div class="nav-section-label">System</div>${nav('settings')}<div class="nav-spacer"></div>`;
      side.dataset.fullV2='1';
    }
    const bottom=$('#bottom-nav'); if(bottom && !bottom.dataset.fullV2){ bottom.innerHTML=TABS.map(t=>`<button class="bottom-nav-item" id="bnav-${t}" onclick="switchTab('${t}')"><i class="ti ${ICONS[t]}"></i><span>${TITLES[t]}</span></button>`).join(''); bottom.dataset.fullV2='1'; }
    const content=$('.content-area'); if(content){ TABS.forEach(t=>{ if(!$(`#${t}-section`)){ const d=document.createElement('div'); d.id=`${t}-section`; d.style.display='none'; content.appendChild(d); } }); }
    wireGlobalSearch();
  }
  function nav(t){ return `<a class="nav-item" id="nav-${t}" data-title="${TITLES[t]}" onclick="switchTab('${t}')"><i class="ti ${ICONS[t]}"></i><span class="nav-item-label">${TITLES[t]}</span></a>`; }

  window.switchTab = function(tab){
    ensureShell(); tab=ALIASES[tab]||tab||'dash';
    TABS.concat(Object.keys(ALIASES)).forEach(t=>{ const sec=$(`#${t}-section`); if(sec) sec.style.display='none'; });
    const sec=$(`#${tab}-section`); if(sec) sec.style.display='';
    setActive(tab);
    if(typeof closeProfileDropdown==='function') closeProfileDropdown();
    ({dash:renderDash,pipeline:renderPipelinePage,candidates:renderCandidatesPage,tasks:renderTasksPage,finance:renderFinancePage,documents:renderDocumentsPage,reports:renderReportsPage,clients:renderClientsPage,settings:renderSettingsPageV2}[tab]||renderDash)();
  };

  window.renderDash = function(){
    const el=$('#dash-section'); if(!el) return; const r=rows();
    const awaitingMol=(proDB||[]).filter(x=>x.stage==='PENDING MOL').length;
    const visaReady=(proDB||[]).filter(x=>x.stage==='PENDING VISA').length;
    const unpaid=r.filter(x=>x.balance>0).length;
    const tickets=(proDB||[]).filter(x=>x.stage==='PENDING TRAVEL').length;
    const compliance=r.filter(x=>!hasDocument(x)).length;
    const recent=r.slice().sort((a,b)=>(b.id||0)-(a.id||0)).slice(0,6);
    el.innerHTML=`<div class="dreco-page"><div class="dreco-page-head"><div><h1>Good morning, ${html(firstName())} 👋</h1><p>Here’s what needs your attention today.</p></div><div class="dreco-head-actions"><button class="dreco-btn" onclick="openCommandPalette()"><i class="ti ti-command"></i>Command Search</button><button class="dreco-btn primary" onclick="openProForm()"><i class="ti ti-plus"></i>New Candidate</button></div></div><div class="priority-grid"><div class="priority-card" onclick="switchTab('pipeline')"><div class="priority-icon orange"><i class="ti ti-file-check"></i></div><strong>${awaitingMol}</strong><span>Awaiting MOL</span><small>High priority</small></div><div class="priority-card" onclick="setCandidateFilter('visa')"><div class="priority-icon blue"><i class="ti ti-id-badge-2"></i></div><strong>${visaReady}</strong><span>Visas Ready</span><small>Ready to travel</small></div><div class="priority-card" onclick="switchTab('finance')"><div class="priority-icon green"><i class="ti ti-coin"></i></div><strong>${unpaid}</strong><span>Unpaid Commissions</span><small>${money(r.reduce((s,x)=>s+x.balance,0))}</small></div><div class="priority-card" onclick="setCandidateFilter('ticket')"><div class="priority-icon purple"><i class="ti ti-plane"></i></div><strong>${tickets}</strong><span>Tickets Pending</span><small>Awaiting issue</small></div><div class="priority-card" onclick="switchTab('documents')"><div class="priority-icon red"><i class="ti ti-alert-circle"></i></div><strong>${compliance}</strong><span>Compliance Issue</span><small>Action required</small></div></div><div class="dreco-card pad"><div class="dreco-card-title">Pipeline Overview <button class="inline-link" onclick="switchTab('pipeline')">View pipeline →</button></div><div class="pipeline-flow">${PRO_FLOW.map(s=>`<div class="flow-step" onclick="openPipelineStage('${jsStr(s)}')"><span>${html(s.replace('PENDING ',''))}</span><strong>${(proDB||[]).filter(x=>x.stage===s).length}</strong></div>`).join('')}</div></div><div class="dreco-grid dash-two"><div class="dreco-card pad"><div class="dreco-card-title">Recent Activity <button class="inline-link" onclick="switchTab('candidates')">View all →</button></div><div class="activity-list">${recent.map(x=>`<div class="activity-item" onclick="openCandidateProfile('${x.type}',${x.id})"><div class="activity-icon"><i class="ti ti-user-check"></i></div><div><div class="item-title">${html(x.name)} moved to ${html(x.stage)}</div><div class="item-meta">${html(x.company)} • ${html(date(x.submitted))}</div></div>${badge(x.stage)}</div>`).join('') || '<div class="empty-state">No recent activity yet.</div>'}</div></div><div class="dreco-card pad"><div class="dreco-card-title">Upcoming Reminders <button class="inline-link" onclick="switchTab('tasks')">View tasks →</button></div><div class="task-list">${taskRows().slice(0,6).map(taskHtml).join('') || '<div class="empty-state">No open tasks.</div>'}</div></div></div></div>`;
  };

  window.renderPipelinePage = function(){
    const el=$('#pipeline-section'); if(!el) return; const src=activePipelineSource;
    const sourceRows = src==='pro' ? rows().filter(x=>x.type==='pro') : rows().filter(x=>x.type==='lb');
    const stages = src==='pro' ? PRO_FLOW : ['NOT YET','TRAVELLED','NOT TRAVELLED'];
    el.innerHTML=`<div class="dreco-page"><div class="dreco-page-head"><div><h1>Pipeline</h1><p>Move candidates through offer, MOL, visa, ticketing, and travel.</p></div><div class="dreco-head-actions"><button class="dreco-btn ${src==='pro'?'primary':''}" onclick="setPipelineSource('pro')">Professional</button><button class="dreco-btn ${src==='lb'?'primary':''}" onclick="setPipelineSource('lb')">General</button><button class="dreco-btn primary" onclick="${src==='pro'?'openProForm()':'openLBForm()'}"><i class="ti ti-plus"></i>Add Candidate</button></div></div><div class="pipeline-board v2">${stages.map(stage=>pipelineColumn(stage, sourceRows.filter(x=>x.stage===stage))).join('')}</div></div>`;
  };
  function pipelineColumn(stage,list){ return `<div class="pipe-col"><div class="pipe-head"><span>${html(stage.replace('PENDING ',''))}</span><strong>${list.length}</strong></div><div class="pipe-list">${list.slice(0,24).map(x=>`<div class="pipe-card" onclick="openCandidateProfile('${x.type}',${x.id})">${avatar(x.name)}<div><div class="item-title">${html(x.name)}</div><div class="item-meta">${html(x.position)} • ${html(x.company)}</div><div class="pipe-actions"><button onclick="event.stopPropagation();${x.type==='pro'?`editPro(${x.id})`:`editLB(${x.id})`}">Edit</button>${x.type==='pro'?`<button onclick="event.stopPropagation();advanceCandidate(${x.id})">Advance</button>`:''}</div></div></div>`).join('') || '<div class="empty-state small">No candidates</div>'}</div></div>`; }
  window.setPipelineSource = function(src){ activePipelineSource=src; renderPipelinePage(); };
  window.openPipelineStage = function(stage){ activePipelineSource='pro'; switchTab('pipeline'); };
  window.advanceCandidate = async function(id){ const rec=(proDB||[]).find(x=>x.id==id); if(!rec) return; const i=PRO_FLOW.indexOf(rec.stage); if(i<0 || i>=PRO_FLOW.length-1){ showToast?.('Candidate is already at final stage.'); return; } const oldEdit=editingProId; editingProId=id; rec.stage=PRO_FLOW[i+1]; rec[stageDateField(rec.stage)] = rec[stageDateField(rec.stage)] || new Date().toISOString().slice(0,10); addTimeline?.('pro',id,`Stage advanced to ${rec.stage}`); await saveProRecord(rec); editingProId=oldEdit; renderPipelinePage(); showToast?.('Candidate advanced.'); };
  function stageDateField(stage){ if(stage.includes('MOL')) return 'mol'; if(stage.includes('VISA')) return 'visa'; if(stage.includes('TRAVEL')) return 'travel'; return 'ol'; }

  window.setCandidateFilter = function(f){ activeCandidateFilter=f||'all'; switchTab('candidates'); };
  window.setCandidateSearch = function(q){ activeCandidateSearch=q||''; renderCandidatesPage(); };
  window.renderCandidatesPage = function(){
    const el=$('#candidates-section'); if(!el) return; const all=rows(); let list=all;
    const q=(activeCandidateSearch || '').toLowerCase().trim(); if(q) list=list.filter(x=>[x.name,x.pp,x.company,x.position,x.stage,x.phone].some(v=>String(v||'').toLowerCase().includes(q)));
    if(activeCandidateFilter==='my') list=list.filter(x=>x.owner===currentUser?.display);
    if(activeCandidateFilter==='follow') list=list.filter(x=>x.balance>0 || !hasDocument(x));
    if(activeCandidateFilter==='short') list=list.filter(x=>String(x.stage).includes('OFFER') || String(x.stage).includes('MOL'));
    if(activeCandidateFilter==='visa') list=list.filter(x=>String(x.stage).includes('VISA'));
    if(activeCandidateFilter==='ticket') list=list.filter(x=>String(x.stage).includes('TRAVEL'));
    el.innerHTML=`<div class="dreco-page"><div class="dreco-page-head"><div><h1>Candidates</h1><p>Search, open profiles, edit records, manage documents, and track payments.</p></div><div class="dreco-head-actions"><button class="dreco-btn" onclick="exportCSV('pro')"><i class="ti ti-download"></i>Export</button><button class="dreco-btn primary" onclick="openProForm()"><i class="ti ti-plus"></i>Add Candidate</button></div></div><div class="toolbar"><div class="toolbar-left"><input class="dreco-input" id="candidate-search" placeholder="Search candidates, passport, company..." value="${html(activeCandidateSearch)}" oninput="setCandidateSearch(this.value)"><select class="dreco-select" onchange="setCandidateFilter(this.value)"><option value="all">All Candidates</option><option value="my">My Candidates</option><option value="follow">Follow Ups</option><option value="short">Shortlisted</option><option value="visa">Visa Stage</option><option value="ticket">Ticketing</option></select></div><div class="toolbar-right"><span class="muted">Showing ${list.length} of ${all.length}</span></div></div><div class="table-card"><div class="dreco-table-wrap"><table class="dreco-table"><thead><tr><th>Name</th><th>Job Title</th><th>Company</th><th>Stage</th><th>Submitted</th><th>Next Action</th><th>Owner</th><th></th></tr></thead><tbody>${list.map(candidateRow).join('') || '<tr><td colspan="8"><div class="empty-state">No candidates found.</div></td></tr>'}</tbody></table></div></div></div>`;
    const s=$('#candidates-section select'); if(s) s.value=activeCandidateFilter;
  };
  function candidateRow(x){ return `<tr onclick="openCandidateProfile('${x.type}',${x.id})"><td><div class="name-cell">${avatar(x.name)}<div><div class="item-title">${html(x.name)}</div><div class="item-meta">${html(x.pp||'No passport')} • ${html(x.phone||'No phone')}</div></div></div></td><td>${html(x.position)}</td><td>${html(x.company)}</td><td>${badge(x.stage)}</td><td>${html(date(x.submitted))}</td><td>${nextAction(x)}</td><td>${html(x.owner)}</td><td><button class="action-mini" onclick="event.stopPropagation();${x.type==='pro'?`editPro(${x.id})`:`editLB(${x.id})`}">Edit</button></td></tr>`; }
  function nextAction(x){ if(!hasDocument(x)) return 'Upload documents'; if(x.balance>0) return 'Collect commission'; if(String(x.stage).includes('MOL')) return 'MOL submission'; if(String(x.stage).includes('VISA')) return 'Visa stamping'; if(String(x.stage).includes('TRAVEL')) return 'Book ticket'; return 'Post-arrival follow up'; }

  function taskRows(){ const out=[]; rows().forEach(x=>{ if(!hasDocument(x)) out.push({title:`Upload documents - ${x.name}`,meta:x.company,priority:'High',type:x.type,id:x.id,icon:'ti-folder-x'}); if(x.balance>0) out.push({title:`Pay commission - ${x.name}`,meta:`Balance ${money(x.balance)}`,priority:'High',type:x.type,id:x.id,icon:'ti-coin'}); if(String(x.stage).includes('MOL')) out.push({title:`Submit MOL for ${x.name}`,meta:x.company,priority:'Medium',type:x.type,id:x.id,icon:'ti-file-check'}); if(String(x.stage).includes('VISA')) out.push({title:`Visa follow up - ${x.name}`,meta:x.company,priority:'Medium',type:x.type,id:x.id,icon:'ti-id-badge-2'}); if(String(x.stage).includes('TRAVEL')) out.push({title:`Ticketing - ${x.name}`,meta:x.company,priority:'High',type:x.type,id:x.id,icon:'ti-plane'}); }); return out; }
  function taskHtml(t){ return `<div class="task-item" onclick="openCandidateProfile('${t.type}',${t.id})"><div class="task-icon"><i class="ti ${t.icon}"></i></div><div><div class="item-title">${html(t.title)}</div><div class="item-meta">${html(t.meta)}</div></div><span class="item-pill ${t.priority==='High'?'danger':''}">${t.priority}</span></div>`; }
  window.renderTasksPage = function(){ const el=$('#tasks-section'); if(!el) return; const tasks=taskRows(); el.innerHTML=`<div class="dreco-page"><div class="dreco-page-head"><div><h1>Tasks</h1><p>Auto-generated from candidate blockers, documents, finance, and stage movement.</p></div><div class="dreco-head-actions"><button class="dreco-btn primary" onclick="openCommandPalette()"><i class="ti ti-command"></i>Find Anything</button></div></div><div class="dreco-grid dreco-kpis">${kpi('Open Tasks',tasks.length,'Need attention','ti-checkbox')}${kpi('High Priority',tasks.filter(t=>t.priority==='High').length,'Urgent blockers','ti-alert-triangle')}${kpi('Missing Docs',rows().filter(x=>!hasDocument(x)).length,'Compliance','ti-folder-x')}${kpi('Unpaid',rows().filter(x=>x.balance>0).length,'Finance follow up','ti-coin')}${kpi('Ticketing',(proDB||[]).filter(x=>x.stage==='PENDING TRAVEL').length,'Travel desk','ti-plane')}</div><div class="dreco-card pad"><div class="dreco-card-title">Task Queue <span>${tasks.length} items</span></div><div class="task-list">${tasks.map(taskHtml).join('') || '<div class="empty-state">Everything is clear.</div>'}</div></div></div>`; };

  window.renderFinancePage = function(){ const el=$('#finance-section'); if(!el) return; const r=rows(); const total=r.reduce((s,x)=>s+x.commission,0), paid=r.reduce((s,x)=>s+x.paid,0), bal=r.reduce((s,x)=>s+x.balance,0); el.innerHTML=`<div class="dreco-page"><div class="dreco-page-head"><div><h1>Finance</h1><p>Track commissions, payments, balances, and reconciliation from real candidate data.</p></div><div class="dreco-head-actions"><button class="dreco-btn" onclick="exportCSV('pro')"><i class="ti ti-download"></i>Export</button><button class="dreco-btn primary" onclick="switchTab('candidates')"><i class="ti ti-users"></i>Open Candidates</button></div></div><div class="dreco-grid dreco-kpis">${kpi('Total Invoiced',money(total),'All records','ti-receipt')}${kpi('Total Paid',money(paid),'Collected','ti-wallet')}${kpi('Outstanding',money(bal),'Follow up','ti-alert-circle')}${kpi('Collection Rate',total?Math.round(paid/total*100)+'%':'0%','Paid / invoiced','ti-chart-line')}${kpi('Unpaid Accounts',r.filter(x=>x.balance>0).length,'Open balances','ti-user-dollar')}</div><div class="dreco-grid dash-two"><div class="dreco-card pad"><div class="dreco-card-title">Cash Flow</div><div class="finance-chart">${[40,55,35,64,48,72,60].map(h=>`<div class="bar" style="height:${h}%"></div>`).join('')}</div></div><div class="dreco-card pad"><div class="dreco-card-title">Outstanding by Candidate</div><div class="task-list">${r.filter(x=>x.balance>0).slice(0,8).map(x=>`<div class="task-item" onclick="openCandidateProfile('${x.type}',${x.id})"><div class="task-icon"><i class="ti ti-coin"></i></div><div><div class="item-title">${html(x.name)}</div><div class="item-meta">${html(x.company)} • ${money(x.balance)}</div></div><span class="item-pill danger">Unpaid</span></div>`).join('') || '<div class="empty-state">No outstanding balances.</div>'}</div></div></div><div style="margin-top:14px">${financeTable(r)}</div></div>`; };
  function financeTable(r){ return `<div class="table-card"><div class="dreco-table-wrap"><table class="dreco-table"><thead><tr><th>Candidate</th><th>Company</th><th>Invoice</th><th>Paid</th><th>Balance</th><th>Status</th><th></th></tr></thead><tbody>${r.map(x=>`<tr onclick="openCandidateProfile('${x.type}',${x.id})"><td><div class="name-cell">${avatar(x.name)}<div><div class="item-title">${html(x.name)}</div><div class="item-meta">${html(x.pp||'No passport')}</div></div></div></td><td>${html(x.company)}</td><td>${money(x.commission)}</td><td>${money(x.paid)}</td><td>${money(x.balance)}</td><td>${x.balance>0?'<span class="stage-badge red">Unpaid</span>':'<span class="stage-badge green">Paid</span>'}</td><td><button class="action-mini" onclick="event.stopPropagation();openCandidateProfile('${x.type}',${x.id})">Open</button></td></tr>`).join('')}</tbody></table></div></div>`; }

  window.renderDocumentsPage = function(){ const el=$('#documents-section'); if(!el) return; const r=rows(); el.innerHTML=`<div class="dreco-page"><div class="dreco-page-head"><div><h1>Documents</h1><p>Document links, passport records, visa/ticket dates, and compliance status.</p></div><div class="dreco-head-actions"><button class="dreco-btn primary" onclick="switchTab('candidates')"><i class="ti ti-paperclip"></i>Attach to Candidate</button></div></div><div class="dreco-grid dreco-kpis">${kpi('With Documents',r.filter(hasDocument).length,'Candidates with links','ti-folder-check')}${kpi('Missing',r.filter(x=>!hasDocument(x)).length,'Needs upload','ti-folder-x')}${kpi('Passports',r.filter(x=>x.pp).length,'Recorded','ti-id')}${kpi('Visas',(proDB||[]).filter(x=>x.visa).length,'Visa dates','ti-id-badge-2')}${kpi('Tickets',(proDB||[]).filter(x=>x.travel).length,'Travel dates','ti-plane')}</div><div class="table-card"><div class="dreco-table-wrap"><table class="dreco-table"><thead><tr><th>Candidate</th><th>Category</th><th>Company</th><th>Passport</th><th>Status</th><th>Link</th><th>Action</th></tr></thead><tbody>${r.map(x=>{ const link=docsLink(x); return `<tr onclick="openCandidateProfile('${x.type}',${x.id})"><td><div class="name-cell">${avatar(x.name)}<div><div class="item-title">${html(x.name)}</div><div class="item-meta">${x.type==='pro'?'Professional':'General'}</div></div></div></td><td>${html(x.position)}</td><td>${html(x.company)}</td><td>${html(x.pp||'—')}</td><td>${link?'<span class="stage-badge green">Uploaded</span>':'<span class="stage-badge red">Missing</span>'}</td><td>${link?`<button class="action-mini" onclick="event.stopPropagation();window.open('${html(link)}','_blank')">Open</button>`:'—'}</td><td><button class="action-mini" onclick="event.stopPropagation();openDocs('${x.type}',${JSON.stringify(x.id)},'${jsStr(x.name)}')">Manage</button></td></tr>`}).join('')}</tbody></table></div></div></div>`; };

  function clients(){ const map=new Map(); rows().filter(x=>x.type==='pro').forEach(x=>{ const name=x.company||'Unassigned'; const c=map.get(name)||{name,country:x.country||'—',active:0,total:0,due:0,manager:currentUser?.display||'Team'}; c.total++; if(x.stage!=='TRAVELLED') c.active++; c.due+=x.balance; map.set(name,c); }); return [...map.values()].sort((a,b)=>b.total-a.total); }
  window.renderReportsPage = function(){ const el=$('#reports-section'); if(!el) return; const r=rows(); const stage={}; r.forEach(x=>stage[x.stage]=(stage[x.stage]||0)+1); el.innerHTML=`<div class="dreco-page"><div class="dreco-page-head"><div><h1>Reports</h1><p>Performance overview for candidates, stages, clients, and collections.</p></div><div class="dreco-head-actions"><button class="dreco-btn" onclick="exportCSV('pro')"><i class="ti ti-download"></i>Export Pro</button><button class="dreco-btn" onclick="exportCSV('lb')"><i class="ti ti-download"></i>Export General</button></div></div><div class="dreco-grid dreco-kpis">${kpi('Total Candidates',r.length,'All records','ti-users')}${kpi('Travelled',r.filter(x=>String(x.stage).toUpperCase()==='TRAVELLED').length,'Successful travel','ti-plane')}${kpi('Success Rate',r.length?Math.round(r.filter(x=>String(x.stage).toUpperCase()==='TRAVELLED').length/r.length*100)+'%':'0%','Travelled / total','ti-target')}${kpi('Collection Rate',r.reduce((s,x)=>s+x.commission,0)?Math.round(r.reduce((s,x)=>s+x.paid,0)/r.reduce((s,x)=>s+x.commission,0)*100)+'%':'0%','Finance health','ti-chart-line')}${kpi('Clients',clients().length,'Companies','ti-building')}</div><div class="dreco-grid dash-two"><div class="dreco-card pad"><div class="dreco-card-title">Candidates by Stage</div><div class="task-list">${Object.entries(stage).map(([s,c])=>`<div class="task-item"><div class="task-icon"><i class="ti ti-chart-pie"></i></div><div><div class="item-title">${html(s)}</div><div class="item-meta">${c} candidates</div></div><span class="item-pill">${Math.round(c/Math.max(r.length,1)*100)}%</span></div>`).join('')}</div></div><div class="dreco-card pad"><div class="dreco-card-title">Top Companies</div><div class="task-list">${clients().slice(0,8).map(c=>`<div class="task-item"><div class="task-icon"><i class="ti ti-building"></i></div><div><div class="item-title">${html(c.name)}</div><div class="item-meta">${c.total} candidates • ${money(c.due)} due</div></div><span class="item-pill">${html(c.country)}</span></div>`).join('') || '<div class="empty-state">No company data.</div>'}</div></div></div></div>`; };
  window.renderClientsPage = function(){ const el=$('#clients-section'); if(!el) return; const c=clients(); el.innerHTML=`<div class="dreco-page"><div class="dreco-page-head"><div><h1>Clients</h1><p>Client accounts generated from companies already attached to candidates.</p></div><div class="dreco-head-actions"><button class="dreco-btn primary" onclick="openProForm()"><i class="ti ti-plus"></i>Add Client Candidate</button></div></div><div class="table-card"><div class="dreco-table-wrap"><table class="dreco-table"><thead><tr><th>Client Name</th><th>Country</th><th>Active Jobs</th><th>Total Hired</th><th>Due Amount</th><th>Manager</th><th></th></tr></thead><tbody>${c.map(x=>`<tr><td><div class="name-cell"><div class="avatar-mini"><i class="ti ti-building"></i></div><div><div class="item-title">${html(x.name)}</div><div class="item-meta">Client account</div></div></div></td><td>${html(x.country)}</td><td>${x.active}</td><td>${x.total}</td><td>${money(x.due)}</td><td>${html(x.manager)}</td><td><button class="action-mini" onclick="setCandidateSearch('${jsStr(x.name)}');switchTab('candidates')">View</button></td></tr>`).join('') || '<tr><td colspan="7"><div class="empty-state">Clients appear after company names are added to candidates.</div></td></tr>'}</tbody></table></div></div></div>`; };
  window.renderSettingsPageV2 = function(){ if(typeof renderSettingsPage==='function') renderSettingsPage(); const el=$('#settings-section'); if(!el) return; el.classList.add('dreco-settings-v2'); };

  window.openCandidateProfile = function(type,id){ const r=rows().find(x=>x.type===type && String(x.id)===String(id)); if(!r) return; ensureProfileShell(); const modal=$('#candidate-profile-modal'); const link=docsLink(r); const timeline=(allTimelines?.[`${type}_${id}`]||[]).slice(-5).reverse(); const steps=(type==='pro'?['Submitted','Interview','Offer','MOL','Visa','Ticket','Travelled','Onboarded']:['Registered','Documents','Payment','Travelled']).map((s,i)=>`<div class="cp-step ${i<profileStepIndex(r)?'done':i===profileStepIndex(r)?'active':''}"><span>${i+1}</span><small>${s}</small></div>`).join(''); modal.innerHTML=`<div class="cp-panel"><div class="cp-head"><button class="action-mini" onclick="closeCandidateProfile()"><i class="ti ti-x"></i></button><div class="cp-id">${r.type==='pro'?'Professional':'General'} Candidate</div><div class="cp-actions"><button class="dreco-btn" onclick="${r.type==='pro'?`editPro(${r.id})`:`editLB(${r.id})`}"><i class="ti ti-edit"></i>Edit</button><button class="dreco-btn primary" onclick="openDocs('${r.type}',${JSON.stringify(r.id)},'${jsStr(r.name)}')"><i class="ti ti-paperclip"></i>Documents</button></div></div><div class="cp-profile"><div class="cp-avatar">${html(initials(r.name))}</div><div><h2>${html(r.name)}</h2><p>${html(r.position)} • ${html(r.company)}</p><div class="cp-meta"><span><i class="ti ti-map-pin"></i>${html(r.country||'—')}</span><span><i class="ti ti-id"></i>${html(r.pp||'No passport')}</span><span><i class="ti ti-phone"></i>${html(r.phone||'No phone')}</span></div></div><div class="cp-stage">${badge(r.stage)}<small>Next: ${html(nextAction(r))}</small></div></div><div class="cp-steps">${steps}</div><div class="cp-grid"><div class="dreco-card pad"><div class="dreco-card-title">Stage Checklist <span>${checklistPercent(r)}%</span></div>${checklist(r).map(x=>`<div class="check-row"><i class="ti ${x.done?'ti-circle-check-filled':'ti-circle'}"></i><span>${html(x.label)}</span></div>`).join('')}</div><div class="dreco-card pad"><div class="dreco-card-title">Details</div><div class="detail-grid"><span>Submitted</span><strong>${html(date(r.submitted))}</strong><span>Stage</span><strong>${html(r.stage)}</strong><span>Owner</span><strong>${html(r.owner)}</strong><span>Company</span><strong>${html(r.company)}</strong></div></div><div class="dreco-card pad"><div class="dreco-card-title">Finance Summary</div><div class="detail-grid"><span>Commission</span><strong>${money(r.commission)}</strong><span>Paid</span><strong>${money(r.paid)}</strong><span>Balance</span><strong class="danger-text">${money(r.balance)}</strong><span>Document</span><strong>${link?'Uploaded':'Missing'}</strong></div></div></div><div class="dreco-card pad"><div class="dreco-card-title">Recent Activity</div><div class="activity-list">${timeline.map(t=>`<div class="activity-item"><div class="activity-icon"><i class="ti ti-clock"></i></div><div><div class="item-title">${html(t.text||t.message||'Activity updated')}</div><div class="item-meta">${html(t.date||t.at||'')}</div></div></div>`).join('') || '<div class="empty-state">No activity timeline yet.</div>'}</div></div></div>`; modal.classList.add('open'); };
  function ensureProfileShell(){ if(!$('#candidate-profile-modal')){ const d=document.createElement('div'); d.id='candidate-profile-modal'; d.className='candidate-profile-modal'; document.body.appendChild(d); } }
  window.closeCandidateProfile = function(){ $('#candidate-profile-modal')?.classList.remove('open'); };
  function profileStepIndex(r){ const s=String(r.stage); if(s.includes('OFFER')) return 2; if(s.includes('MOL')) return 3; if(s.includes('VISA')) return 4; if(s.includes('TRAVEL') && s!=='TRAVELLED') return 5; if(s==='TRAVELLED') return 6; return 1; }
  function checklist(r){ return [{label:'Passport Copy',done:!!r.pp},{label:'Documents Link',done:hasDocument(r)},{label:'Offer / Initial Approval',done:profileStepIndex(r)>=2},{label:'MOL / Visa Progress',done:profileStepIndex(r)>=3},{label:'Commission Payment',done:r.balance<=0 && r.commission>0},{label:'Flight / Travel',done:String(r.stage).toUpperCase()==='TRAVELLED'}]; }
  function checklistPercent(r){ const c=checklist(r); return Math.round(c.filter(x=>x.done).length/c.length*100); }

  function wireGlobalSearch(){ const input=$('.topbar-search input'); if(input && !input.dataset.fullV2){ input.placeholder='Search anything...'; input.addEventListener('keydown',e=>{ if(e.key==='Enter'){ activeCandidateSearch=input.value; switchTab('candidates'); } }); input.dataset.fullV2='1'; } document.addEventListener('keydown',e=>{ if((e.ctrlKey||e.metaKey) && e.key.toLowerCase()==='k'){ e.preventDefault(); openCommandPalette(); } },{once:true}); }
  window.openCommandPalette = function(){ ensureCommandShell(); const modal=$('#command-modal'); modal.classList.add('open'); const input=$('#command-input'); input.value=''; renderCommandResults(''); setTimeout(()=>input.focus(),20); };
  function ensureCommandShell(){ if($('#command-modal')) return; const d=document.createElement('div'); d.id='command-modal'; d.className='command-modal'; d.innerHTML=`<div class="command-box"><div class="command-search"><i class="ti ti-search"></i><input id="command-input" placeholder="Search candidates, passports, companies, invoices, tasks..." oninput="renderCommandResults(this.value)"><button onclick="closeCommandPalette()"><i class="ti ti-x"></i></button></div><div id="command-results" class="command-results"></div></div>`; document.body.appendChild(d); d.addEventListener('click',e=>{ if(e.target===d) closeCommandPalette(); }); }
  window.closeCommandPalette = function(){ $('#command-modal')?.classList.remove('open'); };
  window.renderCommandResults = function(q){ q=String(q||'').toLowerCase(); const found=rows().filter(x=>!q || [x.name,x.pp,x.company,x.position,x.stage].some(v=>String(v||'').toLowerCase().includes(q))).slice(0,10); $('#command-results').innerHTML = found.map(x=>`<div class="command-result" onclick="closeCommandPalette();openCandidateProfile('${x.type}',${x.id})">${avatar(x.name)}<div><strong>${html(x.name)}</strong><span>${html(x.position)} • ${html(x.company)} • ${html(x.pp)}</span></div>${badge(x.stage)}</div>`).join('') || '<div class="empty-state">No results found.</div>'; };

  const oldUpdate = window.updateWorkspaceLabels;
  window.updateWorkspaceLabels = function(){ if(oldUpdate) oldUpdate(); ensureShell(); };
  window.addEventListener('DOMContentLoaded',()=>setTimeout(()=>{ ensureShell(); if($('#app')?.style.display!=='none') switchTab('dash'); },50));
})();

/* ========================= DRECO FULL OPS UI V3 PATCH =========================
   Implements: full workflow pipeline, pro/general candidate split, visual reports,
   finance visuals/recent transactions, modal stacking fixes, bottom user card.
============================================================================= */
(function(){
  const $ = (s,r=document)=>r.querySelector(s);
  const $$ = (s,r=document)=>Array.from(r.querySelectorAll(s));
  const esc = v => String(v ?? '').replace(/[&<>'"]/g, c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));
  const js = v => String(v ?? '').replace(/\\/g,'\\\\').replace(/'/g,"\\'").replace(/\n/g,' ');
  const num = v => Number(v) || 0;
  const money = v => 'KES ' + (num(v)).toLocaleString('en-KE');
  const fmtDate = v => {
    if(!v) return '—';
    if(typeof v === 'number'){
      const d = new Date(Math.round((v - 25569) * 86400 * 1000));
      return isNaN(d) ? '—' : d.toLocaleDateString('en-GB',{day:'2-digit',month:'short',year:'numeric'});
    }
    const d = new Date(v);
    return isNaN(d) ? esc(v) : d.toLocaleDateString('en-GB',{day:'2-digit',month:'short',year:'numeric'});
  };
  const initials = n => String(n||'U').trim().split(/\s+/).slice(0,2).map(x=>x[0]||'').join('').toUpperCase() || 'U';
  const avatar = n => `<div class="avatar-mini">${esc(initials(n))}</div>`;
  const stageClass = s => {
    s=String(s||'').toUpperCase();
    if(s.includes('TRAVELLED')||s.includes('ONBOARD')) return 'green';
    if(s.includes('VISA')||s.includes('MEDICAL')) return 'blue';
    if(s.includes('MOL')||s.includes('OFFER')) return 'amber';
    if(s.includes('PENDING')||s.includes('NOT')) return 'red';
    return 'purple';
  };
  const badge = s => `<span class="stage-badge ${stageClass(s)}">${esc(s||'Not set')}</span>`;

  const OPS_STAGES = ['Submitted','Interview','Offer','MOL','Medical','Visa','Commission','Ticket','Travelled','Onboarded'];
  const PRO_STAGE_TO_OPS = {
    'PENDING OFFER LETTER':'Offer',
    'PENDING MOL':'MOL',
    'PENDING VISA':'Visa',
    'PENDING TRAVEL':'Ticket',
    'TRAVELLED':'Travelled'
  };
  const GENERAL_STAGES = ['Registered','Documents','Payment','Travelled'];
  let candidateMode = sessionStorage.getItem('dreco_candidate_mode_v3') || 'professional';

  function rows(type='all'){
    const pro = (Array.isArray(proDB)?proDB:[]).map(r=>({
      type:'pro', id:r.id, name:r.name, pp:r.pp, phone:r.phone, position:r.position||'—', company:r.company||'—', country:r.country||'—',
      stage:r.stage||'PENDING OFFER LETTER', opsStage:opsStageForPro(r), submitted:r.submitted, interview:r.interview, ol:r.ol, mol:r.mol, visa:r.visa, travel:r.travel,
      commission:num(r.commission), paid:num(r.paid), balance:Math.max(num(r.commission)-num(r.paid),0), owner:currentUser?.display||'Team', raw:r
    }));
    const lb = (Array.isArray(lbDB)?lbDB:[]).map(r=>{
      const paid = num(r.r1Amt||r.r1_amt)+num(r.r2Amt||r.r2_amt); const comm=num(r.toRefund||r.to_refund||r.commission);
      return {type:'lb', id:r.id, name:r.name, pp:r.pp||r.passport, phone:r.phone, position:r.position||'General Job', company:r.company||r.country||'General Jobs', country:r.country||'',
      stage:r.travelStatus||r.travel_status||'NOT YET', opsStage:opsStageForGeneral(r,paid,comm), submitted:r.submitted||r.travelDate||r.travel_date,
      commission:comm, paid, balance:Math.max(comm-paid,0), owner:currentUser?.display||'Team', raw:r};
    });
    if(type==='pro') return pro; if(type==='lb') return lb; return [...pro,...lb];
  }
  function opsStageForPro(r){
    const s = String(r.stage||'').toUpperCase();
    if(r.travel || s==='TRAVELLED') return 'Travelled';
    if(s.includes('TRAVEL')) return 'Ticket';
    if(num(r.commission)>0 && Math.max(num(r.commission)-num(r.paid),0)>0 && (r.visa || s.includes('VISA'))) return 'Commission';
    if(r.visa || s.includes('VISA')) return 'Visa';
    if(r.mol || s.includes('MOL')) return 'MOL';
    if(r.ol || s.includes('OFFER')) return 'Offer';
    if(r.interview) return 'Interview';
    return 'Submitted';
  }
  function opsStageForGeneral(r,paid,comm){
    const s = String(r.travelStatus||r.travel_status||'').toUpperCase();
    if(s.includes('TRAVELLED')) return 'Travelled';
    if(comm && paid < comm) return 'Payment';
    if(r.pp||r.passport) return 'Documents';
    return 'Registered';
  }
  function hasDoc(type,id){
    const docs = allDocs || {};
    return !!(docs[`${type}_${id}`] || docs[id] || docs[String(id)]);
  }
  function setActiveNav(t){
    $$('#app .nav-item,.bottom-nav-item').forEach(n=>n.classList.remove('active'));
    $(`#nav-${t}`)?.classList.add('active'); $(`#bnav-${t}`)?.classList.add('active');
  }
  function ensureSections(){
    const area=$('.content-area'); if(!area) return;
    ['dash','pipeline','candidates','tasks','finance','documents','reports','clients','settings'].forEach(t=>{
      if(!$(`#${t}-section`)){ const d=document.createElement('div'); d.id=`${t}-section`; d.style.display='none'; area.appendChild(d); }
    });
  }
  function nav(t,icon,label){ return `<a class="nav-item" id="nav-${t}" data-title="${label}" onclick="switchTab('${t}')"><i class="ti ${icon}"></i><span class="nav-item-label">${label}</span></a>`; }
  function setupShellV3(){
    ensureSections();
    const side=$('#app .sidebar');
    if(side && !side.dataset.v3Shell){
      const display = window.currentUser?.display || 'John Fred';
      const org = (typeof window.getCompanyName==='function'?window.getCompanyName():'Destiny Recruit Consults');
      side.innerHTML = `
        <div class="sidebar-top"><a class="sidebar-logo" onclick="switchTab('dash')"><div class="sidebar-logo-mark"><svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M3 6C3 4.343 4.343 3 6 3h4c1.657 0 3 1.343 3 3v4c0 1.657-1.343 3-3 3H6c-1.657 0-3-1.343-3-3V6Z"/><path d="M14 14c0-1.105.895-2 2-2h4c1.105 0 2 .895 2 2v6c0 1.105-.895 2-2 2h-4c-1.105 0-2-.895-2-2v-6Z" opacity=".55"/><path d="M3 17c0-1.105.895-2 2-2h3c1.105 0 2 .895 2 2v2c0 1.105-.895 2-2 2H5c-1.105 0-2-.895-2-2v-2Z" opacity=".32"/></svg></div><span class="sidebar-logo-text">DRECO</span></a><button class="sidebar-toggle" onclick="toggleSidebar()"><i class="ti ti-chevrons-left"></i></button></div>
        <div class="nav-section-label">Workspace</div>${nav('dash','ti-home','Home')}${nav('pipeline','ti-route','Pipeline')}${nav('candidates','ti-users','Candidates')}${nav('tasks','ti-checkbox','Tasks')}
        <div class="nav-section-label">Operations</div>${nav('finance','ti-wallet','Finance')}${nav('documents','ti-file-text','Documents')}${nav('reports','ti-chart-pie','Reports')}${nav('clients','ti-building','Clients')}
        <div class="nav-section-label">System</div>${nav('settings','ti-settings','Settings')}<div class="nav-spacer"></div>
        <button class="sidebar-user-card v3-user-bottom" onclick="toggleProfileDropdown(event)" type="button"><div class="suc-avatar">${esc(initials(display))}</div><div class="suc-info"><div class="suc-name">${esc(display)}</div><div class="suc-org">${esc(org)}</div></div><i class="ti ti-chevron-right suc-arrow"></i></button>`;
      side.dataset.v3Shell='1';
    }
    const title=$('#topbar-title'); if(title) title.textContent='Dreco';
  }

  function topHead(title,sub,actions=''){ return `<div class="dreco-page-head"><div><h1>${esc(title)}</h1><p>${esc(sub)}</p></div><div class="dreco-head-actions">${actions}</div></div>`; }
  function kpi(label,value,note,icon,click=''){ return `<div class="dreco-kpi" ${click?`onclick="${click}"`:''}><div class="dreco-kpi-icon"><i class="ti ${icon}"></i></div><div class="dreco-kpi-label">${esc(label)}</div><div class="dreco-kpi-value">${esc(value)}</div><div class="dreco-kpi-note">${esc(note)}</div></div>`; }

  window.switchTab = function(t='dash'){
    setupShellV3();
    const alias={pro:'candidates',lb:'candidates',kanban:'pipeline',travel:'pipeline',commissions:'finance',repayments:'finance',expenses:'finance',team:'settings',calendar:'tasks'};
    t=alias[t]||t;
    ['dash','pipeline','candidates','tasks','finance','documents','reports','clients','settings','pro','lb','kanban','travel','commissions','repayments','expenses','team','calendar','help'].forEach(x=>{ const s=$(`#${x}-section`); if(s) s.style.display='none'; });
    const sec=$(`#${t}-section`); if(sec) sec.style.display='';
    setActiveNav(t); const tb=$('#topbar-title'); if(tb) tb.textContent = ({dash:'Home',pipeline:'Pipeline',candidates:'Candidates',tasks:'Tasks',finance:'Finance',documents:'Documents',reports:'Reports',clients:'Clients',settings:'Settings'})[t] || 'Dreco';
    ({dash:renderDashV3,pipeline:renderPipelineV3,candidates:renderCandidatesV3,tasks:renderTasksV3,finance:renderFinanceV3,documents:renderDocumentsV3,reports:renderReportsV3,clients:renderClientsV3,settings:renderSettingsV3}[t]||renderDashV3)();
    closeProfileDropdown?.();
  };

  function renderDashV3(){
    const el=$('#dash-section'); if(!el) return; const all=rows();
    const count = st => all.filter(x=>x.opsStage===st || x.stage===st).length;
    const due = all.filter(x=>x.balance>0).reduce((s,x)=>s+x.balance,0);
    el.innerHTML=`<div class="dreco-page">${topHead(`Good morning, ${(window.currentUser?.display||'John').split(' ')[0]} 👋`,'Here is what needs your attention today.',`<button class="dreco-btn" onclick="switchTab('tasks')">View all tasks</button><button class="dreco-btn primary" onclick="openProForm()"><i class="ti ti-plus"></i>New Candidate</button>`)}
      <div class="dreco-grid priority-grid">${kpi('Awaiting MOL',count('MOL'),'High priority','ti-file-description','switchTab(\'pipeline\')')}${kpi('Visas Ready',count('Visa'),'Ready for ticketing','ti-id-badge-2','switchTab(\'pipeline\')')}${kpi('Unpaid Commissions',money(due),'Requires follow-up','ti-coin','switchTab(\'finance\')')}${kpi('Tickets Pending',count('Ticket'),'Awaiting issue','ti-plane-departure','switchTab(\'pipeline\')')}${kpi('Compliance Issues',all.filter(x=>!hasDoc(x.type,x.id)).length,'Missing documents','ti-alert-circle','switchTab(\'documents\')')}</div>
      <div class="dreco-card pad"><div class="dreco-card-title">Operations Pipeline <span onclick="switchTab('pipeline')">View pipeline →</span></div><div class="pipeline-flow">${OPS_STAGES.map(s=>`<div class="flow-step"><span>${s}</span><strong>${count(s)}</strong></div>`).join('')}</div></div>
      <div class="dreco-grid dash-two"><div class="dreco-card pad"><div class="dreco-card-title">Recent Activity</div>${recentTransactionsHTML(6)}</div><div class="dreco-card pad"><div class="dreco-card-title">Priority Queue</div>${taskRowsHTML(6)}</div></div></div>`;
  }

  function renderPipelineV3(){
    const el=$('#pipeline-section'); if(!el) return; const all=rows('pro');
    el.innerHTML=`<div class="dreco-page">${topHead('Pipeline','Full recruitment workflow: Submitted → Interview → Offer → MOL → Medical → Visa → Commission → Ticket → Travelled → Onboarded.',`<button class="dreco-btn" onclick="switchTab('candidates')">View Candidates</button><button class="dreco-btn primary" onclick="openProForm()"><i class="ti ti-plus"></i>Add Candidate</button>`)}
    <div class="pipeline-board v3-pipeline-board">${OPS_STAGES.map(stage=>{
      const list=all.filter(x=>x.opsStage===stage).slice(0,8);
      return `<div class="pipeline-col"><div class="pipeline-col-head"><strong>${stage}</strong><span>${all.filter(x=>x.opsStage===stage).length}</span></div>${list.map(x=>pipelineCard(x)).join('') || '<div class="mini-empty">No candidates</div>'}</div>`;
    }).join('')}</div></div>`;
  }
  function pipelineCard(x){ return `<div class="pipeline-card" onclick="openCandidateProfile && openCandidateProfile('${x.type}',${x.id})"><div class="pc-top">${avatar(x.name)}<button onclick="event.stopPropagation();${x.type==='pro'?`editPro(${x.id})`:`editLB(${x.id})`}"><i class="ti ti-dots-vertical"></i></button></div><strong>${esc(x.name)}</strong><span>${esc(x.position)}</span><small>${esc(x.company)} • ${fmtDate(x.submitted)}</small></div>`; }

  window.setCandidateMode = function(mode){ candidateMode=mode; sessionStorage.setItem('dreco_candidate_mode_v3',mode); renderCandidatesV3(); };
  function renderCandidatesV3(){
    const el=$('#candidates-section'); if(!el) return;
    const type = candidateMode==='general'?'lb':'pro'; const data=rows(type); const q=String($('#candidate-search-v3')?.value||'').toLowerCase();
    const st=String($('#candidate-stage-v3')?.value||'');
    const filtered=data.filter(x=>(!q||[x.name,x.pp,x.position,x.company,x.stage].some(v=>String(v||'').toLowerCase().includes(q))) && (!st||x.stage===st||x.opsStage===st));
    const stages=[...new Set(data.flatMap(x=>[x.stage,x.opsStage]).filter(Boolean))];
    el.innerHTML=`<div class="dreco-page">${topHead('Candidates','Separate professional and general job candidates while keeping all records connected to existing data.',`<button class="dreco-btn" onclick="openLBForm()"><i class="ti ti-briefcase"></i>Add General</button><button class="dreco-btn primary" onclick="openProForm()"><i class="ti ti-plus"></i>Add Professional</button>`)}
      <div class="dreco-tabs"><button class="${candidateMode==='professional'?'active':''}" onclick="setCandidateMode('professional')">Professional <span>${rows('pro').length}</span></button><button class="${candidateMode==='general'?'active':''}" onclick="setCandidateMode('general')">General <span>${rows('lb').length}</span></button></div>
      <div class="toolbar"><div class="toolbar-left"><input class="dreco-input" id="candidate-search-v3" placeholder="Search ${candidateMode} candidates..." value="${esc($('#candidate-search-v3')?.value||'')}" oninput="renderCandidatesV3()"><select class="dreco-select" id="candidate-stage-v3" onchange="renderCandidatesV3()"><option value="">All stages</option>${stages.map(s=>`<option ${s===st?'selected':''}>${esc(s)}</option>`).join('')}</select></div><div class="toolbar-right"><button class="dreco-btn" onclick="exportCSV('${type}')"><i class="ti ti-download"></i>Export</button></div></div>
      <div class="table-card"><div class="dreco-table-wrap"><table class="dreco-table"><thead><tr><th>Name</th><th>Job Title</th><th>Company/Country</th><th>Workflow</th><th>Stage</th><th>Balance</th><th>Owner</th><th>Actions</th></tr></thead><tbody>${filtered.map(x=>`<tr onclick="openCandidateProfile && openCandidateProfile('${x.type}',${x.id})"><td><div class="name-cell">${avatar(x.name)}<div><div class="item-title">${esc(x.name)}</div><div class="item-meta">${esc(x.pp||'No passport')}</div></div></div></td><td>${esc(x.position)}</td><td>${esc(x.company||x.country)}</td><td>${badge(x.opsStage)}</td><td>${badge(x.stage)}</td><td>${x.balance?money(x.balance):'<span class="stage-badge green">Clear</span>'}</td><td>${esc(x.owner)}</td><td><button class="action-mini" onclick="event.stopPropagation();${x.type==='pro'?`editPro(${x.id})`:`editLB(${x.id})`}">Edit</button><button class="action-mini" onclick="event.stopPropagation();openDocs('${x.type}',${JSON.stringify(x.id)},'${js(x.name)}')">Docs</button></td></tr>`).join('') || '<tr><td colspan="8"><div class="empty-state">No candidates found.</div></td></tr>'}</tbody></table></div></div></div>`;
  }
  window.renderCandidatesV3 = renderCandidatesV3;

  function taskRows(){ return rows().flatMap(x=>{ const arr=[]; if(!hasDoc(x.type,x.id)) arr.push({title:'Upload documents',meta:x.name,prio:'High'}); if(x.balance>0) arr.push({title:'Follow up commission',meta:`${x.name} • ${money(x.balance)}`,prio:'High'}); if(x.opsStage==='Visa') arr.push({title:'Prepare ticketing',meta:x.name,prio:'Medium'}); if(x.opsStage==='MOL') arr.push({title:'MOL follow-up',meta:x.name,prio:'Medium'}); return arr; }); }
  function taskRowsHTML(limit=999){ const t=taskRows().slice(0,limit); return `<div class="task-list">${t.map(x=>`<div class="task-item"><div class="task-icon"><i class="ti ti-checkbox"></i></div><div><div class="item-title">${esc(x.title)}</div><div class="item-meta">${esc(x.meta)}</div></div><span class="item-pill ${x.prio==='High'?'danger':''}">${x.prio}</span></div>`).join('') || '<div class="empty-state">No generated tasks right now.</div>'}</div>`; }
  function renderTasksV3(){ const el=$('#tasks-section'); if(!el) return; el.innerHTML=`<div class="dreco-page">${topHead('Tasks','Priority queue generated from workflow blockers, missing documents and finance balances.',`<button class="dreco-btn primary" onclick="switchTab('candidates')">Open Candidates</button>`)}<div class="dreco-grid dreco-kpis">${kpi('Open Tasks',taskRows().length,'Generated automatically','ti-checkbox')}${kpi('Missing Docs',rows().filter(x=>!hasDoc(x.type,x.id)).length,'Compliance blockers','ti-file-alert')}${kpi('Unpaid',rows().filter(x=>x.balance>0).length,'Finance follow-ups','ti-coin')}</div><div class="dreco-card pad">${taskRowsHTML()}</div></div>`; }

  function transactions(){ return rows().filter(x=>x.commission||x.paid||x.balance).map(x=>({name:x.name,company:x.company,paid:x.paid,balance:x.balance,commission:x.commission,date:x.travel||x.visa||x.submitted,type:x.paid?'Payment':'Invoice',status:x.balance>0?'Unpaid':'Paid'})).sort((a,b)=>num(b.date)-num(a.date)); }
  function recentTransactionsHTML(limit=8){ const tx=transactions().slice(0,limit); return `<div class="transaction-list">${tx.map(t=>`<div class="tx-row"><div><strong>${esc(t.name)}</strong><span>${esc(t.company)} • ${t.type}</span></div><div><strong>${money(t.paid||t.commission)}</strong>${badge(t.status)}</div></div>`).join('') || '<div class="empty-state">No transactions yet.</div>'}</div>`; }
  function renderFinanceV3(){
    const el=$('#finance-section'); if(!el) return; const all=rows(); const total=all.reduce((s,x)=>s+x.commission,0), paid=all.reduce((s,x)=>s+x.paid,0), bal=all.reduce((s,x)=>s+x.balance,0);
    el.innerHTML=`<div class="dreco-page">${topHead('Finance','Track commissions, payments, outstanding balances and recent transactions.',`<button class="dreco-btn" onclick="switchTab('candidates')">Open Candidates</button><button class="dreco-btn primary" onclick="openProForm()"><i class="ti ti-plus"></i>New Invoice Candidate</button>`)}
    <div class="dreco-grid dreco-kpis">${kpi('Total Invoiced',money(total),'All commissions','ti-receipt')}${kpi('Total Paid',money(paid),'Collected','ti-wallet')}${kpi('Outstanding',money(bal),'Needs follow-up','ti-alert-circle')}${kpi('Collection Rate',total?Math.round(paid/total*100)+'%':'0%','Paid / invoiced','ti-chart-line')}</div>
    <div class="dreco-grid dash-two"><div class="dreco-card pad"><div class="dreco-card-title">Cash Flow</div>${barChart(monthlyFinance())}</div><div class="dreco-card pad"><div class="dreco-card-title">Outstanding by Age</div>${donutChart([{label:'Paid',value:paid},{label:'Outstanding',value:bal}], bal?money(bal):'Clear')}</div></div>
    <div class="dreco-card pad"><div class="dreco-card-title">Recent Transactions <span>Functional from candidate payment data</span></div>${recentTransactionsHTML(12)}</div></div>`;
  }
  function monthlyFinance(){ const months=['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']; const paid=Array(12).fill(0), inv=Array(12).fill(0); rows().forEach(x=>{ let d=x.submitted; let m=(typeof d==='number'?new Date(Math.round((d-25569)*86400*1000)):new Date(d||Date.now())).getMonth(); if(isNaN(m)) m=new Date().getMonth(); paid[m]+=x.paid; inv[m]+=x.commission; }); return months.map((m,i)=>({label:m,paid:paid[i],invoiced:inv[i]})); }

  function renderDocumentsV3(){ const el=$('#documents-section'); if(!el) return; const all=rows(); el.innerHTML=`<div class="dreco-page">${topHead('Documents','Manage passport, visa, MOL, medical, ticket and contract links attached to each candidate.',`<button class="dreco-btn primary" onclick="switchTab('candidates')">Attach from Candidate</button>`)}<div class="dreco-grid dreco-kpis">${kpi('Passports',all.filter(x=>x.pp).length,'Captured','ti-id')}${kpi('Document Links',all.filter(x=>hasDoc(x.type,x.id)).length,'Uploaded','ti-folder')}${kpi('Missing',all.filter(x=>!hasDoc(x.type,x.id)).length,'Need action','ti-file-alert')}</div><div class="table-card"><div class="dreco-table-wrap"><table class="dreco-table"><thead><tr><th>Candidate</th><th>Type</th><th>Passport</th><th>Workflow</th><th>Status</th><th>Action</th></tr></thead><tbody>${all.map(x=>`<tr><td><div class="name-cell">${avatar(x.name)}<div><div class="item-title">${esc(x.name)}</div><div class="item-meta">${esc(x.company)}</div></div></div></td><td>${x.type==='pro'?'Professional':'General'}</td><td>${esc(x.pp||'—')}</td><td>${badge(x.opsStage)}</td><td>${hasDoc(x.type,x.id)?'<span class="stage-badge green">Uploaded</span>':'<span class="stage-badge red">Missing</span>'}</td><td><button class="action-mini" onclick="openDocs('${x.type}',${JSON.stringify(x.id)},'${js(x.name)}')">Manage</button></td></tr>`).join('')}</tbody></table></div></div></div>`; }

  function renderReportsV3(){
    const el=$('#reports-section'); if(!el) return; const all=rows(); const stageCounts=OPS_STAGES.map(s=>({label:s,value:all.filter(x=>x.opsStage===s).length})).filter(x=>x.value); const trend=monthlyTrends();
    el.innerHTML=`<div class="dreco-page">${topHead('Reports','Visual performance overview for candidates, stages, monthly trends and companies.',`<button class="dreco-btn" onclick="exportCSV('pro')">Export Pro</button><button class="dreco-btn" onclick="exportCSV('lb')">Export General</button>`)}<div class="dreco-grid dreco-kpis">${kpi('Total Candidates',all.length,'All records','ti-users')}${kpi('Travelled',all.filter(x=>x.opsStage==='Travelled').length,'Completed placements','ti-plane')}${kpi('Success Rate',all.length?Math.round(all.filter(x=>x.opsStage==='Travelled').length/all.length*100)+'%':'0%','Travelled / total','ti-target')}${kpi('Collection Rate',all.reduce((s,x)=>s+x.commission,0)?Math.round(all.reduce((s,x)=>s+x.paid,0)/all.reduce((s,x)=>s+x.commission,0)*100)+'%':'0%','Finance health','ti-chart-line')}</div><div class="dreco-grid dash-two"><div class="dreco-card pad"><div class="dreco-card-title">Candidates by Stage</div>${donutChart(stageCounts, String(all.length))}<div class="chart-legend">${stageCounts.map(x=>`<span><i></i>${esc(x.label)} ${x.value}</span>`).join('')}</div></div><div class="dreco-card pad"><div class="dreco-card-title">Monthly Trends</div>${lineChart(trend)}</div></div><div class="dreco-card pad"><div class="dreco-card-title">Top Companies</div>${clientTableHTML()}</div></div>`;
  }
  function monthlyTrends(){ const months=['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']; const sub=Array(12).fill(0), tr=Array(12).fill(0); rows().forEach(x=>{ let d=x.submitted; let m=(typeof d==='number'?new Date(Math.round((d-25569)*86400*1000)):new Date(d||Date.now())).getMonth(); if(!isNaN(m)) sub[m]++; if(x.opsStage==='Travelled') tr[m]++; }); return months.map((m,i)=>({label:m,submitted:sub[i],travelled:tr[i]})); }

  function clients(){ const map={}; rows().forEach(x=>{ const k=x.company||'Unknown'; if(!map[k]) map[k]={name:k,country:x.country||'—',active:0,total:0,due:0,manager:x.owner}; map[k].total++; if(x.opsStage!=='Travelled') map[k].active++; map[k].due+=x.balance; }); return Object.values(map).sort((a,b)=>b.total-a.total); }
  function clientTableHTML(){ const c=clients().slice(0,10); return `<div class="dreco-table-wrap"><table class="dreco-table"><thead><tr><th>Company</th><th>Country</th><th>Active</th><th>Total</th><th>Due</th></tr></thead><tbody>${c.map(x=>`<tr><td>${esc(x.name)}</td><td>${esc(x.country)}</td><td>${x.active}</td><td>${x.total}</td><td>${money(x.due)}</td></tr>`).join('')}</tbody></table></div>`; }
  function renderClientsV3(){ const el=$('#clients-section'); if(!el) return; el.innerHTML=`<div class="dreco-page">${topHead('Clients','Client accounts generated from company names already attached to candidates.',`<button class="dreco-btn primary" onclick="openProForm()"><i class="ti ti-plus"></i>Add Client Candidate</button>`)}<div class="table-card">${clientTableHTML()}</div></div>`; }
  function renderSettingsV3(){ if(typeof window.renderSettingsPage==='function') window.renderSettingsPage(); const el=$('#settings-section'); if(el) el.classList.add('dreco-settings-v3'); }

  function donutChart(items,totalText){ const total=items.reduce((s,x)=>s+x.value,0)||1; let acc=0; const stops=items.map((x,i)=>{ const start=acc/total*100; acc+=x.value; const end=acc/total*100; const colors=['#5347CE','#1A6BB5','#22A06B','#F0B429','#EF4444','#8B5CF6','#14B8A6','#F97316','#64748B','#111827']; return `${colors[i%colors.length]} ${start}% ${end}%`; }).join(','); return `<div class="donut-wrap"><div class="donut" style="background:conic-gradient(${stops})"><div><strong>${esc(totalText)}</strong><span>Total</span></div></div></div>`; }
  function barChart(data){ const max=Math.max(...data.flatMap(x=>[x.paid,x.invoiced]),1); return `<div class="bar-chart">${data.map(x=>`<div class="bar-group"><div class="bars"><span style="height:${Math.max(4,x.invoiced/max*120)}px"></span><span style="height:${Math.max(4,x.paid/max*120)}px"></span></div><small>${x.label}</small></div>`).join('')}</div><div class="chart-legend"><span><i></i>Invoiced</span><span><i></i>Paid</span></div>`; }
  function lineChart(data){ const max=Math.max(...data.flatMap(x=>[x.submitted,x.travelled]),1); const pts1=data.map((x,i)=>`${i*(500/(data.length-1))},${140-(x.submitted/max*120)}`).join(' '); const pts2=data.map((x,i)=>`${i*(500/(data.length-1))},${140-(x.travelled/max*120)}`).join(' '); return `<svg class="line-chart" viewBox="0 0 520 160"><polyline points="${pts1}" fill="none" stroke="#5347CE" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/><polyline points="${pts2}" fill="none" stroke="#22A06B" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>${data.map((x,i)=>`<text x="${i*(500/(data.length-1))}" y="156" font-size="10" fill="#8a8f9e">${x.label}</text>`).join('')}</svg><div class="chart-legend"><span><i></i>Submitted</span><span><i></i>Travelled</span></div>`; }

  // Modal stacking fix: close profile before opening edit/docs and force one active overlay layer.
  function closeFloatingOverlays(except){
    ['candidate-profile-modal','command-modal','pro-modal','lb-modal','docs-modal'].forEach(id=>{ if(id!==except) $(`#${id}`)?.classList.remove('open'); });
    $$('.modal.open').forEach(m=>{ if(m.id!==except) m.classList.remove('open'); });
  }
  ['openProForm','editPro','openLBForm','editLB','openDocs'].forEach(name=>{
    const old=window[name]; if(typeof old==='function' && !old._v3Wrapped){
      const wrapped=function(...args){ closeFloatingOverlays(name.includes('Doc')?'docs-modal': name.includes('LB')?'lb-modal':'pro-modal'); return old.apply(this,args); };
      wrapped._v3Wrapped=true; window[name]=wrapped;
    }
  });

  // expose expected render names for older onclick hooks
  window.renderPipelineV3=renderPipelineV3; window.renderFinanceV3=renderFinanceV3; window.renderReportsV3=renderReportsV3;
  window.addEventListener('DOMContentLoaded',()=>setTimeout(()=>{ setupShellV3(); if($('#app') && $('#app').style.display!=='none') window.switchTab('dash'); },80));
})();
