// ==========================================
// SUPABASE CLIENT (Declared ONLY ONCE)
// ==========================================
const SUPABASE_URL = "https://pizirpyvkxzghvxlipzc.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_UIyIdjowYK4Klg2tU4Nz8A_t1BV2QgQ";

const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// ==========================================
// GLOBAL STATE
// ==========================================
let currentUser = null;
let activeTab = 'dash';
let proPage = 1;
let lbPage = 1;
const rowsPerPage = 10;

let currentEditingId = null;
let currentDocsType = null;

let globalProData = [];
let globalLbData = [];

// ==========================================
// HARDCODED AUTH
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
// UTILITIES
// ==========================================
function escapeHtml(str) {
  if (!str) return '';
  return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;").replace(/'/g, "&#039;");
}

function escapeCsv(str) {
  if (!str) return '';
  return str.replace(/"/g, '""');
}

function showToast(msg, variant = 'success') {
  const toast = document.getElementById('toast');
  if (!toast) return;
  toast.textContent = msg;
  toast.className = `toast show ${variant}`;
  setTimeout(() => toast.classList.remove('show'), 3000);
}

function setSaveStatus(state) {
  const indicator = document.getElementById('save-status');
  const text = document.getElementById('save-text');
  if (indicator) indicator.className = `save-status ${state}`;
  if (text) text.textContent = state === 'saving' ? 'Saving to Cloud...' : 'Saved to Cloud';
}

function closeModal(id) {
  const modal = document.getElementById(id);
  if (modal) modal.classList.remove('open');
  currentEditingId = null;
}

// Close modals when clicking outside
document.querySelectorAll('.modal-bg').forEach(bg => {
  bg.addEventListener('click', (e) => {
    if (e.target === bg) closeModal(bg.id);
  });
});

// ==========================================
// AUTH FUNCTIONS
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
// NAVIGATION
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
// DASHBOARD
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
  // Alerts
  const alertsContainer = document.getElementById('dash-alerts');
  let alertsHtml = '';
  proList.forEach(c => {
    const bal = (c.commission || 0) - (c.amount_paid || 0);
    if (c.current_stage === 'TRAVELLED' && bal > 0) {
      alertsHtml += `<div class="alert-row"><div class="alert-dot red"></div><div><span class="alert-name">${c.full_name}</span> <span class="alert-msg">has travelled but owes KES ${bal.toLocaleString()}</span></div></div>`;
    }
  });
  lbList.forEach(c => {
    if (c.travel_status === 'NOT TRAVELLED' && c.refund_status !== 'complete') {
      alertsHtml += `<div class="alert-row"><div class="alert-dot amber"></div><div><span class="alert-name">${c.full_name}</span> <span class="alert-msg">did not travel. Refund: ${c.refund_status}</span></div></div>`;
    }
  });
  alertsContainer.innerHTML = alertsHtml ? `<div class="alerts-card"><h3>⚠️ Action Alerts</h3>${alertsHtml}</div>` : `<div class="alerts-card"><h3>⚠️ Action Alerts</h3><div class="no-alerts">All clear.</div></div>`;

  // ... (rest of your original renderDashboard can be added if needed)
}

// ==========================================
// PRO & LB FUNCTIONS (rest of your original code)
// ==========================================
async function loadProData() { /* paste your original loadProData here */ }
function populateCompanyFilter(data) { /* original */ }
function renderPro() { /* original */ }
function getStageBadgeClass(stg) { /* original */ }

async function loadLBData() { /* original */ }
function renderLB() { /* original */ }

function renderPagination(elemId, totalPages, currPage, type) { /* original */ }
function changePage(type, targetPage) { /* original */ }

async function openProForm(id = null) { /* original */ }
async function savePro() { /* original */ }

async function openLBForm(id = null) { /* original */ }
async function saveLB() { /* original */ }

async function deleteCandidate(type, id) { /* original */ }

async function addTimelineEvent(type, candidateId, actionText) { /* original */ }
async function renderTimeline(type, candidateId) { /* original */ }

// ==========================================
// DOCUMENTS - FIXED
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
    if (data) data.forEach(row => linksMap[row.document_type] = row.drive_url);

    const schemas = type === 'pro' ? PRO_DOC_SCHEMAS : LB_DOC_SCHEMAS;
    let html = '';

    schemas.forEach(schema => {
      const currentUrl = linksMap[schema.key] || '';
      html += `
        <div class="doc-slot">
          <div class="doc-slot-label">${schema.label}</div>
          <div class="doc-link-row">
            <input type="url" class="doc-link-input" data-key="${schema.key}" value="${escapeHtml(currentUrl)}" placeholder="https://drive.google.com/..." oninput="evaluateDocRow(this)">
            <button type="button" class="doc-open-btn" data-url="${escapeHtml(currentUrl)}">🔗 Open</button>
          </div>
        </div>`;
    });

    grid.innerHTML = html;

    grid.querySelectorAll('.doc-open-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const url = btn.dataset.url;
        if (url) window.open(url, '_blank');
      });
    });

  } catch (err) {
    console.error(err);
    grid.innerHTML = '<div style="grid-column:1/-1; color:var(--red)">Failed to load documents.</div>';
  }
}

function evaluateDocRow(input) {
  const btn = input.nextElementSibling;
  const val = input.value.trim();
  if (val) {
    btn.removeAttribute('disabled');
    btn.dataset.url = val;
  } else {
    btn.setAttribute('disabled', 'true');
  }
}

async function saveDocs() { /* your original saveDocs function */ }

function exportExcel(type) { /* your original exportExcel */ }

function switchModalTab(type, tabKey, tabButtonElement) { /* original */ }
function resetModalTabs(type) { /* original */ }
function openAddStageModal(type) { /* original */ }

console.log("✅ app.js loaded successfully");
