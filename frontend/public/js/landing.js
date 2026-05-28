/**
 * MediLink Landing Page Scripts
 */

document.addEventListener('DOMContentLoaded', () => {
  const btnGeolocate = document.getElementById('btnGeolocate');
  const locationInput = document.getElementById('locationInput');
  const procedureInput = document.getElementById('procedureInput');
  const btnSearch = document.getElementById('btnSearch');

  // Check if location is already fetched in session
  const storedCoords = sessionStorage.getItem('medilink_coords');
  if (storedCoords) {
    updateLocationUI(JSON.parse(storedCoords));
  }

  /**
   * Update the location field value and geolocate button state.
   */
  function updateLocationUI(coords) {
    if (!locationInput) return;
    
    // Simulate reverse geocoding showing a readable location for UI polished aesthetics
    let displayLoc = 'Location Detected';
    
    // Check approximate location
    if (Math.abs(coords.lat - 19.07) < 0.2) {
      displayLoc = 'Mumbai, Maharashtra';
    } else if (Math.abs(coords.lat - 28.61) < 0.2) {
      displayLoc = 'New Delhi, NCR';
    } else {
      displayLoc = `Lat: ${coords.lat.toFixed(3)}, Lon: ${coords.lon.toFixed(3)}`;
    }

    locationInput.value = displayLoc;
    
    if (btnGeolocate) {
      btnGeolocate.innerHTML = `<i data-lucide="check-circle-2" style="width: 12px; display: inline-block;"></i> Coordinates Set`;
      btnGeolocate.style.background = 'var(--success-bg)';
      btnGeolocate.style.color = 'var(--success)';
      btnGeolocate.style.borderColor = 'rgba(22, 163, 74, 0.2)';
      if (window.lucide) window.lucide.createIcons();
    }
  }

  // Allow Location Button Click
  if (btnGeolocate) {
    btnGeolocate.addEventListener('click', async () => {
      btnGeolocate.innerHTML = `<i data-lucide="loader" style="width: 12px; display: inline-block; animation: spin 1s linear infinite;"></i> Loading...`;
      if (window.lucide) window.lucide.createIcons();

      try {
        const coords = await requestUserLocation();
        updateLocationUI(coords);
      } catch (error) {
        console.warn('Geolocation failed/denied, falling back to simulated Delhi coordinates:', error);
        
        // Seeding default simulated coords for testing (Delhi)
        const mockCoords = { lat: 28.5562, lon: 77.2410 };
        sessionStorage.setItem('medilink_coords', JSON.stringify(mockCoords));
        updateLocationUI(mockCoords);
      }
    });
  }

  // Helper function to execute search query
  async function executeSearch() {
    const user = await getProfile();
    if (!user) {
      alert('Please log in to search for clinics.');
      const procedure = procedureInput.value.trim();
      if (procedure) {
        sessionStorage.setItem('medilink_booking_redirect', `/search?service=${encodeURIComponent(procedure)}`);
      }
      window.location.href = '/login';
      return;
    }

    const procedure = procedureInput.value.trim();
    if (!procedure) {
      alert('Please type or select a medical procedure (e.g., MRI, X-ray, Consultation)');
      return;
    }

    let searchUrl = `/search?service=${encodeURIComponent(procedure)}`;

    // Append coordinates if available
    const coordsStr = sessionStorage.getItem('medilink_coords');
    if (coordsStr) {
      const coords = JSON.parse(coordsStr);
      searchUrl += `&lat=${coords.lat}&lon=${coords.lon}`;
    } else {
      // Default to Delhi center
      searchUrl += `&lat=28.5562&lon=77.2410`;
    }

    window.location.href = searchUrl;
  }

  // Search Button Click
  if (btnSearch) {
    btnSearch.addEventListener('click', executeSearch);
  }

  // Handle enter key press on procedure input
  if (procedureInput) {
    procedureInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        executeSearch();
      }
    });
  }

  // Specialty category cards click mapping
  const specialtyCards = document.querySelectorAll('.specialty-card');
  specialtyCards.forEach(card => {
    card.addEventListener('click', async () => {
      const user = await getProfile();
      if (!user) {
        alert('Please log in to search for clinics.');
        window.location.href = '/login';
        return;
      }

      const specialty = card.getAttribute('data-specialty');
      let searchProcedure = 'Consultation';

      // Map specialty cards to matching seeded services
      if (specialty === 'Radiology') {
        searchProcedure = 'X-ray';
      } else if (specialty === 'Cardiology') {
        searchProcedure = 'Cardiology Consultation';
      } else if (specialty === 'Eye Care') {
        searchProcedure = 'Eye Care Consultation';
      } else if (specialty === 'Orthopedic') {
        searchProcedure = 'Orthopedic Consultation';
      } else if (specialty === 'Dental') {
        searchProcedure = 'Dental Checkup';
      } else if (specialty === 'Skin Care') {
        searchProcedure = 'Dermatology Consultation';
      }

      if (procedureInput) {
        procedureInput.value = searchProcedure;
      }
      
      let searchUrl = `/search?service=${encodeURIComponent(searchProcedure)}`;
      const coordsStr = sessionStorage.getItem('medilink_coords');
      if (coordsStr) {
        const coords = JSON.parse(coordsStr);
        searchUrl += `&lat=${coords.lat}&lon=${coords.lon}`;
      } else {
        searchUrl += `&lat=28.5562&lon=77.2410`;
      }

      window.location.href = searchUrl;
    });
  });
});
