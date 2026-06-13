// ==========================================
// SUPABASE CLIENT
// ==========================================
const SUPABASE_URL = "https://pizirpyvkxzghvxlipzc.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_UIyIdjowYK4Klg2tU4Nz8A_t1BV2QgQ";

const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// ==========================================
// STATE
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
  fred: "dr123", robert: "dr456", doreen: "dr789",
  maxwell: "dr000", consolata: "dr555"
};
const MASTER_RECOVERY_CODE = "DESTINY2026";

// ==========================================
// UTILITY FUNCTIONS (moved to top)
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

// Backdrop click to close modals
document.querySelectorAll('.modal-bg').forEach(bg => {
  bg.addEventListener('click', e => {
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

function showForgotPassword() { /* same as before */ }
function hideForgotPassword() { /* same as before */ }
function submitForgotPassword() { /* same as before */ }

function doLogin() { /* same as before */ }
function doLogout() { /* same as before */ }

// ==========================================
// NAVIGATION
// ==========================================
function switchTab(tabName) { /* same as before */ }

// ==========================================
// DASHBOARD, PRO, LB (unchanged core logic, but safer)
// ==========================================
// ... keep your existing loadDashboardData, renderDashboard, loadProData, renderPro, etc.

// Only change: In openDocsModal, use safer button handling

async function openDocsModal(type, id, name) {
  currentDocsType = type;
  currentEditingId = id;
  document.getElementById('docs-modal-title').textContent = `Document Registry: ${name}`;

  const grid = document.getElementById('docs-grid');
  grid.innerHTML = '<div style="grid-column:1/-1; text-align:center; padding:1rem; color:var(--text-3)">Loading...</div>';
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
            <button type="button" class="doc-open-btn" data-url="${escapeHtml(currentUrl)}">
              🔗 Open
            </button>
          </div>
        </div>`;
    });

    grid.innerHTML = html;

    // Safe event listeners instead of inline onclick
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

// Rest of your functions (savePro, saveLB, deleteCandidate, etc.) remain mostly the same.

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

// Keep all other functions (renderTimeline, saveDocs, exportExcel, etc.) as they were.
// Just ensure escapeHtml is used consistently.
