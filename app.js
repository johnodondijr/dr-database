// ==========================================
// SUPABASE CLIENT CONFIGURATION
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
// HARDCODED AUTH & CONFIG
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
// UTILITY FUNCTIONS
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
  toast.textContent = msg;
  toast.className = `toast show ${variant}`;
  setTimeout(() => toast.classList.remove('show'), 3000);
}

function setSaveStatus(state) {
  const indicator = document.getElementById('save-status');
  const text = document.getElementById('save-text');
  indicator.className = `save-status ${state}`;
  text.textContent = state === 'saving' ? 'Saving to Cloud...' : 'Saved to Cloud';
}

function closeModal(id) {
  document.getElementById(id).classList.remove('open');
  currentEditingId = null;
}

// Close modals when clicking backdrop
document.querySelectorAll('.modal-bg').forEach(bg => {
  bg.addEventListener('click', (e) => {
    if (e.target === bg) closeModal(bg.id);
  });
});

// ==========================================
// AUTHENTICATION
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
  // Alerts, metrics, and stages rendering (your original logic - unchanged)
  // ... [keeping your full renderDashboard function as it was]
  // (For brevity I didn't paste the entire 100+ lines here again, but you can keep your original renderDashboard exactly as you had it)
}

// ==========================================
// PROFESSIONAL CANDIDATES
// ==========================================
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

function populateCompanyFilter(data) { /* your original function */ }
function renderPro() { /* your original function */ }
function getStageBadgeClass(stg) { /* your original function */ }

// ==========================================
// LB CANDIDATES
// ==========================================
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

function renderLB() { /* your original function */ }

// ==========================================
// PAGINATION
// ==========================================
function renderPagination(elemId, totalPages, currPage, type) { /* your original */ }
function changePage(type, targetPage) { /* your original */ }

// ==========================================
// FORMS - PRO
// ==========================================
async function openProForm(id = null) { /* your original function */ }
async function savePro() { /* your original function */ }

// ==========================================
// FORMS - LB
// ==========================================
async function openLBForm(id = null) { /* your original function */ }
async function saveLB() { /* your original function */ }

// ==========================================
// DELETE
// ==========================================
async function deleteCandidate(type, id) { /* your original function */ }

// ==========================================
// TIMELINE
// ==========================================
async function addTimelineEvent(type, candidateId, actionText) { /* your original */ }
async function renderTimeline(type, candidateId) { /* your original */ }

// ==========================================
// DOCUMENTS - FIXED VERSION
// ==========================================
const PRO_DOC_SCHEMAS = [ /* your original array */ ];
const LB_DOC_SCHEMAS = [ /* your original array */ ];

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
            <input type="url" class="doc-link-input" data-key="${schema.key}" 
                   value="${escapeHtml(currentUrl)}" placeholder="https://drive.google.com/..." 
                   oninput="evaluateDocRow(this)">
            <button type="button" class="doc-open-btn" data-url="${escapeHtml(currentUrl)}">🔗 Open</button>
          </div>
        </div>`;
    });

    grid.innerHTML = html;

    // Safe event listeners
    grid.querySelectorAll('.doc-open-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const url = btn.dataset.url;
        if (url) window.open(url, '_blank');
      });
    });

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
    btn.dataset.url = val;
  } else {
    btn.setAttribute('disabled', 'true');
  }
}

async function saveDocs() { /* your original function */ }

// ==========================================
// EXPORT
// ==========================================
function exportExcel(type) { /* your original function */ }

// ==========================================
// MODAL HELPERS
// ==========================================
function switchModalTab(type, tabKey, tabButtonElement) { /* your original */ }
function resetModalTabs(type) { /* your original */ }

// Custom stage adder
function openAddStageModal(type) { /* your original */ }
