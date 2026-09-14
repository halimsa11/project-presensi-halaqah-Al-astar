const API_URL = '/api';

let students = [];
let attendances = [];
let customHolidays = [];
let currentPanel = 'panel-santri';

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
  minus: `<svg class="icon icon-sm" viewBox="0 0 24 24"><line x1="5" x2="19" y1="12" y2="12"/></svg>`
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

const btnMarkHoliday    = document.getElementById('btn-mark-holiday');
const btnCancelHoliday  = document.getElementById('btn-cancel-holiday');
const holidayWeekendInfo = document.getElementById('holiday-weekend-info');
const holidayWeekendText = document.getElementById('holiday-weekend-text');
const mainHolidayBanner  = document.getElementById('main-holiday-banner');
const mainHolidayTitle   = document.getElementById('main-holiday-title');
const mainHolidayReason  = document.getElementById('main-holiday-reason');

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
function getHolidayInfo(dateStr) {
  if (!dateStr) return { isHoliday: false };
  const d = new Date(dateStr + 'T00:00:00');
  const day = d.getDay();
  if (day === 0 || day === 6) {
    const name = day === 0 ? 'Ahad' : 'Sabtu';
    return { isHoliday: true, title: `Libur Rutin ${name}`, reason: `Hari ${name} — jadwal libur rutin akhir pekan.`, isWeekend: true };
  }
  const custom = customHolidays.find(h => h.date === dateStr);
  if (custom) {
    return { isHoliday: true, title: 'Hari Libur Halaqah', reason: custom.reason || 'Kegiatan halaqah diliburkan.', isWeekend: false };
  }
  return { isHoliday: false };
}

function checkRangkumButton(dateStr) {
  const isAhad = new Date(dateStr + 'T00:00:00').getDay() === 0;
  btnShowSummary?.classList.toggle('hidden', !isAhad);
}

// ============ LOAD HOLIDAYS ============
async function fetchHolidays() {
  try {
    const res = await fetch(`${API_URL}/holidays`);
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
    const res = await fetch(`${API_URL}/students`);
    students = await res.json();
  } catch {
    toast('Gagal memuat daftar santri', 'error');
    students = [];
  }
  renderSantriTable();
  santriLoading?.classList.add('hidden');
  santriTableWrap?.classList.remove('hidden');
}

function renderSantriTable() {
  if (!santriTableBody) return;
  santriTableBody.innerHTML = '';
  if (santriCountLabel) santriCountLabel.textContent = `${students.length} santri aktif terdaftar`;

  if (!students.length) {
    santriTableBody.innerHTML = `
      <tr>
        <td colspan="3">
          <div class="empty">
            <div class="empty-icon-wrap">${ICONS.inbox}</div>
            <p>Belum ada santri terdaftar. Silakan tambahkan pada form di atas.</p>
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
        <span class="td-class-badge">Kelas ${s.class}</span>
      </td>
      <td style="text-align:right;">
        <div class="flex gap-2" style="justify-content: flex-end;">
          <button type="button" class="btn btn-sm btn-action-edit btn-edit" data-id="${s.id}">
            ${ICONS.edit}
            <span>Edit</span>
          </button>
          <button type="button" class="btn btn-sm btn-action-delete btn-delete" data-id="${s.id}" title="Hapus santri">
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
      const newName = prompt('Ubah Nama Santri:', s.name);
      if (newName === null) return;
      const newClass = prompt('Ubah Kelas (10 / 11 / 12):', s.class);
      if (newClass === null) return;
      if (!newName.trim()) return toast('Nama santri tidak boleh kosong', 'error');
      try {
        const res = await fetch(`${API_URL}/students/${id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: newName.trim(), class: newClass })
        });
        if (!res.ok) throw new Error();
        toast('Data santri berhasil diperbarui');
        loadSantriList();
      } catch { toast('Gagal memperbarui data santri', 'error'); }
    });
  });

  // Delete Listener
  santriTableBody.querySelectorAll('.btn-delete').forEach(btn => {
    btn.addEventListener('click', async e => {
      const id = e.currentTarget.dataset.id;
      const s = students.find(x => x.id === id);
      if (!confirm(`Hapus santri "${s?.name}"? Seluruh riwayat presensinya akan ikut dihapus.`)) return;
      try {
        const res = await fetch(`${API_URL}/students/${id}`, { method: 'DELETE' });
        if (!res.ok) throw new Error();
        toast('Santri berhasil dihapus', 'warning');
        loadSantriList();
      } catch { toast('Gagal menghapus santri', 'error'); }
    });
  });
}

addStudentForm?.addEventListener('submit', async e => {
  e.preventDefault();
  const nameInput = document.getElementById('new-student-name');
  const classInput = document.getElementById('new-student-class');
  const name = nameInput ? nameInput.value.trim() : '';
  const cls  = classInput ? classInput.value : '10';
  const btn  = document.getElementById('btn-add-student');
  if (btn) {
    btn.disabled = true;
    btn.innerHTML = `<div class="spin" style="width:16px;height:16px;"></div> <span>Menyimpan...</span>`;
  }
  try {
    const res = await fetch(`${API_URL}/students`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, class: cls })
    });
    const data = await res.json();
    if (!res.ok) { toast(data.error || 'Gagal menambahkan santri', 'error'); }
    else {
      toast(`${name} berhasil didaftarkan`);
      addStudentForm.reset();
      loadSantriList();
    }
  } catch { toast('Gagal terhubung ke server', 'error'); }
  finally {
    if (btn) {
      btn.disabled = false;
      btn.innerHTML = `<svg class="icon icon-sm" viewBox="0 0 24 24"><line x1="12" x2="12" y1="5" y2="19"/><line x1="5" x2="19" y1="12" y2="12"/></svg> <span>Tambah Santri</span>`;
    }
  }
});

// ============ PANEL: INPUT PRESENSI ============
function updateHolidayUI() {
  const info = getHolidayInfo(mainDate?.value);
  const weekend = holidayWeekendInfo;
  const markBtn = btnMarkHoliday;
  const cancelBtn = btnCancelHoliday;

  if (info.isWeekend) {
    weekend?.classList.remove('hidden');
    if (holidayWeekendText) holidayWeekendText.textContent = `${info.title} — ${info.reason}`;
    markBtn?.classList.add('hidden');
    cancelBtn?.classList.add('hidden');
  } else if (info.isHoliday) {
    weekend?.classList.remove('hidden');
    if (holidayWeekendText) holidayWeekendText.textContent = `Libur khusus: ${info.reason}`;
    markBtn?.classList.add('hidden');
    cancelBtn?.classList.remove('hidden');
  } else {
    weekend?.classList.add('hidden');
    markBtn?.classList.remove('hidden');
    cancelBtn?.classList.add('hidden');
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
      fetch(`${API_URL}/students`),
      fetch(`${API_URL}/attendance?date=${date}&session=${session}`),
      fetch(`${API_URL}/holidays`)
    ]);
    students = await r1.json();
    attendances = await r2.json();
    customHolidays = await r3.json();
  } catch {
    toast('Gagal memuat data presensi', 'error');
    students = []; attendances = []; customHolidays = [];
  }

  updateHolidayUI();
  renderAttendanceTable();
  mainLoading?.classList.add('hidden');
  mainTableContainer?.classList.remove('hidden');
}

function renderAttendanceTable() {
  if (!mainTableBody) return;
  mainTableBody.innerHTML = '';
  const info = getHolidayInfo(mainDate?.value);

  if (!students.length) {
    mainTableBody.innerHTML = `
      <tr>
        <td colspan="3">
          <div class="empty">
            <div class="empty-icon-wrap">${ICONS.inbox}</div>
            <p>Belum ada data santri. Silakan tambah santri terlebih dahulu.</p>
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
      statusCell = `<span class="badge badge-libur">${ICONS.palmtree} Libur</span>`;
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

btnMarkHoliday?.addEventListener('click', async () => {
  const date = mainDate?.value;
  if (!date) return toast('Pilih tanggal terlebih dahulu!', 'warning');
  const reason = prompt('Keterangan libur:', 'Libur Halaqah');
  if (reason === null) return;
  try {
    const res = await fetch(`${API_URL}/holidays`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ date, reason: reason.trim() || 'Libur Halaqah' })
    });
    if (!res.ok) throw new Error();
    toast(`Tanggal ${date} ditandai libur halaqah`);
    await loadAttendance();
  } catch { toast('Gagal menandai hari libur', 'error'); }
});

btnCancelHoliday?.addEventListener('click', async () => {
  const date = mainDate?.value;
  if (!confirm(`Batalkan status libur untuk tanggal ${date}?`)) return;
  try {
    const res = await fetch(`${API_URL}/holidays/${date}`, { method: 'DELETE' });
    if (!res.ok) throw new Error();
    toast('Status libur berhasil dibatalkan', 'warning');
    await loadAttendance();
  } catch { toast('Gagal membatalkan libur', 'error'); }
});

btnSaveAttendance?.addEventListener('click', async () => {
  const date = mainDate?.value;
  const session = mainSession?.value;
  const sels = mainTableBody?.querySelectorAll('.status-sel') || [];
  if (!sels.length) return toast('Tidak ada santri untuk diabsen', 'warning');
  const records = [...sels].map(s => ({ studentId: s.dataset.id, status: s.value }));

  if (btnSaveAttendance) {
    btnSaveAttendance.disabled = true;
    btnSaveAttendance.innerHTML = `<div class="spin" style="width:16px;height:16px;"></div> <span>Menyimpan Presensi...</span>`;
  }

  try {
    const res = await fetch(`${API_URL}/attendance`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
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
      fetch(`${API_URL}/students`),
      fetch(`${API_URL}/attendance?date=${date}&session=${session}`),
      fetch(`${API_URL}/holidays`)
    ]);
    viewStudents = await r1.json();
    viewAtts = await r2.json();
    customHolidays = await r3.json();
  } catch {
    toast('Gagal memuat rekap presensi', 'error');
  }

  const info = getHolidayInfo(date);
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
          <td colspan="3">
            <div class="empty">
              <div class="empty-icon-wrap">${ICONS.inbox}</div>
              <p>Belum ada data santri terdaftar.</p>
            </div>
          </td>
        </tr>`;
    } else {
      viewStudents.forEach(s => {
        const att = viewAtts.find(a => a.studentId === s.id);
        let status = att ? att.status : null;

        let badge;
        if (info.isHoliday) {
          badge = `<span class="badge badge-libur">${ICONS.palmtree} Libur</span>`;
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
      fetch(`${API_URL}/students`),
      fetch(`${API_URL}/attendance/summary?month=${month}`)
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
                <p>Belum ada santri terdaftar pada periode ini.</p>
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
checkRangkumButton(todayStr);
loadSantriList();
