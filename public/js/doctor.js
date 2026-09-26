/* =============================================
   SmartCare AI – Doctor JS
   ============================================= */

// ── Dashboard ──────────────────────────────────────────────────────────────
async function loadDoctorDashboard() {
  try {
    const res = await authFetch('/api/doctors/me/dashboard');
    if (!res) return;
    const data = await res.json();
    if (!data.success) return;

    const s = data.stats;
    document.getElementById('statToday').textContent = s.todayAppointments;
    document.getElementById('statPatients').textContent = s.totalPatients;
    document.getElementById('statCompleted').textContent = s.completedConsultations;
    document.getElementById('statPending').textContent = s.pendingAppointments;

    const el = document.getElementById('todayAppts');
    const appts = data.todayAppointments || [];
    if (!appts.length) {
      el.innerHTML = `<div class="empty-state" style="padding:32px 16px;">
        <div class="empty-state-icon">📅</div>
        <h3>No appointments today</h3>
        <p>You have no scheduled appointments for today.</p>
      </div>`;
      return;
    }
    el.innerHTML = appts.map(a => buildDoctorApptRow(a, true)).join('');
  } catch (err) {
    console.error('Doctor dashboard error:', err);
  }
}

function buildDoctorApptRow(a, compact = false) {
  const patientName = a.patientId?.name || a.patientName || 'Patient';
  const dob = a.patientId?.dateOfBirth || a.patientDob;
  const age = dob ? calcAge(dob) : null;
  const gender = a.patientId?.gender || a.patientGender || '';

  return `
  <div class="appt-item" style="${compact ? '' : 'border:1px solid var(--gray-100);border-radius:var(--radius);padding:14px;margin-bottom:10px;'}">
    <div class="appt-time-block">
      <div class="time">${a.time}</div>
      <div class="date-sm">${formatDate(a.date)}</div>
    </div>
    <div class="appt-info">
      <h4>${patientName}${age ? `, ${age} yrs` : ''} ${gender ? '(' + gender + ')' : ''}</h4>
      <p style="font-size:12px;color:var(--gray-500);">${a.reason?.substring(0,50) || ''}</p>
    </div>
    <div class="appt-actions" style="display:flex;gap:6px;align-items:center;">
      ${statusBadge(a.status)}
      <button class="btn btn-secondary btn-sm" onclick="viewApptDetail('${a._id || a.id}')">
        <i class="fa-solid fa-eye"></i>
      </button>
    </div>
  </div>`;
}

// ── Appointments ────────────────────────────────────────────────────────────
async function loadDoctorAppointments(filter = 'all', date = '') {
  const el = document.getElementById('doctorApptsList');
  if (!el) return;
  el.innerHTML = `<div class="loading-overlay"><div class="spinner spinner-dark"></div></div>`;

  try {
    let url = '/api/appointments/doctor?';
    if (filter !== 'all') url += `status=${filter}&`;
    if (date) url += `date=${date}`;

    const res = await authFetch(url);
    if (!res) return;
    const data = await res.json();
    const appts = data.appointments || [];

    if (!appts.length) {
      el.innerHTML = `<div class="empty-state">
        <div class="empty-state-icon">📅</div>
        <h3>No ${filter === 'all' ? '' : filter} appointments</h3>
        <p>${date ? 'No appointments on ' + formatDate(date) : 'Nothing to show here.'}</p>
      </div>`;
      return;
    }

    el.innerHTML = appts.map(a => `
      <div class="card" style="margin-bottom:12px;">
        <div class="card-body">
          <div style="display:flex;align-items:flex-start;gap:16px;flex-wrap:wrap;">
            <div style="min-width:56px;text-align:center;background:var(--gray-50);border-radius:8px;padding:8px 6px;">
              <div style="font-size:13px;font-weight:700;">${a.time}</div>
              <div style="font-size:10px;color:var(--gray-400);">${formatDate(a.date)}</div>
            </div>
            <div style="flex:1;min-width:0;">
              <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap;margin-bottom:4px;">
                <h3 style="font-size:15px;">${a.patientName || 'Patient'}</h3>
                ${statusBadge(a.status)}
              </div>
              <p style="font-size:12px;color:var(--gray-500);margin-bottom:4px;">
                ${a.patientGender || ''} ${a.patientDob ? '| Age ' + calcAge(a.patientDob) : ''}
                ${a.patientPhone ? '| ' + a.patientPhone : ''}
              </p>
              <p style="font-size:13px;color:var(--gray-600);"><strong>Reason:</strong> ${a.reason || '—'}</p>
            </div>
            <div style="display:flex;flex-direction:column;gap:6px;flex-shrink:0;">
              <button class="btn btn-secondary btn-sm" onclick="viewApptDetail('${a.id}')">
                <i class="fa-solid fa-eye"></i> Details
              </button>
              ${a.status === 'pending' ? `<button class="btn btn-primary btn-sm" onclick="updateApptStatus('${a.id}','confirmed')">
                <i class="fa-solid fa-check"></i> Confirm
              </button>` : ''}
              ${a.status === 'confirmed' ? `<button class="btn btn-success btn-sm" onclick="updateApptStatus('${a.id}','completed')">
                <i class="fa-solid fa-check-double"></i> Complete
              </button>` : ''}
              ${a.status === 'completed' ? `<a href="/doctor/prescription?appt=${a.id}" class="btn btn-outline btn-sm">
                <i class="fa-solid fa-file-prescription"></i> Prescribe
              </a>` : ''}
            </div>
          </div>
        </div>
      </div>`).join('');
  } catch (err) {
    el.innerHTML = `<p style="color:var(--danger);padding:20px;">Failed to load appointments.</p>`;
  }
}

async function viewApptDetail(id) {
  const content = document.getElementById('apptDetailContent');
  const actions = document.getElementById('apptDetailActions');
  if (!content) return;

  content.innerHTML = `<div class="loading-overlay"><div class="spinner spinner-dark"></div></div>`;
  document.getElementById('apptDetailModal').classList.add('open');

  try {
    const res = await authFetch(`/api/appointments/${id}`);
    const data = await res.json();
    if (!res.ok) { content.innerHTML = '<p>Failed to load.</p>'; return; }

    const a = data.appointment;
    const p = a.patientId;
    const d = a.doctorId;

    content.innerHTML = `
      <div style="display:grid;gap:12px;">
        <div style="background:var(--gray-50);border-radius:var(--radius);padding:14px;">
          <p style="font-size:12px;font-weight:700;color:var(--gray-400);margin-bottom:8px;">PATIENT</p>
          <p><strong>${p?.name || 'Patient'}</strong></p>
          <p style="font-size:13px;color:var(--gray-600);">${p?.gender || ''} ${p?.dateOfBirth ? '| Age ' + calcAge(p.dateOfBirth) : ''}</p>
          <p style="font-size:13px;color:var(--gray-600);">${p?.phone || ''}</p>
          <p style="font-size:13px;color:var(--gray-600);">${p?.email || ''}</p>
        </div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;">
          <div style="background:var(--gray-50);border-radius:var(--radius);padding:12px;">
            <p style="font-size:11px;font-weight:700;color:var(--gray-400);">DATE</p>
            <p style="font-weight:600;">${formatDateFull(a.date)}</p>
          </div>
          <div style="background:var(--gray-50);border-radius:var(--radius);padding:12px;">
            <p style="font-size:11px;font-weight:700;color:var(--gray-400);">TIME</p>
            <p style="font-weight:600;">${a.time}</p>
          </div>
        </div>
        <div style="background:var(--gray-50);border-radius:var(--radius);padding:12px;">
          <p style="font-size:11px;font-weight:700;color:var(--gray-400);margin-bottom:4px;">REASON</p>
          <p style="font-size:13px;">${a.reason}</p>
        </div>
        <div>Status: ${statusBadge(a.status)}</div>
      </div>`;

    if (!actions) return;
    actions.innerHTML = `<button class="btn btn-secondary" onclick="document.getElementById('apptDetailModal').classList.remove('open')">Close</button>`;
    if (a.status === 'pending') {
      actions.innerHTML += `<button class="btn btn-primary" onclick="updateApptStatus('${a._id}','confirmed');document.getElementById('apptDetailModal').classList.remove('open')">
        <i class="fa-solid fa-check"></i> Confirm</button>`;
    }
    if (a.status === 'confirmed') {
      actions.innerHTML += `<button class="btn btn-success" onclick="updateApptStatus('${a._id}','completed');document.getElementById('apptDetailModal').classList.remove('open')">
        <i class="fa-solid fa-check-double"></i> Mark Completed</button>`;
    }
    if (a.status === 'completed') {
      actions.innerHTML += `<a href="/doctor/prescription?appt=${a._id}" class="btn btn-outline">
        <i class="fa-solid fa-file-prescription"></i> Write Prescription</a>`;
    }
  } catch (err) {
    content.innerHTML = '<p style="color:var(--danger);">Error loading details.</p>';
  }
}

async function updateApptStatus(id, status) {
  try {
    const res = await authFetch(`/api/appointments/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status })
    });
    const data = await res.json();
    if (res.ok) {
      showToast(`Appointment ${status}!`, 'success');
      // Refresh current page
      if (typeof loadDoctorAppointments === 'function' && document.getElementById('doctorApptsList')) {
        const activeTab = document.querySelector('.tab-btn.active')?.dataset?.tab || 'all';
        loadDoctorAppointments(activeTab, document.getElementById('dateFilter')?.value || '');
      }
      if (typeof loadDoctorDashboard === 'function' && document.getElementById('todayAppts')) {
        loadDoctorDashboard();
      }
    } else {
      showToast(data.message || 'Update failed.', 'error');
    }
  } catch (err) {
    showToast('Server error.', 'error');
  }
}

// ── Prescriptions ───────────────────────────────────────────────────────────
let currentApptId = null;
let medicineCount = 0;

async function initPrescriptionForm(apptId) {
  currentApptId = apptId;
  addMedicineRow(); // start with one row

  try {
    const res = await authFetch(`/api/appointments/${apptId}`);
    const data = await res.json();
    if (!res.ok || !data.appointment) {
      document.getElementById('patientInfoBox').innerHTML = '<p style="color:var(--danger);">Appointment not found.</p>';
      return;
    }
    const a = data.appointment;
    const p = a.patientId;
    document.getElementById('patientInfoBox').innerHTML = `
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;">
        <div><p style="font-size:11px;font-weight:700;color:var(--gray-400);">PATIENT</p>
          <p style="font-weight:600;">${p?.name || 'Patient'}</p>
          <p style="font-size:13px;color:var(--gray-500);">${p?.gender || ''} ${p?.dateOfBirth ? '| Age ' + calcAge(p.dateOfBirth) : ''}</p></div>
        <div><p style="font-size:11px;font-weight:700;color:var(--gray-400);">APPOINTMENT</p>
          <p style="font-weight:600;">${formatDateFull(a.date)}</p>
          <p style="font-size:13px;color:var(--gray-500);">${a.time} | ${statusBadge(a.status)}</p></div>
      </div>
      <p style="font-size:13px;margin-top:8px;"><strong>Reason:</strong> ${a.reason}</p>`;
  } catch (err) {
    document.getElementById('patientInfoBox').innerHTML = '<p style="color:var(--danger);">Error loading appointment.</p>';
  }
}

function addMedicineRow() {
  medicineCount++;
  const id = `med_${medicineCount}`;
  const container = document.getElementById('medicinesContainer');
  const div = document.createElement('div');
  div.className = 'medicine-entry';
  div.id = id;
  div.innerHTML = `
    <button type="button" class="remove-btn" onclick="removeMedicineRow('${id}')"><i class="fa-solid fa-xmark"></i></button>
    <p style="font-size:12px;font-weight:700;color:var(--gray-500);margin-bottom:10px;">Medicine ${medicineCount}</p>
    <div class="medicine-entry-grid">
      <div class="form-group" style="margin-bottom:0;">
        <label class="form-label">Medicine Name *</label>
        <input type="text" class="form-control med-name" placeholder="e.g. Paracetamol 500mg" />
      </div>
      <div class="form-group" style="margin-bottom:0;">
        <label class="form-label">Dosage *</label>
        <input type="text" class="form-control med-dosage" placeholder="1 Tablet" />
      </div>
      <div class="form-group" style="margin-bottom:0;">
        <label class="form-label">Frequency *</label>
        <select class="form-control med-frequency">
          <option>Once Daily</option><option>Twice Daily</option><option>Three times a day</option>
          <option>Four times a day</option><option>As needed</option><option>At bedtime</option>
        </select>
      </div>
      <div class="form-group" style="margin-bottom:0;">
        <label class="form-label">Duration *</label>
        <input type="text" class="form-control med-duration" placeholder="3 Days" />
      </div>
    </div>
    <div class="form-group" style="margin-top:10px;margin-bottom:0;">
      <label class="form-label">Instructions</label>
      <input type="text" class="form-control med-instructions" placeholder="After food, with water…" />
    </div>`;
  container.appendChild(div);
}

function removeMedicineRow(id) {
  const el = document.getElementById(id);
  if (el) el.remove();
}

async function savePrescription() {
  const alertEl = document.getElementById('prescriptionAlert');
  alertEl.innerHTML = '';
  document.getElementById('diagnosisError').textContent = '';

  const diagnosis = document.getElementById('diagnosis').value.trim();
  if (!diagnosis) {
    document.getElementById('diagnosisError').textContent = 'Diagnosis is required.';
    return;
  }

  // Collect medicines
  const medicines = [];
  document.querySelectorAll('.medicine-entry').forEach(entry => {
    const name = entry.querySelector('.med-name')?.value?.trim();
    const dosage = entry.querySelector('.med-dosage')?.value?.trim();
    const frequency = entry.querySelector('.med-frequency')?.value;
    const duration = entry.querySelector('.med-duration')?.value?.trim();
    const instructions = entry.querySelector('.med-instructions')?.value?.trim();
    if (name && dosage && duration) {
      medicines.push({ medicineName: name, dosage, frequency, duration, instructions: instructions || '' });
    }
  });

  const doctorNotes = document.getElementById('doctorNotes').value.trim();
  const followUpDate = document.getElementById('followUpDate').value || null;

  const btn = document.getElementById('savePrescriptionBtn');
  btn.disabled = true;
  document.getElementById('saveRxText').style.display = 'none';
  document.getElementById('saveRxSpinner').style.display = 'inline-block';

  try {
    const res = await authFetch('/api/prescriptions', {
      method: 'POST',
      body: JSON.stringify({ appointmentId: currentApptId, diagnosis, medicines, doctorNotes, followUpDate })
    });
    const data = await res.json();
    if (res.ok) {
      showToast('Prescription saved successfully!', 'success');
      setTimeout(() => window.location.href = '/doctor/appointments', 1500);
    } else {
      alertEl.innerHTML = `<div class="alert alert-error"><i class="fa-solid fa-circle-xmark"></i> ${data.message}</div>`;
    }
  } catch (err) {
    alertEl.innerHTML = `<div class="alert alert-error">Server error. Please try again.</div>`;
  } finally {
    btn.disabled = false;
    document.getElementById('saveRxText').style.display = 'inline';
    document.getElementById('saveRxSpinner').style.display = 'none';
  }
}

async function loadDoctorPrescriptions() {
  const el = document.getElementById('rxListContent');
  if (!el) return;
  try {
    const res = await authFetch('/api/prescriptions/doctor');
    if (!res) return;
    const data = await res.json();
    const rxs = data.prescriptions || [];
    if (!rxs.length) {
      el.innerHTML = `<div class="empty-state"><div class="empty-state-icon">💊</div>
        <h3>No prescriptions written yet</h3>
        <p>Prescriptions you write will appear here.</p>
        <a href="/doctor/appointments" class="btn btn-primary btn-sm">View Appointments</a>
      </div>`;
      return;
    }
    el.innerHTML = rxs.map(rx => `
      <div class="card" style="margin-bottom:12px;">
        <div class="card-body">
          <div style="display:flex;justify-content:space-between;align-items:flex-start;flex-wrap:wrap;gap:10px;">
            <div>
              <h3 style="margin-bottom:4px;">${rx.patientId?.name || 'Patient'}</h3>
              <p style="font-size:13px;color:var(--gray-500);margin-bottom:4px;">${formatDate(rx.createdAt)}</p>
              <p style="font-size:13px;color:var(--gray-700);"><strong>Diagnosis:</strong> ${rx.diagnosis}</p>
              <p style="font-size:12px;color:var(--gray-400);">${rx.medicines?.length || 0} medicine(s)</p>
            </div>
            <span class="badge badge-completed">Completed</span>
          </div>
        </div>
      </div>`).join('');
  } catch (err) {
    el.innerHTML = '<p style="color:var(--danger);padding:20px;">Failed to load.</p>';
  }
}

// ── Availability ────────────────────────────────────────────────────────────
let pendingSlots = [];

async function loadMyAvailability() {
  const el = document.getElementById('availabilityList');
  if (!el) return;
  el.innerHTML = `<div class="loading-overlay"><div class="spinner spinner-dark"></div></div>`;
  try {
    const res = await authFetch('/api/doctors/me/availability');
    if (!res) return;
    const data = await res.json();
    const avail = data.availability || [];
    const days = ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'];

    if (!avail.length) {
      el.innerHTML = `<div class="empty-state"><div class="empty-state-icon">📅</div>
        <h3>No availability set</h3>
        <p>Add your available days and time slots using the form.</p></div>`;
      return;
    }

    // Sort by week order
    avail.sort((a, b) => days.indexOf(a.day) - days.indexOf(b.day));

    el.innerHTML = avail.map(av => `
      <div class="avail-day-card">
        <div class="avail-day-header">
          <h4><i class="fa-solid fa-calendar-day" style="color:var(--primary);"></i> ${av.day}</h4>
          <button class="btn btn-danger btn-sm" onclick="deleteAvailDay('${av.day}')">
            <i class="fa-solid fa-trash"></i> Remove
          </button>
        </div>
        <div class="avail-day-body">
          <div class="slots-wrap">
            ${av.slots.map(s => `
              <span class="slot-chip ${s.isBooked ? 'booked' : ''}">
                <i class="fa-solid fa-clock"></i> ${s.time}
                ${s.isBooked ? '<small>(Booked)</small>' : ''}
              </span>`).join('')}
          </div>
          ${!av.slots.length ? '<p style="font-size:13px;color:var(--gray-400);">No slots added.</p>' : ''}
        </div>
      </div>`).join('');
  } catch (err) {
    el.innerHTML = '<p style="color:var(--danger);padding:20px;">Failed to load availability.</p>';
  }
}

function addSlot() {
  const input = document.getElementById('slotInput');
  const time24 = input.value;
  if (!time24) { showToast('Select a time first.', 'warning'); return; }

  const formatted = formatTime24to12(time24);
  if (pendingSlots.includes(formatted)) { showToast('Slot already added.', 'warning'); return; }
  pendingSlots.push(formatted);
  renderPendingSlots();
  input.value = '';
}

function addPreset(type) {
  const presets = {
    morning: ['09:00 AM','09:30 AM','10:00 AM','10:30 AM','11:00 AM','11:30 AM'],
    afternoon: ['02:00 PM','02:30 PM','03:00 PM','03:30 PM','04:00 PM','04:30 PM'],
    evening: ['05:00 PM','05:30 PM','06:00 PM','06:30 PM','07:00 PM','07:30 PM']
  };
  const slots = presets[type] || [];
  slots.forEach(s => { if (!pendingSlots.includes(s)) pendingSlots.push(s); });
  renderPendingSlots();
}

function removeSlot(time) {
  pendingSlots = pendingSlots.filter(s => s !== time);
  renderPendingSlots();
}

function renderPendingSlots() {
  const el = document.getElementById('pendingSlots');
  if (!el) return;
  el.innerHTML = pendingSlots.map(s => `
    <span class="slot-chip">
      ${s}
      <button class="slot-remove" type="button" onclick="removeSlot('${s}')">×</button>
    </span>`).join('');
}

function formatTime24to12(t) {
  if (!t) return '';
  const [hStr, mStr] = t.split(':');
  let h = parseInt(hStr, 10);
  const m = mStr || '00';
  const ampm = h >= 12 ? 'PM' : 'AM';
  h = h % 12 || 12;
  return `${h.toString().padStart(2,'0')}:${m} ${ampm}`;
}

async function saveAvailability() {
  const day = document.getElementById('availDay').value;
  const alertEl = document.getElementById('availAlert');
  alertEl.innerHTML = '';

  if (!day) { alertEl.innerHTML = `<div class="alert alert-error">Select a day.</div>`; return; }
  if (!pendingSlots.length) { alertEl.innerHTML = `<div class="alert alert-error">Add at least one time slot.</div>`; return; }

  const btn = document.getElementById('saveAvailBtn');
  btn.disabled = true;
  document.getElementById('saveAvailText').style.display = 'none';
  document.getElementById('saveAvailSpinner').style.display = 'inline-block';

  try {
    const res = await authFetch('/api/doctors/me/availability', {
      method: 'POST',
      body: JSON.stringify({ day, slots: pendingSlots })
    });
    const data = await res.json();
    if (res.ok) {
      showToast(`Availability for ${day} saved!`, 'success');
      pendingSlots = [];
      renderPendingSlots();
      document.getElementById('availDay').value = '';
      loadMyAvailability();
    } else {
      alertEl.innerHTML = `<div class="alert alert-error">${data.message}</div>`;
    }
  } catch (err) {
    alertEl.innerHTML = `<div class="alert alert-error">Server error.</div>`;
  } finally {
    btn.disabled = false;
    document.getElementById('saveAvailText').style.display = 'inline';
    document.getElementById('saveAvailSpinner').style.display = 'none';
  }
}

async function deleteAvailDay(day) {
  if (!confirm(`Remove all slots for ${day}?`)) return;
  try {
    const res = await authFetch(`/api/doctors/me/availability/${day}`, { method: 'DELETE' });
    if (res.ok) {
      showToast(`${day} availability removed.`, 'success');
      loadMyAvailability();
    }
  } catch (err) {
    showToast('Failed to delete.', 'error');
  }
}

// ── Patients ────────────────────────────────────────────────────────────────
async function loadMyPatients() {
  const el = document.getElementById('patientsList');
  if (!el) return;
  try {
    const res = await authFetch('/api/doctors/me/patients');
    if (!res) return;
    const data = await res.json();
    const patients = data.patients || [];

    if (!patients.length) {
      el.innerHTML = `<div class="empty-state"><div class="empty-state-icon">👥</div>
        <h3>No patients yet</h3>
        <p>Patients who book appointments with you will appear here.</p></div>`;
      return;
    }

    el.innerHTML = `<div class="table-wrap"><table>
      <thead><tr><th>Name</th><th>Gender</th><th>Age</th><th>Phone</th><th>Email</th><th>Last Visit</th></tr></thead>
      <tbody>${patients.map(p => `<tr>
        <td><strong>${p.name}</strong></td>
        <td>${p.gender ? p.gender.charAt(0).toUpperCase() + p.gender.slice(1) : '—'}</td>
        <td>${p.dateOfBirth ? calcAge(p.dateOfBirth) + ' yrs' : '—'}</td>
        <td>${p.phone || '—'}</td>
        <td>${p.email || '—'}</td>
        <td>${formatDate(p.lastAppointment)}</td>
      </tr>`).join('')}</tbody>
    </table></div>`;
  } catch (err) {
    el.innerHTML = '<p style="color:var(--danger);padding:20px;">Failed to load patients.</p>';
  }
}

// ── Doctor Profile ──────────────────────────────────────────────────────────
async function loadDoctorProfile() {
  try {
    const res = await authFetch('/api/auth/me');
    if (!res) return;
    const data = await res.json();
    const u = data.user;
    const d = data.doctorProfile;

    if (document.getElementById('phone')) document.getElementById('phone').value = u.phone || '';
    if (d) {
      if (document.getElementById('specialization')) document.getElementById('specialization').value = d.specialization || '';
      if (document.getElementById('qualification')) document.getElementById('qualification').value = d.qualification || '';
      if (document.getElementById('experience')) document.getElementById('experience').value = d.experience || '';
      if (document.getElementById('consultationFee')) document.getElementById('consultationFee').value = d.consultationFee || '';
      if (document.getElementById('clinicName')) document.getElementById('clinicName').value = d.clinicName || '';
      if (document.getElementById('about')) document.getElementById('about').value = d.about || '';
    }
  } catch (err) { console.error(err); }
}

async function saveDoctorProfile() {
  const alertEl = document.getElementById('docProfileAlert');
  if (alertEl) alertEl.innerHTML = '';
  try {
    const body = {
      phone: document.getElementById('phone')?.value?.trim(),
      specialization: document.getElementById('specialization')?.value,
      qualification: document.getElementById('qualification')?.value?.trim(),
      experience: document.getElementById('experience')?.value,
      consultationFee: document.getElementById('consultationFee')?.value,
      clinicName: document.getElementById('clinicName')?.value?.trim(),
      about: document.getElementById('about')?.value?.trim()
    };
    const res = await authFetch('/api/doctors/me/profile', { method: 'PUT', body: JSON.stringify(body) });
    const data = await res.json();
    if (res.ok) {
      showToast('Profile updated!', 'success');
      if (alertEl) alertEl.innerHTML = `<div class="alert alert-success">Profile saved.</div>`;
    } else {
      if (alertEl) alertEl.innerHTML = `<div class="alert alert-error">${data.message}</div>`;
    }
  } catch (err) {
    if (alertEl) alertEl.innerHTML = `<div class="alert alert-error">Server error.</div>`;
  }
}

async function changeDoctorPassword() {
  const alertEl = document.getElementById('pwdAlert');
  if (alertEl) alertEl.innerHTML = '';
  const cur = document.getElementById('currentPwd')?.value;
  const nw = document.getElementById('newPwd')?.value;
  const conf = document.getElementById('confirmPwd')?.value;
  if (!cur || !nw) { if (alertEl) alertEl.innerHTML = `<div class="alert alert-error">All fields required.</div>`; return; }
  if (nw.length < 6) { if (alertEl) alertEl.innerHTML = `<div class="alert alert-error">Min 6 characters.</div>`; return; }
  if (nw !== conf) { if (alertEl) alertEl.innerHTML = `<div class="alert alert-error">Passwords don't match.</div>`; return; }
  try {
    const res = await authFetch('/api/auth/change-password', { method: 'PUT', body: JSON.stringify({ currentPassword: cur, newPassword: nw }) });
    const data = await res.json();
    if (res.ok) {
      showToast('Password updated!', 'success');
      if (alertEl) alertEl.innerHTML = `<div class="alert alert-success">Password changed.</div>`;
    } else {
      if (alertEl) alertEl.innerHTML = `<div class="alert alert-error">${data.message}</div>`;
    }
  } catch (err) {
    if (alertEl) alertEl.innerHTML = `<div class="alert alert-error">Server error.</div>`;
  }
}
