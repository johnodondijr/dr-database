// ─── CONFIG ───────────────────────────────────────────────
const PASSWORD = 'Destiny@2025';
const STORAGE_KEY_PRO = 'dr_pro_db';
const STORAGE_KEY_LB  = 'dr_lb_db';
const STORAGE_KEY_IDS = 'dr_next_ids';
const PER_PAGE = 20;
const EXCEL_EPOCH = new Date(1899, 11, 30);

// ─── STATE ────────────────────────────────────────────────
let proDB = [], lbDB = [];
let nextProId = 38, nextLbId = 99;
let proPage = 1, lbPage = 1;
let editingProId = null, editingLbId = null;
let saveTimer = null;

// ─── AUTH ─────────────────────────────────────────────────
function doLogin() {
  const val = document.getElementById('pw-input').value;
  if (val === PASSWORD) {
    document.getElementById('login-screen').style.display = 'none';
    document.getElementById('app').style.display = 'block';
    sessionStorage.setItem('dr_auth', '1');
    loadData();
  } else {
    document.getElementById('login-error').style.display = 'block';
    document.getElementById('pw-input').value = '';
    document.getElementById('pw-input').focus();
  }
}

function doLogout() {
  sessionStorage.removeItem('dr_auth');
  document.getElementById('app').style.display = 'none';
  document.getElementById('login-screen').style.display = 'flex';
  document.getElementById('pw-input').value = '';
  document.getElementById('login-error').style.display = 'none';
}

// Auto-login if session active
if (sessionStorage.getItem('dr_auth') === '1') {
  document.getElementById('login-screen').style.display = 'none';
  document.getElementById('app').style.display = 'block';
  // loadData called after DOM ready
}

// ─── STORAGE ──────────────────────────────────────────────
function loadData() {
  try {
    const pro = localStorage.getItem(STORAGE_KEY_PRO);
    const lb  = localStorage.getItem(STORAGE_KEY_LB);
    const ids = localStorage.getItem(STORAGE_KEY_IDS);
    proDB = pro ? JSON.parse(pro) : JSON.parse(JSON.stringify(PRO_SEED));
    lbDB  = lb  ? JSON.parse(lb)  : JSON.parse(JSON.stringify(LB_SEED));
    if (ids) { const p = JSON.parse(ids); nextProId = p.pro; nextLbId = p.lb; }
    if (!pro) persist(); // first time — save seed
  } catch(e) {
    proDB = JSON.parse(JSON.stringify(PRO_SEED));
    lbDB  = JSON.parse(JSON.stringify(LB_SEED));
  }
  renderPro();
}

function persist() {
  try {
    localStorage.setItem(STORAGE_KEY_PRO, JSON.stringify(proDB));
    localStorage.setItem(STORAGE_KEY_LB,  JSON.stringify(lbDB));
    localStorage.setItem(STORAGE_KEY_IDS, JSON.stringify({ pro: nextProId, lb: nextLbId }));
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
  const icons = {
    saved:  '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>',
    saving: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-.03-4.95"/></svg>',
    error:  '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>'
  };
  if (s === 'saved')  { el.classList.add('saved');  el.innerHTML = icons.saved  + ' <span id="save-text">Saved</span>'; }
  if (s === 'saving') { el.classList.add('saving'); el.innerHTML = icons.saving + ' <span id="save-text">Saving…</span>'; }
  if (s === 'error')  { el.innerHTML = icons.error  + ' <span id="save-text">Save failed</span>'; }
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
    return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: '2-digit' });
  } catch { return s; }
}

function toInput(v) {
  if (!v) return '';
  if (typeof v === 'number') return xlToDate(v);
  return v;
}

function getRefundStatus(r) {
  if (r.ppStatus === 'HAD PP') return 'N/A';
  if ((r.notes || '').trim().toUpperCase() === 'RETURNED') return 'RETURNED';
  if (!r.toRefund || r.toRefund === 0) return 'N/A';
  const paid = (Number(r.r1Amt) || 0) + (Number(r.r2Amt) || 0);
  return paid >= r.toRefund ? 'complete' : 'incomplete';
}

function stageBadge(s) {
  const map = {
    'PENDING OFFER LETTER': ['b-pol', 'Pending OL'],
    'PENDING MOL':          ['b-mol', 'Pending MOL'],
    'PENDING VISA':         ['b-visa', 'Pending Visa'],
    'PENDING TRAVEL':       ['b-travel', 'Pending Travel'],
    'TRAVELLED':            ['b-travelled', 'Travelled'],
  };
  const [cls, label] = map[s] || ['b-na', s];
  return `<span class="badge ${cls}">${label}</span>`;
}

function travelBadge(s) {
  const map = {
    'TRAVELLED':     'b-travelled',
    'NOT YET':       'b-notyet',
    'NOT TRAVELLED': 'b-nottravelled',
  };
  return `<span class="badge ${map[s] || 'b-na'}">${s}</span>`;
}

function refundBadge(s) {
  const map = { complete: 'b-complete', incomplete: 'b-incomplete', RETURNED: 'b-returned', 'N/A': 'b-na' };
  return `<span class="badge ${map[s] || 'b-na'}">${s}</span>`;
}

// ─── TAB SWITCH ───────────────────────────────────────────
function switchTab(t) {
  document.getElementById('tab-pro').classList.toggle('active', t === 'pro');
  document.getElementById('tab-lb').classList.toggle('active',  t === 'lb');
  document.getElementById('pro-section').style.display = t === 'pro' ? '' : 'none';
  document.getElementById('lb-section').style.display  = t === 'lb'  ? '' : 'none';
  if (t === 'lb') renderLB();
}

// ─── PROFESSIONAL ─────────────────────────────────────────
function getFilteredPro() {
  const q     = (document.getElementById('pro-search').value || '').toLowerCase();
  const stage = document.getElementById('pro-stage-f').value;
  const comp  = document.getElementById('pro-company-f').value;
  return proDB.filter(r => {
    const text = `${r.name} ${r.pp} ${r.company} ${r.position}`.toLowerCase();
    return (!q || text.includes(q)) && (!stage || r.stage === stage) && (!comp || r.company === comp);
  });
}

function renderPro() {
  // metrics
  let totalComm = 0, totalPaid = 0;
  const stages = {};
  ['PENDING OFFER LETTER','PENDING MOL','PENDING VISA','PENDING TRAVEL','TRAVELLED'].forEach(s => stages[s] = 0);
  proDB.forEach(r => {
    stages[r.stage] = (stages[r.stage] || 0) + 1;
    if (r.commission) totalComm += Number(r.commission);
    if (r.paid)       totalPaid += Number(r.paid);
  });
  document.getElementById('pro-metrics').innerHTML = `
    <div class="metric"><div class="metric-label">Total</div><div class="metric-val">${proDB.length}</div></div>
    <div class="metric"><div class="metric-label">Travelled</div><div class="metric-val green">${stages['TRAVELLED']}</div></div>
    <div class="metric"><div class="metric-label">In pipeline</div><div class="metric-val blue">${proDB.length - stages['TRAVELLED']}</div></div>
    <div class="metric"><div class="metric-label">Commission billed</div><div class="metric-val sm">KES ${totalComm.toLocaleString()}</div></div>
    <div class="metric"><div class="metric-label">Outstanding</div><div class="metric-val sm amber">KES ${(totalComm - totalPaid).toLocaleString()}</div></div>`;

  // company filter
  const companies = [...new Set(proDB.map(r => r.company).filter(Boolean))].sort();
  const sel = document.getElementById('pro-company-f');
  const cur = sel.value;
  sel.innerHTML = '<option value="">All companies</option>' +
    companies.map(c => `<option value="${c}"${c === cur ? ' selected' : ''}>${c}</option>`).join('');

  const data = getFilteredPro();
  const totalPages = Math.max(1, Math.ceil(data.length / PER_PAGE));
  if (proPage > totalPages) proPage = 1;
  const slice = data.slice((proPage - 1) * PER_PAGE, proPage * PER_PAGE);

  const tbody = document.getElementById('pro-tbody');
  if (!slice.length) {
    tbody.innerHTML = `<tr><td colspan="12"><div class="empty">
      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
      No candidates match your search</div></td></tr>`;
  } else {
    tbody.innerHTML = slice.map((r, i) => {
      const comm = r.commission ? 'KES ' + Number(r.commission).toLocaleString() : '—';
      const paid = r.paid ? 'KES ' + Number(r.paid).toLocaleString() : '—';
      const bal  = (r.commission && r.paid) ? Number(r.commission) - Number(r.paid) : null;
      const balTxt = bal !== null ? 'KES ' + bal.toLocaleString() : '—';
      const balClass = (bal !== null && bal > 0) ? 'balance-owed' : '';
      return `<tr>
        <td>${(proPage-1)*PER_PAGE + i + 1}</td>
        <td class="name-cell">${r.name}</td>
        <td>${r.pp || '—'}</td>
        <td>${r.phone || '—'}</td>
        <td>${r.position || '—'}</td>
        <td>${r.company || '—'}</td>
        <td>${r.country || '—'}</td>
        <td>${stageBadge(r.stage)}</td>
        <td>${comm}</td>
        <td>${paid}</td>
        <td class="${balClass}">${balTxt}</td>
        <td style="white-space:nowrap">
          <button class="action-btn" onclick="editPro(${r.id})" title="Edit">✏️</button>
          <button class="action-btn del" onclick="deletePro(${r.id})" title="Delete">🗑</button>
        </td></tr>`;
    }).join('');
  }
  renderPagination('pro-pagination', proPage, totalPages, data.length, 'pro');
}

function openProForm() {
  editingProId = null;
  document.getElementById('pro-modal-title').textContent = 'Add professional candidate';
  ['pf-name','pf-pp','pf-phone','pf-position','pf-company','pf-country',
   'pf-submitted','pf-interview','pf-ol','pf-mol','pf-visa','pf-travel','pf-comm','pf-paid']
    .forEach(id => document.getElementById(id).value = '');
  document.getElementById('pf-stage').value = 'PENDING OFFER LETTER';
  document.getElementById('pro-modal').classList.add('open');
}

function editPro(id) {
  const r = proDB.find(x => x.id === id); if (!r) return;
  editingProId = id;
  document.getElementById('pro-modal-title').textContent = 'Edit candidate';
  document.getElementById('pf-name').value     = r.name;
  document.getElementById('pf-pp').value       = r.pp || '';
  document.getElementById('pf-phone').value    = r.phone || '';
  document.getElementById('pf-position').value = r.position || '';
  document.getElementById('pf-company').value  = r.company || '';
  document.getElementById('pf-country').value  = r.country || '';
  document.getElementById('pf-stage').value    = r.stage;
  document.getElementById('pf-comm').value     = r.commission || '';
  document.getElementById('pf-paid').value     = r.paid || '';
  document.getElementById('pf-submitted').value  = toInput(r.submitted);
  document.getElementById('pf-interview').value  = toInput(r.interview);
  document.getElementById('pf-ol').value         = toInput(r.ol);
  document.getElementById('pf-mol').value        = toInput(r.mol);
  document.getElementById('pf-visa').value       = toInput(r.visa);
  document.getElementById('pf-travel').value     = toInput(r.travel);
  document.getElementById('pro-modal').classList.add('open');
}

function savePro() {
  const name = document.getElementById('pf-name').value.trim();
  if (!name) { showToast('Full name is required.', 'error'); return; }
  const rec = {
    id: editingProId || nextProId++,
    name: name.toUpperCase(),
    pp:         document.getElementById('pf-pp').value.trim().toUpperCase(),
    phone:      document.getElementById('pf-phone').value.trim(),
    position:   document.getElementById('pf-position').value.trim().toUpperCase(),
    company:    document.getElementById('pf-company').value.trim().toUpperCase(),
    country:    document.getElementById('pf-country').value.trim(),
    stage:      document.getElementById('pf-stage').value,
    submitted:  document.getElementById('pf-submitted').value,
    interview:  document.getElementById('pf-interview').value,
    ol:         document.getElementById('pf-ol').value,
    mol:        document.getElementById('pf-mol').value,
    visa:       document.getElementById('pf-visa').value,
    travel:     document.getElementById('pf-travel').value,
    commission: document.getElementById('pf-comm').value ? Number(document.getElementById('pf-comm').value) : '',
    paid:       document.getElementById('pf-paid').value ? Number(document.getElementById('pf-paid').value) : '',
  };
  if (editingProId) {
    const i = proDB.findIndex(x => x.id === editingProId);
    proDB[i] = rec;
    showToast('Candidate updated ✓', 'success');
  } else {
    proDB.push(rec);
    showToast('Candidate added ✓', 'success');
  }
  closeModal('pro-modal');
  scheduleSave();
  renderPro();
}

function deletePro(id) {
  if (!confirm('Delete this candidate? This cannot be undone.')) return;
  proDB = proDB.filter(x => x.id !== id);
  scheduleSave();
  showToast('Candidate deleted', 'success');
  renderPro();
}

// ─── LB ───────────────────────────────────────────────────
function getFilteredLB() {
  const q      = (document.getElementById('lb-search').value || '').toLowerCase();
  const travel = document.getElementById('lb-travel-f').value;
  const refund = document.getElementById('lb-refund-f').value;
  return lbDB.filter(r => {
    const text = `${r.name} ${r.phone}`.toLowerCase();
    const rs = getRefundStatus(r);
    return (!q || text.includes(q)) && (!travel || r.travelStatus === travel) && (!refund || rs === refund);
  });
}

function renderLB() {
  // metrics
  const travelled  = lbDB.filter(r => r.travelStatus === 'TRAVELLED').length;
  const notYet     = lbDB.filter(r => r.travelStatus === 'NOT YET').length;
  const incomplete = lbDB.filter(r => getRefundStatus(r) === 'incomplete').length;
  let totalOwed = 0, totalPaid = 0;
  lbDB.forEach(r => {
    if (r.ppStatus !== 'HAD PP' && (r.notes || '').trim().toUpperCase() !== 'RETURNED') {
      totalOwed += Number(r.toRefund) || 0;
      totalPaid += (Number(r.r1Amt) || 0) + (Number(r.r2Amt) || 0);
    }
  });
  document.getElementById('lb-metrics').innerHTML = `
    <div class="metric"><div class="metric-label">Total</div><div class="metric-val">${lbDB.length}</div></div>
    <div class="metric"><div class="metric-label">Travelled</div><div class="metric-val green">${travelled}</div></div>
    <div class="metric"><div class="metric-label">Not yet</div><div class="metric-val blue">${notYet}</div></div>
    <div class="metric"><div class="metric-label">Refund balance</div><div class="metric-val sm amber">$${totalOwed - totalPaid}</div></div>
    <div class="metric"><div class="metric-label">Incomplete refunds</div><div class="metric-val amber">${incomplete}</div></div>`;

  const data = getFilteredLB();
  const totalPages = Math.max(1, Math.ceil(data.length / PER_PAGE));
  if (lbPage > totalPages) lbPage = 1;
  const slice = data.slice((lbPage - 1) * PER_PAGE, lbPage * PER_PAGE);

  const tbody = document.getElementById('lb-tbody');
  if (!slice.length) {
    tbody.innerHTML = `<tr><td colspan="11"><div class="empty">
      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
      No candidates match your search</div></td></tr>`;
  } else {
    tbody.innerHTML = slice.map((r, i) => {
      const rs   = getRefundStatus(r);
      const paid = (Number(r.r1Amt) || 0) + (Number(r.r2Amt) || 0);
      const bal  = (rs === 'N/A' || rs === 'RETURNED') ? '—' : '$' + (Number(r.toRefund) - paid);
      const toRefundDisplay = rs === 'N/A' ? '—' : '$' + (r.toRefund || 0);
      const paidDisplay     = rs === 'N/A' ? '—' : '$' + paid;
      const balClass = rs === 'incomplete' ? 'balance-owed' : '';
      return `<tr>
        <td>${(lbPage-1)*PER_PAGE + i + 1}</td>
        <td class="name-cell">${r.name}</td>
        <td>${r.phone || '—'}</td>
        <td>${r.ppStatus}</td>
        <td>${travelBadge(r.travelStatus)}</td>
        <td>${fmtDate(r.travelDate)}</td>
        <td>${toRefundDisplay}</td>
        <td>${paidDisplay}</td>
        <td class="${balClass}">${bal}</td>
        <td>${refundBadge(rs)}</td>
        <td style="white-space:nowrap">
          <button class="action-btn" onclick="editLB(${r.id})" title="Edit">✏️</button>
          <button class="action-btn del" onclick="deleteLB(${r.id})" title="Delete">🗑</button>
        </td></tr>`;
    }).join('');
  }
  renderPagination('lb-pagination', lbPage, totalPages, data.length, 'lb');
}

function openLBForm() {
  editingLbId = null;
  document.getElementById('lb-modal-title').textContent = 'Add LB candidate';
  ['lf-name','lf-phone','lf-tdate','lf-torefund','lf-r1date','lf-r1amt','lf-r2date','lf-r2amt','lf-notes']
    .forEach(id => document.getElementById(id).value = '');
  document.getElementById('lf-pp').value     = 'APPLIED';
  document.getElementById('lf-travel').value = 'NOT YET';
  document.getElementById('lb-modal').classList.add('open');
}

function editLB(id) {
  const r = lbDB.find(x => x.id === id); if (!r) return;
  editingLbId = id;
  document.getElementById('lb-modal-title').textContent = 'Edit LB candidate';
  document.getElementById('lf-name').value    = r.name;
  document.getElementById('lf-phone').value   = r.phone || '';
  document.getElementById('lf-pp').value      = r.ppStatus;
  document.getElementById('lf-travel').value  = r.travelStatus;
  document.getElementById('lf-tdate').value   = toInput(r.travelDate);
  document.getElementById('lf-torefund').value = r.toRefund || '';
  document.getElementById('lf-r1date').value  = toInput(r.r1Date);
  document.getElementById('lf-r1amt').value   = r.r1Amt || '';
  document.getElementById('lf-r2date').value  = toInput(r.r2Date);
  document.getElementById('lf-r2amt').value   = r.r2Amt || '';
  document.getElementById('lf-notes').value   = r.notes || '';
  document.getElementById('lb-modal').classList.add('open');
}

function saveLB() {
  const name = document.getElementById('lf-name').value.trim();
  if (!name) { showToast('Full name is required.', 'error'); return; }
  const ppStatus = document.getElementById('lf-pp').value;
  const isHadPP  = ppStatus === 'HAD PP';
  const rec = {
    id: editingLbId || nextLbId++,
    name:        name.toUpperCase(),
    phone:       document.getElementById('lf-phone').value.trim(),
    ppStatus,
    travelStatus: document.getElementById('lf-travel').value,
    travelDate:   document.getElementById('lf-tdate').value,
    toRefund: isHadPP ? 0 : (Number(document.getElementById('lf-torefund').value) || 0),
    r1Date:   document.getElementById('lf-r1date').value,
    r1Amt:    isHadPP ? 0 : (Number(document.getElementById('lf-r1amt').value) || 0),
    r2Date:   document.getElementById('lf-r2date').value,
    r2Amt:    isHadPP ? 0 : (Number(document.getElementById('lf-r2amt').value) || 0),
    notes:    document.getElementById('lf-notes').value.trim(),
  };
  if (editingLbId) {
    const i = lbDB.findIndex(x => x.id === editingLbId);
    lbDB[i] = rec;
    showToast('Candidate updated ✓', 'success');
  } else {
    lbDB.push(rec);
    showToast('Candidate added ✓', 'success');
  }
  closeModal('lb-modal');
  scheduleSave();
  renderLB();
}

function deleteLB(id) {
  if (!confirm('Delete this candidate? This cannot be undone.')) return;
  lbDB = lbDB.filter(x => x.id !== id);
  scheduleSave();
  showToast('Candidate deleted', 'success');
  renderLB();
}

// ─── PAGINATION ───────────────────────────────────────────
function renderPagination(elId, page, total, count, which) {
  const el = document.getElementById(elId);
  if (total <= 1) { el.innerHTML = `<span>${count} record${count !== 1 ? 's' : ''}</span>`; return; }
  let btns = '';
  for (let p = 1; p <= total; p++) {
    if (p === 1 || p === total || Math.abs(p - page) <= 1) {
      btns += `<button class="${p === page ? 'active' : ''}" onclick="goPage('${which}',${p})">${p}</button>`;
    } else if (Math.abs(p - page) === 2) {
      btns += `<span style="padding:4px 4px;color:var(--text-3)">…</span>`;
    }
  }
  el.innerHTML = `<span>${count} record${count !== 1 ? 's' : ''}</span><div class="page-btns">${btns}</div>`;
}

function goPage(which, p) {
  if (which === 'pro') { proPage = p; renderPro(); }
  else                 { lbPage  = p; renderLB();  }
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

// ─── MODAL ────────────────────────────────────────────────
function closeModal(id) { document.getElementById(id).classList.remove('open'); }

document.getElementById('pro-modal').addEventListener('click', function(e) { if (e.target === this) closeModal('pro-modal'); });
document.getElementById('lb-modal').addEventListener('click',  function(e) { if (e.target === this) closeModal('lb-modal'); });

// ─── TOAST ────────────────────────────────────────────────
function showToast(msg, type = '') {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.className = 'toast ' + type;
  void t.offsetWidth;
  t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), 2500);
}

// ─── INIT ─────────────────────────────────────────────────
if (sessionStorage.getItem('dr_auth') === '1') loadData();
