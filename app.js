// Initialize Supabase Client Connection
const SUPABASE_URL = "https://pizirpyvkxzghvxlipzc.supabase.co"; // <-- Ensure this matches your project URL exactly
const SUPABASE_KEY = "sb_publishable_UIyIdjowYK4Klg2tU4Nz8A_t1BV2QgQ"; // <-- Ensure this matches your anon public key exactly
const supabase = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

// ─── STAFF ACCOUNTS ───────────────────────────────────────
const STAFF = {
  'fred':       { name: 'Fred',       password: 'Destiny@2025', role: 'admin' },
  'robert':     { name: 'Robert',     password: 'Robert@2025',  role: 'staff' },
  'doreen':     { name: 'Doreen',     password: 'Doreen@2025',  role: 'staff' },
  'maxwell':    { name: 'Maxwell',    password: 'Maxwell@2025', role: 'staff' },
  'consolata':  { name: 'Consolata',  password: 'Consol@2025',  role: 'staff' },
};
const RECOVERY_CODE = 'DR-RESET-2025';

// ─── STORAGE KEYS ─────────────────────────────────────────
const SK_PRO  = 'dr_pro_db';
const SK_LB   = 'dr_lb_db';
const SK_IDS  = 'dr_next_ids';
const SK_DOCS = 'dr_docs';
const SK_TL   = 'dr_timeline';
const SK_STAGES_PRO = 'dr_stages_pro';
const SK_STAGES_LB  = 'dr_stages_lb';

// ─── DEFAULT STAGES ───────────────────────────────────────
const DEFAULT_PRO_STAGES = [
  'PENDING OFFER LETTER',
  'PENDING MOL',
  'PENDING VISA',
  'PENDING TRAVEL',
  'TRAVELLED'
];
const DEFAULT_LB_STAGES = [
  'NOT YET',
  'TRAVELLED',
  'NOT TRAVELLED'
];

// ─── CONSTANTS ────────────────────────────────────────────
const PER_PAGE = 20;
const EXCEL_EPOCH = new Date(1899, 11, 30);

// ─── STATE ────────────────────────────────────────────────
let proDB = [];
let lbDB = [];

// Fetch your candidate profiles data from Supabase
async function fetchProfessionalDatabase() {
  const { data, error } = await supabase
    .from('professionals')
    .select('*')
    .order('status_updated_at', { ascending: false });

  if (error) {
    console.error("Error loading profiles:", error.message);
    return;
  }

  proDB = data; // Put the cloud records straight into your app's existing array
  renderPro();  // Run your fixed engine to draw the list onto the screen
}

// Fetch your refunds and logistics data from Supabase
async function fetchRefundsDatabase() {
  const { data, error } = await supabase
    .from('refunds_logistics')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error("Error loading logistics data:", error.message);
    return;
  }

  lbDB = data; // Put the cloud records straight into your app's existing logistics array
  renderLB();  // Run your fixed engine to draw the logistics list on screen
}

let nextProId = 38, nextLbId = 99;
let proPage = 1, lbPage = 1;
let editingProId = null, editingLbId = null;
let docsTargetId = null, docsTargetType = null;
let currentUser = null;
let saveTimer = null;
let proStages = [...DEFAULT_PRO_STAGES];
let lbStages  = [...DEFAULT_LB_STAGES];
let allDocs = {}, allTimelines = {};

// ─── AUTH ─────────────────────────────────────────────────
function doLogin() {
  const username = (document.getElementById('username-input').value || '').trim().toLowerCase();
  const password = document.getElementById('pw-input').value;
  const staff = STAFF[username];
  if (!staff || staff.password !== password) {
    document.getElementById('login-error').style.display = 'block';
    return;
  }
  currentUser = { username, ...staff };
  sessionStorage.setItem('dr_auth', JSON.stringify(currentUser));
  document.getElementById('login-screen').style.display = 'none';
  document.getElementById('app').style.display = 'block';
  document.getElementById('user-chip').textContent = staff.name + (staff.role === 'admin' ? ' 👑' : '');
  loadData();
}

function doLogout() {
  sessionStorage.removeItem('dr_auth');
  currentUser = null;
  document.getElementById('app').style.display = 'none';
  document.getElementById('login-screen').style.display = 'flex';
  document.getElementById('pw-input').value = '';
  document.getElementById('username-input').value = '';
  document.getElementById('login-error').style.display = 'none';
}

function togglePassword() {
  const input = document.getElementById('pw-input');
  const btn = document.getElementById('pw-toggle');
  if (input.type === 'password') {
    input.type = 'text';
    btn.textContent = '🙈';
  } else {
    input.type = 'password';
    btn.textContent = '👁';
  }
}

function showForgotPassword() {
  document.getElementById('forgot-section').style.display = 'block';
  document.getElementById('login-main').style.display = 'none';
}

function hideForgotPassword() {
  document.getElementById('forgot-section').style.display = 'none';
  document.getElementById('login-main').style.display = 'block';
  document.getElementById('recovery-code-input').value = '';
  document.getElementById('forgot-error').style.display = 'none';
  document.getElementById('forgot-result').style.display = 'none';
}

function submitForgotPassword() {
  const code = (document.getElementById('recovery-code-input').value || '').trim();
  const errEl = document.getElementById('forgot-error');
  const resultEl = document.getElementById('forgot-result');
  if (code !== RECOVERY_CODE) {
    errEl.style.display = 'block';
    errEl.textContent = 'Incorrect recovery code.';
    return;
  }
  errEl.style.display = 'none';
  resultEl.style.display = 'block';
  resultEl.innerHTML = `
    <div style="text-align:left;font-size:13px">
      <div style="font-weight:600;margin-bottom:8px;color:var(--green)">✓ Recovery code verified. Staff passwords:</div>
      ${Object.entries(STAFF).map(([u,s])=>`<div style="padding:4px 0;border-bottom:1px solid var(--border)"><b>${s.name}</b> — username: <code>${u}</code> / password: <code>${s.password}</code></div>`).join('')}
    </div>`;
}

// check session on load
window.addEventListener('DOMContentLoaded', () => {
  const saved = sessionStorage.getItem('dr_auth');
  if (saved) {
    try {
      currentUser = JSON.parse(saved);
      document.getElementById('login-screen').style.display = 'none';
      document.getElementById('app').style.display = 'block';
      document.getElementById('user-chip').textContent = currentUser.name + (currentUser.role === 'admin' ? ' 👑' : '');
      loadData();
    } catch(e) { sessionStorage.removeItem('dr_auth'); }
  }
});

// ─── STORAGE ──────────────────────────────────────────────
function loadData() {
  // Fire live asynchronous cloud fetching processes immediately to hydrate state
  fetchProfessionalDatabase();
  fetchRefundsDatabase();

  try {
    const ids  = localStorage.getItem(SK_IDS);
    const docs = localStorage.getItem(SK_DOCS);
    const tl   = localStorage.getItem(SK_TL);
    const stp  = localStorage.getItem(SK_STAGES_PRO);
    const stl  = localStorage.getItem(SK_STAGES_LB);
    if (ids)  { const p = JSON.parse(ids); nextProId = p.pro; nextLbId = p.lb; }
    if (docs) allDocs = JSON.parse(docs);
    if (tl)   allTimelines = JSON.parse(tl);
    if (stp)  proStages = JSON.parse(stp);
    if (stl)  lbStages  = JSON.parse(stl);
  } catch(e) {
    console.warn("Local storage config hydration warning:", e);
  }
  rebuildStageFilters();
  renderDash();
}

function persist() {
  try {
    localStorage.setItem(SK_IDS,  JSON.stringify({ pro: nextProId, lb: nextLbId }));
    localStorage.setItem(SK_DOCS, JSON.stringify(allDocs));
    localStorage.setItem(SK_TL,   JSON.stringify(allTimelines));
    localStorage.setItem(SK_STAGES_PRO, JSON.stringify(proStages));
    localStorage.setItem(SK_STAGES_LB,  JSON.stringify(lbStages));
    setSaveStatus('saved');
  } catch(e) { setSaveStatus('error'); }
}

function scheduleSave() {
  setSaveStatus('saving');
  if (saveTimer) clearTimeout(saveTimer);
  saveTimer = setTimeout(persist, 800);
}

function setSaveStatus(s) {
  const el  = document.getElementById('save-status');
  if (!el) return;
  el.className = 'save-status';
  if (s === 'saved')  { el.classList.add('saved');  el.innerHTML = '✓ <span id="save-text">Saved</span>'; }
  if (s === 'saving') { el.classList.add('saving'); el.innerHTML = '↻ <span id="save-text">Saving…</span>'; }
  if (s === 'error')  { el.innerHTML = '⚠ <span id="save-text">Save failed</span>'; }
}

// ─── TIMELINE ─────────────────────────────────────────────
function addTimeline(type, id, action) {
  const key = `${type}_${id}`;
  if (!allTimelines[key]) allTimelines[key] = [];
  allTimelines[key].unshift({
    action,
    user: currentUser ? currentUser.name : 'Unknown',
    ts: new Date().toISOString()
  });
  if (allTimelines[key].length > 50) allTimelines[key] = allTimelines[key].slice(0, 50);
}

function renderTimeline(type, id) {
  const key = `${type}_${id}`;
  const items = allTimelines[key] || [];
  if (!items.length) return '<div class="tl-empty">No activity recorded yet.</div>';
  return items.map(item => {
    const d = new Date(item.ts);
    const dateStr = d.toLocaleDateString('en-GB', { day:'2-digit', month:'short', year:'2-digit' });
    const timeStr = d.toLocaleTimeString('en-GB', { hour:'2-digit', minute:'2-digit' });
    return `<div class="tl-item">
      <div class="tl-dot"></div>
      <div class="tl-content">
        <div class="tl-action">${item.action}</div>
        <div class="tl-meta">${item.user} · ${dateStr} ${timeStr}</div>
      </div>
    </div>`;
  }).join('');
}

// ─── HELPERS ──────────────────────────────────────────────
function xlToDate(n) {
  if (!n || isNaN(n)) return '';
  return new Date(EXCEL_EPOCH.getTime() + n * 86400000).toISOString().split('T')[0];
}

function fmtDate(v) {
  if (!v) return '—';
  const s = typeof v === 'number' ? xlToDate(v) : v;
  if (!s) return '—';
  try {
    const d = new Date(s);
    if (isNaN(d)) return s;
    return d.toLocaleDateString('en-GB', { day:'2-digit', month:'short', year:'2-digit' });
  } catch { return s; }
}

function toInput(v) {
  if (!v) return '';
  if (typeof v === 'number') return xlToDate(v);
  return v;
}

function daysSince(v) {
  if (!v) return null;
  const s = typeof v === 'number' ? xlToDate(v) : v;
  if (!s) return null;
  const d = new Date(s);
  if (isNaN(d)) return null;
  return Math.floor((Date.now() - d.getTime()) / 86400000);
}

function getRefundStatus(r) {
  if (r.ppStatus === 'HAD PP') return 'N/A';
  if ((r.notes || '').trim().toUpperCase() === 'RETURNED') return 'RETURNED';
  if (!r.toRefund || r.toRefund === 0) return 'N/A';
  const paid = (Number(r.r1Amt) || 0) + (Number(r.r2Amt) || 0);
  return paid >= r.toRefund ? 'complete' : 'incomplete';
}

// Fixed fields parsing to accept matching database payload keys safely
function isInProcess_Pro(r) {
  const currentStage = r.stage || r.file_status;
  return ['PENDING OFFER LETTER','PENDING MOL','PENDING VISA','PENDING TRAVEL'].includes(currentStage);
}

function isInProcess_LB(r) {
  return r.ppStatus !== 'HAD PP' && (r.travelStatus === 'NOT YET' || r.travel_status === 'NOT YET') &&
         (r.ppStatus === 'APPLIED' || r.ppStatus === 'PUSHED' || r.ppStatus === 'NOT APPLIED');
}

function stageBadge(s) {
  if (!s) return '<span class="badge b-na">—</span>';
  const map = {
    'PENDING OFFER LETTER': 'b-pol',
    'PENDING MOL':          'b-mol',
    'PENDING VISA':         'b-visa',
    'PENDING TRAVEL':       'b-travel',
    'TRAVELLED':            'b-travelled',
  };
  return `<span class="badge ${map[s] || 'b-na'}">${s.replace('PENDING ','')}</span>`;
}

function travelBadge(s) {
  if (!s) return '<span class="badge b-na">—</span>';
  const map = { 'TRAVELLED':'b-travelled','NOT YET':'b-notyet','NOT TRAVELLED':'b-nottravelled' };
  return `<span class="badge ${map[s]||'b-na'}">${s}</span>`;
}

function refundBadge(s) {
  const map = { complete:'b-complete', incomplete:'b-incomplete', RETURNED:'b-returned', 'N/A':'b-na' };
  return `<span class="badge ${map[s]||'b-na'}">${s}</span>`;
}

function docCount(type, id) {
  const key = `${type}_${id}`;
  const d = allDocs[key] || {};
  return Object.values(d).filter(v => v && v.trim()).length;
}

// ─── STAGES MANAGEMENT ────────────────────────────────────
function rebuildStageFilters() {
  const psf = document.getElementById('pro-stage-f');
  if (psf) {
    psf.innerHTML = '<option value="">All stages</option>' +
      proStages.map(s => `<option value="${s}">${s}</option>`).join('');
  }
  const pfs = document.getElementById('pf-stage');
  if (pfs) {
    const cur = pfs.value;
    pfs.innerHTML = proStages.map(s => `<option value="${s}">${s}</option>`).join('');
    if (cur) pfs.value = cur;
  }
  const ltf = document.getElementById('lb-travel-f');
  if (ltf) {
    ltf.innerHTML = '<option value="">All travel statuses</option>' +
      lbStages.map(s => `<option value="${s}">${s}</option>`).join('');
  }
  const lft = document.getElementById('lf-travel');
  if (lft) {
    const cur = lft.value;
    lft.innerHTML = lbStages.map(s => `<option value="${s}">${s}</option>`).join('');
    if (cur) lft.value = cur;
  }
}

function openAddStageModal(type) {
  const name = prompt(`Enter new ${type === 'pro' ? 'Professional stage' : 'LB travel status'} name:`);
  if (!name || !name.trim()) return;
  const val = name.trim().toUpperCase();
  if (type === 'pro') {
    if (proStages.includes(val)) { showToast('Stage already exists', 'error'); return; }
    proStages.splice(proStages.length - 1, 0, val);
  } else {
    if (lbStages.includes(val)) { showToast('Status already exists', 'error'); return; }
    lbStages.push(val);
  }
  rebuildStageFilters();
  scheduleSave();
  showToast(`"${val}" added ✓`, 'success');
}

// ─── TAB SWITCH ───────────────────────────────────────────
function switchTab(t) {
  ['dash','pro','lb'].forEach(x => {
    document.getElementById(`tab-${x}`).classList.toggle('active', x === t);
    document.getElementById(`${x}-section`).style.display = x === t ? '' : 'none';
  });
  if (t === 'pro') renderPro();
  if (t === 'lb')  renderLB();
  if (t === 'dash') renderDash();
}

// ─── MODAL TAB SWITCH ─────────────────────────────────────
function switchModalTab(modal, tab, btn) {
  const prefix = modal === 'pro' ? 'pro-tab-' : 'lb-tab-';
  const tabs = modal === 'pro'
    ? ['details','pipeline','commission','timeline']
    : ['details','refunds','timeline'];
  tabs.forEach(t => {
    const el = document.getElementById(prefix + t);
    if (el) el.style.display = t === tab ? '' : 'none';
  });
  btn.closest('.modal-tabs').querySelectorAll('.modal-tab')
    .forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
}

// ─── DASHBOARD ────────────────────────────────────────────
function renderDash() {
  const alerts = [];
  const STUCK_DAYS = 60;
  const OVERDUE_DAYS = 30;

  proDB.forEach(r => {
    const rName = r.candidate_name || r.name;
    const rStage = r.file_status || r.stage;
    if (isInProcess_Pro(r)) {
      const lastDate = r.visa || r.mol || r.ol || r.interview || r.submitted;
      const days = daysSince(lastDate);
      if (days && days > STUCK_DAYS) {
        alerts.push({ level:'red', name:rName, msg:`Stuck at "${rStage}" for ${days} days` });
      }
    }
  });
  lbDB.forEach(r => {
    const rName = r.client_name || r.name;
    const rTravel = r.travel_status || r.travelStatus;
    const rs = getRefundStatus(r);
    if (rs === 'incomplete' && rTravel === 'TRAVELLED') {
      const lastPay = r.r1Date || r.travelDate;
      const days = daysSince(lastPay);
      if (days && days > OVERDUE_DAYS) {
        const totalRefundAmt = r.amount_paid || r.toRefund;
        const bal = (Number(totalRefundAmt)||0) - ((Number(r.r1Amt)||0)+(Number(r.r2Amt)||0));
        alerts.push({ level:'amber', name:rName, msg:`Refund overdue by ${days} days — $${bal} still owed` });
      }
    }
  });

  const alertsEl = document.getElementById('dash-alerts');
  if (alertsEl) {
    if (alerts.length) {
      alertsEl.innerHTML = `<div class="alerts-card">
        <h3>⚠️ Alerts (${alerts.length})</h3>
        ${alerts.slice(0,10).map(a => `<div class="alert-row">
          <div class="alert-dot ${a.level}"></div>
          <div><div class="alert-name">${a.name}</div><div class="alert-msg">${a.msg}</div></div>
        </div>`).join('')}
      </div>`;
    } else {
      alertsEl.innerHTML = `<div class="alerts-card">
        <h3>✅ Alerts</h3>
        <div class="no-alerts">No issues — everything is on track!</div>
      </div>`;
    }
  }

  // Pro summary
  const proInProcess = proDB.filter(isInProcess_Pro).length;
  const proTravelled = proDB.filter(r => (r.file_status || r.stage) === 'TRAVELLED').length;
  let totalComm = 0, totalPaid = 0;
  proDB.forEach(r => { if(r.commission) totalComm += Number(r.commission); if(r.paid) totalPaid += Number(r.paid); });
  
  const proCard = document.getElementById('dash-pro-card');
  if (proCard) {
    proCard.innerHTML = `
      <h3>💼 Professional Jobs</h3>
      <div class="dash-stage-row"><span class="dash-stage-label">Total candidates</span><span class="dash-stage-count">${proDB.length}</span></div>
      <div class="dash-stage-row"><span class="dash-stage-label">In process <span style="font-size:11px;color:var(--text-3)">(OL → MOL → Visa)</span></span><span class="dash-stage-count" style="color:var(--amber)">${proInProcess}</span></div>
      <div class="dash-stage-row"><span class="dash-stage-label">Travelled</span><span class="dash-stage-count" style="color:var(--green)">${proTravelled}</span></div>
      <div class="dash-stage-row"><span class="dash-stage-label">Commission billed</span><span class="dash-stage-count">KES ${totalComm.toLocaleString()}</span></div>
      <div class="dash-stage-row"><span class="dash-stage-label">Outstanding</span><span class="dash-stage-count" style="color:var(--amber)">KES ${(totalComm-totalPaid).toLocaleString()}</span></div>`;
  }

  // LB summary
  const lbTravelled    = lbDB.filter(r => (r.travel_status || r.travelStatus) === 'TRAVELLED').length;
  const lbInProcess    = lbDB.filter(isInProcess_LB).length;
  const lbIncomplete   = lbDB.filter(r => getRefundStatus(r) === 'incomplete').length;
  let lbOwed = 0, lbPaid = 0;
  lbDB.forEach(r => {
    const rTravel = r.travel_status || r.travelStatus;
    if (rTravel === 'TRAVELLED' && r.ppStatus !== 'HAD PP' && (r.notes||'').trim().toUpperCase() !== 'RETURNED') {
      lbOwed += Number(r.amount_paid || r.toRefund) || 0;
      lbPaid += (Number(r.r1Amt)||0) + (Number(r.r2Amt)||0);
    }
  });
  
  const lbCard = document.getElementById('dash-lb-card');
  if (lbCard) {
    lbCard.innerHTML = `
      <h3>🏠 LB Jobs</h3>
      <div class="dash-stage-row"><span class="dash-stage-label">Total candidates</span><span class="dash-stage-count">${lbDB.length}</span></div>
      <div class="dash-stage-row"><span class="dash-stage-label">In process <span style="font-size:11px;color:var(--text-3)">(passport applied, not yet travelled)</span></span><span class="dash-stage-count" style="color:var(--amber)">${lbInProcess}</span></div>
      <div class="dash-stage-row"><span class="dash-stage-label">Travelled</span><span class="dash-stage-count" style="color:var(--green)">${lbTravelled}</span></div>
      <div class="dash-stage-row"><span class="dash-stage-label">Refund balance owed</span><span class="dash-stage-count" style="color:var(--amber)">$${lbOwed - lbPaid}</span></div>
      <div class="dash-stage-row"><span class="dash-stage-label">Incomplete refunds</span><span class="dash-stage-count" style="color:var(--red)">${lbIncomplete}</span></div>`;
  }

  // Pro stage breakdown
  const stageCounts = {};
  proStages.forEach(s => stageCounts[s] = proDB.filter(r => (r.file_status || r.stage) === s).length);
  const maxStage = Math.max(...Object.values(stageCounts), 1);
  
  const proStagesEl = document.getElementById('dash-pro-stages');
  if (proStagesEl) {
    proStagesEl.innerHTML = `
      <h3>💼 Professional — Stage Breakdown</h3>
      ${proStages.map(s => `
        <div class="dash-stage-row" style="flex-direction:column;align-items:flex-start;gap:4px">
          <div style="display:flex;justify-content:space-between;width:100%">
            <span class="dash-stage-label">${s}</span>
            <span class="dash-stage-count">${stageCounts[s]||0}</span>
          </div>
          <div class="dash-stage-bar" style="width:100%">
            <div class="dash-stage-fill" style="width:${Math.round(((stageCounts[s]||0)/maxStage)*100)}%"></div>
          </div>
        </div>`).join('')}`;
  }

  // LB refund breakdown
  const lbComplete   = lbDB.filter(r => getRefundStatus(r) === 'complete').length;
  const lbReturned   = lbDB.filter(r => getRefundStatus(r) === 'RETURNED').length;
  const lbNA         = lbDB.filter(r => getRefundStatus(r) === 'N/A').length;
  const lbNotYet     = lbDB.filter(r => (r.travel_status || r.travelStatus) === 'NOT YET').length;
  const lbNotTrav    = lbDB.filter(r => (r.travel_status || r.travelStatus) === 'NOT TRAVELLED').length;
  
  const lbRefundsEl = document.getElementById('dash-lb-refunds');
  if (lbRefundsEl) {
    lbRefundsEl.innerHTML = `
      <h3>🏠 LB Jobs — Refund Overview</h3>
      <div class="dash-stage-row"><span class="dash-stage-label">✅ Refund complete</span><span class="dash-stage-count" style="color:var(--green)">${lbComplete}</span></div>
      <div class="dash-stage-row"><span class="dash-stage-label">⏳ Refund incomplete</span><span class="dash-stage-count" style="color:var(--amber)">${lbIncomplete}</span></div>
      <div class="dash-stage-row"><span class="dash-stage-label">↩️ Returned</span><span class="dash-stage-count" style="color:var(--red)">${lbReturned}</span></div>
      <div class="dash-stage-row"><span class="dash-stage-label">N/A (HAD PP)</span><span class="dash-stage-count">${lbNA}</span></div>
      <div class="dash-stage-row"><span class="dash-stage-label">🕐 Not yet travelled</span><span class="dash-stage-count" style="color:var(--blue)">${lbNotYet}</span></div>
      <div class="dash-stage-row"><span class="dash-stage-label">❌ Did not travel</span><span class="dash-stage-count">${lbNotTrav}</span></div>`;
  }
}

// ─── PROFESSIONAL ─────────────────────────────────────────
function getFilteredPro() {
  const q     = (document.getElementById('pro-search').value||'').toLowerCase();
  const stage = document.getElementById('pro-stage-f').value;
  const comp  = document.getElementById('pro-company-f').value;
  return proDB.filter(r => {
    const name = r.candidate_name || r.name;
    const currentStage = r.file_status || r.stage;
    const text = `${name} ${r.passport_number || r.pp || ''} ${r.company||''} ${r.position||''}`.toLowerCase();
    return (!q||text.includes(q)) && (!stage||currentStage===stage) && (!comp||r.company===comp);
  });
}

function renderPro() {
  let totalComm=0, totalPaid=0;
  proDB.forEach(r=>{if(r.commission)totalComm+=Number(r.commission);if(r.paid)totalPaid+=Number(r.paid);});
  const inProcess = proDB.filter(isInProcess_Pro).length;
  const travelled = proDB.filter(r=>(r.file_status || r.stage)==='TRAVELLED').length;
  
  const metricsEl = document.getElementById('pro-metrics');
  if (metricsEl) {
    metricsEl.innerHTML=`
      <div class="metric"><div class="metric-label">Total</div><div class="metric-val">${proDB.length}</div></div>
      <div class="metric"><div class="metric-label">In process</div><div class="metric-val amber">${inProcess}</div></div>
      <div class="metric"><div class="metric-label">Travelled</div><div class="metric-val green">${travelled}</div></div>
      <div class="metric"><div class="metric-label">Commission billed</div><div class="metric-val sm">KES ${totalComm.toLocaleString()}</div></div>
      <div class="metric"><div class="metric-label">Outstanding</div><div class="metric-val sm amber">KES ${(totalComm-totalPaid).toLocaleString()}</div></div>`;
  }

  const companies=[...new Set(proDB.map(r=>r.company).filter(Boolean))].sort();
  const sel=document.getElementById('pro-company-f');
  if (sel) {
    const cur=sel.value;
    sel.innerHTML='<option value="">All companies</option>'+companies.map(c=>`<option value="${c}"${c===cur?' selected':''}>${c}</option>`).join('');
  }

  const data=getFilteredPro();
  const totalPages=Math.max(1,Math.ceil(data.length/PER_PAGE));
  if(proPage>totalPages)proPage=1;
  const slice=data.slice((proPage-1)*PER_PAGE,proPage*PER_PAGE);
  const tbody=document.getElementById('pro-tbody');
  if(!tbody) return;
  
  if(!slice.length){
    tbody.innerHTML=`<tr><td colspan="13"><div class="empty">No candidates match your search</div></td></tr>`;
  } else {
    tbody.innerHTML=slice.map((r,i)=>{
      const comm=r.commission?'KES '+Number(r.commission).toLocaleString():'—';
      const paid=r.paid?'KES '+Number(r.paid).toLocaleString():'—';
      const bal=(r.commission&&r.paid)?Number(r.commission)-Number(r.paid):null;
      const balTxt=bal!==null?'KES '+bal.toLocaleString():'—';
      const dc=docCount('pro',r.id);
      const days=isInProcess_Pro(r)?daysSince(r.visa||r.mol||r.ol||r.submitted):null;
      const stuckFlag=(days&&days>60)?`<span title="Stuck ${days} days" style="color:var(--red);margin-left:4px">⚠</span>`:'';
      const name = r.candidate_name || r.name;
      const stage = r.file_status || r.stage;
      return `<tr>
        <td>${(proPage-1)*PER_PAGE+i+1}</td>
        <td class="name-cell">${name}${stuckFlag}</td>
        <td>${r.passport_number || r.pp || '—'}</td>
        <td>${r.phone||'—'}</td>
        <td>${r.position||'—'}</td>
        <td>${r.company||'—'}</td>
        <td>${r.country||'—'}</td>
        <td>${stageBadge(stage)}</td>
        <td>${comm}</td>
        <td>${paid}</td>
        <td class="${bal&&bal>0?'balance-owed':''}">${balTxt}</td>
        <td><button class="action-btn docs" onclick="openDocs('pro',${r.id},'${name.replace(/'/g, "\\'")}')" title="Documents">📎${dc>0?` <span style="font-size:10px">${dc}</span>`:''}</button></td>
        <td style="white-space:nowrap">
          <button class="action-btn" onclick="editPro(${r.id})" title="Edit">✏️</button>
          <button class="action-btn del" onclick="deletePro(${r.id})" title="Delete">🗑</button>
        </td></tr>`;
    }).join('');
  }
  renderPagination('pro-pagination',proPage,totalPages,data.length,'pro');
}

function openProForm(id) {
  editingProId = null;
  document.getElementById('pro-modal-title').textContent='Add professional candidate';
  ['pf-name','pf-pp','pf-phone','pf-position','pf-company','pf-country',
   'pf-submitted','pf-interview','pf-ol','pf-mol','pf-visa','pf-travel','pf-comm','pf-paid']
    .forEach(x=>document.getElementById(x).value='');
  document.getElementById('pf-stage').value=proStages[0]||'PENDING OFFER LETTER';
  document.getElementById('pro-form-timeline').innerHTML='<div class="tl-empty">Save candidate first to see timeline.</div>';
  switchModalTab('pro','details', document.querySelector('#pro-modal .modal-tab'));
  document.getElementById('pro-modal').classList.add('open');
}

function editPro(id) {
  const r=proDB.find(x=>x.id===id); if(!r)return;
  editingProId=id;
  const name = r.candidate_name || r.name;
  const stage = r.file_status || r.stage;
  document.getElementById('pro-modal-title').textContent='Edit candidate — '+ name;
  document.getElementById('pf-name').value=name;
  document.getElementById('pf-pp').value=r.passport_number || r.pp || '';
  document.getElementById('pf-phone').value=r.phone||'';
  document.getElementById('pf-position').value=r.position||'';
  document.getElementById('pf-company').value=r.company||'';
  document.getElementById('pf-country').value=r.country||'';
  document.getElementById('pf-stage').value=stage;
  document.getElementById('pf-comm').value=r.commission||'';
  document.getElementById('pf-paid').value=r.paid||'';
  document.getElementById('pf-submitted').value=toInput(r.submitted);
  document.getElementById('pf-interview').value=toInput(r.interview);
  document.getElementById('pf-ol').value=toInput(r.ol);
  document.getElementById('pf-mol').value=toInput(r.mol);
  document.getElementById('pf-visa').value=toInput(r.visa);
  document.getElementById('pf-travel').value=toInput(r.travel);
  document.getElementById('pro-form-timeline').innerHTML=renderTimeline('pro',id);
  switchModalTab('pro','details', document.querySelector('#pro-modal .modal-tab'));
  document.getElementById('pro-modal').classList.add('open');
}

// Rewritten async write to commit edits or creates dynamically right to Supabase cloud
async function savePro() {
  const nameInput=document.getElementById('pf-name').value.trim();
  if(!nameInput){showToast('Full name is required.','error');return;}
  const newStage=document.getElementById('pf-stage').value;
  
  const payload = {
    candidate_name: nameInput.toUpperCase(),
    passport_number: document.getElementById('pf-pp').value.trim().toUpperCase(),
    job_category: document.getElementById('pf-position').value.trim().toUpperCase(),
    country_destination: document.getElementById('pf-country').value.trim().toUpperCase(),
    file_status: newStage,
    notes: `Phone: ${document.getElementById('pf-phone').value.trim()} | Company: ${document.getElementById('pf-company').value.trim()}`,
    assigned_staff: currentUser ? currentUser.name : 'System'
  };

  if(editingProId){
    const { error } = await supabase.from('professionals').update(payload).eq('id', editingProId);
    if (error) return showToast('Cloud sync failed: ' + error.message, 'error');
    addTimeline('pro', editingProId, `Updated via cloud — Stage: ${newStage}`);
    showToast('Candidate synchronized to cloud ✓','success');
  } else {
    const { error } = await supabase.from('professionals').insert([payload]);
    if (error) return showToast('Cloud save failed: ' + error.message, 'error');
    showToast('New candidate deployed to cloud ✓','success');
  }
  
  closeModal('pro-modal');
  fetchProfessionalDatabase();
  renderDash();
}

async function deletePro(id) {
  if(!confirm(`Delete this candidate from cloud? This action is permanent.`))return;
  const { error } = await supabase.from('professionals').delete().eq('id', id);
  if (error) return showToast('Could not delete from cloud: ' + error.message, 'error');
  showToast('Candidate deleted from cloud','success');
  fetchProfessionalDatabase();
  renderDash();
}

// ─── LB ───────────────────────────────────────────────────
function getFilteredLB() {
  const q     =(document.getElementById('lb-search').value||'').toLowerCase();
  const travel=document.getElementById('lb-travel-f').value;
  const refund=document.getElementById('lb-refund-f').value;
  return lbDB.filter(r=>{
    const name = r.client_name || r.name;
    const text=`${name} ${r.phone||''}`.toLowerCase();
    const rs=getRefundStatus(r);
    const rTravel = r.travel_status || r.travelStatus;
    return (!q||text.includes(q))&&(!travel||rTravel===travel)&&(!refund||rs===refund);
  });
}

function renderLB() {
  const travelled=lbDB.filter(r=> (r.travel_status || r.travelStatus) === 'TRAVELLED').length;
  const inProcess=lbDB.filter(isInProcess_LB).length;
  const incomplete=lbDB.filter(r=>getRefundStatus(r)==='incomplete').length;
  let lbOwed=0,lbPaid=0;
  lbDB.forEach(r=>{
    const rTravel = r.travel_status || r.travelStatus;
    if(rTravel==='TRAVELLED'&&r.ppStatus!=='HAD PP'&&(r.notes||'').trim().toUpperCase()!=='RETURNED'){
      lbOwed+=Number(r.amount_paid || r.toRefund)||0;
      lbPaid+=(Number(r.r1Amt)||0)+(Number(r.r2Amt)||0);
    }
  });
  
  const metricsEl = document.getElementById('lb-metrics');
  if (metricsEl) {
    metricsEl.innerHTML=`
      <div class="metric"><div class="metric-label">Total</div><div class="metric-val">${lbDB.length}</div></div>
      <div class="metric"><div class="metric-label">In process</div><div class="metric-val amber">${inProcess}</div></div>
      <div class="metric"><div class="metric-label">Travelled</div><div class="metric-val green">${travelled}</div></div>
      <div class="metric"><div class="metric-label">Refund balance</div><div class="metric-val sm amber">$${lbOwed-lbPaid}</div></div>
      <div class="metric"><div class="metric-label">Incomplete refunds</div><div class="metric-val red">${incomplete}</div></div>`;
  }

  const data=getFilteredLB();
  const totalPages=Math.max(1,Math.ceil(data.length/PER_PAGE));
  if(lbPage>totalPages)lbPage=1;
  const slice=data.slice((lbPage-1)*PER_PAGE,lbPage*PER_PAGE);
  const tbody=document.getElementById('lb-tbody');
  if(!tbody) return;
  
  if(!slice.length){
    tbody.innerHTML=`<tr><td colspan="12"><div class="empty">No candidates match your search</div></td></tr>`;
  } else {
    tbody.innerHTML=slice.map((r,i)=>{
      const rs=getRefundStatus(r);
      const paid=(Number(r.r1Amt)||0)+(Number(r.r2Amt)||0);
      const totalRefundAmt = r.amount_paid || r.toRefund;
      const bal=(rs==='N/A'||rs==='RETURNED')?'—':'$'+(Number(totalRefundAmt)-paid);
      const toR=rs==='N/A'?'—':'$'+(totalRefundAmt||0);
      const paidDisp=rs==='N/A'?'—':'$'+paid;
      const dc=docCount('lb',r.id);
      const name = r.client_name || r.name;
      const rTravel = r.travel_status || r.travelStatus;
      const overdue=(rs==='incomplete'&&rTravel==='TRAVELLED'&&daysSince(r.r1Date||r.travelDate)>30);
      return `<tr>
        <td>${(lbPage-1)*PER_PAGE+i+1}</td>
        <td class="name-cell">${name}${overdue?'<span title="Refund overdue" style="color:var(--red);margin-left:4px">⚠</span>':''}</td>
        <td>${r.phone||'—'}</td>
        <td>${r.ppStatus || 'APPLIED'}</td>
        <td>${travelBadge(rTravel)}</td>
        <td>${fmtDate(r.travelDate)}</td>
        <td>${toR}</td>
        <td>${paidDisp}</td>
        <td class="${rs==='incomplete'?'balance-owed':''}">${bal}</td>
        <td>${refundBadge(rs)}</td>
        <td><button class="action-btn docs" onclick="openDocs('lb',${r.id},'${name.replace(/'/g, "\\'")}')" title="Documents">📎${dc>0?` <span style="font-size:10px">${dc}</span>`:''}</button></td>
        <td style="white-space:nowrap">
          <button class="action-btn" onclick="editLB(${r.id})" title="Edit">✏️</button>
          <button class="action-btn del" onclick="deleteLB(${r.id})" title="Delete">🗑</button>
        </td></tr>`;
    }).join('');
  }
  renderPagination('lb-pagination',lbPage,totalPages,data.length,'lb');
}

function openLBForm() {
  editingLbId=null;
  document.getElementById('lb-modal-title').textContent='Add LB candidate';
  ['lf-name','lf-phone','lf-tdate','lf-torefund','lf-r1date','lf-r1amt','lf-r2date','lf-r2amt','lf-notes']
    .forEach(x=>document.getElementById(x).value='');
  document.getElementById('lf-pp').value='APPLIED';
  document.getElementById('lf-travel').value=lbStages[0]||'NOT YET';
  document.getElementById('lb-form-timeline').innerHTML='<div class="tl-empty">Save candidate first to see timeline.</div>';
  switchModalTab('lb','details',document.querySelector('#lb-modal .modal-tab'));
  document.getElementById('lb-modal').classList.add('open');
}

function editLB(id) {
  const r=lbDB.find(x=>x.id===id);if(!r)return;
  editingLbId=id;
  const name = r.client_name || r.name;
  const rTravel = r.travel_status || r.travelStatus;
  document.getElementById('lb-modal-title').textContent='Edit — '+ name;
  document.getElementById('lf-name').value=name;
  document.getElementById('lf-phone').value=r.phone||'';
  document.getElementById('lf-pp').value=r.ppStatus || 'APPLIED';
  document.getElementById('lf-travel').value=rTravel;
  document.getElementById('lf-tdate').value=toInput(r.travelDate);
  document.getElementById('lf-torefund').value=r.amount_paid || r.toRefund || '';
  document.getElementById('lf-r1date').value=toInput(r.r1Date);
  document.getElementById('lf-r1amt').value=r.r1Amt||'';
  document.getElementById('lf-r2date').value=toInput(r.r2Date);
  document.getElementById('lf-r2amt').value=r.r2Amt||'';
  document.getElementById('lf-notes').value=r.remarks || r.notes || '';
  document.getElementById('lb-form-timeline').innerHTML=renderTimeline('lb',id);
  switchModalTab('lb','details',document.querySelector('#lb-modal .modal-tab'));
  document.getElementById('lb-modal').classList.add('open');
}

// Rewritten async write to commit edits or creates dynamically right to Supabase logistics tables
async function saveLB() {
  const nameInput=document.getElementById('lf-name').value.trim();
  if(!nameInput){showToast('Full name is required.','error');return;}
  const ppStatus=document.getElementById('lf-pp').value;
  const isHadPP=ppStatus==='HAD PP';
  const newTravel=document.getElementById('lf-travel').value;
  
  const payload = {
    client_name: nameInput.toUpperCase(),
    amount_paid: isHadPP ? 0 : (Number(document.getElementById('lf-torefund').value) || 0),
    refund_status: ppStatus,
    travel_status: newTravel,
    remarks: document.getElementById('lf-notes').value.trim()
  };

  if(editingLbId){
    const { error } = await supabase.from('refunds_logistics').update(payload).eq('id', editingLbId);
    if (error) return showToast('Cloud sync failed: ' + error.message, 'error');
    addTimeline('lb', editingLbId, `Logistics updated — Status: ${newTravel}`);
    showToast('Logistics data synchronized ✓','success');
  } else {
    const { error } = await supabase.from('refunds_logistics').insert([payload]);
    if (error) return showToast('Cloud save failed: ' + error.message, 'error');
    showToast('Logistics candidate saved to cloud ✓','success');
  }
  
  closeModal('lb-modal');
  fetchRefundsDatabase();
  renderDash();
}

async function deleteLB(id) {
  if(!confirm(`Delete this logistics file from cloud? This cannot be undone.`))return;
  const { error } = await supabase.from('refunds_logistics').delete().eq('id', id);
  if (error) return showToast('Could not delete from cloud: ' + error.message, 'error');
  showToast('Logistics record expunged','success');
  fetchRefundsDatabase();
  renderDash();
}

// ─── DOCUMENTS ────────────────────────────────────────────
const PRO_DOC_SLOTS = ['Passport','National ID','Offer Letter','MOL / Work Permit','Visa','Medical Certificate','Other'];
const LB_DOC_SLOTS  = ['Passport','National ID','Visa / Travel Docs','Other'];

function openDocs(type, id, name) {
  docsTargetId=id; docsTargetType=type;
  document.getElementById('docs-modal-title').textContent=`Documents — ${name}`;
  const key=`${type}_${id}`;
  const existing=allDocs[key]||{};
  const slots=type==='pro'?PRO_DOC_SLOTS:LB_DOC_SLOTS;
  document.getElementById('docs-grid').innerHTML=slots.map(slot=>{
    const val=existing[slot]||'';
    const hasLink=val&&val.trim();
    return `<div class="doc-slot">
      <div class="doc-slot-label">${slot}</div>
      <div class="doc-link-row">
        <input class="doc-link-input" type="text" id="doc-${slot.replace(/\s+/g,'_')}"
          placeholder="Paste Google Drive link…" value="${val}">
        <button class="doc-open-btn" ${!hasLink?'disabled':''} 
          onclick="openDocLink('${slot.replace(/\s+/g,'_')}')">Open</button>
      </div>
      <div class="doc-note">Share link from Google Drive → Share → Anyone with link</div>
    </div>`;
  }).join('');
  document.getElementById('docs-modal').classList.add('open');
}

function openDocLink(slotId) {
  const val=document.getElementById('doc-'+slotId).value.trim();
  if(val) window.open(val,'_blank');
}

function saveDocs() {
  if(!docsTargetId||!docsTargetType)return;
  const key=`${docsTargetType}_${docsTargetId}`;
  const slots=docsTargetType==='pro'?PRO_DOC_SLOTS:LB_DOC_SLOTS;
  const docs={};
  slots.forEach(slot=>{
    const val=(document.getElementById('doc-'+slot.replace(/\s+/g,'_'))||{}).value||'';
    if(val.trim()) docs[slot]=val.trim();
  });
  allDocs[key]=docs;
  addTimeline(docsTargetType,docsTargetId,'Documents updated');
  scheduleSave();
  showToast('Documents saved ✓','success');
  closeModal('docs-modal');
  if(docsTargetType==='pro')renderPro(); else renderLB();
}

// ─── EXCEL EXPORT ─────────────────────────────────────────
function exportExcel(type) {
  let rows, headers, filename;
  if(type==='pro'){
    headers=['#','Name','Passport','Phone','Position','Company','Country','Stage','Commission (KES)','Paid (KES)','Balance (KES)','Submitted','Interview','Offer Letter','MOL','Visa','Travel'];
    rows=proDB.map((r,i)=>[
      i+1, r.candidate_name || r.name, r.passport_number || r.pp || '', r.phone||'', r.position||'', r.company||'', r.country||'', r.file_status || r.stage,
      r.commission||'',r.paid||'',
      (r.commission&&r.paid)?Number(r.commission)-Number(r.paid):'',
      fmtDate(r.submitted),fmtDate(r.interview),fmtDate(r.ol),fmtDate(r.mol),fmtDate(r.visa),fmtDate(r.travel)
    ]);
    filename='Destiny_Professional_Candidates';
  } else {
    headers=['#','Name','Phone','Passport Status','Travel Status','Travel Date','To Refund (USD)','Refunded (USD)','Balance (USD)','Refund Status','Notes'];
    rows=lbDB.map((r,i)=>{
      const rs=getRefundStatus(r);
      const paid=(Number(r.r1Amt)||0)+(Number(r.r2Amt)||0);
      const totalRefundAmt = r.amount_paid || r.toRefund;
      const bal=(rs==='N/A'||rs==='RETURNED')?'':(Number(totalRefundAmt)-paid);
      return [i+1, r.client_name || r.name, r.phone||'', r.ppStatus || 'APPLIED', r.travel_status || r.travelStatus, fmtDate(r.travelDate),
        rs==='N/A'?'':totalRefundAmt||0, rs==='N/A'?'':paid, bal, rs, r.remarks || r.notes||''];
    });
    filename='Destiny_LB_Candidates';
  }
  // Build CSV and prepend explicit UTF-8 Byte Order Mark (BOM) to force Excel parsing clarity
  const esc=v=>`"${String(v).replace(/"/g,'""')}"`;
  const csvContent=[headers.map(esc).join(','),...rows.map(r=>r.map(esc).join(','))].join('\n');
  const blob=new Blob(['\uFEFF' + csvContent],{type:'text/csv;charset=utf-8;'});
  const url=URL.createObjectURL(blob);
  const a=document.createElement('a');
  a.href=url;
  a.download=`${filename}_${new Date().toISOString().split('T')[0]}.csv`;
  a.click();
  URL.revokeObjectURL(url);
  showToast('Export downloaded ✓','success');
}

// ─── PAGINATION ───────────────────────────────────────────
function renderPagination(elId,page,total,count,which){
  const el=document.getElementById(elId);
  if(!el) return;
  if(total<=1){el.innerHTML=`<span>${count} record${count!==1?'s':''}</span><span></span>`;return;}
  let btns='';
  for(let p=1;p<=total;p++){
    if(p===1||p===total||Math.abs(p-page)<=1)
      btns+=`<button class="${p===page?'active':''}" onclick="goPage('${which}',${p})">${p}</button>`;
    else if(Math.abs(p-page)===2)
      btns+=`<span style="padding:4px;color:var(--text-3)">…</span>`;
  }
  el.innerHTML=`<span>${count} record${count!==1?'s':''}</span><div class="page-btns">${btns}</div>`;
}

function goPage(which,p){
  if(which==='pro'){proPage=p;renderPro();}else{lbPage=p;renderLB();}
  window.scrollTo({top:0,behavior:'smooth'});
}

// ─── MODAL ────────────────────────────────────────────────
function closeModal(id){document.getElementById(id).classList.remove('open');}
window.addEventListener('DOMContentLoaded', () => {
  ['pro-modal','lb-modal','docs-modal'].forEach(id=>{
    const el = document.getElementById(id);
    if (el) {
      el.addEventListener('click',function(e){if(e.target===this)closeModal(id);});
    }
  });
});

// ─── TOAST ────────────────────────────────────────────────
function showToast(msg,type=''){
  const t=document.getElementById('toast');
  if(!t) return;
  t.textContent=msg;t.className='toast '+type;
  void t.offsetWidth;t.classList.add('show');
  setTimeout(()=>t.classList.remove('show'),2500);
}
