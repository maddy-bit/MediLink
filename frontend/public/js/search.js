/**
 * MediLink Search Results / Comparison Script
 */

document.addEventListener('DOMContentLoaded', () => {
  const resultsContainer = document.getElementById('resultsContainer');
  const searchedServiceTxt = document.getElementById('searchedServiceTxt');
  const inlineSearchInput = document.getElementById('inlineSearchInput');
  const filterAvailableToday = document.getElementById('filterAvailableToday');
  
  // Parse query params
  const urlParams = new URLSearchParams(window.location.search);
  let service = urlParams.get('service') || 'Consultation';
  let lat = urlParams.get('lat');
  let lon = urlParams.get('lon');
  
  // Check if we have cached coords in sessionStorage but missing in query
  if (!lat && !lon) {
    const cachedCoordsStr = sessionStorage.getItem('medilink_coords');
    if (cachedCoordsStr) {
      const coords = JSON.parse(cachedCoordsStr);
      // Reload page with coords
      window.location.search = `?service=${encodeURIComponent(service)}&lat=${coords.lat}&lon=${coords.lon}`;
      return;
    }
  }

  // Pre-fill header UI elements
  if (searchedServiceTxt) {
    searchedServiceTxt.textContent = service;
  }

  // Pre-fill search input
  if (inlineSearchInput) {
    inlineSearchInput.value = service;
    
    // Search input enter trigger
    inlineSearchInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        const query = inlineSearchInput.value.trim();
        if (query) {
          const newUrl = `/search?service=${encodeURIComponent(query)}` + (lat ? `&lat=${lat}&lon=${lon}` : '');
          window.location.href = newUrl;
        }
      }
    });
  }

  // Store current global search results to filter client-side if needed
  let searchResultsCache = [];

  /**
   * Fetch and render matching hospitals.
   */
  async function loadSearchResults() {
    // Get active sorting parameter
    const sortByRadio = document.querySelector('input[name="sortBy"]:checked');
    const sortBy = sortByRadio ? sortByRadio.value : 'price';

    try {
      resultsContainer.innerHTML = `
        <div class="success-checkout-container" style="padding: 100px 0;">
          <div style="border: 4px solid var(--gray-200); border-top-color: var(--accent); width: 40px; height: 40px; border-radius: 50%; animation: spin 1s linear infinite;"></div>
          <p style="margin-top: 16px; color: var(--gray-500);">Comparing clinics near you...</p>
        </div>
      `;

      let apiUrl = `/api/hospitals/search?service=${encodeURIComponent(service)}&sortBy=${sortBy}`;
      if (lat && lon) {
        apiUrl += `&lat=${lat}&lon=${lon}`;
      }

      const response = await fetch(apiUrl);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to search hospitals');
      }

      searchResultsCache = data.results;
      renderResults(searchResultsCache);

    } catch (error) {
      console.error(error);
      resultsContainer.innerHTML = `
        <div class="success-checkout-container" style="padding: 60px 24px;">
          <div class="success-icon-ring" style="background: var(--danger-bg); color: var(--danger);">
            <i data-lucide="alert-circle"></i>
          </div>
          <h3>Search Failed</h3>
          <p>${error.message || 'An error occurred while loading results.'}</p>
        </div>
      `;
      if (window.lucide) window.lucide.createIcons();
    }
  }

  /**
   * Renders the results onto the DOM.
   */
  function renderResults(results) {
    if (!resultsContainer) return;

    if (results.length === 0) {
      resultsContainer.innerHTML = `
        <div class="success-checkout-container" style="padding: 80px 24px; border: var(--border-default); border-radius: var(--radius-lg); background: var(--white);">
          <div class="success-icon-ring" style="background: var(--primary-bg); color: var(--primary);">
            <i data-lucide="search-code"></i>
          </div>
          <h3>No Match Found</h3>
          <p>We couldn't find any clinic offering '${service}' matching your filters nearby.</p>
          <a href="/" class="btn btn-primary" style="margin-top: 16px;">Try Another Search</a>
        </div>
      `;
      if (window.lucide) window.lucide.createIcons();
      return;
    }

    let html = '';
    results.forEach(item => {
      // Build star ratings
      let starsHtml = '';
      const fullStars = Math.floor(item.overallRating);
      for (let i = 0; i < 5; i++) {
        starsHtml += `<i data-lucide="star" style="width: 14px;" class="${i < fullStars ? 'rating-star' : ''}"></i>`;
      }

      // Generate visual tags based on procedure price to look rich & premium
      const tags = ['Verified Facility'];
      if (item.overallRating >= 4.5) tags.push('Highly Rated');
      if (item.searchedService.price < 1500) tags.push('Best Value');

      html += `
        <div class="hospital-card">
          <div class="hospital-card-img" style="background-image: url('${item.imageUrl}');"></div>
          <div class="hospital-card-body">
            <div class="hospital-card-header">
              <div>
                <a href="/hospital/${item.id}?service=${encodeURIComponent(item.searchedService.name)}" class="hospital-name">${item.name}</a>
                <span class="verified-tag"><i data-lucide="badge-check" style="width: 10px; display: inline-block;"></i> Partner</span>
              </div>
            </div>
            
            <div class="hospital-meta">
              <span style="color: var(--accent); font-weight: 700;">
                ${item.overallRating}
                <span style="display: inline-flex; align-items: center; gap: 2px;">
                  ${starsHtml}
                </span>
                <span style="color: var(--gray-400); font-weight: 400;">(${item.totalReviews})</span>
              </span>
              <span><i data-lucide="navigation-2" style="width: 14px; fill: var(--gray-400);"></i> ${item.distance} km away</span>
            </div>

            <div style="font-size: 13px; color: var(--gray-500); margin-bottom: 16px; display: flex; align-items: center; gap: 4px;">
              <i data-lucide="map-pin" style="width: 14px;"></i> ${item.address}
            </div>

            <div class="hospital-tags">
              ${tags.map(t => `<span class="hospital-tag">${t}</span>`).join('')}
            </div>
          </div>

          <div class="hospital-card-pricing">
            <span class="price-label">Fee starts at</span>
            <div class="price-value">₹${item.searchedService.price.toLocaleString('en-IN')}</div>
            <a href="/hospital/${item.id}?service=${encodeURIComponent(item.searchedService.name)}" class="btn btn-accent" style="width: 100%;">
              Book Now <i data-lucide="arrow-right" style="width: 14px;"></i>
            </a>
          </div>
        </div>
      `;
    });

    resultsContainer.innerHTML = html;
    
    // Re-initialize Lucide Icons
    if (window.lucide) {
      window.lucide.createIcons();
    }
  }

  // Attach change event to sort radio options
  const sortByRadios = document.querySelectorAll('input[name="sortBy"]');
  sortByRadios.forEach(radio => {
    radio.addEventListener('change', loadSearchResults);
  });

  // Toggle filter logic
  if (filterAvailableToday) {
    filterAvailableToday.addEventListener('change', () => {
      // Simulate visual filter
      if (filterAvailableToday.checked) {
        // filter highly rated or simulate available today
        const filtered = searchResultsCache.filter(h => h.overallRating >= 4.2);
        renderResults(filtered);
      } else {
        renderResults(searchResultsCache);
      }
    });
  }

  // Run on start
  loadSearchResults();
});
