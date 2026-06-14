// ══════════════════════════════════════════════════════════
// SUPABASE CONFIG — replace with your project values
// ══════════════════════════════════════════════════════════
const SUPABASE_URL      = 'https://pizirpyvkxzghvxlipzc.supabase.co';       // e.g. https://abcxyz.supabase.co
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBpemlycHl2a3h6Z2h2eGxpcHpjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODEzNDgyOTIsImV4cCI6MjA5NjkyNDI5Mn0.MPaIYYhStetM3Wxre2SlF3xO1VfXeb9QxsMm9nyqrZA';  // long key from Supabase dashboard

const db = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// ══════════════════════════════════════════════════════════
// STAFF ACCOUNTS
// ══════════════════════════════════════════════════════════
const STAFF_ACCOUNTS = {
  fred:      { password: 'Destiny@2025', role: 'admin', display: 'Fred' },
  robert:    { password: 'Robert@2025',  role: 'staff', display: 'Robert'    },
  doreen:    { password: 'Doreen@2025',  role: 'staff', display: 'Doreen'    },
  maxwell:   { password: 'Maxwell@2025', role: 'staff', display: 'Maxwell'   },
};
const RECOVERY_CODE = 'DR-RESET-2025';

// ══════════════════════════════════════════════════════════
// STATE
// ══════════════════════════════════════════════════════════
let currentUser   = null;
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

// ══════════════════════════════════════════════════════════
// LOADING
// ══════════════════════════════════════════════════════════
function showLoading(msg = 'Loading…') {
  const el = document.getElementById('loading-text');
  if (el) el.textContent = msg;
  document.getElementById('loading-overlay').classList.add('show');
}
function hideLoading() {
  document.getElementById('loading-overlay').classList.remove('show');
}

// ══════════════════════════════════════════════════════════
// AUTH
// ══════════════════════════════════════════════════════════
function togglePassword() {
  const inp = document.getElementById('pw-input');
  const btn = document.getElementById('pw-toggle');
  if (inp.type === 'password') {
    inp.type = 'text';
    btn.innerHTML = '<i class="ti ti-eye-off"></i>';
  } else {
    inp.type = 'password';
    btn.innerHTML = '<i class="ti ti-eye"></i>';
  }
}

function showForgotPassword() {
  document.getElementById('login-main').style.display     = 'none';
  document.getElementById('forgot-section').style.display = 'block';
}
function hideForgotPassword() {
  document.getElementById('forgot-section').style.display = 'none';
  document.getElementById('login-main').style.display     = 'block';
  const ri = document.getElementById('recovery-code-input');
  if (ri) ri.value = '';
  const fe = document.getElementById('forgot-error');
  if (fe) fe.style.display = 'none';
  const fr = document.getElementById('forgot-result');
  if (fr) fr.style.display = 'none';
}

function submitForgotPassword() {
  const code  = (document.getElementById('recovery-code-input').value || '').trim();
  const errEl = document.getElementById('forgot-error');
  const resEl = document.getElementById('forgot-result');
  if (code !== RECOVERY_CODE) {
    errEl.textContent    = 'Incorrect recovery code.';
    errEl.style.display  = 'block';
    resEl.style.display  = 'none';
    return;
  }
  errEl.style.display = 'none';
  resEl.innerHTML = '<strong style="color:var(--green)">✓ Verified. Staff credentials:</strong>' +
    Object.entries(STAFF_ACCOUNTS).map(([u, s]) =>
      `<div style="padding:6px 0;border-bottom:1px solid var(--border)">
        <b>${s.display}</b> — username: <code>${u}</code> · password: <code>${s.password}</code>
       </div>`
    ).join('');
  resEl.style.display = 'block';
}

function doLogin() {
  const username = (document.getElementById('username-input').value || '').trim().toLowerCase();
  const password = (document.getElementById('pw-input').value || '').trim();
  const errEl    = document.getElementById('login-error');
  const account  = STAFF_ACCOUNTS[username];
  if (!account || account.password !== password) {
    errEl.style.display = 'block';
    return;
  }
  errEl.style.display = 'none';
  currentUser = { username, ...account };
  sessionStorage.setItem('dr_user', JSON.stringify(currentUser));
  document.getElementById('login-screen').style.display = 'none';
  document.getElementById('app').style.display          = 'block';
  setUserDisplay(account.display);
  loadAllData();
}

function doLogout() {
  sessionStorage.removeItem('dr_user');
  currentUser = null;
  document.getElementById('app').style.display          = 'none';
  document.getElementById('login-screen').style.display = 'flex';
  document.getElementById('pw-input').value       = '';
  document.getElementById('username-input').value = '';
  document.getElementById('login-error').style.display = 'none';
  hideForgotPassword();
}

function setUserDisplay(display) {
  const chip = document.getElementById('user-chip');
  const av   = document.getElementById('user-avatar-initials');
  if (chip) chip.textContent = display;
  if (av) {
    const parts = display.replace(/[^a-zA-Z ]/g, '').trim().split(' ');
    av.textContent = parts.length >= 2
      ? (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
      : display.substring(0, 2).toUpperCase();
  }
}

// Auto-login from session
window.addEventListener('DOMContentLoaded', () => {
  const saved = sessionStorage.getItem('dr_user');
  if (saved) {
    try {
      currentUser = JSON.parse(saved);
      document.getElementById('login-screen').style.display = 'none';
      document.getElementById('app').style.display          = 'block';
      setUserDisplay(currentUser.display);
      loadAllData();
    } catch { sessionStorage.removeItem('dr_user'); }
  }
  rebuildStageSelects();
  // close modals on backdrop click
  ['pro-modal','lb-modal','docs-modal'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.addEventListener('click', e => { if (e.target === el) closeModal(id); });
  });
});

// ══════════════════════════════════════════════════════════
// SUPABASE DATA LOADING
// ══════════════════════════════════════════════════════════
async function loadAllData() {
  showLoading('Loading candidates…');
  try {
    const [proRes, lbRes, docsRes, tlRes, stagesRes] = await Promise.all([
      db.from('pro_candidates').select('*').order('id'),
      db.from('lb_candidates').select('*').order('id'),
      db.from('documents').select('*'),
      db.from('timelines').select('*'),
      db.from('app_settings').select('*'),
    ]);

    if (proRes.data && proRes.data.length > 0) {
      proDB = proRes.data;
    } else {
      await seedProData();
    }

    if (lbRes.data && lbRes.data.length > 0) {
      lbDB = lbRes.data;
    } else {
      await seedLBData();
    }

    if (docsRes.data) {
      docsRes.data.forEach(row => { allDocs[row.key] = row.data; });
    }

    if (tlRes.data) {
      tlRes.data.forEach(row => { allTimelines[row.key] = row.entries; });
    }

    if (stagesRes.data) {
      const ps = stagesRes.data.find(r => r.key === 'pro_stages');
      const ls = stagesRes.data.find(r => r.key === 'lb_stages');
      if (ps) proStages = ps.value;
      if (ls) lbStages  = ls.value;
    }

  } catch (err) {
    console.warn('Supabase error, falling back to seed data:', err);
    if (proDB.length === 0) proDB = JSON.parse(JSON.stringify(PRO_SEED));
    if (lbDB.length === 0)  lbDB  = JSON.parse(JSON.stringify(LB_SEED));
  }

  rebuildStageSelects();
  hideLoading();
  switchTab('dash');
}

function normalizeDateField(v) {
  if (v === '' || v === null || v === undefined) return null;
  if (typeof v === 'number') return xlToISO(v);
  return v;
}

async function seedProData() {
  const seed = JSON.parse(JSON.stringify(PRO_SEED)).map(r => {
    ['submitted','interview','ol','mol','visa','travel'].forEach(f => r[f] = normalizeDateField(r[f]));
    if (r.commission === '') r.commission = null;
    if (r.paid === '') r.paid = null;
    delete r.id;
    return r;
  });
  const { data, error } = await db.from('pro_candidates').insert(seed).select();
  if (data && data.length) proDB = data;
  else { console.warn('Seed insert failed', error); proDB = JSON.parse(JSON.stringify(PRO_SEED)); }
}

async function seedLBData() {
  const seed = JSON.parse(JSON.stringify(LB_SEED)).map(r => {
    ['travelDate','r1Date','r2Date'].forEach(f => r[f] = normalizeDateField(r[f]));
    delete r.id;
    return r;
  });
  const { data, error } = await db.from('lb_candidates').insert(seed).select();
  if (data && data.length) lbDB = data;
  else { console.warn('Seed insert failed', error); lbDB = JSON.parse(JSON.stringify(LB_SEED)); }
}

// ══════════════════════════════════════════════════════════
// SAVE STATUS
// ══════════════════════════════════════════════════════════
function setSaveStatus(s) {
  const el = document.getElementById('save-status');
  if (!el) return;
  el.className = 'save-status ' + s;
  el.innerHTML = s === 'saving'
    ? '<i class="ti ti-refresh"></i><span id="save-text">Saving…</span>'
    : '<i class="ti ti-circle-check"></i><span id="save-text">Saved</span>';
}

// ══════════════════════════════════════════════════════════
// SUPABASE WRITES
// ══════════════════════════════════════════════════════════
async function saveProRecord(rec) {
  setSaveStatus('saving');
  const tempId = rec.id;
  try {
    if (editingProId) {
      const toSend = { ...rec }; delete toSend.id;
      await db.from('pro_candidates').update(toSend).eq('id', rec.id);
    } else {
      const toSend = { ...rec }; delete toSend.id;
      const { data, error } = await db.from('pro_candidates').insert(toSend).select().single();
      if (data) {
        rec.id = data.id;
        if (allTimelines[`pro_${tempId}`]) {
          allTimelines[`pro_${rec.id}`] = allTimelines[`pro_${tempId}`];
          delete allTimelines[`pro_${tempId}`];
        }
        renderPro();
      } else { console.warn('Insert failed', error); }
    }
    await saveTimeline(`pro_${rec.id}`);
    setSaveStatus('saved');
  } catch(e) { console.error(e); showToast('Save failed — check connection', 'error'); setSaveStatus('saved'); }
}

async function saveLBRecord(rec) {
  setSaveStatus('saving');
  const tempId = rec.id;
  try {
    if (editingLbId) {
      const toSend = { ...rec }; delete toSend.id;
      await db.from('lb_candidates').update(toSend).eq('id', rec.id);
    } else {
      const toSend = { ...rec }; delete toSend.id;
      const { data, error } = await db.from('lb_candidates').insert(toSend).select().single();
      if (data) {
        rec.id = data.id;
        if (allTimelines[`lb_${tempId}`]) {
          allTimelines[`lb_${rec.id}`] = allTimelines[`lb_${tempId}`];
          delete allTimelines[`lb_${tempId}`];
        }
        renderLB();
      } else { console.warn('Insert failed', error); }
    }
    await saveTimeline(`lb_${rec.id}`);
    setSaveStatus('saved');
  } catch(e) { console.error(e); showToast('Save failed — check connection', 'error'); setSaveStatus('saved'); }
}

async function deleteProRecord(id) {
  setSaveStatus('saving');
  try { await db.from('pro_candidates').delete().eq('id', id); setSaveStatus('saved'); }
  catch(e) { console.error(e); setSaveStatus('saved'); }
}

async function deleteLBRecord(id) {
  setSaveStatus('saving');
  try { await db.from('lb_candidates').delete().eq('id', id); setSaveStatus('saved'); }
  catch(e) { console.error(e); setSaveStatus('saved'); }
}

async function saveDocsToDB(key, data) {
  setSaveStatus('saving');
  try {
    await db.from('documents').upsert({ key, data }, { onConflict: 'key' });
    setSaveStatus('saved');
  } catch(e) { console.error(e); setSaveStatus('saved'); }
}

async function saveTimeline(key) {
  if (!allTimelines[key]) return;
  try {
    await db.from('timelines').upsert({ key, entries: allTimelines[key] }, { onConflict: 'key' });
  } catch(e) { console.error(e); }
}

async function saveStages() {
  setSaveStatus('saving');
  try {
    await db.from('app_settings').upsert([
      { key: 'pro_stages', value: proStages },
      { key: 'lb_stages',  value: lbStages  },
    ], { onConflict: 'key' });
    setSaveStatus('saved');
  } catch(e) { console.error(e); setSaveStatus('saved'); }
}

// ══════════════════════════════════════════════════════════
// TIMELINE
// ══════════════════════════════════════════════════════════
function addTimeline(type, id, action) {
  const key = `${type}_${id}`;
  if (!allTimelines[key]) allTimelines[key] = [];
  allTimelines[key].unshift({
    action,
    user: currentUser ? currentUser.display : 'System',
    ts: new Date().toISOString()
  });
  if (allTimelines[key].length > 50) allTimelines[key].length = 50;
}

function renderTimelineHTML(type, id) {
  const key   = `${type}_${id}`;
  const items = allTimelines[key] || [];
  if (!items.length) return '<div class="tl-empty">No activity yet.</div>';
  return items.map(item => {
    const d  = new Date(item.ts);
    const ds = d.toLocaleDateString('en-GB', { day:'2-digit', month:'short', year:'2-digit' });
    const ts = d.toLocaleTimeString('en-GB', { hour:'2-digit', minute:'2-digit' });
    return `<div class="tl-item-modal">
      <div class="tl-dot-modal"></div>
      <div><div class="tl-action-modal">${item.action}</div>
      <div class="tl-meta-modal">${item.user} · ${ds} ${ts}</div></div>
    </div>`;
  }).join('');
}

// ══════════════════════════════════════════════════════════
// HELPERS
// ══════════════════════════════════════════════════════════
function xlToISO(n) {
  if (!n || isNaN(n)) return '';
  return new Date(EXCEL_EPOCH.getTime() + n * 86400000).toISOString().split('T')[0];
}
function fmtDate(v) {
  if (!v) return '—';
  const s = typeof v === 'number' ? xlToISO(v) : v;
  if (!s) return '—';
  try {
    const d = new Date(s);
    if (isNaN(d)) return s;
    return d.toLocaleDateString('en-GB', { day:'2-digit', month:'short', year:'2-digit' });
  } catch { return s; }
}
function toInput(v) {
  if (!v) return '';
  return typeof v === 'number' ? xlToISO(v) : v;
}
function getRefundStatus(r) {
  if ((r.ppStatus || r.pp_status) === 'HAD PP') return 'N/A';
  const notes = (r.notes || '').trim().toUpperCase();
  if (notes === 'RETURNED') return 'RETURNED';
  const toRef = Number(r.toRefund || r.to_refund) || 0;
  if (!toRef) return 'N/A';
  const paid = (Number(r.r1Amt || r.r1_amt) || 0) + (Number(r.r2Amt || r.r2_amt) || 0);
  return paid >= toRef ? 'complete' : 'incomplete';
}
function isInProcessPro(r) {
  return ['PENDING OFFER LETTER','PENDING MOL','PENDING VISA','PENDING TRAVEL'].includes(r.stage);
}
function isInProcessLB(r) {
  return (r.ppStatus || r.pp_status) !== 'HAD PP'
      && (r.travelStatus || r.travel_status) === 'NOT YET';
}
function stageBadge(s) {
  const map = {
    'PENDING OFFER LETTER':'b-pol','PENDING MOL':'b-mol',
    'PENDING VISA':'b-visa','PENDING TRAVEL':'b-travel','TRAVELLED':'b-travelled'
  };
  return `<span class="badge ${map[s]||'b-na'}">${s}</span>`;
}
function travelBadge(s) {
  const map = { 'TRAVELLED':'b-travelled','NOT YET':'b-notyet','NOT TRAVELLED':'b-nottravelled' };
  return `<span class="badge ${map[s]||'b-na'}">${s}</span>`;
}
function refundBadge(s) {
  const map = { complete:'b-complete', incomplete:'b-incomplete', RETURNED:'b-returned', 'N/A':'b-na' };
  return `<span class="badge ${map[s]||'b-na'}">${s}</span>`;
}

// ══════════════════════════════════════════════════════════
// TABS + MODALS
// ══════════════════════════════════════════════════════════
function switchTab(t) {
  ['dash','pro','lb'].forEach(x => {
    const nav = document.getElementById('nav-' + x);
    if (nav) nav.classList.toggle('active', x === t);
    const sec = document.getElementById(x + '-section');
    if (sec) sec.style.display = x === t ? '' : 'none';
  });
  const titles = { dash:'Dashboard', pro:'Professional', lb:'LB Jobs' };
  const titleEl = document.getElementById('topbar-title');
  if (titleEl) titleEl.textContent = titles[t] || '';
  if (t === 'dash') renderDash();
  if (t === 'pro')  { rebuildProPills(); renderPro(); }
  if (t === 'lb')   renderLB();
}

function switchModalTab(modal, tab, btn) {
  const tabs = modal === 'pro'
    ? ['details','pipeline','commission','timeline']
    : ['details','refunds','timeline'];
  tabs.forEach(tt => {
    const el = document.getElementById(`${modal}-tab-${tt}`);
    if (el) el.style.display = tt === tab ? '' : 'none';
  });
  btn.closest('.modal-tabs').querySelectorAll('.modal-tab').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
}

function closeModal(id) {
  const el = document.getElementById(id);
  if (el) el.classList.remove('open');
}

// ══════════════════════════════════════════════════════════
// STAGES
// ══════════════════════════════════════════════════════════
function rebuildStageSelects() {
  const ADD_NEW = '__add_new__';

  const proSel = document.getElementById('pf-stage');
  if (proSel) {
    proSel.innerHTML = proStages.map(s => `<option value="${s}">${s}</option>`).join('')
      + `<option value="${ADD_NEW}">+ Add new stage…</option>`;
  }
  const lbSel = document.getElementById('lf-travel');
  if (lbSel) {
    lbSel.innerHTML = lbStages.map(s => `<option value="${s}">${s}</option>`).join('')
      + `<option value="${ADD_NEW}">+ Add new status…</option>`;
  }
}

function rebuildProPills() {
  const wrap = document.getElementById('pro-stage-pills');
  if (!wrap) return;
  const cur = window.proStagePillFilter || '';
  wrap.innerHTML = `<button class="pill-tab ${cur===''?'active':''}" onclick="setProStagePill('',this)">All</button>`
    + proStages.map(s =>
        `<button class="pill-tab ${cur===s?'active':''}" onclick="setProStagePill('${s.replace(/'/g,"\\'")}',this)">${s.replace('PENDING ','')}</button>`
      ).join('');
}

function handleStageSelectChange(type, selectEl) {
  if (selectEl.value !== '__add_new__') { selectEl.dataset.prev = selectEl.value; return; }
  const previous = selectEl.dataset.prev || (type === 'pro' ? proStages[0] : lbStages[0]);
  const label    = type === 'pro' ? 'professional stage' : 'LB travel status';
  const name     = (prompt(`Enter new ${label} name:`) || '').trim().toUpperCase();
  if (!name) { selectEl.value = previous; return; }
  if (type === 'pro') {
    if (proStages.includes(name)) {
      selectEl.value = name;
    } else {
      proStages.splice(proStages.indexOf('TRAVELLED'), 0, name);
      rebuildStageSelects();
      selectEl.value = name;
      saveStages();
      showToast(`"${name}" added ✓`, 'success');
    }
  } else {
    if (lbStages.includes(name)) {
      selectEl.value = name;
    } else {
      lbStages.push(name);
      rebuildStageSelects();
      selectEl.value = name;
      saveStages();
      showToast(`"${name}" added ✓`, 'success');
    }
  }
  selectEl.dataset.prev = selectEl.value;
}

function addCustomStage(type) {
  const label = type === 'pro' ? 'professional stage' : 'LB travel status';
  const name  = (prompt(`Enter new ${label} name:`) || '').trim().toUpperCase();
  if (!name) return;
  if (type === 'pro') {
    if (proStages.includes(name)) { showToast('Already exists', 'error'); return; }
    proStages.splice(proStages.indexOf('TRAVELLED'), 0, name);
  } else {
    if (lbStages.includes(name)) { showToast('Already exists', 'error'); return; }
    lbStages.push(name);
  }
  rebuildStageSelects();
  rebuildProPills();
  saveStages();
  showToast(`"${name}" added ✓`, 'success');
}

// ══════════════════════════════════════════════════════════
// PILL FILTER STATE
// ══════════════════════════════════════════════════════════
window.proStagePillFilter = '';
window.lbTravelPillFilter = '';

function setProStagePill(val, btn) {
  window.proStagePillFilter = val;
  document.querySelectorAll('#pro-stage-pills .pill-tab').forEach(b => b.classList.remove('active'));
  if (btn) btn.classList.add('active');
  renderPro();
}

function setLBTravelPill(val, btn) {
  window.lbTravelPillFilter = val;
  document.querySelectorAll('#lb-travel-pills .pill-tab').forEach(b => b.classList.remove('active'));
  if (btn) btn.classList.add('active');
  renderLB();
}

// Global search
function onGlobalSearch() {
  const q   = document.getElementById('global-search').value;
  const ps  = document.getElementById('pro-search');
  const ls  = document.getElementById('lb-search');
  if (ps) ps.value = q;
  if (ls) ls.value = q;
  const activeNav = document.querySelector('.nav-item.active');
  if (activeNav && activeNav.id === 'nav-pro') renderPro();
  else if (activeNav && activeNav.id === 'nav-lb') renderLB();
}

// ══════════════════════════════════════════════════════════
// DASHBOARD
// ══════════════════════════════════════════════════════════
function renderDash() {
  const proTravelled = proDB.filter(r => r.stage === 'TRAVELLED').length;
  const proInProcess = proDB.filter(isInProcessPro).length;
  let totalComm = 0, totalPaid = 0;
  proDB.forEach(r => {
    if (r.commission) totalComm += Number(r.commission);
    if (r.paid)       totalPaid += Number(r.paid);
  });

  const lbTravelled  = lbDB.filter(r => (r.travelStatus||r.travel_status) === 'TRAVELLED').length;
  const lbInProcess  = lbDB.filter(isInProcessLB).length;
  const lbIncomplete = lbDB.filter(r => getRefundStatus(r) === 'incomplete').length;
  let lbOwed = 0, lbPaid = 0;
  lbDB.forEach(r => {
    if ((r.travelStatus||r.travel_status) === 'TRAVELLED' &&
        (r.ppStatus||r.pp_status) !== 'HAD PP' &&
        (r.notes||'').trim().toUpperCase() !== 'RETURNED') {
      lbOwed += Number(r.toRefund||r.to_refund) || 0;
      lbPaid += (Number(r.r1Amt||r.r1_amt)||0) + (Number(r.r2Amt||r.r2_amt)||0);
    }
  });

  // Pipeline cards
  const cardsEl = document.getElementById('dash-pipeline-cards');
  if (cardsEl) cardsEl.innerHTML = `
    <div class="p-card card-gold" onclick="switchTab('pro')">
      <div class="p-card-label">In process</div>
      <div class="p-card-count">${proInProcess}</div>
      <div class="p-card-sub">Professional</div>
      <i class="ti ti-briefcase p-card-icon"></i>
    </div>
    <div class="p-card card-dark" onclick="switchTab('pro')">
      <div class="p-card-label">Travelled</div>
      <div class="p-card-count">${proTravelled}</div>
      <div class="p-card-sub">Professional</div>
      <i class="ti ti-plane p-card-icon"></i>
    </div>
    <div class="p-card card-slate" onclick="switchTab('lb')">
      <div class="p-card-label">LB active</div>
      <div class="p-card-count">${lbInProcess}</div>
      <div class="p-card-sub">Not yet travelled</div>
      <i class="ti ti-home p-card-icon"></i>
    </div>
    <div class="p-card card-amber" onclick="switchTab('lb')">
      <div class="p-card-label">Refund balance</div>
      <div class="p-card-count" style="font-size:22px">$${lbOwed - lbPaid}</div>
      <div class="p-card-sub">Outstanding USD</div>
      <i class="ti ti-coin p-card-icon"></i>
    </div>`;

  // Stage breakdown bars
  const maxS = Math.max(...proStages.map(s => proDB.filter(r => r.stage === s).length), 1);
  const stageBreakdown = proStages.map(s => {
    const n = proDB.filter(r => r.stage === s).length;
    return `<div class="dash-row" style="flex-direction:column;align-items:stretch;gap:4px">
      <div style="display:flex;justify-content:space-between">
        <span class="dash-row-label">${s}</span><span class="dash-row-val">${n}</span>
      </div>
      <div class="dash-bar-wrap"><div class="dash-bar-fill" style="width:${Math.round(n/maxS*100)}%"></div></div>
    </div>`;
  }).join('');

  const lbComplete = lbDB.filter(r => getRefundStatus(r) === 'complete').length;
  const lbReturned = lbDB.filter(r => getRefundStatus(r) === 'RETURNED').length;
  const lbNA       = lbDB.filter(r => getRefundStatus(r) === 'N/A').length;

  const grid = document.getElementById('dash-cards-grid');
  if (grid) grid.innerHTML = `
    <div class="dash-card">
      <h3>Professional Jobs</h3>
      <div class="dash-row"><span class="dash-row-label">Total candidates</span><span class="dash-row-val">${proDB.length}</span></div>
      <div class="dash-row"><span class="dash-row-label">In process</span><span class="dash-row-val" style="color:var(--amber)">${proInProcess}</span></div>
      <div class="dash-row"><span class="dash-row-label">Travelled</span><span class="dash-row-val" style="color:var(--green)">${proTravelled}</span></div>
      <div class="dash-row"><span class="dash-row-label">Commission billed</span><span class="dash-row-val">KES ${totalComm.toLocaleString()}</span></div>
      <div class="dash-row"><span class="dash-row-label">Outstanding</span><span class="dash-row-val" style="color:var(--amber)">KES ${(totalComm-totalPaid).toLocaleString()}</span></div>
    </div>
    <div class="dash-card">
      <h3>LB Jobs</h3>
      <div class="dash-row"><span class="dash-row-label">Total candidates</span><span class="dash-row-val">${lbDB.length}</span></div>
      <div class="dash-row"><span class="dash-row-label">In process</span><span class="dash-row-val" style="color:var(--amber)">${lbInProcess}</span></div>
      <div class="dash-row"><span class="dash-row-label">Travelled</span><span class="dash-row-val" style="color:var(--green)">${lbTravelled}</span></div>
      <div class="dash-row"><span class="dash-row-label">Refund balance owed</span><span class="dash-row-val" style="color:var(--amber)">$${lbOwed - lbPaid}</span></div>
      <div class="dash-row"><span class="dash-row-label">Incomplete refunds</span><span class="dash-row-val" style="color:var(--red)">${lbIncomplete}</span></div>
    </div>
    <div class="dash-card">
      <h3>Stage Breakdown</h3>
      ${stageBreakdown}
    </div>
    <div class="dash-card">
      <h3>Refund Overview</h3>
      <div class="dash-row"><span class="dash-row-label">Complete</span><span class="dash-row-val" style="color:var(--green)">${lbComplete}</span></div>
      <div class="dash-row"><span class="dash-row-label">Incomplete</span><span class="dash-row-val" style="color:var(--amber)">${lbIncomplete}</span></div>
      <div class="dash-row"><span class="dash-row-label">Returned</span><span class="dash-row-val" style="color:var(--red)">${lbReturned}</span></div>
      <div class="dash-row"><span class="dash-row-label">N/A (Had PP)</span><span class="dash-row-val">${lbNA}</span></div>
      <div class="dash-row"><span class="dash-row-label">Not yet travelled</span><span class="dash-row-val" style="color:var(--blue)">${lbDB.filter(r=>(r.travelStatus||r.travel_status)==='NOT YET').length}</span></div>
    </div>`;

  // Right column
  const pendingTravel = proDB.filter(r => r.stage === 'PENDING TRAVEL');
  const travelItems = pendingTravel.length
    ? pendingTravel.slice(0, 5).map(r =>
        `<div class="due-item">
          <div><div class="due-name">${r.name}</div><div class="due-stage">${r.company||'—'} · ${r.position||'—'}</div></div>
          <div class="due-date">Pending</div>
        </div>`).join('')
    : '<div class="due-empty">No candidates pending travel</div>';

  const recentActivity = Object.entries(allTimelines)
    .flatMap(([key, entries]) => (entries || []).map(e => ({ ...e, key })))
    .sort((a, b) => new Date(b.ts) - new Date(a.ts))
    .slice(0, 5);
  const activityHTML = recentActivity.length
    ? recentActivity.map(item => {
        const d  = new Date(item.ts);
        const ds = d.toLocaleDateString('en-GB', { day:'2-digit', month:'short', year:'2-digit' });
        const ts = d.toLocaleTimeString('en-GB', { hour:'2-digit', minute:'2-digit' });
        return `<div class="tl-item"><div class="tl-dot"></div><div>
          <div class="tl-action">${item.action}</div>
          <div class="tl-meta">${item.user} · ${ds} ${ts}</div>
        </div></div>`;
      }).join('')
    : '<div class="tl-empty">No recent activity</div>';

  const rightCol = document.getElementById('dash-right-col');
  if (rightCol) rightCol.innerHTML = `
    <div class="spotlight">
      <div class="spotlight-label">Commission summary</div>
      <div class="spotlight-amount">KES ${totalComm.toLocaleString()}</div>
      <div class="spotlight-sub">Total billed across all candidates</div>
      <div class="spotlight-row"><span class="spotlight-row-label">Collected</span><span class="spotlight-row-val" style="color:#6FCF97">KES ${totalPaid.toLocaleString()}</span></div>
      <div class="spotlight-row"><span class="spotlight-row-label">Outstanding</span><span class="spotlight-row-val" style="color:var(--gold)">KES ${(totalComm-totalPaid).toLocaleString()}</span></div>
      <div class="spotlight-row"><span class="spotlight-row-label">LB refund balance</span><span class="spotlight-row-val" style="color:var(--gold)">$${lbOwed-lbPaid}</span></div>
    </div>
    <div class="due-panel">
      <div class="due-header"><i class="ti ti-plane"></i><span>Pending travel</span></div>
      ${travelItems}
    </div>
    <div class="activity-panel">
      <div class="activity-header">Recent activity</div>
      ${activityHTML}
    </div>`;
}

// ══════════════════════════════════════════════════════════
// PROFESSIONAL
// ══════════════════════════════════════════════════════════
function getFilteredPro() {
  const q     = (document.getElementById('pro-search')?.value || '').toLowerCase();
  const stage = window.proStagePillFilter || '';
  const comp  = document.getElementById('pro-company-f')?.value || '';
  return proDB.filter(r => {
    const text = `${r.name} ${r.pp||''} ${r.company||''} ${r.position||''}`.toLowerCase();
    return (!q || text.includes(q)) && (!stage || r.stage === stage) && (!comp || r.company === comp);
  });
}

function renderPro() {
  let totalComm = 0, totalPaid = 0;
  proDB.forEach(r => {
    if (r.commission) totalComm += Number(r.commission);
    if (r.paid)       totalPaid += Number(r.paid);
  });

  const metricsEl = document.getElementById('pro-metrics');
  if (metricsEl) metricsEl.innerHTML = `
    <div class="metric-card"><div class="metric-label">Total</div><div class="metric-val">${proDB.length}</div></div>
    <div class="metric-card"><div class="metric-label">In process</div><div class="metric-val amber">${proDB.filter(isInProcessPro).length}</div></div>
    <div class="metric-card"><div class="metric-label">Travelled</div><div class="metric-val green">${proDB.filter(r=>r.stage==='TRAVELLED').length}</div></div>
    <div class="metric-card"><div class="metric-label">Commission billed</div><div class="metric-val sm">KES ${totalComm.toLocaleString()}</div></div>
    <div class="metric-card"><div class="metric-label">Outstanding</div><div class="metric-val sm amber">KES ${(totalComm-totalPaid).toLocaleString()}</div></div>`;

  // Company filter
  const companies = [...new Set(proDB.map(r => r.company).filter(Boolean))].sort();
  const csel = document.getElementById('pro-company-f');
  if (csel) {
    const ccur = csel.value;
    csel.innerHTML = '<option value="">All companies</option>'
      + companies.map(c => `<option value="${c}"${c===ccur?' selected':''}>${c}</option>`).join('');
  }

  const data       = getFilteredPro();
  const totalPages = Math.max(1, Math.ceil(data.length / PER_PAGE));
  if (proPage > totalPages) proPage = 1;
  const slice = data.slice((proPage - 1) * PER_PAGE, proPage * PER_PAGE);

  const tbody = document.getElementById('pro-tbody');
  if (!tbody) return;

  if (!slice.length) {
    tbody.innerHTML = `<tr><td colspan="11"><div class="empty">No candidates found</div></td></tr>`;
  } else {
    tbody.innerHTML = slice.map((r, i) => {
      const comm   = r.commission ? 'KES ' + Number(r.commission).toLocaleString() : '—';
      const paid   = r.paid       ? 'KES ' + Number(r.paid).toLocaleString()       : '—';
      const bal    = (r.commission && r.paid) ? Number(r.commission) - Number(r.paid) : null;
      const balTxt = bal !== null ? 'KES ' + bal.toLocaleString() : '—';
      const hd     = hasDocs('pro', r.id);
      return `<tr onclick="editPro(${r.id})">
        <td>${(proPage-1)*PER_PAGE+i+1}</td>
        <td><div class="name-cell">${r.name}</div><div class="pp-cell">${r.pp||''}</div></td>
        <td style="color:var(--text-2)">${r.position||'—'}</td>
        <td style="color:var(--text-2)">${r.company||'—'}</td>
        <td style="color:var(--text-2)">${r.country||'—'}</td>
        <td>${stageBadge(r.stage)}</td>
        <td>${comm}</td>
        <td>${paid}</td>
        <td class="${bal&&bal>0?'balance-owed':''}">${balTxt}</td>
        <td onclick="event.stopPropagation()">
          <button class="action-btn docs" onclick="openDocs('pro',${r.id},'${r.name.replace(/'/g,"\\'")}')" title="${hd?'View/edit documents':'Add documents'}">
            <i class="ti ti-paperclip"></i>${hd?' <i class="ti ti-check" style="color:var(--green);font-size:11px"></i>':''}
          </button>
        </td>
        <td onclick="event.stopPropagation()">
          <button class="action-btn del" onclick="deletePro(${r.id})"><i class="ti ti-trash"></i></button>
        </td>
      </tr>`;
    }).join('');
  }
  renderPagination('pro-pagination', proPage, totalPages, data.length, 'pro');
}

function openProForm() {
  editingProId = null;
  document.getElementById('pro-modal-title').textContent = 'Add professional candidate';
  ['pf-name','pf-pp','pf-phone','pf-position','pf-company','pf-country',
   'pf-submitted','pf-interview','pf-ol','pf-mol','pf-visa','pf-travel','pf-comm','pf-paid']
    .forEach(id => { const el = document.getElementById(id); if (el) el.value = ''; });
  const stageEl = document.getElementById('pf-stage');
  if (stageEl) { stageEl.value = proStages[0] || 'PENDING OFFER LETTER'; stageEl.dataset.prev = stageEl.value; }
  document.getElementById('pro-form-timeline').innerHTML = '<div class="tl-empty">Save candidate first to see timeline.</div>';
  document.getElementById('pro-tab-details').style.display = '';
  ['pipeline','commission','timeline'].forEach(t => {
    const el = document.getElementById(`pro-tab-${t}`); if (el) el.style.display = 'none';
  });
  document.getElementById('pro-modal').querySelectorAll('.modal-tab').forEach((b, i) => b.classList.toggle('active', i === 0));
  document.getElementById('pro-modal').classList.add('open');
}

function editPro(id) {
  const r = proDB.find(x => x.id == id); if (!r) return;
  editingProId = id;
  document.getElementById('pro-modal-title').textContent = 'Edit — ' + r.name;
  document.getElementById('pf-name').value     = r.name;
  document.getElementById('pf-pp').value       = r.pp || '';
  document.getElementById('pf-phone').value    = r.phone || '';
  document.getElementById('pf-position').value = r.position || '';
  document.getElementById('pf-company').value  = r.company || '';
  document.getElementById('pf-country').value  = r.country || '';
  const stEl = document.getElementById('pf-stage');
  if (stEl) { stEl.value = r.stage; stEl.dataset.prev = r.stage; }
  document.getElementById('pf-comm').value       = r.commission || '';
  document.getElementById('pf-paid').value       = r.paid || '';
  document.getElementById('pf-submitted').value  = toInput(r.submitted);
  document.getElementById('pf-interview').value  = toInput(r.interview);
  document.getElementById('pf-ol').value         = toInput(r.ol);
  document.getElementById('pf-mol').value        = toInput(r.mol);
  document.getElementById('pf-visa').value       = toInput(r.visa);
  document.getElementById('pf-travel').value     = toInput(r.travel);
  document.getElementById('pro-form-timeline').innerHTML = renderTimelineHTML('pro', id);
  document.getElementById('pro-tab-details').style.display = '';
  ['pipeline','commission','timeline'].forEach(t => {
    const el = document.getElementById(`pro-tab-${t}`); if (el) el.style.display = 'none';
  });
  document.getElementById('pro-modal').querySelectorAll('.modal-tab').forEach((b, i) => b.classList.toggle('active', i === 0));
  document.getElementById('pro-modal').classList.add('open');
}

async function savePro() {
  const name = document.getElementById('pf-name').value.trim();
  if (!name) { showToast('Full name is required', 'error'); return; }
  const oldStage = editingProId ? (proDB.find(x => x.id == editingProId) || {}).stage : null;
  const newStage = document.getElementById('pf-stage').value;
  const rec = {
    name:      name.toUpperCase(),
    pp:        document.getElementById('pf-pp').value.trim().toUpperCase(),
    phone:     document.getElementById('pf-phone').value.trim(),
    position:  document.getElementById('pf-position').value.trim().toUpperCase(),
    company:   document.getElementById('pf-company').value.trim().toUpperCase(),
    country:   document.getElementById('pf-country').value.trim(),
    stage:     newStage,
    submitted: document.getElementById('pf-submitted').value || null,
    interview: document.getElementById('pf-interview').value || null,
    ol:        document.getElementById('pf-ol').value || null,
    mol:       document.getElementById('pf-mol').value || null,
    visa:      document.getElementById('pf-visa').value || null,
    travel:    document.getElementById('pf-travel').value || null,
    commission: document.getElementById('pf-comm').value ? Number(document.getElementById('pf-comm').value) : null,
    paid:       document.getElementById('pf-paid').value ? Number(document.getElementById('pf-paid').value) : null,
  };
  if (editingProId) {
    rec.id = editingProId;
    const i = proDB.findIndex(x => x.id == editingProId);
    proDB[i] = { ...proDB[i], ...rec };
    addTimeline('pro', editingProId, oldStage !== newStage ? `Stage: "${oldStage}" → "${newStage}"` : 'Details updated');
    showToast('Candidate updated ✓', 'success');
  } else {
    rec.id = Date.now();
    proDB.push(rec);
    addTimeline('pro', rec.id, `Added — Stage: ${newStage}`);
    showToast('Candidate added ✓', 'success');
  }
  closeModal('pro-modal');
  renderPro(); renderDash();
  await saveProRecord(rec);
}

async function deletePro(id) {
  const r = proDB.find(x => x.id == id);
  if (!confirm(`Delete ${r ? r.name : 'this candidate'}? Cannot be undone.`)) return;
  proDB = proDB.filter(x => x.id != id);
  showToast('Deleted', 'success');
  renderPro(); renderDash();
  await deleteProRecord(id);
}

// ══════════════════════════════════════════════════════════
// LB JOBS
// ══════════════════════════════════════════════════════════
function getFilteredLB() {
  const q      = (document.getElementById('lb-search')?.value || '').toLowerCase();
  const travel = window.lbTravelPillFilter || '';
  const refund = document.getElementById('lb-refund-f')?.value || '';
  return lbDB.filter(r => {
    const text = `${r.name} ${r.phone || ''}`.toLowerCase();
    const ts   = r.travelStatus || r.travel_status || '';
    const rs   = getRefundStatus(r);
    return (!q || text.includes(q)) && (!travel || ts === travel) && (!refund || rs === refund);
  });
}

function renderLB() {
  let lbOwed = 0, lbPaid = 0;
  lbDB.forEach(r => {
    if ((r.travelStatus||r.travel_status) === 'TRAVELLED' &&
        (r.ppStatus||r.pp_status) !== 'HAD PP' &&
        (r.notes||'').trim().toUpperCase() !== 'RETURNED') {
      lbOwed += Number(r.toRefund||r.to_refund) || 0;
      lbPaid += (Number(r.r1Amt||r.r1_amt)||0) + (Number(r.r2Amt||r.r2_amt)||0);
    }
  });

  const metricsEl = document.getElementById('lb-metrics');
  if (metricsEl) metricsEl.innerHTML = `
    <div class="metric-card"><div class="metric-label">Total</div><div class="metric-val">${lbDB.length}</div></div>
    <div class="metric-card"><div class="metric-label">In process</div><div class="metric-val amber">${lbDB.filter(isInProcessLB).length}</div></div>
    <div class="metric-card"><div class="metric-label">Travelled</div><div class="metric-val green">${lbDB.filter(r=>(r.travelStatus||r.travel_status)==='TRAVELLED').length}</div></div>
    <div class="metric-card"><div class="metric-label">Refund balance</div><div class="metric-val sm amber">$${lbOwed-lbPaid}</div></div>
    <div class="metric-card"><div class="metric-label">Incomplete</div><div class="metric-val red">${lbDB.filter(r=>getRefundStatus(r)==='incomplete').length}</div></div>`;

  const data       = getFilteredLB();
  const totalPages = Math.max(1, Math.ceil(data.length / PER_PAGE));
  if (lbPage > totalPages) lbPage = 1;
  const slice = data.slice((lbPage - 1) * PER_PAGE, lbPage * PER_PAGE);

  const tbody = document.getElementById('lb-tbody');
  if (!tbody) return;

  if (!slice.length) {
    tbody.innerHTML = `<tr><td colspan="12"><div class="empty">No candidates found</div></td></tr>`;
  } else {
    tbody.innerHTML = slice.map((r, i) => {
      const rs   = getRefundStatus(r);
      const ts   = r.travelStatus || r.travel_status || '';
      const toR  = Number(r.toRefund || r.to_refund) || 0;
      const paid = (Number(r.r1Amt || r.r1_amt) || 0) + (Number(r.r2Amt || r.r2_amt) || 0);
      const bal  = (rs === 'N/A' || rs === 'RETURNED') ? '—' : '$' + (toR - paid);
      const td   = r.travelDate || r.travel_date;
      const hd   = hasDocs('lb', r.id);
      return `<tr onclick="editLB(${r.id})">
        <td>${(lbPage-1)*PER_PAGE+i+1}</td>
        <td class="name-cell">${r.name}</td>
        <td>${r.phone || '—'}</td>
        <td>${r.ppStatus || r.pp_status || '—'}</td>
        <td>${travelBadge(ts)}</td>
        <td>${fmtDate(td)}</td>
        <td>${rs === 'N/A' ? '—' : '$' + toR}</td>
        <td>${rs === 'N/A' ? '—' : '$' + paid}</td>
        <td class="${rs==='incomplete'?'balance-owed':''}">${bal}</td>
        <td>${refundBadge(rs)}</td>
        <td onclick="event.stopPropagation()">
          <button class="action-btn docs" onclick="openDocs('lb',${r.id},'${r.name.replace(/'/g,"\\'")}')">
            <i class="ti ti-paperclip"></i>${hd?' <i class="ti ti-check" style="color:var(--green);font-size:11px"></i>':''}
          </button>
        </td>
        <td onclick="event.stopPropagation()">
          <button class="action-btn del" onclick="deleteLB(${r.id})"><i class="ti ti-trash"></i></button>
        </td>
      </tr>`;
    }).join('');
  }
  renderPagination('lb-pagination', lbPage, totalPages, data.length, 'lb');
}

function openLBForm() {
  editingLbId = null;
  document.getElementById('lb-modal-title').textContent = 'Add LB candidate';
  ['lf-name','lf-phone','lf-tdate','lf-torefund','lf-r1date','lf-r1amt','lf-r2date','lf-r2amt','lf-notes']
    .forEach(id => { const el = document.getElementById(id); if (el) el.value = ''; });
  document.getElementById('lf-pp').value = 'APPLIED';
  const tvEl = document.getElementById('lf-travel');
  if (tvEl) { tvEl.value = lbStages[0] || 'NOT YET'; tvEl.dataset.prev = tvEl.value; }
  document.getElementById('lb-form-timeline').innerHTML = '<div class="tl-empty">Save candidate first to see timeline.</div>';
  document.getElementById('lb-tab-details').style.display = '';
  ['refunds','timeline'].forEach(t => {
    const el = document.getElementById(`lb-tab-${t}`); if (el) el.style.display = 'none';
  });
  document.getElementById('lb-modal').querySelectorAll('.modal-tab').forEach((b, i) => b.classList.toggle('active', i === 0));
  document.getElementById('lb-modal').classList.add('open');
}

function editLB(id) {
  const r = lbDB.find(x => x.id == id); if (!r) return;
  editingLbId = id;
  document.getElementById('lb-modal-title').textContent = 'Edit — ' + r.name;
  document.getElementById('lf-name').value     = r.name;
  document.getElementById('lf-phone').value    = r.phone || '';
  document.getElementById('lf-pp').value       = r.ppStatus || r.pp_status || 'APPLIED';
  const tvEl = document.getElementById('lf-travel');
  if (tvEl) { tvEl.value = r.travelStatus || r.travel_status || 'NOT YET'; tvEl.dataset.prev = tvEl.value; }
  document.getElementById('lf-tdate').value    = toInput(r.travelDate || r.travel_date);
  document.getElementById('lf-torefund').value = r.toRefund || r.to_refund || '';
  document.getElementById('lf-r1date').value   = toInput(r.r1Date || r.r1_date);
  document.getElementById('lf-r1amt').value    = r.r1Amt || r.r1_amt || '';
  document.getElementById('lf-r2date').value   = toInput(r.r2Date || r.r2_date);
  document.getElementById('lf-r2amt').value    = r.r2Amt || r.r2_amt || '';
  document.getElementById('lf-notes').value    = r.notes || '';
  document.getElementById('lb-form-timeline').innerHTML = renderTimelineHTML('lb', id);
  document.getElementById('lb-tab-details').style.display = '';
  ['refunds','timeline'].forEach(t => {
    const el = document.getElementById(`lb-tab-${t}`); if (el) el.style.display = 'none';
  });
  document.getElementById('lb-modal').querySelectorAll('.modal-tab').forEach((b, i) => b.classList.toggle('active', i === 0));
  document.getElementById('lb-modal').classList.add('open');
}

async function saveLB() {
  const name = document.getElementById('lf-name').value.trim();
  if (!name) { showToast('Full name is required', 'error'); return; }
  const ppStatus  = document.getElementById('lf-pp').value;
  const isHadPP   = ppStatus === 'HAD PP';
  const oldTravel = editingLbId ? ((lbDB.find(x => x.id == editingLbId) || {}).travelStatus || '') : null;
  const newTravel = document.getElementById('lf-travel').value;
  const rec = {
    name:         name.toUpperCase(),
    phone:        document.getElementById('lf-phone').value.trim(),
    ppStatus,
    travelStatus: newTravel,
    travelDate:   document.getElementById('lf-tdate').value || null,
    toRefund:     isHadPP ? 0 : (Number(document.getElementById('lf-torefund').value) || 0),
    r1Date:       document.getElementById('lf-r1date').value || null,
    r1Amt:        isHadPP ? 0 : (Number(document.getElementById('lf-r1amt').value) || 0),
    r2Date:       document.getElementById('lf-r2date').value || null,
    r2Amt:        isHadPP ? 0 : (Number(document.getElementById('lf-r2amt').value) || 0),
    notes:        document.getElementById('lf-notes').value.trim(),
  };
  if (editingLbId) {
    rec.id = editingLbId;
    const i = lbDB.findIndex(x => x.id == editingLbId);
    lbDB[i] = { ...lbDB[i], ...rec };
    addTimeline('lb', editingLbId, oldTravel !== newTravel ? `Travel: "${oldTravel}" → "${newTravel}"` : 'Details updated');
    showToast('Candidate updated ✓', 'success');
  } else {
    rec.id = Date.now();
    lbDB.push(rec);
    addTimeline('lb', rec.id, `Added — ${ppStatus}, ${newTravel}`);
    showToast('Candidate added ✓', 'success');
  }
  closeModal('lb-modal');
  renderLB(); renderDash();
  await saveLBRecord(rec);
}

async function deleteLB(id) {
  const r = lbDB.find(x => x.id == id);
  if (!confirm(`Delete ${r ? r.name : 'this candidate'}? Cannot be undone.`)) return;
  lbDB = lbDB.filter(x => x.id != id);
  showToast('Deleted', 'success');
  renderLB(); renderDash();
  await deleteLBRecord(id);
}

// ══════════════════════════════════════════════════════════
// DOCUMENTS
// ══════════════════════════════════════════════════════════
function hasDocs(type, id) {
  const v = allDocs[`${type}_${id}`];
  return typeof v === 'string' && v.trim().length > 0;
}

function openDocs(type, id, name) {
  docsTarget = { type, id, name };
  document.getElementById('docs-modal-title').textContent = `Documents — ${name}`;
  let existing = allDocs[`${type}_${id}`];
  if (typeof existing !== 'string') existing = '';
  const input  = document.getElementById('docs-link-input');
  const openBtn = document.getElementById('docs-open-btn');
  input.value   = existing;
  openBtn.disabled = !existing.trim();
  document.getElementById('docs-modal').classList.add('open');
}

function onDocsLinkInput() {
  const val = document.getElementById('docs-link-input').value.trim();
  document.getElementById('docs-open-btn').disabled = !val;
}

function openCurrentDocLink() {
  const val = document.getElementById('docs-link-input').value.trim();
  if (val) window.open(val, '_blank');
}

async function saveDocs() {
  if (!docsTarget) return;
  const { type, id } = docsTarget;
  const link = document.getElementById('docs-link-input').value.trim();
  const dbKey = `${type}_${id}`;
  allDocs[dbKey] = link;
  addTimeline(type, id, link ? 'Documents link updated' : 'Documents link removed');
  closeModal('docs-modal');
  showToast('Documents saved ✓', 'success');
  if (type === 'pro') renderPro(); else renderLB();
  await saveDocsToDB(dbKey, link);
}

// ══════════════════════════════════════════════════════════
// EXPORT CSV
// ══════════════════════════════════════════════════════════
function exportCSV(type) {
  let headers, rows, filename;
  if (type === 'pro') {
    headers  = ['#','Name','Passport','Phone','Position','Company','Country','Stage','Commission (KES)','Paid (KES)','Balance (KES)','Submitted','Interview','Offer Letter','MOL','Visa','Travel Date'];
    rows     = proDB.map((r, i) => [
      i+1, r.name, r.pp||'', r.phone||'', r.position||'', r.company||'', r.country||'', r.stage,
      r.commission||'', r.paid||'', (r.commission&&r.paid) ? Number(r.commission)-Number(r.paid) : '',
      fmtDate(r.submitted), fmtDate(r.interview), fmtDate(r.ol), fmtDate(r.mol), fmtDate(r.visa), fmtDate(r.travel)
    ]);
    filename = 'Destiny_Professional';
  } else {
    headers  = ['#','Name','Phone','Passport Status','Travel Status','Travel Date','To Refund (USD)','Refunded (USD)','Balance (USD)','Refund Status','Notes'];
    rows     = lbDB.map((r, i) => {
      const rs   = getRefundStatus(r);
      const toR  = Number(r.toRefund||r.to_refund) || 0;
      const paid = (Number(r.r1Amt||r.r1_amt)||0) + (Number(r.r2Amt||r.r2_amt)||0);
      return [i+1, r.name, r.phone||'', r.ppStatus||r.pp_status||'', r.travelStatus||r.travel_status||'',
        fmtDate(r.travelDate||r.travel_date), rs==='N/A'?'':toR, rs==='N/A'?'':paid,
        (rs==='N/A'||rs==='RETURNED') ? '' : toR-paid, rs, r.notes||''];
    });
    filename = 'Destiny_LB';
  }
  const esc = v => `"${String(v == null ? '' : v).replace(/"/g, '""')}"`;
  const csv = [headers.map(esc).join(','), ...rows.map(r => r.map(esc).join(','))].join('\n');
  const a   = Object.assign(document.createElement('a'), {
    href:     URL.createObjectURL(new Blob([csv], { type: 'text/csv' })),
    download: `${filename}_${new Date().toISOString().split('T')[0]}.csv`
  });
  a.click();
  showToast('Export downloaded ✓', 'success');
}

// ══════════════════════════════════════════════════════════
// PAGINATION
// ══════════════════════════════════════════════════════════
function renderPagination(elId, page, total, count, which) {
  const el = document.getElementById(elId);
  if (!el) return;
  if (total <= 1) {
    el.innerHTML = `<span>${count} record${count !== 1 ? 's' : ''}</span><span></span>`;
    return;
  }
  let btns = '';
  for (let p = 1; p <= total; p++) {
    if (p === 1 || p === total || Math.abs(p - page) <= 1)
      btns += `<button class="page-btn ${p===page?'active':''}" onclick="goPage('${which}',${p})">${p}</button>`;
    else if (Math.abs(p - page) === 2)
      btns += `<span style="padding:4px 2px;color:var(--text-3);font-size:11px">…</span>`;
  }
  el.innerHTML = `<span>${count} record${count !== 1 ? 's' : ''}</span><div class="page-btns">${btns}</div>`;
}

function goPage(which, p) {
  if (which === 'pro') { proPage = p; renderPro(); }
  else                 { lbPage  = p; renderLB();  }
  document.querySelector('.content-area')?.scrollTo({ top: 0, behavior: 'smooth' });
}

// ══════════════════════════════════════════════════════════
// TOAST
// ══════════════════════════════════════════════════════════
function showToast(msg, type = '') {
  const t = document.getElementById('toast');
  if (!t) return;
  const icon = type === 'error' ? 'ti-alert-circle' : 'ti-circle-check';
  t.className = 'toast ' + type;
  t.innerHTML = `<i class="ti ${icon}"></i><span>${msg}</span>`;
  void t.offsetWidth;
  t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), 2800);
}
