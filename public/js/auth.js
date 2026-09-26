/* =============================================
   SmartCare AI – Shared Auth & Utility Helpers
   ============================================= */

// ── Toast notifications ────────────────────────────────────────────────────
function showToast(message, type = 'info', duration = 3500) {
  const container = document.getElementById('toast-container');
  if (!container) return;

  const icons = { success: 'circle-check', error: 'circle-xmark', warning: 'triangle-exclamation', info: 'circle-info' };
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.innerHTML = `<i class="fa-solid fa-${icons[type] || 'circle-info'}" style="flex-shrink:0;"></i><span>${message}</span>`;
  container.appendChild(toast);

  setTimeout(() => {
    toast.classList.add('hide');
    setTimeout(() => toast.remove(), 300);
  }, duration);
}

// ── Auth helpers ───────────────────────────────────────────────────────────
function getToken() { return localStorage.getItem('token'); }
function getRole()  { return localStorage.getItem('role'); }
function getUserId(){ return localStorage.getItem('userId'); }
function getUserName(){ return localStorage.getItem('userName'); }

function logout() {
  localStorage.removeItem('token');
  localStorage.removeItem('role');
  localStorage.removeItem('userId');
  localStorage.removeItem('userName');
  window.location.href = '/login';
}

// ── Authenticated fetch wrapper ────────────────────────────────────────────
async function authFetch(url, options = {}) {
  const token = getToken();
  if (!token) { logout(); return null; }

  const headers = { ...(options.headers || {}), Authorization: `Bearer ${token}` };
  if (!(options.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
  }

  const res = await fetch(url, { ...options, headers });

  if (res.status === 401) { logout(); return null; }
  return res;
}

// ── Guard: redirect if not logged in ──────────────────────────────────────
function requireAuth(expectedRole) {
  const token = getToken();
  const role = getRole();
  if (!token) { window.location.href = '/login'; return false; }
  if (expectedRole && role !== expectedRole) {
    const map = { patient: '/patient/dashboard', doctor: '/doctor/dashboard', admin: '/admin/dashboard' };
    window.location.href = map[role] || '/login';
    return false;
  }
  return true;
}

// ── Date formatting ────────────────────────────────────────────────────────
function formatDate(dateStr) {
  if (!dateStr) return '—';
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

function formatDateFull(dateStr) {
  if (!dateStr) return '—';
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('en-IN', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' });
}

// ── Status badge HTML ──────────────────────────────────────────────────────
function statusBadge(status) {
  return `<span class="badge badge-${status}">${status}</span>`;
}

// ── Avatar initials ────────────────────────────────────────────────────────
function getInitials(name) {
  if (!name) return '?';
  const parts = name.trim().split(' ');
  return parts.length >= 2
    ? (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
    : name[0].toUpperCase();
}

// ── Populate sidebar user info ─────────────────────────────────────────────
function populateSidebarUser() {
  const nameEl = document.getElementById('sidebarUserName');
  const roleEl = document.getElementById('sidebarUserRole');
  const initEl = document.getElementById('sidebarUserInit');
  const name = getUserName() || 'User';
  const role = getRole() || '';
  if (nameEl) nameEl.textContent = name;
  if (roleEl) roleEl.textContent = role;
  if (initEl) initEl.textContent = getInitials(name);

  // Topbar avatar initials
  const topAvatar = document.getElementById('topbarAvatar');
  if (topAvatar) topAvatar.textContent = getInitials(name);
}

// ── Mobile sidebar toggle ──────────────────────────────────────────────────
function initMobileSidebar() {
  const menuBtn = document.getElementById('mobileMenuBtn');
  const sidebar = document.getElementById('sidebar');
  const overlay = document.getElementById('sidebarOverlay');
  if (!menuBtn || !sidebar) return;

  menuBtn.addEventListener('click', () => {
    sidebar.classList.toggle('open');
    overlay.classList.toggle('open');
  });
  if (overlay) {
    overlay.addEventListener('click', () => {
      sidebar.classList.remove('open');
      overlay.classList.remove('open');
    });
  }
}

// ── Mark active nav item ───────────────────────────────────────────────────
function setActiveNavItem() {
  const path = window.location.pathname;
  document.querySelectorAll('.nav-item[data-path]').forEach(el => {
    el.classList.toggle('active', el.dataset.path === path);
  });
}

// ── Age from DOB ───────────────────────────────────────────────────────────
function calcAge(dob) {
  if (!dob) return null;
  const birth = new Date(dob);
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
  return age;
}

// ── Loading overlay helper ─────────────────────────────────────────────────
function setContainerLoading(containerId, loading, emptyMsg = 'No data found.') {
  const el = document.getElementById(containerId);
  if (!el) return;
  if (loading) {
    el.innerHTML = `<div class="loading-overlay"><div class="spinner spinner-dark"></div><p>Loading…</p></div>`;
  }
}
