/**
   * MediLink Client Common Utilities
   */

/**
 * Get cookie value by name.
 */
function getCookie(name) {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop().split(';').shift();
  return null;
}

/**
 * Fetch currently logged in user profile.
 */
async function getProfile() {
  try {
    const response = await fetch('/api/auth/profile');
    if (!response.ok) return null;
    const data = await response.json();
    return data.user;
  } catch (error) {
    console.error('Error fetching user profile:', error);
    return null;
  }
}

/**
 * Perform logout.
 */
async function logout() {
  try {
    const response = await fetch('/api/auth/logout', { method: 'POST' });
    if (response.ok) {
      // Clear localStorage if used
      localStorage.removeItem('medilink_user');
      window.location.href = '/';
    }
  } catch (error) {
    console.error('Logout error:', error);
  }
}

/**
 * Render the header authentication states dynamically.
 */
async function updateNavHeader(user) {
  const container = document.getElementById('authNavContainer');
  if (!container) return;

  if (user) {
    let dashboardButton = '';
    // If Admin, show link to Admin Dashboard, else patient info
    if (user.role === 'admin') {
      dashboardButton = `<a href="/admin" class="btn btn-outline" style="margin-right: 12px;"><i data-lucide="layout-dashboard" style="width: 14px; display: inline-block; vertical-align: middle;"></i> Admin Portal</a>`;
    }

    container.innerHTML = `
      <div style="display: flex; align-items: center; gap: 16px;">
        ${dashboardButton}
        <div style="text-align: right; display: none; margin-right: 8px;" class="desktop-user-info">
          <div style="font-size: 13px; font-weight: 700; color: var(--primary);">${user.name}</div>
          <div style="font-size: 10px; color: var(--gray-500); text-transform: uppercase;">${user.role}</div>
        </div>
        <div class="review-user-avatar" style="background: var(--accent-light); color: var(--accent); cursor: pointer;" title="${user.name}">
          ${user.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()}
        </div>
        <button class="btn btn-text" id="btnLogoutHeader" style="padding: 6px 12px;"><i data-lucide="log-out" style="width: 16px;"></i></button>
      </div>
    `;

    // Show desktop label if viewport permits
    if (window.innerWidth > 600) {
      const el = container.querySelector('.desktop-user-info');
      if (el) el.style.display = 'block';
    }

    // Attach logout click
    const btnLogout = document.getElementById('btnLogoutHeader');
    if (btnLogout) {
      btnLogout.addEventListener('click', logout);
    }
  } else {
    container.innerHTML = `
      <a href="/login" class="btn btn-text">Login</a>
      <a href="/register" class="btn btn-primary">Sign Up</a>
    `;
  }

  // Re-run lucide icons to catch newly rendered icons
  if (window.lucide) {
    window.lucide.createIcons();
  }
}

/**
 * Handle Geolocation extraction safely.
 */
function requestUserLocation() {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Geolocation is not supported by your browser'));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const coords = {
          lat: position.coords.latitude,
          lon: position.coords.longitude
        };
        // Save in session storage to avoid asking repeatedly
        sessionStorage.setItem('medilink_coords', JSON.stringify(coords));
        resolve(coords);
      },
      (error) => {
        reject(error);
      },
      { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
    );
  });
}

// Auto-run on page load
document.addEventListener('DOMContentLoaded', async () => {
  const user = await getProfile();
  updateNavHeader(user);

  // Dynamic navigation link hiding if not logged in
  const navLinks = document.querySelector('.nav-links');
  if (navLinks && !user) {
    const findClinicsLink = Array.from(navLinks.querySelectorAll('a')).find(a => a.textContent.trim() === 'Find Clinics');
    if (findClinicsLink) {
      const li = findClinicsLink.closest('li');
      if (li) li.remove();
    }
  }
});
