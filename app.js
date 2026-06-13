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
let proDB = [], lbDB = [];
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
  try {
    const pro  = localStorage.getItem(SK_PRO);
    const lb   = localStorage.getItem(SK_LB);
    const ids  = localStorage.getItem(SK_IDS);
    const docs = localStorage.getItem(SK_DOCS);
    const tl   = localStorage.getItem(SK_TL);
    const stp  = localStorage.getItem(SK_STAGES_PRO);
    const stl  = localStorage.getItem(SK_STAGES_LB);
    proDB = pro  ? JSON.parse(pro)  : JSON.parse(JSON.stringify(PRO_SEED));
    lbDB  = lb   ? JSON.parse(lb)   : JSON.parse(JSON.stringify(LB_SEED));
    if (ids)  { const p = JSON.parse(ids); nextProId = p.pro; nextLbId = p.lb; }
    if (docs) allDocs = JSON.parse(docs);
    if (tl)   allTimelines = JSON.parse(tl);
    if (stp)  proStages = JSON.parse(stp);
    if (stl)  lbStages  = JSON.parse(stl);
    if (!pro) persist();
  } catch(e) {
    proDB = JSON.parse(JSON.stringify(PRO_SEED));
    lbDB  = JSON.parse(JSON.stringify(LB_SEED));
  }
  rebuildStageFilters();
  renderDash();
}

function persist() {
  try {
    localStorage.setItem(SK_PRO,  JSON.stringify(proDB));
    localStorage.setItem(SK_LB,   JSON.stringify(lbDB));
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
  const txt = document.getElementById('save-text');
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

function isInProcess_Pro(r) {
  return ['PENDING OFFER LETTER','PENDING MOL','PENDING VISA','PENDING TRAVEL'].includes(r.stage);
}

function isInProcess_LB(r) {
  return r.ppStatus !== 'HAD PP' && (r.travelStatus === 'NOT YET') &&
         (r.ppStatus === 'APPLIED' || r.ppStatus === 'PUSHED' || r.ppStatus === 'NOT APPLIED');
}

function stageBadge(s) {
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
  // Pro stage filter
  const psf = document.getElementById('pro-stage-f');
  if (psf) {
    psf.innerHTML = '<option value="">All stages</option>' +
      proStages.map(s => `<option value="${s}">${s}</option>`).join('');
  }
  // Pro form stage select
  const pfs = document.getElementById('pf-stage');
  if (pfs) {
    const cur = pfs.value;
    pfs.innerHTML = proStages.map(s => `<option value="${s}">${s}</option>`).join('');
    if (cur) pfs.value = cur;
  }
  // LB travel filter
  const ltf = document.getElementById('lb-travel-f');
  if (ltf) {
    ltf.innerHTML = '<option value="">All travel statuses</option>' +
      lbStages.map(s => `<option value="${s}">${s}</option>`).join('');
  }
  // LB form travel select
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
    proStages.splice(proStages.length - 1, 0, val); // insert before TRAVELLED
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
  // Alerts
  const alerts = [];
  const STUCK_DAYS = 60;
  const OVERDUE_DAYS = 30;

  proDB.forEach(r => {
    if (isInProcess_Pro(r)) {
      const lastDate = r.visa || r.mol || r.ol || r.interview || r.submitted;
      const days = daysSince(lastDate);
      if (days && days > STUCK_DAYS) {
        alerts.push({ level:'red', name:r.name, msg:`Stuck at "${r.stage}" for ${days} days` });
      }
    }
  });
  lbDB.forEach(r => {
    const rs = getRefundStatus(r);
    if (rs === 'incomplete' && r.travelStatus === 'TRAVELLED') {
      const lastPay = r.r1Date || r.travelDate;
      const days = daysSince(lastPay);
      if (days && days > OVERDUE_DAYS) {
        const bal = (Number(r.toRefund)||0) - ((Number(r.r1Amt)||0)+(Number(r.r2Amt)||0));
        alerts.push({ level:'amber', name:r.name, msg:`Refund overdue by ${days} days — $${bal} still owed` });
      }
    }
  });

  const alertsEl = document.getElementById('dash-alerts');
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

  // Pro summary
  const proInProcess = proDB.filter(isInProcess_Pro).length;
  const proTravelled = proDB.filter(r => r.stage === 'TRAVELLED').length;
  let totalComm = 0, totalPaid = 0;
  proDB.forEach(r => { if(r.commission) totalComm += Number(r.commission); if(r.paid) totalPaid += Number(r.paid); });
  document.getElementById('dash-pro-card').innerHTML = `
    <h3>💼 Professional Jobs</h3>
    <div class="dash-stage-row"><span class="dash-stage-label">Total candidates</span><span class="dash-stage-count">${proDB.length}</span></div>
    <div class="dash-stage-row"><span class="dash-stage-label">In process <span style="font-size:11px;color:var(--text-3)">(OL → MOL → Visa)</span></span><span class="dash-stage-count" style="color:var(--amber)">${proInProcess}</span></div>
    <div class="dash-stage-row"><span class="dash-stage-label">Travelled</span><span class="dash-stage-count" style="color:var(--green)">${proTravelled}</span></div>
    <div class="dash-stage-row"><span class="dash-stage-label">Commission billed</span><span class="dash-stage-count">KES ${totalComm.toLocaleString()}</span></div>
    <div class="dash-stage-row"><span class="dash-stage-label">Outstanding</span><span class="dash-stage-count" style="color:var(--amber)">KES ${(totalComm-totalPaid).toLocaleString()}</span></div>`;

  // LB summary — only TRAVELLED count toward refund balance
  const lbTravelled    = lbDB.filter(r => r.travelStatus === 'TRAVELLED').length;
  const lbInProcess    = lbDB.filter(isInProcess_LB).length;
  const lbIncomplete   = lbDB.filter(r => getRefundStatus(r) === 'incomplete').length;
  let lbOwed = 0, lbPaid = 0;
  lbDB.forEach(r => {
    if (r.travelStatus === 'TRAVELLED' && r.ppStatus !== 'HAD PP' &&
        (r.notes||'').trim().toUpperCase() !== 'RETURNED') {
      lbOwed += Number(r.toRefund) || 0;
      lbPaid += (Number(r.r1Amt)||0) + (Number(r.r2Amt)||0);
    }
  });
  document.getElementById('dash-lb-card').innerHTML = `
    <h3>🏠 LB Jobs</h3>
    <div class="dash-stage-row"><span class="dash-stage-label">Total candidates</span><span class="dash-stage-count">${lbDB.length}</span></div>
    <div class="dash-stage-row"><span class="dash-stage-label">In process <span style="font-size:11px;color:var(--text-3)">(passport applied, not yet travelled)</span></span><span class="dash-stage-count" style="color:var(--amber)">${lbInProcess}</span></div>
    <div class="dash-stage-row"><span class="dash-stage-label">Travelled</span><span class="dash-stage-count" style="color:var(--green)">${lbTravelled}</span></div>
    <div class="dash-stage-row"><span class="dash-stage-label">Refund balance owed</span><span class="dash-stage-count" style="color:var(--amber)">$${lbOwed - lbPaid}</span></div>
    <div class="dash-stage-row"><span class="dash-stage-label">Incomplete refunds</span><span class="dash-stage-count" style="color:var(--red)">${lbIncomplete}</span></div>`;

  // Pro stage breakdown
  const stageCounts = {};
  proStages.forEach(s => stageCounts[s] = proDB.filter(r => r.stage === s).length);
  const maxStage = Math.max(...Object.values(stageCounts), 1);
  document.getElementById('dash-pro-stages').innerHTML = `
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

  // LB refund breakdown
  const lbComplete   = lbDB.filter(r => getRefundStatus(r) === 'complete').length;
  const lbReturned   = lbDB.filter(r => getRefundStatus(r) === 'RETURNED').length;
  const lbNA         = lbDB.filter(r => getRefundStatus(r) === 'N/A').length;
  const lbNotYet     = lbDB.filter(r => r.travelStatus === 'NOT YET').length;
  const lbNotTrav    = lbDB.filter(r => r.travelStatus === 'NOT TRAVELLED').length;
  document.getElementById('dash-lb-refunds').innerHTML = `
    <h3>🏠 LB Jobs — Refund Overview</h3>
    <div class="dash-stage-row"><span class="dash-stage-label">✅ Refund complete</span><span class="dash-stage-count" style="color:var(--green)">${lbComplete}</span></div>
    <div class="dash-stage-row"><span class="dash-stage-label">⏳ Refund incomplete</span><span class="dash-stage-count" style="color:var(--amber)">${lbIncomplete}</span></div>
    <div class="dash-stage-row"><span class="dash-stage-label">↩️ Returned</span><span class="dash-stage-count" style="color:var(--red)">${lbReturned}</span></div>
    <div class="dash-stage-row"><span class="dash-stage-label">N/A (HAD PP)</span><span class="dash-stage-count">${lbNA}</span></div>
    <div class="dash-stage-row"><span class="dash-stage-label">🕐 Not yet travelled</span><span class="dash-stage-count" style="color:var(--blue)">${lbNotYet}</span></div>
    <div class="dash-stage-row"><span class="dash-stage-label">❌ Did not travel</span><span class="dash-stage-count">${lbNotTrav}</span></div>`;
}

// ─── PROFESSIONAL ─────────────────────────────────────────
function getFilteredPro() {
  const q     = (document.getElementById('pro-search').value||'').toLowerCase();
  const stage = document.getElementById('pro-stage-f').value;
  const comp  = document.getElementById('pro-company-f').value;
  return proDB.filter(r => {
    const text = `${r.name} ${r.pp} ${r.company||''} ${r.position||''}`.toLowerCase();
    return (!q||text.includes(q)) && (!stage||r.stage===stage) && (!comp||r.company===comp);
  });
}

function renderPro() {
  let totalComm=0, totalPaid=0;
  proDB.forEach(r=>{if(r.commission)totalComm+=Number(r.commission);if(r.paid)totalPaid+=Number(r.paid);});
  const inProcess = proDB.filter(isInProcess_Pro).length;
  const travelled = proDB.filter(r=>r.stage==='TRAVELLED').length;
  document.getElementById('pro-metrics').innerHTML=`
    <div class="metric"><div class="metric-label">Total</div><div class="metric-val">${proDB.length}</div></div>
    <div class="metric"><div class="metric-label">In process</div><div class="metric-val amber">${inProcess}</div></div>
    <div class="metric"><div class="metric-label">Travelled</div><div class="metric-val green">${travelled}</div></div>
    <div class="metric"><div class="metric-label">Commission billed</div><div class="metric-val sm">KES ${totalComm.toLocaleString()}</div></div>
    <div class="metric"><div class="metric-label">Outstanding</div><div class="metric-val sm amber">KES ${(totalComm-totalPaid).toLocaleString()}</div></div>`;

  const companies=[...new Set(proDB.map(r=>r.company).filter(Boolean))].sort();
  const sel=document.getElementById('pro-company-f');
  const cur=sel.value;
  sel.innerHTML='<option value="">All companies</option>'+companies.map(c=>`<option value="${c}"${c===cur?' selected':''}>${c}</option>`).join('');

  const data=getFilteredPro();
  const totalPages=Math.max(1,Math.ceil(data.length/PER_PAGE));
  if(proPage>totalPages)proPage=1;
  const slice=data.slice((proPage-1)*PER_PAGE,proPage*PER_PAGE);
  const tbody=document.getElementById('pro-tbody');
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
      return `<tr>
        <td>${(proPage-1)*PER_PAGE+i+1}</td>
        <td class="name-cell">${r.name}${stuckFlag}</td>
        <td>${r.pp||'—'}</td>
        <td>${r.phone||'—'}</td>
        <td>${r.position||'—'}</td>
        <td>${r.company||'—'}</td>
        <td>${r.country||'—'}</td>
        <td>${stageBadge(r.stage)}</td>
        <td>${comm}</td>
        <td>${paid}</td>
        <td class="${bal&&bal>0?'balance-owed':''}">${balTxt}</td>
        <td><button class="action-btn docs" onclick="openDocs('pro',${r.id},'${r.name}')" title="Documents">📎${dc>0?` <span style="font-size:10px">${dc}</span>`:''}</button></td>
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
  document.getElementById('pro-modal-title').textContent='Edit candidate — '+r.name;
  document.getElementById('pf-name').value=r.name;
  document.getElementById('pf-pp').value=r.pp||'';
  document.getElementById('pf-phone').value=r.phone||'';
  document.getElementById('pf-position').value=r.position||'';
  document.getElementById('pf-company').value=r.company||'';
  document.getElementById('pf-country').value=r.country||'';
  document.getElementById('pf-stage').value=r.stage;
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

function savePro() {
  const name=document.getElementById('pf-name').value.trim();
  if(!name){showToast('Full name is required.','error');return;}
  const oldRec=editingProId?proDB.find(x=>x.id===editingProId):null;
  const newStage=document.getElementById('pf-stage').value;
  const rec={
    id:editingProId||nextProId++,
    name:name.toUpperCase(),
    pp:document.getElementById('pf-pp').value.trim().toUpperCase(),
    phone:document.getElementById('pf-phone').value.trim(),
    position:document.getElementById('pf-position').value.trim().toUpperCase(),
    company:document.getElementById('pf-company').value.trim().toUpperCase(),
    country:document.getElementById('pf-country').value.trim(),
    stage:newStage,
    submitted:document.getElementById('pf-submitted').value,
    interview:document.getElementById('pf-interview').value,
    ol:document.getElementById('pf-ol').value,
    mol:document.getElementById('pf-mol').value,
    visa:document.getElementById('pf-visa').value,
    travel:document.getElementById('pf-travel').value,
    commission:document.getElementById('pf-comm').value?Number(document.getElementById('pf-comm').value):'',
    paid:document.getElementById('pf-paid').value?Number(document.getElementById('pf-paid').value):'',
  };
  if(editingProId){
    const i=proDB.findIndex(x=>x.id===editingProId);proDB[i]=rec;
    const action=oldRec&&oldRec.stage!==newStage
      ?`Stage changed: "${oldRec.stage}" → "${newStage}"`
      :'Details updated';
    addTimeline('pro',rec.id,action);
    showToast('Candidate updated ✓','success');
  } else {
    proDB.push(rec);
    addTimeline('pro',rec.id,`Candidate added — Stage: ${newStage}`);
    showToast('Candidate added ✓','success');
  }
  closeModal('pro-modal');
  scheduleSave();
  renderPro();
  renderDash();
}

function deletePro(id) {
  const r=proDB.find(x=>x.id===id);
  if(!confirm(`Delete ${r?r.name:'this candidate'}? This cannot be undone.`))return;
  proDB=proDB.filter(x=>x.id!==id);
  scheduleSave();
  showToast('Candidate deleted','success');
  renderPro();renderDash();
}

// ─── LB ───────────────────────────────────────────────────
function getFilteredLB() {
  const q     =(document.getElementById('lb-search').value||'').toLowerCase();
  const travel=document.getElementById('lb-travel-f').value;
  const refund=document.getElementById('lb-refund-f').value;
  return lbDB.filter(r=>{
    const text=`${r.name} ${r.phone||''}`.toLowerCase();
    const rs=getRefundStatus(r);
    return (!q||text.includes(q))&&(!travel||r.travelStatus===travel)&&(!refund||rs===refund);
  });
}

function renderLB() {
  const travelled=lbDB.filter(r=>r.travelStatus==='TRAVELLED').length;
  const inProcess=lbDB.filter(isInProcess_LB).length;
  const incomplete=lbDB.filter(r=>getRefundStatus(r)==='incomplete').length;
  let lbOwed=0,lbPaid=0;
  lbDB.forEach(r=>{
    if(r.travelStatus==='TRAVELLED'&&r.ppStatus!=='HAD PP'&&(r.notes||'').trim().toUpperCase()!=='RETURNED'){
      lbOwed+=Number(r.toRefund)||0;
      lbPaid+=(Number(r.r1Amt)||0)+(Number(r.r2Amt)||0);
    }
  });
  document.getElementById('lb-metrics').innerHTML=`
    <div class="metric"><div class="metric-label">Total</div><div class="metric-val">${lbDB.length}</div></div>
    <div class="metric"><div class="metric-label">In process</div><div class="metric-val amber">${inProcess}</div></div>
    <div class="metric"><div class="metric-label">Travelled</div><div class="metric-val green">${travelled}</div></div>
    <div class="metric"><div class="metric-label">Refund balance</div><div class="metric-val sm amber">$${lbOwed-lbPaid}</div></div>
    <div class="metric"><div class="metric-label">Incomplete refunds</div><div class="metric-val red">${incomplete}</div></div>`;

  const data=getFilteredLB();
  const totalPages=Math.max(1,Math.ceil(data.length/PER_PAGE));
  if(lbPage>totalPages)lbPage=1;
  const slice=data.slice((lbPage-1)*PER_PAGE,lbPage*PER_PAGE);
  const tbody=document.getElementById('lb-tbody');
  if(!slice.length){
    tbody.innerHTML=`<tr><td colspan="12"><div class="empty">No candidates match your search</div></td></tr>`;
  } else {
    tbody.innerHTML=slice.map((r,i)=>{
      const rs=getRefundStatus(r);
      const paid=(Number(r.r1Amt)||0)+(Number(r.r2Amt)||0);
      const bal=(rs==='N/A'||rs==='RETURNED')?'—':'$'+(Number(r.toRefund)-paid);
      const toR=rs==='N/A'?'—':'$'+(r.toRefund||0);
      const paidDisp=rs==='N/A'?'—':'$'+paid;
      const dc=docCount('lb',r.id);
      const overdue=(rs==='incomplete'&&r.travelStatus==='TRAVELLED'&&daysSince(r.r1Date||r.travelDate)>30);
      return `<tr>
        <td>${(lbPage-1)*PER_PAGE+i+1}</td>
        <td class="name-cell">${r.name}${overdue?'<span title="Refund overdue" style="color:var(--red);margin-left:4px">⚠</span>':''}</td>
        <td>${r.phone||'—'}</td>
        <td>${r.ppStatus}</td>
        <td>${travelBadge(r.travelStatus)}</td>
        <td>${fmtDate(r.travelDate)}</td>
        <td>${toR}</td>
        <td>${paidDisp}</td>
        <td class="${rs==='incomplete'?'balance-owed':''}">${bal}</td>
        <td>${refundBadge(rs)}</td>
        <td><button class="action-btn docs" onclick="openDocs('lb',${r.id},'${r.name}')" title="Documents">📎${dc>0?` <span style="font-size:10px">${dc}</span>`:''}</button></td>
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
  document.getElementById('lb-modal-title').textContent='Edit — '+r.name;
  document.getElementById('lf-name').value=r.name;
  document.getElementById('lf-phone').value=r.phone||'';
  document.getElementById('lf-pp').value=r.ppStatus;
  document.getElementById('lf-travel').value=r.travelStatus;
  document.getElementById('lf-tdate').value=toInput(r.travelDate);
  document.getElementById('lf-torefund').value=r.toRefund||'';
  document.getElementById('lf-r1date').value=toInput(r.r1Date);
  document.getElementById('lf-r1amt').value=r.r1Amt||'';
  document.getElementById('lf-r2date').value=toInput(r.r2Date);
  document.getElementById('lf-r2amt').value=r.r2Amt||'';
  document.getElementById('lf-notes').value=r.notes||'';
  document.getElementById('lb-form-timeline').innerHTML=renderTimeline('lb',id);
  switchModalTab('lb','details',document.querySelector('#lb-modal .modal-tab'));
  document.getElementById('lb-modal').classList.add('open');
}

function saveLB() {
  const name=document.getElementById('lf-name').value.trim();
  if(!name){showToast('Full name is required.','error');return;}
  const oldRec=editingLbId?lbDB.find(x=>x.id===editingLbId):null;
  const ppStatus=document.getElementById('lf-pp').value;
  const isHadPP=ppStatus==='HAD PP';
  const newTravel=document.getElementById('lf-travel').value;
  const rec={
    id:editingLbId||nextLbId++,
    name:name.toUpperCase(),
    phone:document.getElementById('lf-phone').value.trim(),
    ppStatus,
    travelStatus:newTravel,
    travelDate:document.getElementById('lf-tdate').value,
    toRefund:isHadPP?0:(Number(document.getElementById('lf-torefund').value)||0),
    r1Date:document.getElementById('lf-r1date').value,
    r1Amt:isHadPP?0:(Number(document.getElementById('lf-r1amt').value)||0),
    r2Date:document.getElementById('lf-r2date').value,
    r2Amt:isHadPP?0:(Number(document.getElementById('lf-r2amt').value)||0),
    notes:document.getElementById('lf-notes').value.trim(),
  };
  if(editingLbId){
    const i=lbDB.findIndex(x=>x.id===editingLbId);lbDB[i]=rec;
    const action=oldRec&&oldRec.travelStatus!==newTravel
      ?`Travel status: "${oldRec.travelStatus}" → "${newTravel}"`
      :'Details updated';
    addTimeline('lb',rec.id,action);
    showToast('Candidate updated ✓','success');
  } else {
    lbDB.push(rec);
    addTimeline('lb',rec.id,`Candidate added — ${ppStatus}, ${newTravel}`);
    showToast('Candidate added ✓','success');
  }
  closeModal('lb-modal');
  scheduleSave();
  renderLB();renderDash();
}

function deleteLB(id) {
  const r=lbDB.find(x=>x.id===id);
  if(!confirm(`Delete ${r?r.name:'this candidate'}? This cannot be undone.`))return;
  lbDB=lbDB.filter(x=>x.id!==id);
  scheduleSave();showToast('Candidate deleted','success');
  renderLB();renderDash();
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
      i+1,r.name,r.pp||'',r.phone||'',r.position||'',r.company||'',r.country||'',r.stage,
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
      const bal=(rs==='N/A'||rs==='RETURNED')?'':(Number(r.toRefund)-paid);
      return [i+1,r.name,r.phone||'',r.ppStatus,r.travelStatus,fmtDate(r.travelDate),
        rs==='N/A'?'':r.toRefund||0,rs==='N/A'?'':paid,bal,rs,r.notes||''];
    });
    filename='Destiny_LB_Candidates';
  }
  // Build CSV
  const esc=v=>`"${String(v).replace(/"/g,'""')}"`;
  const csv=[headers.map(esc).join(','),...rows.map(r=>r.map(esc).join(','))].join('\n');
  const blob=new Blob([csv],{type:'text/csv'});
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
['pro-modal','lb-modal','docs-modal'].forEach(id=>{
  document.getElementById(id).addEventListener('click',function(e){if(e.target===this)closeModal(id);});
});

// ─── TOAST ────────────────────────────────────────────────
function showToast(msg,type=''){
  const t=document.getElementById('toast');
  t.textContent=msg;t.className='toast '+type;
  void t.offsetWidth;t.classList.add('show');
  setTimeout(()=>t.classList.remove('show'),2500);
}
