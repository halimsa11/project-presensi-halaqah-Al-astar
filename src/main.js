const API_URL = '/api';

let students = [];
let attendances = [];
let customHolidays = [];
let currentPanel = 'panel-presensi';
let authToken = null;
let authRole = null;
let authUsername = null;

// ============ AUTH ============
function getAuthHeaders() {
  const headers = { 'Content-Type': 'application/json' };
  if (authToken) headers['Authorization'] = `Bearer ${authToken}`;
  return headers;
}

function authFetch(url, options = {}) {
  if (!options.headers) options.headers = {};
  if (authToken) options.headers['Authorization'] = `Bearer ${authToken}`;
  return fetch(url, options);
}

async function checkAuth() {
  authToken = localStorage.getItem('auth_token');
  authRole = localStorage.getItem('auth_role');
  authUsername = localStorage.getItem('auth_username');

  if (!authToken) {
    window.location.href = '/login.html';
    return false;
  }

  try {
    const res = await fetch(`${API_URL}/auth/me`, {
      headers: { 'Authorization': `Bearer ${authToken}` }
    });
    if (!res.ok) {
      localStorage.removeItem('auth_token');
      localStorage.removeItem('auth_role');
      localStorage.removeItem('auth_username');
      window.location.href = '/login.html';
      return false;
    }
    const data = await res.json();
    authRole = data.role;
    authUsername = data.username;
    localStorage.setItem('auth_role', authRole);
    localStorage.setItem('auth_username', authUsername);
    return true;
  } catch {
    window.location.href = '/login.html';
    return false;
  }
}

function setupRoleUI() {
  // Update header user info
  const headerUsername = document.getElementById('header-username');
  const headerRoleLabel = document.getElementById('header-role-label');
  const headerAvatar = document.getElementById('header-avatar');

  if (headerUsername) headerUsername.textContent = authUsername || 'Admin';
  if (headerRoleLabel) headerRoleLabel.textContent = authRole === 'superadmin' ? 'Super Admin' : 'Admin';
  if (headerAvatar) {
    const initials = (authUsername || 'AD').substring(0, 2).toUpperCase();
    headerAvatar.textContent = initials;
  }

  // Show/hide Data Siswa tab based on role
  const navSantri = document.getElementById('nav-santri');
  const panelSantri = document.getElementById('panel-santri');

  if (authRole === 'superadmin') {
    // Show Data Siswa tab for superadmin
    navSantri?.classList.remove('hidden');
  } else {
    // Keep hidden for admin biasa
    navSantri?.classList.add('hidden');
  }
}

function setupLogout() {
  const btnLogout = document.getElementById('btn-logout');
  btnLogout?.addEventListener('click', () => {
    if (confirm('Yakin ingin logout?')) {
      localStorage.removeItem('auth_token');
      localStorage.removeItem('auth_role');
      localStorage.removeItem('auth_username');
      window.location.href = '/login.html';
    }
  });
}

// ============ SVG ICONS ============
const ICONS = {
  check: `<svg class="icon icon-sm" viewBox="0 0 24 24"><path d="M20 6 9 17l-5-5"/></svg>`,
  checkCircle: `<svg class="icon icon-sm" viewBox="0 0 24 24"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>`,
  fileText: `<svg class="icon icon-sm" viewBox="0 0 24 24"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/><line x1="16" x2="8" y1="13" y2="13"/><line x1="16" x2="8" y1="17" y2="17"/></svg>`,
  heartPulse: `<svg class="icon icon-sm" viewBox="0 0 24 24"><path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/></svg>`,
  xCircle: `<svg class="icon icon-sm" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><line x1="15" x2="9" y1="9" y2="15"/><line x1="9" x2="15" y1="9" y2="15"/></svg>`,
  alertTriangle: `<svg class="icon icon-sm" viewBox="0 0 24 24"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><line x1="12" x2="12" y1="9" y2="13"/><line x1="12" x2="12.01" y1="17" y2="17"/></svg>`,
  edit: `<svg class="icon icon-sm" viewBox="0 0 24 24"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/><path d="m15 5 4 4"/></svg>`,
  trash: `<svg class="icon icon-sm" viewBox="0 0 24 24"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/><line x1="10" x2="10" y1="11" y2="17"/><line x1="14" x2="14" y1="11" y2="17"/></svg>`,
  palmtree: `<svg class="icon icon-sm" viewBox="0 0 24 24"><path d="M13 8c0-2.76-2.46-5-5.5-5S2 5.24 2 8h2c0-1.66 1.57-3 3.5-3S11 6.34 11 8h2z"/><path d="M18 22v-9a4 4 0 0 0-4-4h-1"/></svg>`,
  inbox: `<svg class="icon icon-lg" viewBox="0 0 24 24"><polyline points="22 12 16 12 14 15 10 15 8 12 2 12"/><path d="M5.45 5.11 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z"/></svg>`,
  minus: `<svg class="icon icon-sm" viewBox="0 0 24 24"><line x1="5" x2="19" y1="12" y2="12"/></svg>`,
  clock: `<svg class="icon icon-sm" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>`
};

// ============ AVATAR COLOR HELPER ============
const AVATAR_GRADIENTS = [
  'linear-gradient(135deg, #059669 0%, #10b981 100%)',
  'linear-gradient(135deg, #2563eb 0%, #3b82f6 100%)',
  'linear-gradient(135deg, #7c3aed 0%, #8b5cf6 100%)',
  'linear-gradient(135deg, #d97706 0%, #f59e0b 100%)',
  'linear-gradient(135deg, #0891b2 0%, #06b6d4 100%)',
  'linear-gradient(135deg, #e11d48 0%, #f43f5e 100%)'
];

function getAvatarStyle(name) {
  let hash = 0;
  for (let i = 0; i < (name || '').length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % AVATAR_GRADIENTS.length;
  return AVATAR_GRADIENTS[index];
}

function getInitials(name) {
  if (!name) return 'S';
  const parts = name.trim().split(' ');
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  return name.substring(0, 2).toUpperCase();
}

function getTypeBadge(type) {
  if (type === 'reguler') {
    return '<span class="td-type-badge td-type-reguler">Reguler (PP)</span>';
  }
  return '<span class="td-type-badge td-type-boarding">Boarding</span>';
}

const SESSION_LABELS = {
  pagi: 'Pagi',
  siang: 'Siang',
  malam: 'Malam'
};

// ============ DOM ============
const mainDate    = document.getElementById('main-date');
const mainSession = document.getElementById('main-session');
const viewDate    = document.getElementById('view-date');
const viewSession = document.getElementById('view-session');

const addStudentForm    = document.getElementById('add-student-form');
const santriLoading     = document.getElementById('santri-loading');
const santriTableWrap   = document.getElementById('santri-table-wrap');
const santriTableBody   = document.getElementById('santri-table-body');
const santriCountLabel  = document.getElementById('santri-count-label');

const mainLoading            = document.getElementById('main-loading');
const mainTableContainer     = document.getElementById('main-table-container');
const mainTableBody          = document.getElementById('main-table-body');
const saveAttendanceContainer = document.getElementById('save-attendance-container');
const btnSaveAttendance      = document.getElementById('btn-save-attendance');
const attendanceMessage      = document.getElementById('attendance-message');

const btnMarkHoliday         = document.getElementById('btn-mark-holiday');
const btnMarkSessionHoliday  = document.getElementById('btn-mark-session-holiday');
const btnCancelHoliday       = document.getElementById('btn-cancel-holiday');
const btnCancelSessionHoliday = document.getElementById('btn-cancel-session-holiday');
const holidayWeekendInfo     = document.getElementById('holiday-weekend-info');
const holidayWeekendText     = document.getElementById('holiday-weekend-text');
const mainHolidayBanner      = document.getElementById('main-holiday-banner');
const mainHolidayTitle       = document.getElementById('main-holiday-title');
const mainHolidayReason      = document.getElementById('main-holiday-reason');

const viewLoading       = document.getElementById('view-loading');
const viewTableWrap     = document.getElementById('view-table-wrap');
const viewTableBody     = document.getElementById('view-table-body');
const viewHolidayBanner = document.getElementById('view-holiday-banner');
const viewHolidayTitle  = document.getElementById('view-holiday-title');
const viewHolidayReason = document.getElementById('view-holiday-reason');

const btnShowSummary   = document.getElementById('btn-show-summary');
const summaryModal     = document.getElementById('summary-modal');
const btnCloseSummary  = document.getElementById('btn-close-summary');
const summaryTableBody = document.getElementById('summary-table-body');
const summaryLoading   = document.getElementById('summary-loading');

// ============ INIT ============
const todayStr = new Date().toISOString().split('T')[0];
if (mainDate) mainDate.value = todayStr;
if (viewDate) viewDate.value = todayStr;
document.getElementById('attendance-form')?.addEventListener('submit', e => e.preventDefault());

// ============ TOAST ============
function toast(msg, type = 'success') {
  const el = document.createElement('div');
  el.className = `toast${type === 'error' ? ' error' : type === 'warning' ? ' warning' : ''}`;
  
  let iconSvg = ICONS.checkCircle;
  if (type === 'error') iconSvg = ICONS.xCircle;
  if (type === 'warning') iconSvg = ICONS.alertTriangle;

  el.innerHTML = `
    <span style="color:${type === 'error' ? 'var(--accent-alpa)' : type === 'warning' ? 'var(--accent-izin)' : 'var(--primary)'}; display:flex; align-items:center;">
      ${iconSvg}
    </span>
    <span>${msg}</span>`;
    
  const toaster = document.getElementById('toaster');
  if (toaster) toaster.appendChild(el);
  setTimeout(() => el.remove(), 3500);
}

// ============ NAVBAR ============
document.querySelectorAll('.nav-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
    document.querySelectorAll('.panel').forEach(p => p.classList.remove('active'));
    btn.classList.add('active');
    const target = btn.dataset.panel;
    const panelEl = document.getElementById(target);
    if (panelEl) panelEl.classList.add('active');
    currentPanel = target;
    if (target === 'panel-santri') loadSantriList();
    if (target === 'panel-presensi') loadAttendance();
    if (target === 'panel-lihat') loadView();
  });
});

// ============ HOLIDAY HELPER ============
// Returns holiday info considering both day-level and session-level holidays
function getHolidayInfo(dateStr, session) {
  if (!dateStr) return { isHoliday: false, isSessionHoliday: false };
  const d = new Date(dateStr + 'T00:00:00');
  const day = d.getDay();
  
  // Weekend check
  if (day === 0 || day === 6) {
    const name = day === 0 ? 'Ahad' : 'Sabtu';
    return { 
      isHoliday: true, 
      isSessionHoliday: false,
      title: `Libur Rutin ${name}`, 
      reason: `Hari ${name} — jadwal libur rutin akhir pekan.`, 
      isWeekend: true 
    };
  }
  
  // Check day-level custom holiday
  const dayHoliday = customHolidays.find(h => h.date === dateStr && h.type === 'day');
  if (dayHoliday) {
    return { 
      isHoliday: true, 
      isSessionHoliday: false,
      title: 'Hari Libur Halaqah', 
      reason: dayHoliday.reason || 'Kegiatan halaqah diliburkan.',
      isWeekend: false,
      holidayId: dayHoliday.id
    };
  }
  
  // Check session-level holiday
  if (session) {
    const sessionHoliday = customHolidays.find(
      h => h.date === dateStr && h.type === 'session' && h.session === session
    );
    if (sessionHoliday) {
      return { 
        isHoliday: true, 
        isSessionHoliday: true,
        title: `Libur Sesi ${SESSION_LABELS[session] || session}`, 
        reason: sessionHoliday.reason || `Sesi ${SESSION_LABELS[session] || session} diliburkan.`,
        isWeekend: false,
        holidayId: sessionHoliday.id
      };
    }
  }
  
  return { isHoliday: false, isSessionHoliday: false };
}

function checkRangkumButton(dateStr) {
  const isAhad = new Date(dateStr + 'T00:00:00').getDay() === 0;
  btnShowSummary?.classList.toggle('hidden', !isAhad);
}

// ============ LOAD HOLIDAYS ============
async function fetchHolidays() {
  try {
    const res = await authFetch(`${API_URL}/holidays`);
    customHolidays = await res.json();
  } catch {
    customHolidays = [];
  }
}

// ============ PANEL: SANTRI ============
async function loadSantriList() {
  santriLoading?.classList.remove('hidden');
  santriTableWrap?.classList.add('hidden');
  try {
    const res = await authFetch(`${API_URL}/students`);
    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      throw new Error(errData.error || `Server status ${res.status}`);
    }
    const data = await res.json();
    students = Array.isArray(data) ? data : [];
  } catch (err) {
    console.error('Error loadSantriList:', err);
    toast(err.message || 'Gagal memuat daftar santri', 'error');
    students = [];
  } finally {
    renderSantriTable();
    santriLoading?.classList.add('hidden');
    santriTableWrap?.classList.remove('hidden');
  }
}

function renderSantriTable() {
  if (!santriTableBody) return;
  santriTableBody.innerHTML = '';
  if (santriCountLabel) santriCountLabel.textContent = `${students.length} siswa aktif terdaftar`;

  if (!students.length) {
    santriTableBody.innerHTML = `
      <tr>
        <td colspan="5">
          <div class="empty">
            <div class="empty-icon-wrap">${ICONS.inbox}</div>
            <p>Belum ada siswa terdaftar. Silakan tambahkan pada form di atas.</p>
          </div>
        </td>
      </tr>`;
    return;
  }

  students.sort((a, b) => a.class !== b.class ? a.class - b.class : a.name.localeCompare(b.name));
  students.forEach(s => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>
        <div class="td-name-cell">
          <div class="avatar-init" style="background: ${getAvatarStyle(s.name)}">${getInitials(s.name)}</div>
          <span class="td-name">${s.name}</span>
        </div>
      </td>
      <td>
        <span class="td-class-badge" style="background: #f8fafc; border: 1px solid #e2e8f0; font-family: monospace;">${s.nis || '-'}</span>
      </td>
      <td>
        <span class="td-class-badge">Kelas ${s.class}</span>
      </td>
      <td>
        ${getTypeBadge(s.type)}
      </td>
      <td style="text-align:right;">
        <div class="flex gap-2" style="justify-content: flex-end;">
          <button type="button" class="btn btn-sm btn-action-edit btn-edit" data-id="${s.id}">
            ${ICONS.edit}
            <span>Edit</span>
          </button>
          <button type="button" class="btn btn-sm btn-action-delete btn-delete" data-id="${s.id}" title="Hapus siswa">
            ${ICONS.trash}
          </button>
        </div>
      </td>`;
    santriTableBody.appendChild(tr);
  });

  // Edit Listener
  santriTableBody.querySelectorAll('.btn-edit').forEach(btn => {
    btn.addEventListener('click', async e => {
      const id = e.currentTarget.dataset.id;
      const s = students.find(x => x.id === id);
      if (!s) return;
      const newName = prompt('Ubah Nama Siswa:', s.name);
      if (newName === null) return;
      const newNis = prompt('Ubah NIS (Opsional):', s.nis || '');
      if (newNis === null) return;
      const newClass = prompt('Ubah Kelas (10 / 11 / 12):', s.class);
      if (newClass === null) return;
      const newType = prompt('Ubah Tipe (boarding / reguler):', s.type || 'boarding');
      if (newType === null) return;
      
      if (!newName.trim()) return toast('Nama siswa tidak boleh kosong', 'error');
      if (newType !== 'boarding' && newType !== 'reguler') return toast('Tipe harus "boarding" atau "reguler"', 'error');
      try {
        const res = await authFetch(`${API_URL}/students/${id}`, {
          method: 'PUT',
          headers: getAuthHeaders(),
          body: JSON.stringify({ name: newName.trim(), nis: newNis.trim(), class: newClass, type: newType })
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Gagal memperbarui data siswa');
        toast('Data siswa berhasil diperbarui');
        loadSantriList();
      } catch (err) { toast(err.message, 'error'); }
    });
  });

  // Delete Listener
  santriTableBody.querySelectorAll('.btn-delete').forEach(btn => {
    btn.addEventListener('click', async e => {
      const id = e.currentTarget.dataset.id;
      const s = students.find(x => x.id === id);
      if (!confirm(`Hapus siswa "${s?.name}"? Seluruh riwayat presensinya akan ikut dihapus.`)) return;
      try {
        const res = await authFetch(`${API_URL}/students/${id}`, { method: 'DELETE' });
        if (!res.ok) throw new Error();
        toast('Siswa berhasil dihapus', 'warning');
        loadSantriList();
      } catch { toast('Gagal menghapus siswa', 'error'); }
    });
  });
}

addStudentForm?.addEventListener('submit', async e => {
  e.preventDefault();
  const nisInput = document.getElementById('new-student-nis');
  const nameInput = document.getElementById('new-student-name');
  const classInput = document.getElementById('new-student-class');
  const typeInput = document.getElementById('new-student-type');
  
  const nis = nisInput ? nisInput.value.trim() : '';
  const name = nameInput ? nameInput.value.trim() : '';
  const cls  = classInput ? classInput.value : '10';
  const type = typeInput ? typeInput.value : 'boarding';
  
  const btn  = document.getElementById('btn-add-student');
  if (btn) {
    btn.disabled = true;
    btn.innerHTML = `<div class="spin" style="width:16px;height:16px;"></div> <span>Menyimpan...</span>`;
  }
  try {
    const res = await authFetch(`${API_URL}/students`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ name, nis, class: cls, type })
    });
    const data = await res.json();
    if (!res.ok) { toast(data.error || 'Gagal menambahkan siswa', 'error'); }
    else {
      toast(`${name} berhasil didaftarkan`);
      addStudentForm.reset();
      loadSantriList();
    }
  } catch { toast('Gagal terhubung ke server', 'error'); }
  finally {
    if (btn) {
      btn.disabled = false;
      btn.innerHTML = `<svg class="icon icon-sm" viewBox="0 0 24 24"><line x1="12" x2="12" y1="5" y2="19"/><line x1="5" x2="19" y1="12" y2="12"/></svg> <span>Tambah Siswa</span>`;
    }
  }
});

// ============ PANEL: INPUT PRESENSI ============
function updateHolidayUI() {
  const date = mainDate?.value;
  const session = mainSession?.value;
  const info = getHolidayInfo(date, session);
  const weekend = holidayWeekendInfo;

  // Find if there's a specific session holiday for current session
  const sessionHoliday = customHolidays.find(
    h => h.date === date && h.type === 'session' && h.session === session
  );
  const dayHoliday = customHolidays.find(
    h => h.date === date && h.type === 'day'
  );

  if (info.isWeekend) {
    weekend?.classList.remove('hidden');
    if (holidayWeekendText) holidayWeekendText.textContent = `${info.title} — ${info.reason}`;
    btnMarkHoliday?.classList.add('hidden');
    btnMarkSessionHoliday?.classList.add('hidden');
    btnCancelHoliday?.classList.add('hidden');
    btnCancelSessionHoliday?.classList.add('hidden');
  } else {
    // Day holiday buttons
    if (dayHoliday) {
      btnMarkHoliday?.classList.add('hidden');
      btnCancelHoliday?.classList.remove('hidden');
    } else {
      btnMarkHoliday?.classList.remove('hidden');
      btnCancelHoliday?.classList.add('hidden');
    }
    
    // Session holiday buttons
    if (sessionHoliday) {
      btnMarkSessionHoliday?.classList.add('hidden');
      btnCancelSessionHoliday?.classList.remove('hidden');
    } else if (!dayHoliday) {
      btnMarkSessionHoliday?.classList.remove('hidden');
      btnCancelSessionHoliday?.classList.add('hidden');
    } else {
      // Day is already holiday, hide session buttons
      btnMarkSessionHoliday?.classList.add('hidden');
      btnCancelSessionHoliday?.classList.add('hidden');
    }

    if (info.isHoliday && !info.isWeekend) {
      weekend?.classList.remove('hidden');
      if (info.isSessionHoliday) {
        if (holidayWeekendText) holidayWeekendText.textContent = `Libur sesi: ${info.reason}`;
      } else {
        if (holidayWeekendText) holidayWeekendText.textContent = `Libur khusus: ${info.reason}`;
      }
    } else {
      weekend?.classList.add('hidden');
    }
  }

  if (info.isHoliday) {
    mainHolidayBanner?.classList.remove('hidden');
    if (mainHolidayTitle) mainHolidayTitle.textContent = info.title;
    if (mainHolidayReason) mainHolidayReason.textContent = info.reason;
    saveAttendanceContainer?.classList.add('hidden');
  } else {
    mainHolidayBanner?.classList.add('hidden');
    if (students.length > 0) saveAttendanceContainer?.classList.remove('hidden');
  }
}

async function loadAttendance() {
  const date = mainDate?.value;
  const session = mainSession?.value;
  if (!date) return;

  checkRangkumButton(date);

  mainLoading?.classList.remove('hidden');
  mainTableContainer?.classList.add('hidden');

  try {
    const [r1, r2, r3] = await Promise.all([
      authFetch(`${API_URL}/students?session=${session}`),
      authFetch(`${API_URL}/attendance?date=${date}&session=${session}`),
      authFetch(`${API_URL}/holidays`)
    ]);
    const d1 = await r1.json().catch(() => []);
    const d2 = await r2.json().catch(() => []);
    const d3 = await r3.json().catch(() => []);
    students = Array.isArray(d1) ? d1 : [];
    attendances = Array.isArray(d2) ? d2 : [];
    customHolidays = Array.isArray(d3) ? d3 : [];
  } catch (err) {
    console.error('Error loadAttendance:', err);
    toast('Gagal memuat data presensi', 'error');
    students = []; attendances = []; customHolidays = [];
  } finally {
    updateHolidayUI();
    renderAttendanceTable();
    mainLoading?.classList.add('hidden');
    mainTableContainer?.classList.remove('hidden');
  }
}

function renderAttendanceTable() {
  if (!mainTableBody) return;
  mainTableBody.innerHTML = '';
  const session = mainSession?.value;
  const info = getHolidayInfo(mainDate?.value, session);

  if (!students.length) {
    mainTableBody.innerHTML = `
      <tr>
        <td colspan="4">
          <div class="empty">
            <div class="empty-icon-wrap">${ICONS.inbox}</div>
            <p>${(session === 'pagi' || session === 'malam') 
              ? 'Tidak ada siswa boarding untuk sesi ini, atau belum ada data siswa.' 
              : 'Belum ada data siswa. Silakan tambah siswa terlebih dahulu.'}</p>
          </div>
        </td>
      </tr>`;
    saveAttendanceContainer?.classList.add('hidden');
    return;
  }

  students.sort((a, b) => a.class !== b.class ? a.class - b.class : a.name.localeCompare(b.name));

  students.forEach(s => {
    const att = attendances.find(a => a.studentId === s.id);
    const status = att ? att.status : 'hadir';
    const tr = document.createElement('tr');

    let statusCell;
    if (info.isHoliday) {
      statusCell = `<span class="badge ${info.isSessionHoliday ? 'badge-libur-sesi' : 'badge-libur'}">${ICONS.palmtree} ${info.isSessionHoliday ? 'Libur Sesi' : 'Libur'}</span>`;
    } else {
      statusCell = `
        <select class="status-sel s-${status}" data-id="${s.id}">
          <option value="hadir" ${status==='hadir'?'selected':''}>Hadir</option>
          <option value="sakit" ${status==='sakit'?'selected':''}>Sakit</option>
          <option value="izin"  ${status==='izin' ?'selected':''}>Izin</option>
          <option value="alpa"  ${status==='alpa' ?'selected':''}>Alpa</option>
        </select>`;
    }

    tr.innerHTML = `
      <td>
        <div class="td-name-cell">
          <div class="avatar-init" style="background: ${getAvatarStyle(s.name)}">${getInitials(s.name)}</div>
          <span class="td-name">${s.name}</span>
        </div>
      </td>
      <td><span class="td-class-badge">Kelas ${s.class}</span></td>
      <td>${getTypeBadge(s.type)}</td>
      <td>${statusCell}</td>`;
    mainTableBody.appendChild(tr);
  });

  mainTableBody.querySelectorAll('.status-sel').forEach(sel => {
    sel.addEventListener('change', e => {
      e.target.className = `status-sel s-${e.target.value}`;
    });
  });

  if (!info.isHoliday) saveAttendanceContainer?.classList.remove('hidden');
}

mainDate?.addEventListener('change', loadAttendance);
mainSession?.addEventListener('change', loadAttendance);

// ============ HOLIDAY ACTIONS ============

// Mark full day as holiday
btnMarkHoliday?.addEventListener('click', async () => {
  const date = mainDate?.value;
  if (!date) return toast('Pilih tanggal terlebih dahulu!', 'warning');
  const reason = prompt('Keterangan libur hari:', 'Libur Halaqah');
  if (reason === null) return;
  try {
    const res = await authFetch(`${API_URL}/holidays`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ date, type: 'day', reason: reason.trim() || 'Libur Halaqah' })
    });
    if (!res.ok) throw new Error();
    toast(`Tanggal ${date} ditandai libur halaqah (semua sesi)`);
    await loadAttendance();
  } catch { toast('Gagal menandai hari libur', 'error'); }
});

// Mark session as holiday
btnMarkSessionHoliday?.addEventListener('click', async () => {
  const date = mainDate?.value;
  const session = mainSession?.value;
  if (!date) return toast('Pilih tanggal terlebih dahulu!', 'warning');
  const sessionLabel = SESSION_LABELS[session] || session;
  const reason = prompt(`Keterangan libur sesi ${sessionLabel}:`, `Libur Sesi ${sessionLabel}`);
  if (reason === null) return;
  try {
    const res = await authFetch(`${API_URL}/holidays`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ date, type: 'session', session, reason: reason.trim() || `Libur Sesi ${sessionLabel}` })
    });
    if (!res.ok) throw new Error();
    toast(`Sesi ${sessionLabel} tanggal ${date} ditandai libur`);
    await loadAttendance();
  } catch { toast('Gagal menandai libur sesi', 'error'); }
});

// Cancel day holiday
btnCancelHoliday?.addEventListener('click', async () => {
  const date = mainDate?.value;
  const dayHoliday = customHolidays.find(h => h.date === date && h.type === 'day');
  if (!dayHoliday) return;
  if (!confirm(`Batalkan status libur hari untuk tanggal ${date}?`)) return;
  try {
    const res = await authFetch(`${API_URL}/holidays/${dayHoliday.id}`, { method: 'DELETE' });
    if (!res.ok) throw new Error();
    toast('Status libur hari berhasil dibatalkan', 'warning');
    await loadAttendance();
  } catch { toast('Gagal membatalkan libur', 'error'); }
});

// Cancel session holiday
btnCancelSessionHoliday?.addEventListener('click', async () => {
  const date = mainDate?.value;
  const session = mainSession?.value;
  const sessionHoliday = customHolidays.find(
    h => h.date === date && h.type === 'session' && h.session === session
  );
  if (!sessionHoliday) return;
  const sessionLabel = SESSION_LABELS[session] || session;
  if (!confirm(`Batalkan status libur sesi ${sessionLabel} untuk tanggal ${date}?`)) return;
  try {
    const res = await authFetch(`${API_URL}/holidays/${sessionHoliday.id}`, { method: 'DELETE' });
    if (!res.ok) throw new Error();
    toast(`Status libur sesi ${sessionLabel} berhasil dibatalkan`, 'warning');
    await loadAttendance();
  } catch { toast('Gagal membatalkan libur sesi', 'error'); }
});

btnSaveAttendance?.addEventListener('click', async () => {
  const date = mainDate?.value;
  const session = mainSession?.value;
  const sels = mainTableBody?.querySelectorAll('.status-sel') || [];
  if (!sels.length) return toast('Tidak ada siswa untuk diabsen', 'warning');
  const records = [...sels].map(s => ({ studentId: s.dataset.id, status: s.value }));

  if (btnSaveAttendance) {
    btnSaveAttendance.disabled = true;
    btnSaveAttendance.innerHTML = `<div class="spin" style="width:16px;height:16px;"></div> <span>Menyimpan Presensi...</span>`;
  }

  try {
    const res = await authFetch(`${API_URL}/attendance`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ date, session, records })
    });
    if (!res.ok) throw new Error();
    toast(`Presensi tanggal ${date} (${session}) berhasil disimpan!`);
    loadAttendance();
  } catch { toast('Gagal menyimpan presensi', 'error'); }
  finally {
    if (btnSaveAttendance) {
      btnSaveAttendance.disabled = false;
      btnSaveAttendance.innerHTML = `<svg class="icon icon-sm" viewBox="0 0 24 24"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg> <span>Simpan Presensi</span>`;
    }
  }
});

// ============ PANEL: LIHAT PRESENSI ============
async function loadView() {
  const date = viewDate?.value;
  const session = viewSession?.value;
  if (!date) return;

  checkRangkumButton(date);

  viewLoading?.classList.remove('hidden');
  viewTableWrap?.classList.add('hidden');
  viewHolidayBanner?.classList.add('hidden');

  let viewStudents = [], viewAtts = [];
  try {
    const [r1, r2, r3] = await Promise.all([
      authFetch(`${API_URL}/students?session=${session}`),
      authFetch(`${API_URL}/attendance?date=${date}&session=${session}`),
      authFetch(`${API_URL}/holidays`)
    ]);
    const d1 = await r1.json().catch(() => []);
    const d2 = await r2.json().catch(() => []);
    const d3 = await r3.json().catch(() => []);
    viewStudents = Array.isArray(d1) ? d1 : [];
    viewAtts = Array.isArray(d2) ? d2 : [];
    customHolidays = Array.isArray(d3) ? d3 : [];
  } catch (err) {
    console.error('Error loadView:', err);
    toast('Gagal memuat rekap presensi', 'error');
  } finally {
    const info = getHolidayInfo(date, session);
    if (info.isHoliday) {
      viewHolidayBanner?.classList.remove('hidden');
      if (viewHolidayTitle) viewHolidayTitle.textContent = info.title;
      if (viewHolidayReason) viewHolidayReason.textContent = info.reason;
    }

    const counts = { hadir: 0, izin: 0, sakit: 0, alpa: 0 };
    viewStudents.sort((a, b) => a.class !== b.class ? a.class - b.class : a.name.localeCompare(b.name));

    if (viewTableBody) {
      viewTableBody.innerHTML = '';
      if (!viewStudents.length) {
        viewTableBody.innerHTML = `
          <tr>
            <td colspan="4">
              <div class="empty">
                <div class="empty-icon-wrap">${ICONS.inbox}</div>
                <p>${(session === 'pagi' || session === 'malam') 
                  ? 'Tidak ada siswa boarding untuk sesi ini.' 
                  : 'Belum ada data siswa terdaftar.'}</p>
              </div>
            </td>
          </tr>`;
      } else {
        viewStudents.forEach(s => {
          const att = viewAtts.find(a => a.studentId === s.id);
          let status = att ? att.status : null;

          let badge;
          if (info.isHoliday) {
            badge = `<span class="badge ${info.isSessionHoliday ? 'badge-libur-sesi' : 'badge-libur'}">${ICONS.palmtree} ${info.isSessionHoliday ? 'Libur Sesi' : 'Libur'}</span>`;
          } else if (!status) {
            badge = `<span class="badge badge-belum">${ICONS.minus} Belum Diisi</span>`;
          } else {
            badge = `<span class="badge badge-${status}">${statusBadgeContent(status)}</span>`;
            if (counts[status] !== undefined) counts[status]++;
          }

          const tr = document.createElement('tr');
          tr.innerHTML = `
            <td>
              <div class="td-name-cell">
                <div class="avatar-init" style="background: ${getAvatarStyle(s.name)}">${getInitials(s.name)}</div>
                <span class="td-name">${s.name}</span>
              </div>
            </td>
            <td><span class="td-class-badge">Kelas ${s.class}</span></td>
            <td>${getTypeBadge(s.type)}</td>
            <td class="td-center">${badge}</td>`;
          viewTableBody.appendChild(tr);
        });
      }
    }

    const elHadir = document.getElementById('stat-hadir');
    const elIzin  = document.getElementById('stat-izin');
    const elSakit = document.getElementById('stat-sakit');
    const elAlpa  = document.getElementById('stat-alpa');

    if (elHadir) elHadir.textContent = counts.hadir;
    if (elIzin)  elIzin.textContent  = counts.izin;
    if (elSakit) elSakit.textContent = counts.sakit;
    if (elAlpa)  elAlpa.textContent  = counts.alpa;

    viewLoading?.classList.add('hidden');
    viewTableWrap?.classList.remove('hidden');
  }
}

function statusBadgeContent(status) {
  switch (status) {
    case 'hadir': return `${ICONS.checkCircle} Hadir`;
    case 'izin':  return `${ICONS.fileText} Izin`;
    case 'sakit': return `${ICONS.heartPulse} Sakit`;
    case 'alpa':  return `${ICONS.xCircle} Alpa`;
    default: return status;
  }
}

viewDate?.addEventListener('change', loadView);
viewSession?.addEventListener('change', loadView);

// ============ SUMMARY MODAL ============
btnShowSummary?.addEventListener('click', async () => {
  const dateVal = (currentPanel === 'panel-lihat' ? viewDate?.value : mainDate?.value) || todayStr;
  const month = dateVal ? dateVal.substring(0, 7) : todayStr.substring(0, 7);
  const [y, m] = month.split('-');
  const monthNames = ['Januari','Februari','Maret','April','Mei','Juni','Juli','Agustus','September','Oktober','November','Desember'];
  const monthBadge = document.getElementById('summary-month-badge');
  if (monthBadge && m) {
    monthBadge.textContent = `${monthNames[parseInt(m)-1]} ${y}`;
  }
  const modalTitle = document.getElementById('summary-modal-title');
  if (modalTitle) {
    modalTitle.textContent = 'Rangkuman Presensi Bulanan';
  }

  summaryModal?.classList.add('open');
  summaryLoading?.classList.remove('hidden');
  if (summaryTableBody) summaryTableBody.innerHTML = '';
  
  // Reset stats
  ['hadir','izin','sakit','alpa'].forEach(k => {
    const el = document.getElementById(`sum-stat-${k}`);
    if (el) el.textContent = '0';
  });

  try {
    const [r1, r2] = await Promise.all([
      authFetch(`${API_URL}/students`),
      authFetch(`${API_URL}/attendance/summary?month=${month}`)
    ]);

    if (!r1.ok || !r2.ok) {
      throw new Error('Gagal memuat data dari server');
    }

    const allStudentsRaw = await r1.json();
    const allAttRaw = await r2.json();

    const studentList = Array.isArray(allStudentsRaw) ? allStudentsRaw : [];
    const attendanceList = Array.isArray(allAttRaw) ? allAttRaw : [];

    studentList.sort((a, b) => a.class !== b.class ? a.class - b.class : a.name.localeCompare(b.name));

    const totals = { hadir: 0, izin: 0, sakit: 0, alpa: 0 };

    if (!studentList.length) {
      if (summaryTableBody) {
        summaryTableBody.innerHTML = `
          <tr>
            <td colspan="6">
              <div class="empty">
                <div class="empty-icon-wrap">${ICONS.inbox}</div>
                <p>Belum ada siswa terdaftar pada periode ini.</p>
              </div>
            </td>
          </tr>`;
      }
    } else {
      if (summaryTableBody) {
        studentList.forEach(s => {
          const atts = attendanceList.filter(a => a.studentId === s.id);
          const cnt = { hadir: 0, izin: 0, sakit: 0, alpa: 0 };
          atts.forEach(a => {
            if (cnt[a.status] !== undefined) {
              cnt[a.status]++;
              totals[a.status]++;
            }
          });
          const tr = document.createElement('tr');
          tr.innerHTML = `
            <td>
              <div class="td-name-cell">
                <div class="avatar-init" style="background: ${getAvatarStyle(s.name)}">${getInitials(s.name)}</div>
                <span class="td-name">${s.name}</span>
              </div>
            </td>
            <td><span class="td-class-badge">Kelas ${s.class}</span></td>
            <td class="sum-count sum-hadir">${cnt.hadir}</td>
            <td class="sum-count sum-izin">${cnt.izin}</td>
            <td class="sum-count sum-sakit">${cnt.sakit}</td>
            <td class="sum-count sum-alpa">${cnt.alpa}</td>`;
          summaryTableBody.appendChild(tr);
        });
      }
    }

    ['hadir','izin','sakit','alpa'].forEach(k => {
      const el = document.getElementById(`sum-stat-${k}`);
      if (el) el.textContent = totals[k];
    });
  } catch (err) {
    console.error('Error saat memuat rangkuman:', err);
    toast('Gagal memuat rangkuman bulanan', 'error');
  } finally {
    summaryLoading?.classList.add('hidden');
  }
});

btnCloseSummary?.addEventListener('click', () => summaryModal?.classList.remove('open'));
summaryModal?.addEventListener('click', e => { if (e.target === summaryModal) summaryModal.classList.remove('open'); });

// ============ INIT ============
async function initApp() {
  const isAuth = await checkAuth();
  if (!isAuth) return;
  
  setupRoleUI();
  setupLogout();
  checkRangkumButton(todayStr);
  
  // Load default panel (presensi)
  loadAttendance();
}

initApp();
