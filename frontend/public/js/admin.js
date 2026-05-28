/**
 * MediLink Hospital Admin Portal Scripts
 */

document.addEventListener('DOMContentLoaded', async () => {
  // 1. Verify Authentication & Role
  const user = await getProfile();
  if (!user || user.role !== 'admin') {
    // Redirect to login if unauthorized
    window.location.href = '/login';
    return;
  }

  // Set Profile header
  const adminHeaderProfile = document.getElementById('adminHeaderProfile');
  if (adminHeaderProfile) {
    adminHeaderProfile.innerHTML = `
      <div style="display: flex; align-items: center; gap: 12px;">
        <span style="font-size: 14px; font-weight: 600; color: var(--gray-700);">Admin: ${user.name}</span>
        <div class="review-user-avatar" style="background: var(--primary-bg); color: var(--primary);">
          AD
        </div>
      </div>
    `;
  }

  // Set date title dynamically
  const adminDateHeader = document.getElementById('adminDateHeader');
  if (adminDateHeader) {
    const today = new Date();
    const dateFormatted = today.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' });
    adminDateHeader.textContent = `Today, ${dateFormatted}`;
  }

  // Admin state
  let adminHospital = null;

  // Selected UI targets
  const sidebarHospitalName = document.getElementById('sidebarHospitalName');
  const sidebarHospitalAddress = document.getElementById('sidebarHospitalAddress');
  const adminBookingsFeed = document.getElementById('adminBookingsFeed');
  const adminServicesListContainer = document.getElementById('adminServicesListContainer');
  const onCallStaffList = document.getElementById('onCallStaffList');
  const adminAlertBox = document.getElementById('adminAlertBox');

  // Stats boxes
  const statBookingsCount = document.getElementById('statBookingsCount');
  const statRevenueVal = document.getElementById('statRevenueVal');

  // ----------------------------------------------------
  // 2. Fetch Admin Hospital Profile & Bookings Feed
  // ----------------------------------------------------
  async function loadAdminDashboard() {
    try {
      // Step A: Load hospital profile
      const hospRes = await fetch('/api/hospitals/admin-hospital');
      const hospData = await hospRes.ok ? await hospRes.json() : null;

      if (!hospRes.ok || !hospData) {
        throw new Error(hospData ? hospData.error : 'Failed to retrieve admin hospital profile');
      }

      adminHospital = hospData.hospital;

      // Fill info panels
      sidebarHospitalName.textContent = adminHospital.name;
      sidebarHospitalAddress.textContent = adminHospital.address;

      // Populate On-Call Staff
      renderOnCallStaff(adminHospital.onCallStaff || []);

      // Populate Services editor panel
      renderServicesEditor(adminHospital.services || []);

      // Step B: Load real-time bookings
      const bookingsRes = await fetch(`/api/bookings/hospital/${adminHospital.id}`);
      const bookingsData = await bookingsRes.json();

      if (!bookingsRes.ok) {
        throw new Error(bookingsData.error || 'Failed to load bookings feed');
      }

      // Filter: Confirmed Only
      const confirmedBookings = bookingsData.bookings.filter(b => b.paymentStatus === 'Confirmed');

      // Populate Live table
      renderBookingsFeed(confirmedBookings);

      // Compute & Render stats dynamically
      computeStats(confirmedBookings, adminHospital.services);

    } catch (error) {
      console.error(error);
      displayAdminAlert(error.message, 'danger');
    }
  }

  // ----------------------------------------------------
  // 3. Compute Metrics Dynamically
  // ----------------------------------------------------
  function computeStats(bookings, services) {
    // Count today's bookings
    const todayStr = new Date().toISOString().split('T')[0];
    const todayBookings = bookings.filter(b => b.date === todayStr);
    
    // In our prototype, count all confirmed bookings as today's volume for presentation
    const bookingVolume = bookings.length;
    statBookingsCount.textContent = bookingVolume;

    // Calculate revenue based on service pricing
    let totalRevenue = 0;
    bookings.forEach(b => {
      // Find matching service price
      const match = services.find(s => s.name.toLowerCase() === b.service.toLowerCase().trim());
      if (match) {
        totalRevenue += match.price;
      } else {
        totalRevenue += 1000; // default consultation fallback
      }
    });

    // Format revenue in Lakh format (₹1,24,500)
    statRevenueVal.textContent = `₹${totalRevenue.toLocaleString('en-IN')}`;
  }

  // ----------------------------------------------------
  // 4. Render incoming bookings feed list
  // ----------------------------------------------------
  function renderBookingsFeed(bookings) {
    if (!adminBookingsFeed) return;

    if (bookings.length === 0) {
      adminBookingsFeed.innerHTML = `
        <tr>
          <td colspan="4" style="text-align: center; color: var(--gray-400); padding: 40px 0;">No active bookings found for this clinic today.</td>
        </tr>
      `;
      return;
    }

    let html = '';
    bookings.forEach(b => {
      const initials = b.patientName.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
      
      // format date and time
      const dateObj = new Date(b.date);
      const dayFormatted = dateObj.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
      const timeFormatted = b.timeSlot;

      html += `
        <tr>
          <td>
            <div style="display: flex; align-items: center; gap: 12px;">
              <div class="review-user-avatar" style="width: 32px; height: 32px; background: var(--primary-bg); color: var(--primary); font-size: 12px; font-weight: 700;">
                ${initials}
              </div>
              <span style="font-weight: 600; color: var(--gray-800);">${b.patientName}</span>
            </div>
          </td>
          <td>
            <span class="status-pill" style="background: var(--accent-light); color: var(--accent); padding: 4px 10px;">${b.service}</span>
          </td>
          <td>
            <div style="font-weight: 500; color: var(--gray-800);">${timeFormatted}</div>
            <div style="font-size: 11px; color: var(--gray-400);">Today, ${dayFormatted}</div>
          </td>
          <td>
            <span class="status-pill confirmed">
              <i data-lucide="check-circle-2" style="width: 12px;"></i> Confirmed (₹1)
            </span>
          </td>
        </tr>
      `;
    });

    adminBookingsFeed.innerHTML = html;
    if (window.lucide) window.lucide.createIcons();
  }

  // ----------------------------------------------------
  // 5. Render Services Editor Panel
  // ----------------------------------------------------
  function renderServicesEditor(services) {
    if (!adminServicesListContainer) return;

    let html = '';
    services.forEach((s, idx) => {
      // Mock descriptive label
      const desc = s.name === 'General Consultation' ? 'Avg. Duration: 20 mins' : 
                   (s.name === 'Cardiology Consultation' ? 'Super-Specialty' : 'Avg. Duration: 30-45 mins');

      html += `
        <div class="admin-service-row">
          <div class="admin-service-info">
            <div class="admin-service-name">${s.name}</div>
            <div class="admin-service-desc">${desc}</div>
          </div>
          
          <div class="admin-service-actions">
            <!-- Price Input -->
            <div class="admin-price-input-group">
              <span>₹</span>
              <input type="number" class="admin-price-input service-price-field" data-service="${s.name}" value="${s.price}">
            </div>

            <!-- Active Slider Switch -->
            <label class="switch">
              <input type="checkbox" class="service-active-toggle" data-service="${s.name}" ${s.active ? 'checked' : ''}>
              <span class="slider"></span>
            </label>
          </div>
        </div>
      `;
    });

    adminServicesListContainer.innerHTML = html;
  }

  // Handle updates submission
  const adminServicesForm = document.getElementById('adminServicesForm');
  if (adminServicesForm) {
    adminServicesForm.addEventListener('submit', async (e) => {
      e.preventDefault();

      const priceFields = adminServicesForm.querySelectorAll('.service-price-field');
      const activeToggles = adminServicesForm.querySelectorAll('.service-active-toggle');
      
      const updatePromises = [];

      // Collect data and trigger PUT requests for each row
      priceFields.forEach((field, idx) => {
        const sName = field.getAttribute('data-service');
        const priceVal = Number(field.value);
        const activeVal = activeToggles[idx].checked;

        updatePromises.push(
          fetch(`/api/hospitals/${adminHospital.id}/service`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              serviceName: sName,
              price: priceVal,
              active: activeVal
            })
          })
        );
      });

      try {
        const results = await Promise.all(updatePromises);
        const failed = results.filter(r => !r.ok);

        if (failed.length > 0) {
          throw new Error('Some services failed to update. Please review inputs.');
        }

        displayAdminAlert('All services settings updated successfully!', 'success');
        
        // Reload dashboard stats
        loadAdminDashboard();

      } catch (error) {
        displayAdminAlert(error.message, 'danger');
      }
    });
  }

  // ----------------------------------------------------
  // 6. Render On-Call Staff Card
  // ----------------------------------------------------
  function renderOnCallStaff(staff) {
    if (!onCallStaffList) return;

    let html = '';
    staff.forEach(member => {
      const isLive = member.status === 'LIVE';
      const statusColor = isLive ? 'var(--success)' : 'var(--danger)';
      const statusBg = isLive ? 'var(--success)' : 'var(--gray-400)';

      html += `
        <div style="display: flex; justify-content: space-between; align-items: center; font-size: 13px;">
          <div style="display: flex; align-items: center; gap: 8px;">
            <div style="width: 6px; height: 6px; border-radius: 50%; background: ${statusColor};"></div>
            <strong style="color: var(--gray-800);">${member.name}</strong>
          </div>
          <div style="color: var(--gray-500); font-size: 11px;">
            ${member.dept}
          </div>
        </div>
      `;
    });

    onCallStaffList.innerHTML = html;
  }

  // ----------------------------------------------------
  // 7. General Admin Helpers
  // ----------------------------------------------------
  function displayAdminAlert(message, type = 'danger') {
    if (!adminAlertBox) return;
    adminAlertBox.textContent = message;
    adminAlertBox.className = `alert-popup ${type}`;
    adminAlertBox.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }

  // Admin Logout triggers
  const btnAdminLogout = document.getElementById('btnAdminLogout');
  if (btnAdminLogout) {
    btnAdminLogout.addEventListener('click', logout);
  }

  // Initialize
  loadAdminDashboard();
});
