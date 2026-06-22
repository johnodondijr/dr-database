// **********************************************************
// SUPABASE CONFIG - replace with your project values
// **********************************************************
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

// **********************************************************
// STAFF ACCOUNTS
// **********************************************************
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

// **********************************************************
// STATE
// **********************************************************
let currentUser   = null;
let currentCompany = { ...DEFAULT_COMPANY };
let proDB         = [];
let lbDB          = [];
let allDocs       = {};
let allTimelines  = {};
let proStages     = ['PENDING OFFER LETTER','PENDING MOL','PENDING VISA','PENDING TRAVEL','TRAVELLED'];
let lbStages      = ['NOT YET','TRAVELLED','NOT TRAVELLED'];
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
  const name = (prompt('Add destination country:') || '').trim();
  if (!name) return;
  const countries = getGeneralCountries();
  if (!countries.some(c => c.toLowerCase() === name.toLowerCase())) countries.push(name);
  window.generalCountryFilter = countries.find(c => c.toLowerCase() === name.toLowerCase()) || name;
  await persistWorkspaceCountries(countries);
  renderGeneralCountryTabs();
  renderSettingsCountries();
  renderLB();
  renderDash();
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

// **********************************************************
// LOADING
// **********************************************************
function showLoading(msg = 'Loading...') {
  const el = document.getElementById('loading-text'); if (el) el.textContent = msg;
  document.getElementById('loading-overlay').classList.add('show');
}
function hideLoading() { document.getElementById('loading-overlay').classList.remove('show'); }

// **********************************************************
// SIDEBAR TOGGLE
// **********************************************************
function toggleSidebar() {
  document.getElementById('sidebar').classList.toggle('collapsed');
}

// **********************************************************
// AUTH
// **********************************************************
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
  screen.classList.add(`auth-mode-`);
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

// **********************************************************
// DATA LOADING
// **********************************************************
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

// **********************************************************
// SAVE STATUS
// **********************************************************
function setSaveStatus(s) {
  const dot=document.getElementById('save-dot');
  const lbl=document.getElementById('save-label');
  if (!dot||!lbl) return;
  dot.className='save-dot'+(s==='saving'?' saving':'');
  lbl.textContent=s==='saving'?'Saving...':`${appStorageMode==='cloud'?'Cloud saved':'Local saved'} ${new Date().toLocaleTimeString('en-GB',{hour:'2-digit',minute:'2-digit'})}`;
}

// **********************************************************
// SUPABASE WRITES
// **********************************************************
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

// **********************************************************
// TIMELINE
// **********************************************************
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

// **********************************************************
// HELPERS
// **********************************************************
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

// **********************************************************
// TABS + MODALS
// **********************************************************
function switchTab(t){
  ['dash','pro','lb','kanban','calendar','reports'].forEach(x=>{
    const nav=document.getElementById('nav-'+x); if(nav) nav.classList.toggle('active',x===t);
    const sec=document.getElementById(x+'-section'); if(sec) sec.style.display=x===t?'':'none';
  });
  setBottomNav(t);
  const titles={dash:'Dashboard',pro:'Professional',lb:'General Jobs',kanban:'Kanban Board',calendar:'Calendar',reports:'Reports'};
  const titleEl=document.getElementById('topbar-title'); if(titleEl) titleEl.textContent=titles[t]||'';
  if(t==='dash') renderDash();
  if(t==='pro')  { rebuildProPills(); renderPro(); }
  if(t==='lb')   renderLB();
  if(t==='kanban') renderKanban();
  if(t==='calendar') renderCalendar();
  if(t==='reports') renderReports();
}
function setBottomNav(t){
  document.querySelectorAll('.bottom-nav-item').forEach(btn=>btn.classList.remove('active'));
  const active=document.getElementById('bnav-'+t);
  if(active) active.classList.add('active');
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
function openSettings(){
  closeProfileDropdown();
  const kpis=document.getElementById('settings-kpis');
  if(kpis) kpis.innerHTML=`
    <div class="settings-kpi"><strong>${proDB.length}</strong><span>Professional</span></div>
    <div class="settings-kpi"><strong>${lbDB.length}</strong><span>General Jobs records</span></div>
    <div class="settings-kpi"><strong>${Object.keys(allDocs).length}</strong><span>Doc links</span></div>`;
  const mode=document.getElementById('settings-storage-mode');
  if(mode) mode.textContent=lastSyncError?`${getStorageLabel()}: ${lastSyncError}`:getStorageLabel();
  const companyInput=document.getElementById('settings-company-name');
  if(companyInput) companyInput.value=getCompanyName();
  renderSettingsCountries();
  renderCompanyUsers();
  document.getElementById('settings-modal')?.classList.add('open');
}
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
function openHelp(){
  closeProfileDropdown();
  document.getElementById('help-modal')?.classList.add('open');
}
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

// **********************************************************
// STAGES + PILLS
// **********************************************************
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
  const previous=selectEl.dataset.prev||(type==='pro'?proStages[0]:lbStages[0]);
  const name=(prompt(`Enter new ${type==='pro'?'stage':'travel status'} name:`)||'').trim().toUpperCase();
  if(!name){ selectEl.value=previous; return; }
  if(type==='pro'){
    if(proStages.includes(name)) selectEl.value=name;
    else{ proStages.splice(proStages.indexOf('TRAVELLED'),0,name); rebuildStageSelects(); selectEl.value=name; saveStages(); showToast(`"${name}" added œ"`,'success'); }
  } else {
    if(lbStages.includes(name)) selectEl.value=name;
    else{ lbStages.push(name); rebuildStageSelects(); selectEl.value=name; saveStages(); showToast(`"${name}" added œ"`,'success'); }
  }
  selectEl.dataset.prev=selectEl.value;
}
function addCustomStage(type){
  const name=(prompt(`Enter new ${type==='pro'?'stage':'travel status'} name:`)||'').trim().toUpperCase();
  if(!name) return;
  if(type==='pro'){
    if(proStages.includes(name)){ showToast('Already exists','error'); return; }
    proStages.splice(proStages.indexOf('TRAVELLED'),0,name);
  } else {
    if(lbStages.includes(name)){ showToast('Already exists','error'); return; }
    lbStages.push(name);
  }
  rebuildStageSelects(); rebuildProPills(); saveStages(); showToast(`"${name}" added œ"`,'success');
}

// Global search
function onGlobalSearch(){
  const q=document.getElementById('global-search').value;
  const ps=document.getElementById('pro-search'); const ls=document.getElementById('lb-search');
  if(ps) ps.value=q; if(ls) ls.value=q;
  const active=document.querySelector('.nav-item.active');
  if(active&&active.id==='nav-pro') renderPro();
  else if(active&&active.id==='nav-lb') renderLB();
}

// **********************************************************
// DASHBOARD
// **********************************************************
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
    <div class="ref-travel-date">${i===0?'May 20':i===1?'May 21':'May 22'}</div>
  </div>`).join(''):'<div class="ref-empty">No upcoming travels</div>';

  const recentActivity=Object.entries(allTimelines)
    .flatMap(([key,entries])=>(entries||[]).map(e=>({...e,key})))
    .sort((a,b)=>new Date(b.ts)-new Date(a.ts)).slice(0,3);
  const recentHTML=recentActivity.length?recentActivity.map((item,i)=>`<div class="ref-activity-item">
    <div class="ref-avatar-mini">${['SA','MG','JD'][i]||'DR'}</div>
    <div><div class="ref-activity-name">${escHTML(item.user||['Sara Ali','Michael George','John Doe'][i]||'Dreco')}</div><div class="ref-activity-meta">${escHTML(item.action||'Candidate updated')}</div></div>
    <div class="ref-activity-time">${i===0?'2h ago':i===1?'4h ago':'6h ago'}</div>
  </div>`).join(''):`
    <div class="ref-activity-item"><div class="ref-avatar-mini">SA</div><div><div class="ref-activity-name">Sara Ali</div><div class="ref-activity-meta">Payment received</div></div><div class="ref-activity-time">2h ago</div></div>
    <div class="ref-activity-item"><div class="ref-avatar-mini">MG</div><div><div class="ref-activity-name">Michael George</div><div class="ref-activity-meta">Candidate travelled to Dubai</div></div><div class="ref-activity-time">4h ago</div></div>
    <div class="ref-activity-item"><div class="ref-avatar-mini">JD</div><div><div class="ref-activity-name">John Doe</div><div class="ref-activity-meta">Visa approved</div></div><div class="ref-activity-time">6h ago</div></div>`;

  const dash=document.getElementById('dash-section');
  if(!dash) return;
  dash.innerHTML=`
    <div class="ref-dashboard">
      <div class="ref-dashboard-head">
        <div><h1>Good afternoon, ${escHTML(firstName)} <span>👋</span></h1><p>Here's what's happening in your workspace today.</p></div>
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
              <div class="ref-card-head"><div class="ref-card-title">Pipeline Trend</div><button>This Month <i class="ti ti-chevron-down"></i></button></div>
              <div class="ref-legend"><span><b></b>In Process</span><span><b></b>Travelled</span></div>
              <div class="ref-line-chart">
                <svg viewBox="0 0 620 210" preserveAspectRatio="none" aria-hidden="true">
                  <defs><linearGradient id="trendFill" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#5A49F8" stop-opacity=".20"/><stop offset="1" stop-color="#5DD6C4" stop-opacity=".04"/></linearGradient></defs>
                  <path d="M0 150 C80 120 95 90 160 86 C235 82 235 112 310 92 C390 70 420 88 480 92 C545 96 570 58 620 42 L620 210 L0 210 Z" fill="url(#trendFill)"/>
                  <path d="M0 150 C80 120 95 90 160 86 C235 82 235 112 310 92 C390 70 420 88 480 92 C545 96 570 58 620 42" fill="none" stroke="#5A49F8" stroke-width="4" stroke-linecap="round"/>
                  <path d="M0 178 C80 160 105 130 170 126 C245 122 255 132 320 116 C398 96 428 118 492 114 C552 110 580 88 620 78" fill="none" stroke="#5DD6C4" stroke-width="4" stroke-linecap="round"/>
                  <line x1="318" y1="52" x2="318" y2="210" stroke="#B9C2D7" stroke-dasharray="4 6"/>
                </svg>
                <div class="ref-tooltip"><strong>May 15, 2025</strong><span><b></b>In Process <em>${totalInProcess}</em></span><span><b></b>Travelled <em>${totalTravelled}</em></span></div>
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
            <div class="ref-fin-head"><span>Financial Summary</span><button>This Month <i class="ti ti-chevron-down"></i></button></div>
            <div class="ref-fin-block"><p>Professional Jobs</p><h2>KES ${totalComm.toLocaleString()}</h2><div><span>Collected</span><strong>KES ${totalPaid.toLocaleString()}</strong></div><div><span>Outstanding</span><strong>KES ${(totalComm-totalPaid).toLocaleString()}</strong></div></div>
            <div class="ref-fin-block"><p>General Jobs</p><h2>${moneyUSD(lbFees)}</h2><div><span>Collected</span><strong>${moneyUSD(lbPaid)}</strong></div><div><span>Outstanding</span><strong>${moneyUSD(lbOwed-lbPaid)}</strong></div><div><span>Open Balances</span><strong>${lbIncomplete}</strong></div></div>
            <button class="ref-fin-report" onclick="switchTab('reports')"><i class="ti ti-report-money"></i>View Financial Report<i class="ti ti-chevron-right"></i></button>
          </section>
          <section class="ref-card ref-upcoming"><div class="ref-card-head"><div class="ref-card-title">Upcoming Travels</div><button onclick="openPendingTravelView()">View All</button></div>${upcomingHTML}<button class="ref-total-link" onclick="openPendingTravelView()">Total ${pendingTravel.length} upcoming</button></section>
          <section class="ref-card ref-quick"><div class="ref-card-title">Quick Actions</div><div class="ref-quick-grid">
            <button onclick="openProForm()"><i class="ti ti-user-plus"></i>Add Candidate</button>
            <button onclick="openLBForm()"><i class="ti ti-calendar-plus"></i>Add Job</button>
            <button onclick="switchTab('reports')"><i class="ti ti-chart-bar"></i>View Reports</button>
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
// **********************************************************
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
    showToast('Candidate updated œ"','success');
  } else {
    rec.id=Date.now(); proDB.push(rec);
    addTimeline('pro',rec.id,`Added - Stage: ${newStage}`);
    showToast('Candidate added œ"','success');
  }
  closeModal('pro-modal'); renderPro(); renderDash(); await saveProRecord(rec);
}
async function deletePro(id){
  const r=proDB.find(x=>x.id==id);
  if(!confirm(`Delete ${r?r.name:'this candidate'}? Cannot be undone.`)) return;
  proDB=proDB.filter(x=>x.id!=id); showToast('Deleted','success'); renderPro(); renderDash(); await deleteProRecord(id);
}

// **********************************************************
// LB JOBS
// **********************************************************
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
    showToast('Candidate updated œ"','success');
  } else {
    rec.id=Date.now(); lbDB.push(rec);
    addTimeline('lb',rec.id,`Added - ${ppStatus}, ${newTravel}`);
    showToast('Candidate added œ"','success');
  }
  closeModal('lb-modal'); renderLB(); renderDash(); await saveLBRecord(rec);
}
async function deleteLB(id){
  const r=lbDB.find(x=>x.id==id);
  if(!confirm(`Delete ${r?r.name:'this candidate'}? Cannot be undone.`)) return;
  lbDB=lbDB.filter(x=>x.id!=id); showToast('Deleted','success'); renderLB(); renderDash(); await deleteLBRecord(id);
}

// **********************************************************
// DOCUMENTS
// **********************************************************
function hasDocs(type,id){ const v=allDocs[`${type}_${id}`]; return typeof v==='string'&&v.trim().length>0; }
function openDocs(type,id,name){
  docsTarget={type,id,name};
  document.getElementById('docs-modal-title').textContent=`Documents - ${name}`;
  let existing=allDocs[`${type}_${id}`]; if(typeof existing!=='string') existing='';
  const input=document.getElementById('docs-link-input');
  const openBtn=document.getElementById('docs-open-btn');
  input.value=existing; openBtn.disabled=!existing.trim();
  document.getElementById('docs-modal').classList.add('open');
}
function onDocsLinkInput(){ document.getElementById('docs-open-btn').disabled=!document.getElementById('docs-link-input').value.trim(); }
function openCurrentDocLink(){ const v=document.getElementById('docs-link-input').value.trim(); if(v) window.open(v,'_blank'); }
async function saveDocs(){
  if(!docsTarget) return;
  const {type,id}=docsTarget;
  const link=document.getElementById('docs-link-input').value.trim();
  const dbKey=`${type}_${id}`;
  allDocs[dbKey]=link;
  addTimeline(type,id,link?'Documents link updated':'Documents link removed');
  closeModal('docs-modal'); showToast('Documents saved œ"','success');
  if(type==='pro') renderPro(); else renderLB();
  await saveDocsToDB(dbKey,link);
}

// **********************************************************
// EXPORT CSV
// **********************************************************
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
  a.click(); showToast('Export downloaded œ"','success');
}

// **********************************************************
// PAGINATION
// **********************************************************
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

// **********************************************************
// TOAST
// **********************************************************
function showToast(msg,type=''){
  const t=document.getElementById('toast'); if(!t) return;
  const icon=type==='error'?'ti-alert-circle':'ti-circle-check';
  t.className='toast '+type;
  t.innerHTML=`<i class="ti ${icon}"></i><span>${msg}</span>`;
  void t.offsetWidth; t.classList.add('show');
  setTimeout(()=>t.classList.remove('show'),2800);
}

// **********************************************************
// PROFILE DROPDOWN
// **********************************************************
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




