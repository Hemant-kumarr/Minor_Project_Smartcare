/* =============================================
   SmartCare AI – Patient JS
   ============================================= */

// ── Dashboard ──────────────────────────────────────────────────────────────
async function loadPatientDashboard() {
  try {
    const res = await authFetch('/api/appointments/patient/stats');
    if (!res) return;
    const data = await res.json();
    if (!data.success) return;

    const s = data.stats;
    document.getElementById('statUpcoming').textContent = s.upcoming;
    document.getElementById('statCompleted').textContent = s.completed;
    document.getElementById('statPrescriptions').textContent = s.prescriptions;
    document.getElementById('statTotal').textContent = s.totalConsultations;

    // Next appointment
    const nextEl = document.getElementById('nextApptContent');
    if (data.nextAppointment) {
      const a = data.nextAppointment;
      nextEl.innerHTML = `
        <div class="appt-doctor-info">
          <div class="appt-doc-avatar">${a.profileImage
            ? `<img src="${a.profileImage}" alt="Dr">`
            : '🩺'}</div>
          <div>
            <div class="appt-doc-name">Dr. ${a.doctorName || 'Doctor'}</div>
            <div class="appt-doc-spec">${a.specialization || ''}</div>
          </div>
        </div>
        <div class="appt-details">
          <div class="appt-detail-row"><i class="fa-solid fa-calendar"></i> ${formatDateFull(a.date)}</div>
          <div class="appt-detail-row"><i class="fa-solid fa-clock"></i> ${a.time}</div>
          <div class="appt-detail-row"><i class="fa-solid fa-circle-dot"></i> ${statusBadge(a.status)}</div>
        </div>
        <div style="margin-top:14px;">
          <a href="/patient/appointments" class="btn btn-primary btn-sm btn-block">View Appointments</a>
        </div>`;
    } else {
      nextEl.innerHTML = `
        <div class="empty-state" style="padding:30px 16px;">
          <div class="empty-state-icon">📅</div>
          <h3>No upcoming appointments</h3>
          <p>You don't have any scheduled appointments.</p>
          <a href="/patient/doctors" class="btn btn-primary btn-sm">Find a Doctor</a>
        </div>`;
    }

    loadRecentAppointments();
  } catch (err) {
    console.error('Dashboard load error:', err);
  }
}

async function loadRecentAppointments() {
  const el = document.getElementById('recentAppts');
  if (!el) return;
  try {
    const res = await authFetch('/api/appointments/patient');
    if (!res) return;
    const data = await res.json();
    const appts = (data.appointments || []).slice(0, 5);

    if (!appts.length) {
      el.innerHTML = `<div class="empty-state"><div class="empty-state-icon">📅</div>
        <h3>No appointments yet</h3><p>You haven't booked any appointments.</p>
        <a href="/patient/doctors" class="btn btn-primary btn-sm">Find a Doctor</a></div>`;
      return;
    }

    el.innerHTML = appts.map(a => `
      <div class="appt-item">
        <div class="appt-time-block">
          <div class="time">${a.time}</div>
          <div class="date-sm">${formatDate(a.date)}</div>
        </div>
        <div class="appt-info">
          <h4>Dr. ${a.doctorName || 'Doctor'}</h4>
          <p>${a.specialization || ''} &bull; ${a.reason?.substring(0, 40) || ''}</p>
        </div>
        <div class="appt-actions">${statusBadge(a.status)}</div>
      </div>`).join('');
  } catch (err) {
    el.innerHTML = `<p style="color:var(--danger);font-size:14px;">Failed to load appointments.</p>`;
  }
}

// ── Doctor Listing ──────────────────────────────────────────────────────────
async function loadDoctors(spec = '', search = '') {
  const grid = document.getElementById('doctorsGrid');
  const countEl = document.getElementById('doctorCount');
  if (!grid) return;

  grid.innerHTML = `<div style="grid-column:1/-1;" class="loading-overlay">
    <div class="spinner spinner-dark"></div><p>Loading doctors…</p></div>`;

  try {
    let url = '/api/doctors?';
    if (spec) url += `specialization=${encodeURIComponent(spec)}&`;
    if (search) url += `search=${encodeURIComponent(search)}`;

    const token = getToken();
    const headers = token ? { Authorization: `Bearer ${token}` } : {};
    const res = await fetch(url, { headers });
    const data = await res.json();
    const doctors = data.doctors || [];

    if (countEl) countEl.textContent = `${doctors.length} doctor${doctors.length !== 1 ? 's' : ''} found`;

    if (!doctors.length) {
      grid.innerHTML = `<div style="grid-column:1/-1;">
        <div class="empty-state"><div class="empty-state-icon">🔍</div>
          <h3>No doctors found</h3>
          <p>No doctors match your search. Try different filters.</p></div></div>`;
      return;
    }

    grid.innerHTML = doctors.map(d => buildDoctorCard(d)).join('');
  } catch (err) {
    grid.innerHTML = `<div style="grid-column:1/-1;text-align:center;padding:40px;color:var(--danger);">
      Failed to load doctors. Please try again.</div>`;
  }
}

function buildDoctorCard(d) {
  const avatarContent = d.profileImage
    ? `<img src="${d.profileImage}" alt="${d.name}" style="width:100%;height:100%;object-fit:cover;">`
    : '🩺';
  const stars = '★'.repeat(Math.round(d.rating || 4)) + '☆'.repeat(5 - Math.round(d.rating || 4));
  const isLoggedIn = !!getToken();
  const bookBtn = isLoggedIn
    ? `<a href="/patient/doctor-profile?id=${d.id}" class="btn btn-primary btn-sm" style="flex:1;">Book Appointment</a>`
    : `<a href="/login" class="btn btn-primary btn-sm" style="flex:1;">Login to Book</a>`;

  return `
    <div class="doctor-card">
      <div class="doctor-card-img">${avatarContent}</div>
      <div class="doctor-card-body">
        <h3>Dr. ${d.name || ''}</h3>
        <div class="doctor-specialization">${d.specialization || ''}</div>
        <div class="doctor-meta">
          <div class="doctor-meta-item"><i class="fa-solid fa-graduation-cap"></i> ${d.qualification || ''}</div>
          <div class="doctor-meta-item"><i class="fa-solid fa-briefcase-medical"></i> ${d.experience} years experience</div>
          ${d.clinicName ? `<div class="doctor-meta-item"><i class="fa-solid fa-hospital"></i> ${d.clinicName}</div>` : ''}
        </div>
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:14px;">
          <div class="doctor-fee">₹${d.consultationFee}</div>
          <div class="doctor-rating">${stars} <span style="color:var(--gray-500);font-weight:400;">(${d.totalReviews || 0})</span></div>
        </div>
        <div class="doctor-card-actions">
          <a href="/patient/doctor-profile?id=${d.id}" class="btn btn-outline btn-sm" style="flex:1;">View Profile</a>
          ${bookBtn}
        </div>
      </div>
    </div>`;
}

// ── Doctor Profile & Booking ────────────────────────────────────────────────
let currentDoctorId = null;

async function loadDoctorProfile(doctorId) {
  currentDoctorId = doctorId;
  const el = document.getElementById('profileContent');

  try {
    const res = await fetch(`/api/doctors/${doctorId}`);
    const data = await res.json();
    if (!res.ok || !data.doctor) {
      el.innerHTML = `<div class="empty-state"><div class="empty-state-icon">⚠️</div>
        <h3>Doctor not found</h3><a href="/patient/doctors" class="btn btn-primary">Back to Doctors</a></div>`;
      return;
    }

    const d = data.doctor;
    const stars = '★'.repeat(Math.round(d.rating || 4)) + '☆'.repeat(5 - Math.round(d.rating || 4));

    el.innerHTML = `
      <div style="display:grid;grid-template-columns:1fr 340px;gap:24px;align-items:start;">
        <!-- Left: Doctor Info -->
        <div>
          <div class="card" style="margin-bottom:20px;">
            <div class="card-body">
              <div style="display:flex;gap:20px;align-items:flex-start;flex-wrap:wrap;">
                <div style="width:100px;height:100px;border-radius:16px;background:var(--primary-light);
                  display:flex;align-items:center;justify-content:center;font-size:48px;overflow:hidden;flex-shrink:0;">
                  ${d.profileImage ? `<img src="${d.profileImage}" style="width:100%;height:100%;object-fit:cover;">` : '🩺'}
                </div>
                <div style="flex:1;">
                  <h2 style="margin-bottom:4px;">Dr. ${d.name}</h2>
                  <p style="color:var(--primary);font-weight:600;margin-bottom:6px;">${d.specialization}</p>
                  <p style="font-size:13px;color:var(--gray-500);margin-bottom:8px;">${d.qualification}</p>
                  <div style="display:flex;gap:16px;flex-wrap:wrap;">
                    <span style="font-size:13px;color:var(--gray-600);"><i class="fa-solid fa-briefcase-medical" style="color:var(--primary);"></i> ${d.experience} yrs exp</span>
                    <span style="font-size:13px;color:var(--gray-600);"><i class="fa-solid fa-star" style="color:var(--warning);"></i> ${d.rating} ${stars}</span>
                    <span style="font-size:13px;color:var(--gray-600);"><i class="fa-solid fa-indian-rupee-sign" style="color:var(--accent);"></i> ₹${d.consultationFee} fee</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          ${d.about ? `<div class="card" style="margin-bottom:20px;">
            <div class="card-header"><h3>About</h3></div>
            <div class="card-body"><p>${d.about}</p></div>
          </div>` : ''}

          <div class="card">
            <div class="card-header"><h3>Details</h3></div>
            <div class="card-body">
              <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;">
                <div><p style="font-size:12px;color:var(--gray-400);margin-bottom:2px;">Registration No.</p>
                  <p style="font-weight:600;">${d.medicalRegistrationNumber}</p></div>
                ${d.clinicName ? `<div><p style="font-size:12px;color:var(--gray-400);margin-bottom:2px;">Clinic/Hospital</p>
                  <p style="font-weight:600;">${d.clinicName}</p></div>` : ''}
                <div><p style="font-size:12px;color:var(--gray-400);margin-bottom:2px;">Consultation Fee</p>
                  <p style="font-weight:600;color:var(--accent);">₹${d.consultationFee}</p></div>
                <div><p style="font-size:12px;color:var(--gray-400);margin-bottom:2px;">Experience</p>
                  <p style="font-weight:600;">${d.experience} years</p></div>
              </div>
            </div>
          </div>
        </div>

        <!-- Right: Availability + Book -->
        <div>
          <div class="card" style="margin-bottom:20px;">
            <div class="card-header"><h3>Availability</h3></div>
            <div class="card-body" style="padding:16px;">
              ${d.availability && d.availability.length
                ? d.availability.map(av => `
                  <div style="margin-bottom:10px;">
                    <p style="font-weight:600;font-size:13px;margin-bottom:6px;">${av.day}</p>
                    <div style="display:flex;flex-wrap:wrap;gap:6px;">
                      ${av.slots.map(s => `<span style="padding:4px 10px;border-radius:20px;font-size:11px;font-weight:600;
                        background:var(--primary-light);color:var(--primary);">${s.time}</span>`).join('')}
                    </div>
                  </div>`).join('')
                : '<p style="font-size:13px;color:var(--gray-500);">No availability set.</p>'}
            </div>
          </div>
          <button class="btn btn-primary btn-block btn-lg" onclick="openBookingModal('${d.id}', 'Dr. ${d.name}')">
            <i class="fa-solid fa-calendar-plus"></i> Book Appointment
          </button>
        </div>
      </div>`;
  } catch (err) {
    el.innerHTML = `<div class="empty-state"><div class="empty-state-icon">⚠️</div>
      <h3>Failed to load profile</h3><a href="/patient/doctors" class="btn btn-primary">Back</a></div>`;
  }
}

// ── Booking Modal ───────────────────────────────────────────────────────────
let selectedBookingDoctorId = null;
let selectedBookingDoctorName = null;

function openBookingModal(doctorId, doctorName) {
  selectedBookingDoctorId = doctorId;
  selectedBookingDoctorName = doctorName;
  document.getElementById('bookingModal').classList.add('open');
  document.getElementById('bookingAlert').innerHTML = '';
  document.getElementById('reason').value = '';
  document.getElementById('selectedSlot').value = '';
  document.getElementById('slotsContainer').innerHTML = '<p style="color:var(--gray-400);font-size:13px;">Select a date first</p>';
  document.getElementById('bookingConfirm').style.display = 'none';

  // Set min date to today
  const today = new Date().toISOString().split('T')[0];
  document.getElementById('appointmentDate').min = today;
  document.getElementById('appointmentDate').value = '';
  document.getElementById('appointmentDate').onchange = () => loadSlotsForDate(doctorId);
}

function closeBookingModal() {
  document.getElementById('bookingModal').classList.remove('open');
}

async function loadSlotsForDate(doctorId) {
  const date = document.getElementById('appointmentDate').value;
  if (!date) return;

  const container = document.getElementById('slotsContainer');
  container.innerHTML = '<div class="spinner spinner-dark"></div>';

  try {
    const res = await fetch(`/api/doctors/${doctorId}/slots?date=${date}`);
    const data = await res.json();

    if (!data.slots || !data.slots.length) {
      container.innerHTML = '<p style="color:var(--gray-500);font-size:13px;">No slots available for this day.</p>';
      return;
    }

    container.innerHTML = data.slots.map(s => {
      if (s.isBooked) {
        return `<span style="padding:7px 14px;border-radius:20px;font-size:12px;font-weight:600;
          background:var(--gray-100);color:var(--gray-400);cursor:not-allowed;">${s.time}</span>`;
      }
      return `<button type="button" class="slot-btn" data-time="${s.time}"
        style="padding:7px 14px;border-radius:20px;font-size:12px;font-weight:600;
        background:var(--primary-light);color:var(--primary);border:1.5px solid transparent;cursor:pointer;"
        onclick="selectSlot(this, '${s.time}')">${s.time}</button>`;
    }).join('');
  } catch (err) {
    container.innerHTML = '<p style="color:var(--danger);font-size:13px;">Failed to load slots.</p>';
  }
}

function selectSlot(btn, time) {
  document.querySelectorAll('.slot-btn').forEach(b => {
    b.style.background = 'var(--primary-light)';
    b.style.borderColor = 'transparent';
    b.style.color = 'var(--primary)';
  });
  btn.style.background = 'var(--primary)';
  btn.style.color = 'white';
  btn.style.borderColor = 'var(--primary)';
  document.getElementById('selectedSlot').value = time;

  const date = document.getElementById('appointmentDate').value;
  const confirmEl = document.getElementById('bookingConfirm');
  confirmEl.style.display = 'block';
  document.getElementById('confirmText').textContent =
    `${selectedBookingDoctorName} on ${formatDateFull(date)} at ${time}`;
}

async function confirmBooking() {
  const date = document.getElementById('appointmentDate').value;
  const time = document.getElementById('selectedSlot').value;
  const reason = document.getElementById('reason').value.trim();
  const alertEl = document.getElementById('bookingAlert');
  alertEl.innerHTML = '';
  document.getElementById('reasonError').textContent = '';

  if (!date) { alertEl.innerHTML = `<div class="alert alert-error">Please select a date.</div>`; return; }
  if (!time) { alertEl.innerHTML = `<div class="alert alert-error">Please select a time slot.</div>`; return; }
  if (!reason) { document.getElementById('reasonError').textContent = 'Reason is required.'; return; }

  const btn = document.getElementById('bookBtn');
  btn.disabled = true;
  document.getElementById('bookBtnText').style.display = 'none';
  document.getElementById('bookSpinner').style.display = 'inline-block';

  try {
    const res = await authFetch('/api/appointments', {
      method: 'POST',
      body: JSON.stringify({ doctorId: selectedBookingDoctorId, date, time, reason })
    });
    const data = await res.json();

    if (!res.ok) {
      alertEl.innerHTML = `<div class="alert alert-error"><i class="fa-solid fa-circle-xmark"></i> ${data.message}</div>`;
      return;
    }

    closeBookingModal();
    showToast('Appointment booked successfully! 🎉', 'success', 4000);
    setTimeout(() => window.location.href = '/patient/appointments', 1200);
  } catch (err) {
    alertEl.innerHTML = `<div class="alert alert-error">Server error. Please try again.</div>`;
  } finally {
    btn.disabled = false;
    document.getElementById('bookBtnText').style.display = 'inline';
    document.getElementById('bookSpinner').style.display = 'none';
  }
}
