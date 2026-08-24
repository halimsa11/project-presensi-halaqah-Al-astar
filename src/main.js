const API_URL = '/api'; // Maps to local proxy or vercel functions

let token = localStorage.getItem('token');
let students = [];
let attendances = [];
let currentTab = 'rekap'; // 'rekap' or 'musyrif'

// DOM Elements
const btnLogin = document.getElementById('btn-login');
const btnLogout = document.getElementById('btn-logout');
const loginModal = document.getElementById('login-modal');
const btnCloseLogin = document.getElementById('btn-close-login');
const loginForm = document.getElementById('login-form');
const loginError = document.getElementById('login-error');

const tabRekap = document.getElementById('tab-rekap');
const tabMusyrif = document.getElementById('tab-musyrif');
const addStudentSection = document.getElementById('add-student-section');
const addStudentForm = document.getElementById('add-student-form');
const addStudentMessage = document.getElementById('add-student-message');

const inputDate = document.getElementById('input-date');
const inputSession = document.getElementById('input-session');
const btnLoad = document.getElementById('btn-load');
const loading = document.getElementById('loading');
const tableContainer = document.getElementById('table-container');
const tableBody = document.getElementById('table-body');
const attendanceForm = document.getElementById('attendance-form');

// Set default date
inputDate.value = new Date().toISOString().split('T')[0];

function checkAuth() {
  if (token) {
    btnLogin.classList.add('hidden');
    btnLogout.classList.remove('hidden');
    if (currentTab === 'musyrif') {
      addStudentSection.classList.remove('hidden');
    }
  } else {
    btnLogin.classList.remove('hidden');
    btnLogout.classList.add('hidden');
    addStudentSection.classList.add('hidden');
  }
}

// Tab Handlers
tabRekap.addEventListener('click', () => {
  currentTab = 'rekap';
  tabRekap.classList.replace('border-transparent', 'border-[#16673B]');
  tabRekap.classList.replace('text-gray-500', 'text-[#16673B]');
  tabMusyrif.classList.replace('border-[#16673B]', 'border-transparent');
  tabMusyrif.classList.replace('text-[#16673B]', 'text-gray-500');
  
  addStudentSection.classList.add('hidden');
  
  if (students.length > 0) renderTable();
});

tabMusyrif.addEventListener('click', () => {
  currentTab = 'musyrif';
  tabMusyrif.classList.replace('border-transparent', 'border-[#16673B]');
  tabMusyrif.classList.replace('text-gray-500', 'text-[#16673B]');
  tabRekap.classList.replace('border-[#16673B]', 'border-transparent');
  tabRekap.classList.replace('text-[#16673B]', 'text-gray-500');
  
  if (!token) {
    loginModal.classList.remove('hidden');
  } else {
    checkAuth();
  }
  
  if (students.length > 0) renderTable();
});

// Login Handlers
btnLogin.addEventListener('click', () => {
  loginModal.classList.remove('hidden');
});

btnCloseLogin.addEventListener('click', () => {
  loginModal.classList.add('hidden');
  loginError.classList.add('hidden');
  if (currentTab === 'musyrif' && !token) {
    // Revert to rekap if they cancel login on musyrif tab
    tabRekap.click();
  }
});

btnLogout.addEventListener('click', () => {
  localStorage.removeItem('token');
  token = null;
  checkAuth();
  if (currentTab === 'musyrif') {
    tabRekap.click();
  }
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
    
    if (currentTab === 'musyrif' && students.length > 0) {
      renderTable();
    }
  } catch (err) {
    loginError.textContent = 'Network error';
    loginError.classList.remove('hidden');
  }
});

// Add Student Handler
addStudentForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const id = document.getElementById('new-student-id').value;
  const name = document.getElementById('new-student-name').value;
  const studentClass = document.getElementById('new-student-class').value;
  
  const btnSubmit = document.getElementById('btn-add-student');
  btnSubmit.disabled = true;
  btnSubmit.textContent = 'Menambahkan...';
  
  try {
    const res = await fetch(`${API_URL}/students`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ id, name, class: studentClass })
    });
    const data = await res.json();
    
    addStudentMessage.classList.remove('hidden');
    if (!res.ok) {
      addStudentMessage.className = 'mt-2 text-sm text-red-600 font-medium';
      addStudentMessage.textContent = data.error || 'Gagal menambahkan data';
    } else {
      addStudentMessage.className = 'mt-2 text-sm text-[#16673B] font-medium';
      addStudentMessage.textContent = 'Berhasil menambahkan murid baru!';
      addStudentForm.reset();
      
      // Refresh data to show new student
      btnLoad.click();
    }
    
    setTimeout(() => {
      addStudentMessage.classList.add('hidden');
    }, 4000);
    
  } catch (err) {
    addStudentMessage.classList.remove('hidden');
    addStudentMessage.className = 'mt-2 text-sm text-red-600 font-medium';
    addStudentMessage.textContent = 'Terjadi kesalahan jaringan';
  } finally {
    btnSubmit.disabled = false;
    btnSubmit.textContent = 'Tambah Siswa';
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
  
  const colAksi = document.getElementById('col-aksi');
  
  if (students.length === 0) {
    tableBody.innerHTML = '<tr><td colspan="5" class="px-6 py-4 text-center text-gray-500">Belum ada data siswa</td></tr>';
    return;
  }
  
  if (currentTab === 'musyrif') {
    colAksi.classList.remove('hidden');
  } else {
    colAksi.classList.add('hidden');
  }
  
  // Sort students by class and name
  students.sort((a, b) => {
    if (a.class === b.class) return a.name.localeCompare(b.name);
    return a.class - b.class;
  });
  
  students.forEach(student => {
    // Find existing attendance
    const att = attendances.find(a => a.studentId === student.id);
    let status = att ? att.status : (currentTab === 'musyrif' ? 'hadir' : '-');
    
    const tr = document.createElement('tr');
    
    let statusHTML = '';
    let aksiHTML = '';
    
    if (currentTab === 'musyrif') {
      statusHTML = `
        <select name="status_${student.id}" data-id="${student.id}" class="status-select w-full border border-gray-300 rounded p-1 text-sm ${getStatusColor(status)} focus:ring-[#16673B]">
          <option value="hadir" ${status === 'hadir' ? 'selected' : ''}>Hadir</option>
          <option value="sakit" ${status === 'sakit' ? 'selected' : ''}>Sakit</option>
          <option value="izin" ${status === 'izin' ? 'selected' : ''}>Izin</option>
          <option value="alpa" ${status === 'alpa' ? 'selected' : ''}>Alpa</option>
        </select>
      `;
      aksiHTML = `
        <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
          <button data-id="${student.id}" class="btn-edit text-indigo-600 hover:text-indigo-900 mr-3">Edit</button>
          <button data-id="${student.id}" class="btn-delete text-red-600 hover:text-red-900">Hapus</button>
        </td>
      `;
    } else {
      // Rekap mode (read-only)
      let displayStatus = status.charAt(0).toUpperCase() + status.slice(1);
      if (status === '-') displayStatus = 'Belum Diisi';
      statusHTML = `<span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusBadgeColor(status)}">${displayStatus}</span>`;
      aksiHTML = `<td class="hidden"></td>`;
    }

    tr.innerHTML = `
      <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${student.id}</td>
      <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">${student.name}</td>
      <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">Kelas ${student.class}</td>
      <td class="px-6 py-4 whitespace-nowrap text-sm">
        ${statusHTML}
      </td>
      ${currentTab === 'musyrif' ? aksiHTML : ''}
    `;
    tableBody.appendChild(tr);
  });
  
  if (currentTab === 'musyrif') {
    // Add change listeners to selects to update color and auto-save
    document.querySelectorAll('.status-select').forEach(select => {
      select.addEventListener('change', async (e) => {
        e.target.className = `status-select w-full border border-gray-300 rounded p-1 text-sm ${getStatusColor(e.target.value)} focus:ring-[#16673B]`;
        
        // Auto save all current records
        const date = inputDate.value;
        const session = inputSession.value;
        const allSelects = document.querySelectorAll('.status-select');
        const records = Array.from(allSelects).map(sel => ({
          studentId: sel.getAttribute('data-id'),
          status: sel.value
        }));
        
        try {
          await fetch(`${API_URL}/attendance`, {
            method: 'POST',
            headers: { 
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ date, session, records })
          });
          // Update in-memory attendances
          const resAttendances = await fetch(`${API_URL}/attendance?date=${date}&session=${session}`);
          attendances = await resAttendances.json();
        } catch (err) {
          console.error('Failed to auto-save attendance', err);
        }
      });
    });
    
    // Edit buttons
    document.querySelectorAll('.btn-edit').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        const id = e.target.getAttribute('data-id');
        const student = students.find(s => s.id === id);
        if (!student) return;
        
        const newName = prompt('Ubah Nama Siswa:', student.name);
        if (newName === null) return;
        
        const newClass = prompt('Ubah Kelas (10, 11, 12):', student.class);
        if (newClass === null) return;
        
        if (!newName.trim() || !newClass.trim()) return alert('Data tidak boleh kosong');
        
        try {
          const res = await fetch(`${API_URL}/students/${id}`, {
            method: 'PUT',
            headers: { 
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ name: newName, class: newClass })
          });
          
          if (!res.ok) throw new Error('Gagal mengupdate');
          alert('Berhasil mengupdate siswa');
          btnLoad.click(); // Reload data
        } catch(err) {
          alert(err.message);
        }
      });
    });
    
    // Delete buttons
    document.querySelectorAll('.btn-delete').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        const id = e.target.getAttribute('data-id');
        if (!confirm(`Yakin ingin menghapus siswa dengan NIS ${id}? Semua data absennya juga akan terhapus.`)) return;
        
        try {
          const res = await fetch(`${API_URL}/students/${id}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
          });
          
          if (!res.ok) throw new Error('Gagal menghapus');
          alert('Berhasil menghapus siswa');
          btnLoad.click(); // Reload data
        } catch(err) {
          alert(err.message);
        }
      });
    });
  }
}

function getStatusColor(status) {
  if (status === 'hadir') return 'bg-green-50 text-green-700';
  if (status === 'sakit') return 'bg-blue-50 text-blue-700';
  if (status === 'izin') return 'bg-yellow-50 text-yellow-700';
  if (status === 'alpa') return 'bg-red-50 text-red-700';
  return '';
}

function getStatusBadgeColor(status) {
  if (status === 'hadir') return 'bg-green-100 text-green-800';
  if (status === 'sakit') return 'bg-blue-100 text-blue-800';
  if (status === 'izin') return 'bg-yellow-100 text-yellow-800';
  if (status === 'alpa') return 'bg-red-100 text-red-800';
  return 'bg-gray-100 text-gray-800'; // belum diisi
}


// Initial Setup
checkAuth();
