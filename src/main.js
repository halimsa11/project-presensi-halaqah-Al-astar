const API_URL = '/api'; // Maps to local proxy or vercel functions

let token = localStorage.getItem('token');
let students = [];
let attendances = [];

// DOM Elements
const btnLogin = document.getElementById('btn-login');
const btnLogout = document.getElementById('btn-logout');
const loginModal = document.getElementById('login-modal');
const btnCloseLogin = document.getElementById('btn-close-login');
const loginForm = document.getElementById('login-form');
const loginError = document.getElementById('login-error');

const inputDate = document.getElementById('input-date');
const inputSession = document.getElementById('input-session');
const btnLoad = document.getElementById('btn-load');
const loading = document.getElementById('loading');
const tableContainer = document.getElementById('table-container');
const tableBody = document.getElementById('table-body');
const btnSave = document.getElementById('btn-save');
const attendanceForm = document.getElementById('attendance-form');

// Set default date
inputDate.value = new Date().toISOString().split('T')[0];

function checkAuth() {
  if (token) {
    btnLogin.classList.add('hidden');
    btnLogout.classList.remove('hidden');
    btnSave.classList.remove('hidden');
  } else {
    btnLogin.classList.remove('hidden');
    btnLogout.classList.add('hidden');
    btnSave.classList.add('hidden');
  }
}
checkAuth();

// Login Handlers
btnLogin.addEventListener('click', () => {
  loginModal.classList.remove('hidden');
});

btnCloseLogin.addEventListener('click', () => {
  loginModal.classList.add('hidden');
  loginError.classList.add('hidden');
});

btnLogout.addEventListener('click', () => {
  localStorage.removeItem('token');
  token = null;
  checkAuth();
  // Reset table if needed, but not strictly necessary
});

loginForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const username = document.getElementById('login-username').value;
  const password = document.getElementById('login-password').value;
  
  try {
    const res = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });
    const data = await res.json();
    
    if (!res.ok) {
      loginError.textContent = data.error || 'Login failed';
      loginError.classList.remove('hidden');
      return;
    }
    
    token = data.token;
    localStorage.setItem('token', token);
    loginModal.classList.add('hidden');
    checkAuth();
    loginForm.reset();
    loginError.classList.add('hidden');
  } catch (err) {
    loginError.textContent = 'Network error';
    loginError.classList.remove('hidden');
  }
});

// Load Data
btnLoad.addEventListener('click', async () => {
  const date = inputDate.value;
  const session = inputSession.value;
  
  if (!date) return alert('Pilih tanggal!');
  
  loading.classList.remove('hidden');
  tableContainer.classList.add('hidden');
  
  try {
    // Fetch students if not fetched yet (or always fetch)
    const resStudents = await fetch(`${API_URL}/students`);
    students = await resStudents.json();
    
    // Fetch attendances for date & session
    const resAttendances = await fetch(`${API_URL}/attendance?date=${date}&session=${session}`);
    attendances = await resAttendances.json();
    
    renderTable();
    
    loading.classList.add('hidden');
    tableContainer.classList.remove('hidden');
  } catch (err) {
    alert('Gagal memuat data');
    loading.classList.add('hidden');
  }
});

function renderTable() {
  tableBody.innerHTML = '';
  
  // Sort students by class and name
  students.sort((a, b) => {
    if (a.class === b.class) return a.name.localeCompare(b.name);
    return a.class - b.class;
  });
  
  students.forEach(student => {
    // Find existing attendance
    const att = attendances.find(a => a.studentId === student.id);
    const status = att ? att.status : 'hadir'; // default hadir
    
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${student.id}</td>
      <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">${student.name}</td>
      <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">Kelas ${student.class}</td>
      <td class="px-6 py-4 whitespace-nowrap text-sm">
        <select name="status_${student.id}" data-id="${student.id}" class="status-select w-full border border-gray-300 rounded p-1 text-sm ${getStatusColor(status)} focus:ring-green-500">
          <option value="hadir" ${status === 'hadir' ? 'selected' : ''}>Hadir</option>
          <option value="alpa" ${status === 'alpa' ? 'selected' : ''}>Alpa</option>
          <option value="izin" ${status === 'izin' ? 'selected' : ''}>Izin</option>
        </select>
      </td>
    `;
    tableBody.appendChild(tr);
  });
  
  // Add change listeners to selects to update color
  document.querySelectorAll('.status-select').forEach(select => {
    select.addEventListener('change', (e) => {
      e.target.className = `status-select w-full border border-gray-300 rounded p-1 text-sm ${getStatusColor(e.target.value)} focus:ring-green-500`;
    });
  });
}

function getStatusColor(status) {
  if (status === 'hadir') return 'bg-green-50 text-green-700';
  if (status === 'alpa') return 'bg-red-50 text-red-700';
  if (status === 'izin') return 'bg-yellow-50 text-yellow-700';
  return '';
}

// Save Attendance
attendanceForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  
  if (!token) {
    alert('Anda harus login untuk menyimpan data!');
    return loginModal.classList.remove('hidden');
  }
  
  const date = inputDate.value;
  const session = inputSession.value;
  const selects = document.querySelectorAll('.status-select');
  
  const records = Array.from(selects).map(select => ({
    studentId: select.getAttribute('data-id'),
    status: select.value
  }));
  
  btnSave.disabled = true;
  btnSave.textContent = 'Menyimpan...';
  
  try {
    const res = await fetch(`${API_URL}/attendance`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ date, session, records })
    });
    
    if (!res.ok) {
      if (res.status === 401) {
        localStorage.removeItem('token');
        token = null;
        checkAuth();
        alert('Sesi Anda telah habis. Silakan login kembali.');
      } else {
        alert('Gagal menyimpan data');
      }
      return;
    }
    
    alert('Presensi berhasil disimpan!');
  } catch (err) {
    alert('Terjadi kesalahan jaringan');
  } finally {
    btnSave.disabled = false;
    btnSave.textContent = 'Simpan Presensi';
  }
});
