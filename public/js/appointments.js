/* =============================================
   SmartCare AI – Appointments JS (Patient)
   ============================================= */

let cancelTargetId = null;

async function loadPatientAppointments(filter = 'all') {
  const el = document.getElementById('appointmentsList');
  if (!el) return;
  el.innerHTML = `<div class="loading-overlay"><div class="spinner spinner-dark"></div><p>Loading…</p></div>`;

  try {
    let url = '/api/appointments/patient';
    const today = new Date().toISOString().split('T')[0];
    const res = await authFetch(url);
    if (!res) return;
    const data = await res.json();
    let appts = data.appointments || [];

    // Client-side filter
    if (filter === 'upcoming') {
      appts = appts.filter(a => ['pending','confirmed'].includes(a.status) && a.date >= today);
    } else if (filter === 'completed') {
      appts = appts.filter(a => a.status === 'completed');
    } else if (filter === 'cancelled') {
      appts = appts.filter(a => a.status === 'cancelled');
    }

    if (!appts.length) {
      el.innerHTML = `<div class="empty-state">
        <div class="empty-state-icon">📅</div>
        <h3>No ${filter === 'all' ? '' : filter} appointments</h3>
        <p>You don't have any ${filter === 'all' ? '' : filter} appointments.</p>
        <a href="/patient/doctors" class="btn btn-primary btn-sm">Find a Doctor</a>
      </div>`;
      return;
    }

    el.innerHTML = appts.map(a => buildPatientApptCard(a)).join('');
  } catch (err) {
    el.innerHTML = `<p style="color:var(--danger);padding:20px;">Failed to load appointments.</p>`;
  }
}

function buildPatientApptCard(a) {
  const canCancel = ['pending','confirmed'].includes(a.status);
  const today = new Date().toISOString().split('T')[0];
  const isFuture = a.date >= today;

  return `
  <div class="card" style="margin-bottom:14px;">
    <div class="card-body">
      <div style="display:flex;align-items:flex-start;gap:16px;flex-wrap:wrap;">
        <div style="width:52px;height:52px;border-radius:12px;background:var(--primary-light);
          display:flex;align-items:center;justify-content:center;font-size:24px;flex-shrink:0;">
          ${a.profileImage ? `<img src="${a.profileImage}" style="width:100%;height:100%;object-fit:cover;border-radius:12px;">` : '🩺'}
        </div>
        <div style="flex:1;min-width:0;">
          <div style="display:flex;align-items:center;gap:10px;flex-wrap:wrap;margin-bottom:4px;">
            <h3 style="font-size:15px;">Dr. ${a.doctorName || 'Doctor'}</h3>
            ${statusBadge(a.status)}
          </div>
          <p style="font-size:13px;color:var(--primary);font-weight:600;margin-bottom:6px;">${a.specialization || ''}</p>
          <div style="display:flex;gap:16px;flex-wrap:wrap;">
            <span style="font-size:13px;color:var(--gray-600);"><i class="fa-solid fa-calendar" style="color:var(--primary);"></i> ${formatDateFull(a.date)}</span>
            <span style="font-size:13px;color:var(--gray-600);"><i class="fa-solid fa-clock" style="color:var(--primary);"></i> ${a.time}</span>
          </div>
          <p style="font-size:13px;color:var(--gray-500);margin-top:6px;"><strong>Reason:</strong> ${a.reason || '—'}</p>
        </div>
        <div style="display:flex;flex-direction:column;gap:8px;align-items:flex-end;flex-shrink:0;">
          ${a.status === 'completed' ? `<a href="/patient/prescriptions" class="btn btn-success btn-sm"><i class="fa-solid fa-file-medical"></i> View Prescription</a>` : ''}
          ${canCancel && isFuture ? `<button class="btn btn-danger btn-sm" onclick="initCancelAppt('${a.id}')">
            <i class="fa-solid fa-xmark"></i> Cancel</button>` : ''}
        </div>
      </div>
    </div>
  </div>`;
}

function initCancelAppt(id) {
  cancelTargetId = id;
  document.getElementById('cancelReason').value = '';
  document.getElementById('cancelModal').classList.add('open');

  document.getElementById('confirmCancelBtn').onclick = async () => {
    const reason = document.getElementById('cancelReason').value.trim();
    document.getElementById('cancelModal').classList.remove('open');
    await cancelAppointment(cancelTargetId, reason);
  };
}

async function cancelAppointment(id, reason) {
  try {
    const res = await authFetch(`/api/appointments/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status: 'cancelled', cancellationReason: reason || '' })
    });
    const data = await res.json();
    if (res.ok) {
      showToast('Appointment cancelled.', 'success');
      // Reload current active tab
      const activeTab = document.querySelector('.tab-btn.active')?.dataset?.tab || 'all';
      loadPatientAppointments(activeTab);
    } else {
      showToast(data.message || 'Failed to cancel.', 'error');
    }
  } catch (err) {
    showToast('Server error. Please try again.', 'error');
  }
}
