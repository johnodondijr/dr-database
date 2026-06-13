// ==========================================
// SUPABASE CLIENT CONFIGURATION & INITIALIZATION
// ==========================================
const SUPABASE_URL = "https://pizirpyvkxzghvxlipzc.supabase.co"; // Replace with your real Supabase URL
const SUPABASE_ANON_KEY = "sb_publishable_UIyIdjowYK4Klg2tU4Nz8A_t1BV2QgQ"; // Replace with your real Anon API Key

const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// ==========================================
// STATE MANAGEMENT & CONFIGURATION
// ==========================================
let currentUser = null;
let activeTab = 'dash';

// Pagination States
let proPage = 1;
let lbPage = 1;
const rowsPerPage = 10;

// Dynamic Modals Tracking State
let currentEditingId = null;
let currentDocsType = null; // 'pro' or 'lb'

// ==========================================
// HARDCODED SYSTEM FALLBACKS & AUTH ENTRIES
// ==========================================
const STAFF_ACCOUNTS = {
  fred: "dr123",
  robert: "dr456",
  doreen: "dr789",
  maxwell: "dr000",
  consolata: "dr555"
};
const MASTER_RECOVERY_CODE = "DESTINY2026";

// ==========================================
// AUTHENTICATION ENGINE
// ==========================================
function togglePassword() {
  const pwInput = document.getElementById('pw-input');
  const toggleBtn = document.getElementById('pw-toggle');
  if (pwInput.type === 'password') {
    pwInput.type = 'text';
    toggleBtn.textContent = '🙈';
  } else {
    pwInput.type = 'password';
    toggleBtn.textContent = '👁';
  }
}

function showForgotPassword() {
  document.getElementById('login-main').style.display = 'none';
  document.getElementById('forgot-section').style.display = 'block';
}

function hideForgotPassword() {
  document.getElementById('login-main').style.display = 'block';
  document.getElementById('forgot-section').style.display = 'none';
  document.getElementById('forgot-error').style.display = 'none';
  document.getElementById('forgot-result').style.display = 'none';
}

function submitForgotPassword() {
  const code = document.getElementById('recovery-code-input').value.trim();
  const errDiv = document.getElementById('forgot-error');
  const resDiv = document.getElementById('forgot-result');
  
  errDiv.style.display = 'none';
  resDiv.style.display = 'none';

  if (code === MASTER_RECOVERY_CODE) {
    let html = '<strong>Staff Passwords:</strong><br><ul style="text-align:left; margin-top:8px; padding-left:16px;">';
    for (const [user, pass] of Object.entries(STAFF_ACCOUNTS)) {
      html += `<li><strong>${user}:</strong> ${pass}</li>`;
    }
    html += '</ul>';
    resDiv.innerHTML = html;
    resDiv.style.display = 'block';
  } else {
    errDiv.textContent = "Invalid recovery code.";
    errDiv.style.display = 'block';
  }
}

function doLogin() {
  const user = document.getElementById('username-input').value.trim().toLowerCase();
  const pass = document.getElementById('pw-input').value.trim();
  const errDiv = document.getElementById('login-error');

  if (STAFF_ACCOUNTS[user] && STAFF_ACCOUNTS[user] === pass) {
    currentUser = user.charAt(0).toUpperCase() + user.slice(1);
    errDiv.style.display = 'none';
    document.getElementById('login-screen').style.display = 'none';
    document.getElementById('app').style.display = 'block';
    document.getElementById('user-chip').textContent = currentUser;
    
    showToast(`Welcome back, ${currentUser}!`, 'success');
    switchTab('dash');
  } else {
    errDiv.style.display = 'block';
  }
}

function doLogout() {
  currentUser = null;
  document.getElementById('username-input').value = '';
  document.getElementById('pw-input').value = '';
  document.getElementById('app').style.display = 'none';
  document.getElementById('login-screen').style.display = 'flex';
  hideForgotPassword();
}

// ==========================================
// CORE SHELL NAVIGATION
// ==========================================
function switchTab(tabName) {
  activeTab = tabName;
  document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
  document.getElementById('dash-section').style.display = 'none';
  document.getElementById('pro-section').style.display = 'none';
  document.getElementById('lb-section').style.display = 'none';

  if (tabName === 'dash') {
    document.getElementById('tab-dash').classList.add('active');
    document.getElementById('dash-section').style.display = 'block';
    loadDashboardData();
  } else if (tabName === 'pro') {
    document.getElementById('tab-pro').classList.add('active');
    document.getElementById('pro-section').style.display = 'block';
    proPage = 1;
    loadProData();
  } else if (tabName === 'lb') {
    document.getElementById('tab-lb').classList.add('active');
    document.getElementById('lb-section').style.display = 'block';
    lbPage = 1;
    loadLBData();
  }
}

// ==========================================
// ANALYTICS & DASHBOARD ENGINE
// ==========================================
async function loadDashboardData() {
  setSaveStatus('saving');
  try {
    const { data: proCandidates } = await supabase.from('professional_candidates').select('*');
    const { data: lbCandidates } = await supabase.from('lb_candidates').select('*');

    renderDashboard(proCandidates || [], lbCandidates || []);
    setSaveStatus('saved');
  } catch (err) {
    console.error(err);
    showToast('Failed to load dashboard metrics.', 'error');
  }
}

function renderDashboard(proList, lbList) {
  // 1. Alerts & Flags
  const alertsContainer = document.getElementById('dash-alerts');
  let alertsHtml = '';
  
  // Pro balance alerts
  proList.forEach(c => {
    const bal = (c.commission || 0) - (c.amount_paid || 0);
    if (c.current_stage === 'TRAVELLED' && bal > 0) {
      alertsHtml += `
        <div class="alert-row">
          <div class="alert-dot red"></div>
          <div><span class="alert-name">${c.full_name}</span> <span class="alert-msg">has travelled but owes a balance of KES ${bal.toLocaleString()}</span></div>
        </div>`;
    }
  });

  // LB refund alerts
  lbList.forEach(c => {
    if (c.travel_status === 'NOT TRAVELLED' && c.refund_status !== 'complete') {
      alertsHtml += `
        <div class="alert-row">
          <div class="alert-dot amber"></div>
          <div><span class="alert-name">${c.full_name}</span> <span class="alert-msg">did not travel. Passport status: ${c.passport_status}. Refund status: ${c.refund_status}</span></div>
        </div>`;
    }
  });

  alertsContainer.innerHTML = alertsHtml ? `
    <div class="alerts-card">
      <h3>⚠️ Action Alerts</h3>
      ${alertsHtml}
    </div>` : '<div class="alerts-card"><h3>⚠️ Action Alerts</h3><div class="no-alerts">All candidate pipelines clear. No immediate exceptions flagged.</div></div>';

  // 2. Section Summaries (Top Grid)
  const proTotalComm = proList.reduce((acc, c) => acc + (c.commission || 0), 0);
  const proTotalPaid = proList.reduce((acc, c) => acc + (c.amount_paid || 0), 0);
  const proTotalOwed = proTotalComm - proTotalPaid;

  document.getElementById('dash-pro-card').innerHTML = `
    <h3>💼 Professional Overview</h3>
    <div class="dash-stage-row"><span class="dash-stage-label">Total Pool Size</span><span class="dash-stage-count">${proList.length}</span></div>
    <div class="dash-stage-row"><span class="dash-stage-label">Gross Revenue (KES)</span><span class="dash-stage-count">${proTotalComm.toLocaleString()}</span></div>
    <div class="dash-stage-row"><span class="dash-stage-label">Total Collected (KES)</span><span class="dash-stage-count" style="color:var(--green)">${proTotalPaid.toLocaleString()}</span></div>
    <div class="dash-stage-row"><span class="dash-stage-label">Total Outstandings (KES)</span><span class="dash-stage-count" style="color:var(--amber)">${proTotalOwed.toLocaleString()}</span></div>
  `;

  const lbTotalRefundable = lbList.reduce((acc, c) => acc + (c.amount_to_refund || 0), 0);
  const lbTotalRefunded = lbList.reduce((acc, c) => acc + (c.refund_1_amount || 0) + (c.refund_2_amount || 0), 0);
  const lbOutstandingRefunds = lbTotalRefundable - lbTotalRefunded;

  document.getElementById('dash-lb-card').innerHTML = `
    <h3>🏠 LB Jobs Overview</h3>
    <div class="dash-stage-row"><span class="dash-stage-label">Total Pool Size</span><span class="dash-stage-count">${lbList.length}</span></div>
    <div class="dash-stage-row"><span class="dash-stage-label">Active Deployments</span><span class="dash-stage-count">${lbList.filter(c => c.travel_status === 'TRAVELLED').length}</span></div>
    <div class="dash-stage-row"><span class="dash-stage-label">Gross Escrow Allocations (USD)</span><span class="dash-stage-count">$${lbTotalRefundable.toLocaleString()}</span></div>
    <div class="dash-stage-row"><span class="dash-stage-label">Pending Remittances (USD)</span><span class="dash-stage-count" style="color:var(--red)">$${lbOutstandingRefunds.toLocaleString()}</span></div>
  `;

  // 3. Pipeline Metric Visualizers
  const proStages = ['PENDING OFFER LETTER', 'PENDING MOL', 'PENDING VISA', 'PENDING TRAVEL', 'TRAVELLED'];
  let proStagesHtml = '<h3>📈 Professional Stages</h3>';
  proStages.forEach(stg => {
    const count = proList.filter(c => c.current_stage === stg).length;
    const pct = proList.length ? (count / proList.length) * 100 : 0;
    proStagesHtml += `
      <div class="dash-stage-row" style="display:block; padding: 6px 0;">
        <div style="display:flex; justify-content:space-between; font-size:12px;">
          <span class="dash-stage-label">${stg}</span>
          <span class="dash-stage-count">${count}</span>
        </div>
        <div class="dash-stage-bar"><div class="dash-stage-fill" style="width:${pct}%"></div></div>
      </div>`;
  });
  document.getElementById('dash-pro-stages').innerHTML = proStagesHtml;

  const lbRefundStages = ['complete', 'incomplete', 'RETURNED', 'N/A'];
  let lbRefundsHtml = '<h3>⚖ LB Refund Matrix</h3>';
  lbRefundStages.forEach(stg => {
    const count = lbList.filter(c => c.refund_status === stg).length;
    const pct = lbList.length ? (count / lbList.length) * 100 : 0;
    lbRefundsHtml += `
      <div class="dash-stage-row" style="display:block; padding: 6px 0;">
        <div style="display:flex; justify-content:space-between; font-size:12px;">
          <span class="dash-stage-label">${stg === 'N/A' ? 'N/A (Had Passport)' : stg.toUpperCase()}</span>
          <span class="dash-stage-count">${count}</span>
        </div>
        <div class="dash-stage-bar" style="background:var(--blue-light)"><div class="dash-stage-fill" style="width:${pct}%; background:var(--blue)"></div></div>
      </div>`;
  });
  document.getElementById('dash-lb-refunds').innerHTML = lbRefundsHtml;
}

// ==========================================
// PROFESSIONAL SUBSYSTEM
// ==========================================
let globalProData = [];

async function loadProData() {
  setSaveStatus('saving');
  try {
    const { data, error } = await supabase.from('professional_candidates').select('*').order('created_at', { ascending: false });
    if (error) throw error;
    
    globalProData = data || [];
    populateCompanyFilter(globalProData);
    renderPro();
    setSaveStatus('saved');
  } catch (err) {
    console.error(err);
    showToast('Failed to load professional track.', 'error');
  }
}

function populateCompanyFilter(data) {
  const select = document.getElementById('pro-company-f');
  const currentVal = select.value;
  const companies = [...new Set(data.map(c => c.company).filter(Boolean))];
  
  let html = '<option value="">All companies</option>';
  companies.forEach(c => { html += `<option value="${c}">${c}</option>`; });
  select.innerHTML = html;
  select.value = currentVal;
}

function renderPro() {
  const query = document.getElementById('pro-search').value.toLowerCase();
  const stageF = document.getElementById('pro-stage-f').value;
  const companyF = document.getElementById('pro-company-f').value;

  // Multi-criteria client side filtering
  let filtered = globalProData.filter(c => {
    const matchQuery = !query || 
      (c.full_name && c.full_name.toLowerCase().includes(query)) ||
      (c.passport_no && c.passport_no.toLowerCase().includes(query)) ||
      (c.company && c.company.toLowerCase().includes(query)) ||
      (c.position && c.position.toLowerCase().includes(query));
    
    const matchStage = !stageF || c.current_stage === stageF;
    const matchCompany = !companyF || c.company === companyF;

    return matchQuery && matchStage && matchCompany;
  });

  // Render Aggregated Dashboard Header Cards dynamically
  const total = filtered.length;
  const pendingVisa = filtered.filter(c => c.current_stage === 'PENDING VISA').length;
  const travelled = filtered.filter(c => c.current_stage === 'TRAVELLED').length;
  const totalOwed = filtered.reduce((acc, c) => acc + ((c.commission || 0) - (c.amount_paid || 0)), 0);

  document.getElementById('pro-metrics').innerHTML = `
    <div class="metric"><div class="metric-label">Total Displayed</div><div class="metric-val blue">${total}</div></div>
    <div class="metric"><div class="metric-label">Pending Visa</div><div class="metric-val amber">${pendingVisa}</div></div>
    <div class="metric"><div class="metric-label">Travelled Assets</div><div class="metric-val green">${travelled}</div></div>
    <div class="metric"><div class="metric-label">Outstanding KES</div><div class="metric-val red sm">${totalOwed.toLocaleString()}</div></div>
  `;

  // Pagination Splitting Logic
  const totalPages = Math.ceil(filtered.length / rowsPerPage) || 1;
  if (proPage > totalPages) proPage = totalPages;
  const startIdx = (proPage - 1) * rowsPerPage;
  const pageData = filtered.slice(startIdx, startIdx + rowsPerPage);

  // Core Loop Generation
  const tbody = document.getElementById('pro-tbody');
  if (!pageData.length) {
    tbody.innerHTML = `<tr><td colspan="13"><div class="empty">No matching professional candidates mapped.</div></td></tr>`;
    renderPagination('pro-pagination', totalPages, proPage, 'pro');
    return;
  }

  let html = '';
  pageData.forEach((c, idx) => {
    const globalIdx = startIdx + idx + 1;
    const balance = (c.commission || 0) - (c.amount_paid || 0);
    const stageClass = getStageBadgeClass(c.current_stage);
    
    // Safety flag for deployment balance mismatches
    const nameCellHtml = (c.current_stage === 'TRAVELLED' && balance > 0)
      ? `<span class="flag-cell" title="ALARM: Balance remaining post deployment!">${c.full_name} ⚠️</span>`
      : c.full_name;

    html += `
      <tr>
        <td>${globalIdx}</td>
        <td class="name-cell">${nameCellHtml}</td>
        <td>${c.passport_no || '—'}</td>
        <td>${c.phone_number || '—'}</td>
        <td>${c.position || '—'}</td>
        <td>${c.company || '—'}</td>
        <td>${c.destination_country || '—'}</td>
        <td><span class="badge ${stageClass}">${c.current_stage}</span></td>
        <td>${c.commission ? c.commission.toLocaleString() : '0'}</td>
        <td>${c.amount_paid ? c.amount_paid.toLocaleString() : '0'}</td>
        <td class="${balance > 0 ? 'balance-owed' : ''}">${balance ? balance.toLocaleString() : '0'}</td>
        <td>
          <button class="action-btn docs" onclick="openDocsModal('pro', '${c.id}', '${escapeHtml(c.full_name)}')" title="Manage Cloud Drive links">📁</button>
        </td>
        <td>
          <div style="display:flex; gap:4px">
            <button class="action-btn" onclick="openProForm('${c.id}')" title="Edit Candidate Record">✏️</button>
            <button class="action-btn del" onclick="deleteCandidate('pro', '${c.id}')" title="Drop Record">🗑️</button>
          </div>
        </td>
      </tr>`;
  });
  tbody.innerHTML = html;
  renderPagination('pro-pagination', totalPages, proPage, 'pro');
}

function getStageBadgeClass(stg) {
  switch (stg) {
    case 'PENDING OFFER LETTER': return 'b-pol';
    case 'PENDING MOL': return 'b-mol';
    case 'PENDING VISA': return 'b-visa';
    case 'PENDING TRAVEL': return 'b-travel';
    case 'TRAVELLED': return 'b-travelled';
    default: return 'b-na';
  }
}

// ==========================================
// LB (LIVE MATRIX) SUBSYSTEM
// ==========================================
let globalLbData = [];

async function loadLBData() {
  setSaveStatus('saving');
  try {
    const { data, error } = await supabase.from('lb_candidates').select('*').order('created_at', { ascending: false });
    if (error) throw error;
    
    globalLbData = data || [];
    renderLB();
    setSaveStatus('saved');
  } catch (err) {
    console.error(err);
    showToast('Failed to sync LB infrastructure.', 'error');
  }
}

function renderLB() {
  const query = document.getElementById('lb-search').value.toLowerCase();
  const travelF = document.getElementById('lb-travel-f').value;
  const refundF = document.getElementById('lb-refund-f').value;

  let filtered = globalLbData.filter(c => {
    const matchQuery = !query || 
      (c.full_name && c.full_name.toLowerCase().includes(query)) ||
      (c.phone_number && c.phone_number.toLowerCase().includes(query)) ||
      (c.passport_no && c.passport_no.toLowerCase().includes(query));
      
    const matchTravel = !travelF || c.travel_status === travelF;
    const matchRefund = !refundF || c.refund_status === refundF;

    return matchQuery && matchTravel && matchRefund;
  });

  // Calculate local card summaries
  const total = filtered.length;
  const deployed = filtered.filter(c => c.travel_status === 'TRAVELLED').length;
  const nonTravelled = filtered.filter(c => c.travel_status === 'NOT TRAVELLED').length;
  const totalRefundOwed = filtered.reduce((acc, c) => {
    const rem = (c.amount_to_refund || 0) - ((c.refund_1_amount || 0) + (c.refund_2_amount || 0));
    return acc + (rem > 0 ? rem : 0);
  }, 0);

  document.getElementById('lb-metrics').innerHTML = `
    <div class="metric"><div class="metric-label">Total Pool</div><div class="metric-val blue">${total}</div></div>
    <div class="metric"><div class="metric-label">Deployed</div><div class="metric-val green">${deployed}</div></div>
    <div class="metric"><div class="metric-label">Aborted Plans</div><div class="metric-val red">${nonTravelled}</div></div>
    <div class="metric"><div class="metric-label">Remittance Due (USD)</div><div class="metric-val amber sm">$${totalRefundOwed.toLocaleString()}</div></div>
  `;

  const totalPages = Math.ceil(filtered.length / rowsPerPage) || 1;
  if (lbPage > totalPages) lbPage = totalPages;
  const startIdx = (lbPage - 1) * rowsPerPage;
  const pageData = filtered.slice(startIdx, startIdx + rowsPerPage);

  const tbody = document.getElementById('lb-tbody');
  if (!pageData.length) {
    tbody.innerHTML = `<tr><td colspan="12"><div class="empty">No matching LB records indexed.</div></td></tr>`;
    renderPagination('lb-pagination', totalPages, lbPage, 'lb');
    return;
  }

  let html = '';
  pageData.forEach((c, idx) => {
    const globalIdx = startIdx + idx + 1;
    const totalRefunded = (c.refund_1_amount || 0) + (c.refund_2_amount || 0);
    const balance = (c.amount_to_refund || 0) - totalRefunded;

    let travelClass = 'b-notyet';
    if (c.travel_status === 'TRAVELLED') travelClass = 'b-travelled';
    if (c.travel_status === 'NOT TRAVELLED') travelClass = 'b-nottravelled';

    let refundClass = 'b-na';
    if (c.refund_status === 'complete') refundClass = 'b-complete';
    if (c.refund_status === 'incomplete') refundClass = 'b-incomplete';
    if (c.refund_status === 'RETURNED') refundClass = 'b-returned';

    html += `
      <tr>
        <td>${globalIdx}</td>
        <td class="name-cell">${c.full_name}</td>
        <td>${c.phone_number || '—'}</td>
        <td>${c.passport_no || '—'}</td>
        <td><span class="badge ${travelClass}">${c.travel_status}</span></td>
        <td>${c.travel_date || '—'}</td>
        <td>${c.amount_to_refund ? '$' + c.amount_to_refund.toLocaleString() : '0'}</td>
        <td>${totalRefunded ? '$' + totalRefunded.toLocaleString() : '0'}</td>
        <td class="${balance > 0 ? 'balance-owed' : ''}">${balance ? '$' + balance.toLocaleString() : '0'}</td>
        <td><span class="badge ${refundClass}">${c.refund_status || 'N/A'}</span></td>
        <td>
          <button class="action-btn docs" onclick="openDocsModal('lb', '${c.id}', '${escapeHtml(c.full_name)}')" title="Cloud files">📁</button>
        </td>
        <td>
          <div style="display:flex; gap:4px">
            <button class="action-btn" onclick="openLBForm('${c.id}')" title="Edit candidate">✏️</button>
            <button class="action-btn del" onclick="deleteCandidate('lb', '${c.id}')" title="Purge entry">🗑️</button>
          </div>
        </td>
      </tr>`;
  });
  tbody.innerHTML = html;
  renderPagination('lb-pagination', totalPages, lbPage, 'lb');
}

// ==========================================
// PAGINATION UTILITY PIPELINES
// ==========================================
function renderPagination(elemId, totalPages, currPage, type) {
  const container = document.getElementById(elemId);
  if (totalPages <= 1) {
    container.innerHTML = `<div>Showing records</div><div>Page 1 of 1</div>`;
    return;
  }
  let btnsHtml = '';
  for (let i = 1; i <= totalPages; i++) {
    btnsHtml += `<button class="${i === currPage ? 'active' : ''}" onclick="changePage('${type}', ${i})">${i}</button>`;
  }
  container.innerHTML = `
    <div>Showing operational rows</div>
    <div class="page-btns">${btnsHtml}</div>
  `;
}

function changePage(type, targetPage) {
  if (type === 'pro') { proPage = targetPage; renderPro(); }
  else { lbPage = targetPage; renderLB(); }
}

// ==========================================
// FORM DATA STRUCTURING & MUTATIONS (PRO)
// ==========================================
async function openProForm(id = null) {
  currentEditingId = id;
  resetModalTabs('pro');
  
  if (!id) {
    document.getElementById('pro-modal-title').textContent = "Add professional candidate";
    document.getElementById('pf-name').value = '';
    document.getElementById('pf-pp').value = '';
    document.getElementById('pf-phone').value = '';
    document.getElementById('pf-position').value = '';
    document.getElementById('pf-company').value = '';
    document.getElementById('pf-country').value = '';
    document.getElementById('pf-stage').value = 'PENDING OFFER LETTER';
    document.getElementById('pf-submitted').value = '';
    document.getElementById('pf-interview').value = '';
    document.getElementById('pf-ol').value = '';
    document.getElementById('pf-mol').value = '';
    document.getElementById('pf-visa').value = '';
    document.getElementById('pf-travel').value = '';
    document.getElementById('pf-comm').value = '';
    document.getElementById('pf-paid').value = '';
    document.getElementById('pro-form-timeline').innerHTML = '<div class="tl-empty">Save candidate first to see timeline.</div>';
  } else {
    document.getElementById('pro-modal-title').textContent = "Edit professional candidate";
    const record = globalProData.find(c => c.id === id);
    if (!record) return;

    document.getElementById('pf-name').value = record.full_name || '';
    document.getElementById('pf-pp').value = record.passport_no || '';
    document.getElementById('pf-phone').value = record.phone_number || '';
    document.getElementById('pf-position').value = record.position || '';
    document.getElementById('pf-company').value = record.company || '';
    document.getElementById('pf-country').value = record.destination_country || '';
    document.getElementById('pf-stage').value = record.current_stage || 'PENDING OFFER LETTER';
    document.getElementById('pf-submitted').value = record.date_submitted || '';
    document.getElementById('pf-interview').value = record.interview_date || '';
    document.getElementById('pf-ol').value = record.offer_letter_date || '';
    document.getElementById('pf-mol').value = record.mol_date || '';
    document.getElementById('pf-visa').value = record.visa_date || '';
    document.getElementById('pf-travel').value = record.travel_date || '';
    document.getElementById('pf-comm').value = record.commission || '';
    document.getElementById('pf-paid').value = record.amount_paid || '';

    renderTimeline('pro', id);
  }
  document.getElementById('pro-modal').classList.add('open');
}

async function savePro() {
  const name = document.getElementById('pf-name').value.trim();
  const stage = document.getElementById('pf-stage').value;
  if (!name) { alert('Full name field is required.'); return; }

  const payload = {
    full_name: name,
    passport_no: document.getElementById('pf-pp').value.trim(),
    phone_number: document.getElementById('pf-phone').value.trim(),
    position: document.getElementById('pf-position').value.trim(),
    company: document.getElementById('pf-company').value.trim(),
    destination_country: document.getElementById('pf-country').value.trim(),
    current_stage: stage,
    date_submitted: document.getElementById('pf-submitted').value || null,
    interview_date: document.getElementById('pf-interview').value || null,
    offer_letter_date: document.getElementById('pf-ol').value || null,
    mol_date: document.getElementById('pf-mol').value || null,
    visa_date: document.getElementById('pf-visa').value || null,
    travel_date: document.getElementById('pf-travel').value || null,
    commission: parseFloat(document.getElementById('pf-comm').value) || 0,
    amount_paid: parseFloat(document.getElementById('pf-paid').value) || 0,
    updated_by: currentUser
  };

  setSaveStatus('saving');
  try {
    let responseId = currentEditingId;

    if (!currentEditingId) {
      // Insert new record
      payload.created_by = currentUser;
      const { data, error } = await supabase.from('professional_candidates').insert(payload).select();
      if (error) throw error;
      responseId = data[0].id;
      
      // Auto logger injection
      await addTimelineEvent('pro', responseId, 'Candidate initialized inside system pipeline.');
    } else {
      // Check structural stage shifts for automatic audit logger tracking
      const baseline = globalProData.find(c => c.id === currentEditingId);
      if (baseline && baseline.current_stage !== stage) {
        await addTimelineEvent('pro', currentEditingId, `Stage manually updated from ${baseline.current_stage} ➔ ${stage}`);
      }
      
      const { error } = await supabase.from('professional_candidates').update(payload).eq('id', currentEditingId);
      if (error) throw error;
    }

    closeModal('pro-modal');
    showToast('Professional candidate matrix saved.', 'success');
    loadProData();
  } catch (err) {
    console.error(err);
    showToast('Failed to commit profile modifications to cloud.', 'error');
  }
}

// ==========================================
// FORM DATA STRUCTURING & MUTATIONS (LB)
// ==========================================
async function openLBForm(id = null) {
  currentEditingId = id;
  resetModalTabs('lb');

  if (!id) {
    document.getElementById('lb-modal-title').textContent = "Add LB Candidate";
    document.getElementById('lf-name').value = '';
    document.getElementById('lf-phone').value = '';
    document.getElementById('lf-pp').value = 'APPLIED';
    document.getElementById('lf-travel').value = 'NOT YET';
    document.getElementById('lf-tdate').value = '';
    document.getElementById('lf-notes').value = '';
    document.getElementById('lf-torefund').value = '';
    document.getElementById('lf-r1date').value = '';
    document.getElementById('lf-r1amt').value = '';
    document.getElementById('lf-r2date').value = '';
    document.getElementById('lf-r2amt').value = '';
    document.getElementById('lb-form-timeline').innerHTML = '<div class="tl-empty">Save candidate first to see timeline.</div>';
  } else {
    document.getElementById('lb-modal-title').textContent = "Edit LB Candidate";
    const record = globalLbData.find(c => c.id === id);
    if (!record) return;

    document.getElementById('lf-name').value = record.full_name || '';
    document.getElementById('lf-phone').value = record.phone_number || '';
    document.getElementById('lf-pp').value = record.passport_status || 'APPLIED';
    document.getElementById('lf-travel').value = record.travel_status || 'NOT YET';
    document.getElementById('lf-tdate').value = record.travel_date || '';
    document.getElementById('lf-notes').value = record.notes || '';
    document.getElementById('lf-torefund').value = record.amount_to_refund || '';
    document.getElementById('lf-r1date').value = record.refund_1_date || '';
    document.getElementById('lf-r1amt').value = record.refund_1_amount || '';
    document.getElementById('lf-r2date').value = record.refund_2_date || '';
    document.getElementById('lf-r2amt').value = record.refund_2_amount || '';

    renderTimeline('lb', id);
  }
  document.getElementById('lb-modal').classList.add('open');
}

async function saveLB() {
  const name = document.getElementById('lf-name').value.trim();
  if (!name) { alert('Full name field is required.'); return; }

  // Derive structural state maps based on context rules
  let derivedRefundStatus = 'N/A';
  const ppStatus = document.getElementById('lf-pp').value;
  const travelStatus = document.getElementById('lf-travel').value;
  const toRefund = parseFloat(document.getElementById('lf-torefund').value) || 0;
  const r1 = parseFloat(document.getElementById('lf-r1amt').value) || 0;
  const r2 = parseFloat(document.getElementById('lf-r2amt').value) || 0;

  if (ppStatus !== 'HAD PP') {
    if (travelStatus === 'NOT TRAVELLED' && document.getElementById('lf-notes').value.toUpperCase().includes('RETURNED')) {
      derivedRefundStatus = 'RETURNED';
    } else if (toRefund > 0) {
      derivedRefundStatus = (r1 + r2 >= toRefund) ? 'complete' : 'incomplete';
    } else {
      derivedRefundStatus = 'incomplete';
    }
  }

  const payload = {
    full_name: name,
    phone_number: document.getElementById('lf-phone').value.trim(),
    passport_status: ppStatus,
    travel_status: travelStatus,
    travel_date: document.getElementById('lf-tdate').value || null,
    notes: document.getElementById('lf-notes').value.trim(),
    amount_to_refund: toRefund,
    refund_1_date: document.getElementById('lf-r1date').value || null,
    refund_1_amount: r1,
    refund_2_date: document.getElementById('lf-r2date').value || null,
    refund_2_amount: r2,
    refund_status: derivedRefundStatus,
    updated_by: currentUser
  };

  setSaveStatus('saving');
  try {
    let responseId = currentEditingId;

    if (!currentEditingId) {
      payload.created_by = currentUser;
      const { data, error } = await supabase.from('lb_candidates').insert(payload).select();
      if (error) throw error;
      responseId = data[0].id;

      await addTimelineEvent('lb', responseId, 'LB track records set up successfully.');
    } else {
      const baseline = globalLbData.find(c => c.id === currentEditingId);
      if (baseline && baseline.travel_status !== travelStatus) {
        await addTimelineEvent('lb', currentEditingId, `Travel parameters shifted to: ${travelStatus}`);
      }
      const { error } = await supabase.from('lb_candidates').update(payload).eq('id', currentEditingId);
      if (error) throw error;
    }

    closeModal('lb-modal');
    showToast('LB tracking vector aligned and saved.', 'success');
    loadLBData();
  } catch (err) {
    console.error(err);
    showToast('Failed to save cloud transactional states.', 'error');
  }
}

// ==========================================
// SYSTEM REMOVAL OPERATIONS
// ==========================================
async function deleteCandidate(type, id) {
  if (!confirm(`Are you sure you want to completely purge this candidate's history? This is an irreversible structural delete.`)) return;
  
  setSaveStatus('saving');
  try {
    const table = type === 'pro' ? 'professional_candidates' : 'lb_candidates';
    
    // Cascading deletion handles timeline/docs cleanup depending on DB constraints
    const { error } = await supabase.from(table).delete().eq('id', id);
    if (error) throw error;

    showToast('Identity records cleared from index grid.', 'success');
    if (type === 'pro') loadProData(); else loadLBData();
  } catch (err) {
    console.error(err);
    showToast('Cloud rejection: Could not delete row.', 'error');
  }
}

// ==========================================
// AUDIT LOGGING & SYSTEM TIMELINES
// ==========================================
async function addTimelineEvent(type, candidateId, actionText) {
  try {
    const payload = {
      action: actionText,
      performed_by: currentUser || 'System Context'
    };
    if (type === 'pro') payload.pro_candidate_id = candidateId;
    else payload.lb_candidate_id = candidateId;

    await supabase.from('audit_timelines').insert(payload);
  } catch (err) {
    console.error('Timeline tracking dropped:', err);
  }
}

async function renderTimeline(type, candidateId) {
  const container = document.getElementById(`${type}-form-timeline`);
  container.innerHTML = '<div class="tl-empty">Loading operational audits...</div>';

  try {
    const columnF = type === 'pro' ? 'pro_candidate_id' : 'lb_candidate_id';
    const { data, error } = await supabase
      .from('audit_timelines')
      .select('*')
      .eq(columnF, candidateId)
      .order('created_at', { ascending: false });

    if (error) throw error;

    if (!data || !data.length) {
      container.innerHTML = '<div class="tl-empty">No systemic milestones logged for this profile yet.</div>';
      return;
    }

    let html = '';
    data.forEach(item => {
      const dateStr = new Date(item.created_at).toLocaleString('en-KE', { timeZone: 'Africa/Nairobi' });
      html += `
        <div class="tl-item">
          <div class="tl-dot"></div>
          <div class="tl-content">
            <div class="tl-action">${escapeHtml(item.action)}</div>
            <div class="tl-meta">Logged by ${item.performed_by} • ${dateStr}</div>
          </div>
        </div>`;
    });
    container.innerHTML = html;
  } catch (err) {
    console.error(err);
    container.innerHTML = '<div class="tl-empty" style="color:var(--red)">Failed to load data trace audit.</div>';
  }
}

// ==========================================
// CLOUD DOCUMENT STORAGE MAPPING (DRIVE LINKS)
// ==========================================
const PRO_DOC_SCHEMAS = [
  { key: 'passport', label: 'Passport Copy' },
  { key: 'cv', label: 'Curriculum Vitae (CV)' },
  { key: 'good_conduct', label: 'Certificate of Good Conduct' },
  { key: 'medical', label: 'Medical Assessment Report' },
  { key: 'offer_letter', label: 'Signed Offer Letter' },
  { key: 'visa', label: 'Visa Copy' },
  { key: 'ticket', label: 'Flight Ticket' }
];

const LB_DOC_SCHEMAS = [
  { key: 'passport_receipt', label: 'Passport Application Receipt' },
  { key: 'id_copy', label: 'National Identity Card' },
  { key: 'refund_clearance', label: 'Refund Acknowledgement Form' }
];

async function openDocsModal(type, id, name) {
  currentDocsType = type;
  currentEditingId = id;
  document.getElementById('docs-modal-title').textContent = `Document Registry: ${name}`;
  
  const grid = document.getElementById('docs-grid');
  grid.innerHTML = '<div style="grid-column:1/-1; text-align:center; padding:1rem; color:var(--text-3)">Loading Registry Maps...</div>';
  document.getElementById('docs-modal').classList.add('open');

  try {
    const table = type === 'pro' ? 'professional_documents' : 'lb_documents';
    const foreignKey = type === 'pro' ? 'pro_candidate_id' : 'lb_candidate_id';
    
    const { data } = await supabase.from(table).select('*').eq(foreignKey, id);
    const linksMap = {};
    if (data) { data.forEach(row => { linksMap[row.document_type] = row.drive_url; }); }

    const schemas = type === 'pro' ? PRO_DOC_SCHEMAS : LB_DOC_SCHEMAS;
    let html = '';
    
    schemas.forEach(schema => {
      const currentUrl = linksMap[schema.key] || '';
      html += `
        <div class="doc-slot">
          <div class="doc-slot-label">${schema.label}</div>
          <div class="doc-link-row">
            <input type="url" class="doc-link-input" data-key="${schema.key}" value="${escapeHtml(currentUrl)}" placeholder="https://drive.google.com/..." oninput="evaluateDocRow(this)">
            <button type="button" class="doc-open-btn" onclick="window.open('${escapeHtml(currentUrl)}', '_blank')" ${currentUrl ? '' : 'disabled'}>🔗 Open</button>
          </div>
        </div>`;
    });
    grid.innerHTML = html;
  } catch (err) {
    console.error(err);
    grid.innerHTML = '<div style="grid-column:1/-1; color:var(--red)">Failed to pull cloud document registry links.</div>';
  }
}

function evaluateDocRow(input) {
  const btn = input.nextElementSibling;
  const val = input.value.trim();
  if (val) {
    btn.removeAttribute('disabled');
    btn.setAttribute('onclick', `window.open('${escapeHtml(val)}', '_blank')`);
  } else {
    btn.setAttribute('disabled', 'true');
    btn.removeAttribute('onclick');
  }
}

async function saveDocs() {
  const inputs = document.querySelectorAll('.doc-link-input');
  const table = currentDocsType === 'pro' ? 'professional_documents' : 'lb_documents';
  const foreignKey = currentDocsType === 'pro' ? 'pro_candidate_id' : 'lb_candidate_id';

  setSaveStatus('saving');
  try {
    for (const input of inputs) {
      const docType = input.getAttribute('data-key');
      const urlVal = input.value.trim();

      if (!urlVal) {
        // If field was cleared, drop it from the cloud
        await supabase.from(table).delete().eq(foreignKey, currentEditingId).eq('document_type', docType);
      } else {
        // Upsert operations using composite checks or direct overwrite maps
        const { data: existing } = await supabase.from(table).select('id').eq(foreignKey, currentEditingId).eq('document_type', docType);
        
        const payload = { drive_url: urlVal, updated_by: currentUser };
        if (existing && existing.length) {
          await supabase.from(table).update(payload).eq('id', existing[0].id);
        } else {
          payload[foreignKey] = currentEditingId;
          payload.document_type = docType;
          payload.created_by = currentUser;
          await supabase.from(table).insert(payload);
        }
      }
    }

    await addTimelineEvent(currentDocsType, currentEditingId, 'Cloud document attachment registry updated.');
    closeModal('docs-modal');
    showToast('Documents storage indexes compiled.', 'success');
  } catch (err) {
    console.error(err);
    showToast('Failed to save file routing addresses.', 'error');
  }
}

// ==========================================
// EXCEL / CSV REPORT GENERATOR EXPORT PIPELINE
// ==========================================
function exportExcel(type) {
  // Generates highly structured clean platform-independent CSV payloads data tables
  let csvContent = "data:text/csv;charset=utf-8,";
  
  if (type === 'pro') {
    csvContent += "Index,Full Name,Passport No,Phone Number,Position,Company,Destination Country,Current Stage,Commission KES,Amount Paid KES,Balance KES\n";
    globalProData.forEach((c, i) => {
      const bal = (c.commission || 0) - (c.amount_paid || 0);
      csvContent += `"${i+1}","${escapeCsv(c.full_name)}","${escapeCsv(c.passport_no)}","${escapeCsv(c.phone_number)}","${escapeCsv(c.position)}","${escapeCsv(c.company)}","${escapeCsv(c.destination_country)}","${escapeCsv(c.current_stage)}","${c.commission}","${c.amount_paid}","${bal}"\n`;
    });
  } else {
    csvContent += "Index,Full Name,Phone Number,Passport Status,Travel Status,Travel Date,Amount To Refund USD,Refund 1 Amount,Refund 2 Amount,Balance USD,Refund Status,Notes\n";
    globalLbData.forEach((c, i) => {
      const refunded = (c.refund_1_amount || 0) + (c.refund_2_amount || 0);
      const bal = (c.amount_to_refund || 0) - refunded;
      csvContent += `"${i+1}","${escapeCsv(c.full_name)}","${escapeCsv(c.phone_number)}","${escapeCsv(c.passport_status)}","${escapeCsv(c.travel_status)}","${escapeCsv(c.travel_date)}","${c.amount_to_refund}","${c.refund_1_amount}","${c.refund_2_amount}","${bal}","${escapeCsv(c.refund_status)}","${escapeCsv(c.notes)}"\n`;
    });
  }

  const encodedUri = encodeURI(csvContent);
  const link = document.createElement("a");
  link.setAttribute("href", encodedUri);
  link.setAttribute("download", `DestinyRecruit_${type === 'pro' ? 'Professional' : 'LB_Jobs'}_Export_${new Date().toISOString().split('T')[0]}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  showToast('Spreadsheet matrix export generated successfully.', 'success');
}

// ==========================================
// GENERAL PLATFORM MODAL INTERACTION HELPERS
// ==========================================
function switchModalTab(type, tabKey, tabButtonElement) {
  const container = tabButtonElement.parentElement;
  container.querySelectorAll('.modal-tab').forEach(btn => btn.classList.remove('active'));
  tabButtonElement.classList.add('active');

  const modalSectionIds = type === 'pro' 
    ? ['pro-tab-details', 'pro-tab-pipeline', 'pro-tab-commission', 'pro-tab-timeline']
    : ['lb-tab-details', 'lb-tab-refunds', 'lb-tab-timeline'];

  modalSectionIds.forEach(id => { document.getElementById(id).style.display = 'none'; });
  document.getElementById(`${type}-tab-${tabKey}`).style.display = 'block';
}

function resetModalTabs(type) {
  const modalId = type === 'pro' ? 'pro-modal' : 'lb-modal';
  const modalEl = document.getElementById(modalId);
  const tabs = modalEl.querySelectorAll('.modal-tab');
  if(tabs.length > 0) switchModalTab(type, 'details', tabs[0]);
}

function closeModal(id) {
  document.getElementById(id).classList.remove('open');
  currentEditingId = null;
}

function setSaveStatus(state) {
  const indicator = document.getElementById('save-status');
  const text = document.getElementById('save-text');
  indicator.className = 'save-status ' + state;
  text.textContent = state === 'saving' ? 'Saving to Cloud...' : 'Saved to Cloud';
}

function showToast(msg, variant = 'success') {
  const toast = document.getElementById('toast');
  toast.textContent = msg;
  toast.className = `toast show ${variant}`;
  setTimeout(() => { toast.classList.remove('show'); }, 3000);
}

function escapeHtml(str) {
  if (!str) return '';
  return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#039;");
}

function escapeCsv(str) {
  if (!str) return '';
  return str.replace(/"/g, '""');
}

// Custom runtime stage management config updates
function openAddStageModal(type) {
  const label = type === 'pro' ? 'Pipeline Stage' : 'Travel Status Status';
  const newStg = prompt(`Enter new custom ${label} item value:`);
  if (!newStg) return;
  
  const cleanStg = newStg.trim().toUpperCase();
  const selectId = type === 'pro' ? 'pf-stage' : 'lf-travel';
  const filterId = type === 'pro' ? 'pro-stage-f' : 'lb-travel-f';

  const option1 = document.createElement('option');
  option1.value = cleanStg; option1.textContent = cleanStg;
  document.getElementById(selectId).appendChild(option1);

  const option2 = document.createElement('option');
  option2.value = cleanStg; option2.textContent = cleanStg;
  document.getElementById(filterId).appendChild(option2);

  showToast(`Custom element "${cleanStg}" registered locally.`, 'success');
}
