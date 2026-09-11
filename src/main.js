const API_URL = '/api';

let students = [];
let attendances = [];
let customHolidays = [];
let currentPanel = 'panel-santri';

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
mainDate.value = todayStr;
viewDate.value = todayStr;
document.getElementById('attendance-form')?.addEventListener('submit', e => e.preventDefault());

// ============ TOAST ============
function toast(msg, type = 'success') {
  const el = document.createElement('div');
  el.className = `toast${type === 'error' ? ' error' : type === 'warning' ? ' warning' : ''}`;
  const icons = { success: '✅', error: '❌', warning: '⚠️' };
  el.innerHTML = `<span>${icons[type] || '✅'}</span><span>${msg}</span>`;
  document.getElementById('toaster').appendChild(el);
  setTimeout(() => el.remove(), 3500);
}

// ============ NAVBAR ============
document.querySelectorAll('.nav-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
    document.querySelectorAll('.panel').forEach(p => p.classList.remove('active'));
    btn.classList.add('active');
    const target = btn.dataset.panel;
    document.getElementById(target).classList.add('active');
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
    return { isHoliday: true, title: `Libur ${name}`, reason: `Hari ${name} — libur akhir pekan.`, isWeekend: true };
  }
  const custom = customHolidays.find(h => h.date === dateStr);
  if (custom) {
    return { isHoliday: true, title: 'Hari Libur', reason: custom.reason || 'Kegiatan diliburkan.', isWeekend: false };
  }
  return { isHoliday: false };
}

function checkRangkumButton(dateStr) {
  const day = new Date(dateStr + 'T00:00:00').getDate();
  if (day >= 24) {
    btnShowSummary.classList.remove('hidden');
  } else {
    btnShowSummary.classList.add('hidden');
  }
}

// ============ LOAD HOLIDAYS (shared) ============
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
  santriLoading.classList.remove('hidden');
  santriTableWrap.classList.add('hidden');
  try {
    const res = await fetch(`${API_URL}/students`);
    students = await res.json();
  } catch {
    toast('Gagal memuat daftar santri', 'error');
    students = [];
  }
  renderSantriTable();
  santriLoading.classList.add('hidden');
  santriTableWrap.classList.remove('hidden');
}

function renderSantriTable() {
  santriTableBody.innerHTML = '';
  santriCountLabel.textContent = `${students.length} santri terdaftar`;

  if (!students.length) {
    santriTableBody.innerHTML = `<tr><td colspan="3"><div class="empty"><div class="empty-icon">📭</div><p>Belum ada santri terdaftar.</p></div></td></tr>`;
    return;
  }

  students.sort((a, b) => a.class !== b.class ? a.class - b.class : a.name.localeCompare(b.name));
  students.forEach(s => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td class="td-name">${s.name}</td>
      <td class="td-class">Kelas ${s.class}</td>
      <td>
        <div class="flex gap-2">
          <button class="btn btn-sm btn-indigo-sm btn-edit" data-id="${s.id}">✏️ Edit</button>
          <button class="btn btn-sm btn-red-sm btn-delete" data-id="${s.id}">🗑</button>
        </div>
      </td>`;
    santriTableBody.appendChild(tr);
  });

  // Edit
  santriTableBody.querySelectorAll('.btn-edit').forEach(btn => {
    btn.addEventListener('click', async e => {
      const id = e.currentTarget.dataset.id;
      const s = students.find(x => x.id === id);
      if (!s) return;
      const newName = prompt('Nama Santri:', s.name);
      if (newName === null) return;
      const newClass = prompt('Kelas (10 / 11 / 12):', s.class);
      if (newClass === null) return;
      if (!newName.trim()) return toast('Nama tidak boleh kosong', 'error');
      try {
        const res = await fetch(`${API_URL}/students/${id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: newName.trim(), class: newClass })
        });
        if (!res.ok) throw new Error();
        toast('Data santri berhasil diperbarui');
        loadSantriList();
      } catch { toast('Gagal memperbarui santri', 'error'); }
    });
  });

  // Delete
  santriTableBody.querySelectorAll('.btn-delete').forEach(btn => {
    btn.addEventListener('click', async e => {
      const id = e.currentTarget.dataset.id;
      const s = students.find(x => x.id === id);
      if (!confirm(`Hapus "${s?.name}"? Semua data presensinya ikut terhapus.`)) return;
      try {
        const res = await fetch(`${API_URL}/students/${id}`, { method: 'DELETE' });
        if (!res.ok) throw new Error();
        toast('Santri berhasil dihapus', 'warning');
        loadSantriList();
      } catch { toast('Gagal menghapus santri', 'error'); }
    });
  });
}

addStudentForm.addEventListener('submit', async e => {
  e.preventDefault();
  const name = document.getElementById('new-student-name').value.trim();
  const cls  = document.getElementById('new-student-class').value;
  const btn  = document.getElementById('btn-add-student');
  btn.disabled = true; btn.textContent = 'Menambahkan...';
  try {
    const res = await fetch(`${API_URL}/students`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, class: cls })
    });
    const data = await res.json();
    if (!res.ok) { toast(data.error || 'Gagal menambahkan santri', 'error'); }
    else {
      toast(`${name} berhasil ditambahkan`);
      addStudentForm.reset();
      loadSantriList();
    }
  } catch { toast('Gagal terhubung ke server', 'error'); }
  finally { btn.disabled = false; btn.innerHTML = '➕ Tambah Santri'; }
});

// ============ PANEL: INPUT PRESENSI ============
function updateHolidayUI() {
  const info = getHolidayInfo(mainDate.value);
  const weekend = holidayWeekendInfo;
  const markBtn = btnMarkHoliday;
  const cancelBtn = btnCancelHoliday;

  if (info.isWeekend) {
    weekend.classList.remove('hidden');
    holidayWeekendText.textContent = `${info.title} — ${info.reason}`;
    markBtn.classList.add('hidden');
    cancelBtn.classList.add('hidden');
  } else if (info.isHoliday) {
    weekend.classList.remove('hidden');
    holidayWeekendText.textContent = `🔴 ${mainDate.value} ditandai libur: ${info.reason}`;
    markBtn.classList.add('hidden');
    cancelBtn.classList.remove('hidden');
  } else {
    weekend.classList.add('hidden');
    markBtn.classList.remove('hidden');
    cancelBtn.classList.add('hidden');
  }

  if (info.isHoliday) {
    mainHolidayBanner.classList.remove('hidden');
    mainHolidayTitle.textContent = info.title;
    mainHolidayReason.textContent = info.reason;
    saveAttendanceContainer.classList.add('hidden');
  } else {
    mainHolidayBanner.classList.add('hidden');
    if (students.length > 0) saveAttendanceContainer.classList.remove('hidden');
  }
}

async function loadAttendance() {
  const date = mainDate.value;
  const session = mainSession.value;
  if (!date) return;

  checkRangkumButton(date);

  mainLoading.classList.remove('hidden');
  mainTableContainer.classList.add('hidden');

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
    toast('Gagal memuat data', 'error');
    students = []; attendances = []; customHolidays = [];
  }

  updateHolidayUI();
  renderAttendanceTable();
  mainLoading.classList.add('hidden');
  mainTableContainer.classList.remove('hidden');
}

function renderAttendanceTable() {
  mainTableBody.innerHTML = '';
  const info = getHolidayInfo(mainDate.value);

  if (!students.length) {
    mainTableBody.innerHTML = `<tr><td colspan="3"><div class="empty"><div class="empty-icon">📭</div><p>Belum ada santri. Tambah di menu "Tambah Santri".</p></div></td></tr>`;
    saveAttendanceContainer.classList.add('hidden');
    return;
  }

  students.sort((a, b) => a.class !== b.class ? a.class - b.class : a.name.localeCompare(b.name));

  students.forEach(s => {
    const att = attendances.find(a => a.studentId === s.id);
    const status = att ? att.status : 'hadir';
    const tr = document.createElement('tr');

    let statusCell;
    if (info.isHoliday) {
      statusCell = `<span class="badge badge-libur">🌴 Libur</span>`;
    } else {
      statusCell = `
        <select class="status-sel s-${status}" data-id="${s.id}">
          <option value="hadir" ${status==='hadir'?'selected':''}>✅ Hadir</option>
          <option value="sakit" ${status==='sakit'?'selected':''}>🤒 Sakit</option>
          <option value="izin"  ${status==='izin' ?'selected':''}>📝 Izin</option>
          <option value="alpa"  ${status==='alpa' ?'selected':''}>❌ Alpa</option>
        </select>`;
    }

    tr.innerHTML = `
      <td class="td-name">${s.name}</td>
      <td class="td-class">Kelas ${s.class}</td>
      <td>${statusCell}</td>`;
    mainTableBody.appendChild(tr);
  });

  mainTableBody.querySelectorAll('.status-sel').forEach(sel => {
    sel.addEventListener('change', e => {
      e.target.className = `status-sel s-${e.target.value}`;
    });
  });

  if (!info.isHoliday) saveAttendanceContainer.classList.remove('hidden');
}

mainDate.addEventListener('change', loadAttendance);
mainSession.addEventListener('change', loadAttendance);

btnMarkHoliday.addEventListener('click', async () => {
  const date = mainDate.value;
  if (!date) return toast('Pilih tanggal dulu!', 'warning');
  const reason = prompt('Keterangan libur:', 'Libur Halaqah');
  if (reason === null) return;
  try {
    const res = await fetch(`${API_URL}/holidays`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ date, reason: reason.trim() || 'Libur Halaqah' })
    });
    if (!res.ok) throw new Error();
    toast(`Tanggal ${date} ditandai libur`);
    await loadAttendance();
  } catch { toast('Gagal menandai hari libur', 'error'); }
});

btnCancelHoliday.addEventListener('click', async () => {
  const date = mainDate.value;
  if (!confirm(`Batalkan status libur untuk ${date}?`)) return;
  try {
    const res = await fetch(`${API_URL}/holidays/${date}`, { method: 'DELETE' });
    if (!res.ok) throw new Error();
    toast('Status libur dibatalkan', 'warning');
    await loadAttendance();
  } catch { toast('Gagal membatalkan libur', 'error'); }
});

btnSaveAttendance.addEventListener('click', async () => {
  const date = mainDate.value;
  const session = mainSession.value;
  const sels = mainTableBody.querySelectorAll('.status-sel');
  if (!sels.length) return toast('Tidak ada santri', 'warning');
  const records = [...sels].map(s => ({ studentId: s.dataset.id, status: s.value }));

  btnSaveAttendance.disabled = true; btnSaveAttendance.textContent = 'Menyimpan...';
  try {
    const res = await fetch(`${API_URL}/attendance`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ date, session, records })
    });
    if (!res.ok) throw new Error();
    toast(`Presensi ${date} (${session}) berhasil disimpan!`);
    loadAttendance();
  } catch { toast('Gagal menyimpan presensi', 'error'); }
  finally {
    btnSaveAttendance.disabled = false;
    btnSaveAttendance.innerHTML = `<svg width="15" height="15" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 13l4 4L19 7"/></svg> Simpan Presensi`;
  }
});

// ============ PANEL: LIHAT PRESENSI ============
async function loadView() {
  const date = viewDate.value;
  const session = viewSession.value;
  if (!date) return;

  checkRangkumButton(date);

  viewLoading.classList.remove('hidden');
  viewTableWrap.classList.add('hidden');
  viewHolidayBanner.classList.add('hidden');

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
    toast('Gagal memuat data', 'error');
  }

  const info = getHolidayInfo(date);
  if (info.isHoliday) {
    viewHolidayBanner.classList.remove('hidden');
    viewHolidayTitle.textContent = info.title;
    viewHolidayReason.textContent = info.reason;
  }

  // Stats
  const counts = { hadir: 0, izin: 0, sakit: 0, alpa: 0 };
  viewStudents.sort((a, b) => a.class !== b.class ? a.class - b.class : a.name.localeCompare(b.name));

  viewTableBody.innerHTML = '';
  if (!viewStudents.length) {
    viewTableBody.innerHTML = `<tr><td colspan="3"><div class="empty"><div class="empty-icon">📭</div><p>Belum ada santri terdaftar.</p></div></td></tr>`;
  } else {
    viewStudents.forEach(s => {
      const att = viewAtts.find(a => a.studentId === s.id);
      let status = att ? att.status : null;

      let badge;
      if (info.isHoliday) {
        badge = `<span class="badge badge-libur">🌴 Libur</span>`;
      } else if (!status) {
        badge = `<span class="badge badge-belum">— Belum diisi</span>`;
      } else {
        badge = `<span class="badge badge-${status}">${statusLabel(status)}</span>`;
        counts[status]++;
      }

      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td class="td-name">${s.name}</td>
        <td class="td-class">Kelas ${s.class}</td>
        <td class="td-center">${badge}</td>`;
      viewTableBody.appendChild(tr);
    });
  }

  document.getElementById('stat-hadir').textContent = counts.hadir;
  document.getElementById('stat-izin').textContent  = counts.izin;
  document.getElementById('stat-sakit').textContent = counts.sakit;
  document.getElementById('stat-alpa').textContent  = counts.alpa;

  viewLoading.classList.add('hidden');
  viewTableWrap.classList.remove('hidden');
}

function statusLabel(s) {
  return { hadir: '✅ Hadir', izin: '📝 Izin', sakit: '🤒 Sakit', alpa: '❌ Alpa' }[s] || s;
}

viewDate.addEventListener('change', loadView);
viewSession.addEventListener('change', loadView);

// ============ SUMMARY MODAL ============
btnShowSummary.addEventListener('click', async () => {
  const dateStr = (currentPanel === 'panel-lihat' ? viewDate : mainDate).value;
  const month = dateStr.substring(0, 7);
  const [y, m] = month.split('-');
  const monthNames = ['Jan','Feb','Mar','Apr','Mei','Jun','Jul','Agu','Sep','Okt','Nov','Des'];
  document.getElementById('summary-month-badge').textContent = `${monthNames[parseInt(m)-1]} ${y}`;
  document.getElementById('summary-modal-title').textContent = 'Rangkuman Presensi';

  summaryModal.classList.add('open');
  summaryLoading.classList.remove('hidden');
  summaryTableBody.innerHTML = '';
  // Reset stats
  ['hadir','izin','sakit','alpa'].forEach(k => document.getElementById(`sum-stat-${k}`).textContent = '0');

  try {
    const [r1, r2] = await Promise.all([
      fetch(`${API_URL}/students`),
      fetch(`${API_URL}/attendance/summary?month=${month}`)
    ]);
    const allStudents = await r1.json();
    const allAtt = await r2.json();

    allStudents.sort((a, b) => a.class !== b.class ? a.class - b.class : a.name.localeCompare(b.name));

    const totals = { hadir: 0, izin: 0, sakit: 0, alpa: 0 };

    if (!allStudents.length) {
      summaryTableBody.innerHTML = `<tr><td colspan="6"><div class="empty"><div class="empty-icon">📭</div><p>Belum ada santri.</p></div></td></tr>`;
    } else {
      allStudents.forEach(s => {
        const atts = allAtt.filter(a => a.studentId === s.id);
        const cnt = { hadir: 0, izin: 0, sakit: 0, alpa: 0 };
        atts.forEach(a => { if (cnt[a.status] !== undefined) { cnt[a.status]++; totals[a.status]++; } });
        const tr = document.createElement('tr');
        tr.innerHTML = `
          <td class="td-name">${s.name}</td>
          <td class="td-class">Kelas ${s.class}</td>
          <td class="sum-count sum-hadir">${cnt.hadir}</td>
          <td class="sum-count sum-izin">${cnt.izin}</td>
          <td class="sum-count sum-sakit">${cnt.sakit}</td>
          <td class="sum-count sum-alpa">${cnt.alpa}</td>`;
        summaryTableBody.appendChild(tr);
      });
    }

    ['hadir','izin','sakit','alpa'].forEach(k => {
      document.getElementById(`sum-stat-${k}`).textContent = totals[k];
    });
  } catch (err) {
    console.error(err);
    toast('Gagal memuat rangkuman', 'error');
  } finally {
    summaryLoading.classList.add('hidden');
  }
});

btnCloseSummary.addEventListener('click', () => summaryModal.classList.remove('open'));
summaryModal.addEventListener('click', e => { if (e.target === summaryModal) summaryModal.classList.remove('open'); });

// ============ INIT ============
loadSantriList();
