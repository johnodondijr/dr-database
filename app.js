// ==========================================
// SUPABASE CLIENT - ONLY ONCE
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
// AUTH DATA
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

function showToast(msg, variant = 'success') {
  const toast = document.getElementById('toast');
  if (toast) {
    toast.textContent = msg;
    toast.className = `toast show ${variant}`;
    setTimeout(() => toast.classList.remove('show'), 3000);
  }
}

function setSaveStatus(state) {
  const indicator = document.getElementById('save-status');
  const text = document.getElementById('save-text');
  if (indicator) indicator.className = `save-status ${state}`;
  if (text) text.textContent = state === 'saving' ? 'Saving...' : 'Saved';
}

function closeModal(id) {
  const modal = document.getElementById(id);
  if (modal) modal.classList.remove('open');
  currentEditingId = null;
}

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
  document.getElementById('app').style.display = 'none';
  document.getElementById('login-screen').style.display = 'flex';
  hideForgotPassword();
}

// ==========================================
// BASIC NAVIGATION
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
  } else if (tabName === 'pro') {
    document.getElementById('tab-pro').classList.add('active');
    document.getElementById('pro-section').style.display = 'block';
  } else if (tabName === 'lb') {
    document.getElementById('tab-lb').classList.add('active');
    document.getElementById('lb-section').style.display = 'block';
  }
}

console.log("✅ Full app.js loaded successfully");
