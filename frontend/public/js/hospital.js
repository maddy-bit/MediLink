/**
 * MediLink Hospital Details & Interactive Slot Booking Scripts
 */

document.addEventListener('DOMContentLoaded', () => {
  // Extract Hospital ID from Dynamic URL /hospital/:id
  const pathParts = window.location.pathname.split('/');
  const hospitalId = pathParts[pathParts.length - 1] || 'hosp_1';

  // Get active procedure parameter
  const urlParams = new URLSearchParams(window.location.search);
  let preselectedService = urlParams.get('service') || '';

  // Select UI Elements
  const hospitalName = document.getElementById('hospitalName');
  const avgRatingTxt = document.getElementById('avgRatingTxt');
  const totalReviewsTxt = document.getElementById('totalReviewsTxt');
  const hospitalAddress = document.getElementById('hospitalAddress');
  const hospitalDesc = document.getElementById('hospitalDesc');
  const bookingServiceSelect = document.getElementById('bookingServiceSelect');
  const bookingPriceVal = document.getElementById('bookingPriceVal');
  
  const reviewsContainer = document.getElementById('reviewsContainer');
  const reviewCommentInput = document.getElementById('reviewCommentInput');
  const btnPostReview = document.getElementById('btnPostReview');
  const reviewStarSelector = document.getElementById('reviewStarSelector');
  
  const btnConfirmBooking = document.getElementById('btnConfirmBooking');
  const bookingWidgetAlertBox = document.getElementById('bookingWidgetAlertBox');

  // Checkout elements
  const checkoutModal = document.getElementById('checkoutModal');
  const btnCheckoutClose = document.getElementById('btnCheckoutClose');
  const btnPayCheckout = document.getElementById('btnPayCheckout');
  const btnSuccessClose = document.getElementById('btnSuccessClose');
  
  const checkoutHospName = document.getElementById('checkoutHospName');
  const checkoutService = document.getElementById('checkoutService');
  const checkoutDateTime = document.getElementById('checkoutDateTime');
  const checkoutProcedureCost = document.getElementById('checkoutProcedureCost');
  const successBookingId = document.getElementById('successBookingId');

  const checkoutFormContent = document.getElementById('checkoutFormContent');
  const checkoutSuccessContent = document.getElementById('checkoutSuccessContent');
  const checkoutAlertBox = document.getElementById('checkoutAlertBox');

  // State Management
  let globalHospitalData = null;
  let selectedDate = null;
  let selectedTimeSlot = null;
  let activeReviewRating = 5; // default 5 stars

  // ----------------------------------------------------
  // 1. Fetch Hospital Info & Populate Content
  // ----------------------------------------------------
  async function loadHospitalDetails() {
    try {
      const response = await fetch(`/api/hospitals/${hospitalId}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch details');
      }

      globalHospitalData = data.hospital;
      
      // Populate Details
      hospitalName.textContent = globalHospitalData.name;
      avgRatingTxt.textContent = globalHospitalData.overallRating.toFixed(1);
      totalReviewsTxt.textContent = globalHospitalData.totalReviews;
      hospitalAddress.textContent = globalHospitalData.address;
      
      // Show Top Rated tag conditionally
      const topRatedTag = document.getElementById('topRatedTag');
      if (topRatedTag) {
        topRatedTag.style.display = globalHospitalData.overallRating >= 4.5 ? 'inline-flex' : 'none';
      }

      // Populate Services Dropdown Menu
      bookingServiceSelect.innerHTML = '';
      globalHospitalData.services.forEach(s => {
        if (s.active) {
          const opt = document.createElement('option');
          opt.value = s.name;
          opt.textContent = `${s.name} - ₹${s.price.toLocaleString('en-IN')}`;
          
          // Select matching pre-selected service
          if (preselectedService && s.name.toLowerCase().includes(preselectedService.toLowerCase().trim())) {
            opt.selected = true;
          }
          bookingServiceSelect.appendChild(opt);
        }
      });

      // Update booking pricing display
      updateBookingPrice();

      // Render Reviews List
      renderReviews(data.reviews);

    } catch (error) {
      console.error(error);
      alert('Error loading hospital details. Redirecting to home.');
      window.location.href = '/';
    }
  }

  function updateBookingPrice() {
    if (!globalHospitalData || !bookingServiceSelect.value) return;
    const sName = bookingServiceSelect.value;
    const match = globalHospitalData.services.find(s => s.name === sName);
    if (match) {
      bookingPriceVal.textContent = match.price.toLocaleString('en-IN');
    }
  }

  if (bookingServiceSelect) {
    bookingServiceSelect.addEventListener('change', updateBookingPrice);
  }

  // ----------------------------------------------------
  // 2. Render Review List Feed
  // ----------------------------------------------------
  function renderReviews(reviews) {
    if (!reviewsContainer) return;
    
    if (!reviews || reviews.length === 0) {
      reviewsContainer.innerHTML = `
        <p style="color: var(--gray-400); text-align: center; padding: 24px 0; font-size: 14px;">No reviews yet. Be the first to share your experience!</p>
      `;
      return;
    }

    let html = '';
    reviews.forEach(r => {
      let starsHtml = '';
      for (let i = 0; i < 5; i++) {
        starsHtml += `<i data-lucide="star" style="width: 12px; fill: ${i < r.rating ? 'var(--warning)' : 'none'}; color: ${i < r.rating ? 'var(--warning)' : 'var(--gray-300)'};"></i>`;
      }
      
      const initials = r.patientName.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
      const dateStr = new Date(r.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });

      html += `
        <div class="review-item">
          <div class="review-item-header">
            <div class="review-user-info">
              <div class="review-user-avatar">${initials}</div>
              <div class="review-user-details">
                <span class="review-user-name">${r.patientName}</span>
                <span class="review-date">${dateStr}</span>
              </div>
            </div>
            <div class="review-stars">
              ${starsHtml}
            </div>
          </div>
          <p class="review-comment">"${r.comment}"</p>
        </div>
      `;
    });

    reviewsContainer.innerHTML = html;
    if (window.lucide) window.lucide.createIcons();
  }

  // Handle rating star selector clicks
  if (reviewStarSelector) {
    const starBtns = reviewStarSelector.querySelectorAll('.star-btn');
    starBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        const starCount = Number(btn.getAttribute('data-star'));
        activeReviewRating = starCount;
        
        starBtns.forEach(b => {
          const val = Number(b.getAttribute('data-star'));
          b.className = val <= starCount ? 'star-btn active' : 'star-btn';
        });
      });
    });
  }

  // Post Review Submit Handler
  if (btnPostReview) {
    btnPostReview.addEventListener('click', async () => {
      const comment = reviewCommentInput.value.trim();
      const reviewAlertBox = document.getElementById('reviewAlertBox');
      
      if (!comment) {
        reviewAlertBox.textContent = 'Please write a comment before posting.';
        reviewAlertBox.className = 'alert-popup danger';
        return;
      }

      btnPostReview.disabled = true;
      btnPostReview.textContent = 'Posting...';

      try {
        const response = await fetch('/api/reviews', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            hospitalId,
            rating: activeReviewRating,
            comment
          })
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || 'Failed to submit review');
        }

        reviewCommentInput.value = '';
        reviewAlertBox.textContent = 'Review posted successfully!';
        reviewAlertBox.className = 'alert-popup success';
        
        // Reload hospital info (rating averages) and reviews feed list
        loadHospitalDetails();

      } catch (error) {
        reviewAlertBox.textContent = error.message;
        reviewAlertBox.className = 'alert-popup danger';
      } finally {
        btnPostReview.disabled = false;
        btnPostReview.textContent = 'Post Review';
      }
    });
  }

  // ----------------------------------------------------
  // 3. Interactive Mini Calendar Date Picker
  // ----------------------------------------------------
  const monthYearTitle = document.getElementById('monthYearTitle');
  const calendarDaysGrid = document.getElementById('calendarDaysGrid');
  const prevMonthBtn = document.getElementById('prevMonthBtn');
  const nextMonthBtn = document.getElementById('nextMonthBtn');
  
  let currentCalDate = new Date(); // Tracks displayed month

  function renderCalendar() {
    if (!calendarDaysGrid) return;
    calendarDaysGrid.innerHTML = '';

    const year = currentCalDate.getFullYear();
    const month = currentCalDate.getMonth();

    // Set Header Month Year
    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    monthYearTitle.textContent = `${monthNames[month]} ${year}`;

    // Get first day of the month
    const firstDayIndex = new Date(year, month, 1).getDay();
    // Get last day of the month
    const lastDay = new Date(year, month + 1, 0).getDate();

    // Render Empty cells for weekdays alignment
    for (let i = 0; i < firstDayIndex; i++) {
      const emptyCell = document.createElement('div');
      emptyCell.className = 'calendar-day empty';
      calendarDaysGrid.appendChild(emptyCell);
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Limit bookings up to 14 days in the future
    const maxBookingDate = new Date();
    maxBookingDate.setDate(today.getDate() + 14);

    for (let d = 1; d <= lastDay; d++) {
      const dayCell = document.createElement('div');
      dayCell.className = 'calendar-day';
      dayCell.textContent = d;

      const cellDate = new Date(year, month, d);
      cellDate.setHours(0, 0, 0, 0);

      // Check if date is in range (today -> today + 14 days)
      const isPast = cellDate < today;
      const isTooFar = cellDate > maxBookingDate;

      if (isPast || isTooFar) {
        dayCell.classList.add('disabled');
      } else {
        // Today tag highlight
        if (cellDate.getTime() === today.getTime()) {
          dayCell.classList.add('today');
        }

        // Active state checking
        if (selectedDate && cellDate.getTime() === selectedDate.getTime()) {
          dayCell.classList.add('selected');
        }

        dayCell.addEventListener('click', () => {
          // Deselect previous
          const prevSel = calendarDaysGrid.querySelector('.selected');
          if (prevSel) prevSel.classList.remove('selected');

          dayCell.classList.add('selected');
          selectedDate = cellDate;
          
          // Clear error
          bookingWidgetAlertBox.className = 'alert-popup';
        });
      }

      calendarDaysGrid.appendChild(dayCell);
    }
  }

  if (prevMonthBtn) {
    prevMonthBtn.addEventListener('click', () => {
      currentCalDate.setMonth(currentCalDate.getMonth() - 1);
      renderCalendar();
    });
  }

  if (nextMonthBtn) {
    nextMonthBtn.addEventListener('click', () => {
      currentCalDate.setMonth(currentCalDate.getMonth() + 1);
      renderCalendar();
    });
  }

  // ----------------------------------------------------
  // 4. Slots Selection Grid
  // ----------------------------------------------------
  const slotsContainer = document.getElementById('slotsGridContainer');
  if (slotsContainer) {
    const slotItems = slotsContainer.querySelectorAll('.slot-item');
    slotItems.forEach(item => {
      item.addEventListener('click', () => {
        if (item.classList.contains('disabled')) return;
        
        const prevActive = slotsContainer.querySelector('.selected');
        if (prevActive) prevActive.classList.remove('selected');

        item.classList.add('selected');
        selectedTimeSlot = item.getAttribute('data-slot');
        
        // Clear error
        bookingWidgetAlertBox.className = 'alert-popup';
      });
    });
  }

  // ----------------------------------------------------
  // 5. Booking Flow & Payment Confirmation
  // ----------------------------------------------------
  if (btnConfirmBooking) {
    btnConfirmBooking.addEventListener('click', async () => {
      // 1. Validations
      if (!selectedDate) {
        bookingWidgetAlertBox.textContent = 'Please choose an appointment date from the calendar.';
        bookingWidgetAlertBox.className = 'alert-popup danger';
        return;
      }

      if (!selectedTimeSlot) {
        bookingWidgetAlertBox.textContent = 'Please choose an available time slot.';
        bookingWidgetAlertBox.className = 'alert-popup danger';
        return;
      }

      // 2. Auth checking
      const user = await getProfile();
      if (!user) {
        // Cache redirection URL
        sessionStorage.setItem('medilink_booking_redirect', window.location.href);
        
        bookingWidgetAlertBox.textContent = 'Sign-in required to finalize appointment. Redirecting...';
        bookingWidgetAlertBox.className = 'alert-popup warning';

        setTimeout(() => {
          window.location.href = '/login';
        }, 1200);
        return;
      }

      // 3. Open checkout modal & populate parameters
      const dateString = selectedDate.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });
      
      checkoutHospName.textContent = globalHospitalData.name;
      checkoutService.textContent = bookingServiceSelect.value;
      checkoutDateTime.textContent = `${dateString} at ${selectedTimeSlot}`;
      checkoutProcedureCost.textContent = Number(bookingPriceVal.textContent.replace(/,/g, '')).toLocaleString('en-IN');

      // Initialize modal visual panels
      checkoutFormContent.style.display = 'block';
      checkoutSuccessContent.style.display = 'none';
      checkoutAlertBox.className = 'alert-popup';

      checkoutModal.classList.add('active');
    });
  }

  // Close Checkout Modal
  if (btnCheckoutClose) {
    btnCheckoutClose.addEventListener('click', () => {
      checkoutModal.classList.remove('active');
    });
  }

  // Confirm payment & transaction details submission
  let activeBookingId = null;

  if (btnPayCheckout) {
    btnPayCheckout.addEventListener('click', async (e) => {
      e.preventDefault();
      
      btnPayCheckout.disabled = true;
      btnPayCheckout.innerHTML = `<i data-lucide="loader" style="width: 14px; animation: spin 1s linear infinite;"></i> Processing Payment...`;
      if (window.lucide) window.lucide.createIcons();

      const serviceVal = bookingServiceSelect.value;
      const dateVal = selectedDate.toISOString().split('T')[0]; // YYYY-MM-DD

      try {
        // Step A: Create the booking (Initially Pending)
        const bookingRes = await fetch('/api/bookings', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            hospitalId,
            service: serviceVal,
            date: dateVal,
            timeSlot: selectedTimeSlot
          })
        });

        const bookingData = await bookingRes.json();
        if (!bookingRes.ok) {
          throw new Error(bookingData.error || 'Failed to initialize booking');
        }

        activeBookingId = bookingData.booking.id;

        // Step B: Submit ₹1 Simulated Charge
        const paymentRes = await fetch('/api/bookings/confirm-payment', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            bookingId: activeBookingId
          })
        });

        const paymentData = await paymentRes.json();
        if (!paymentRes.ok) {
          throw new Error(paymentData.error || 'Simulated transaction failed');
        }

        // Success Transition
        successBookingId.textContent = activeBookingId;
        
        checkoutFormContent.style.display = 'none';
        checkoutSuccessContent.style.display = 'block';

      } catch (error) {
        checkoutAlertBox.textContent = error.message;
        checkoutAlertBox.className = 'alert-popup danger';
        
        btnPayCheckout.disabled = false;
        btnPayCheckout.innerHTML = `Pay ₹1.00 & Confirm Booking <i data-lucide="credit-card" style="width: 16px;"></i>`;
        if (window.lucide) window.lucide.createIcons();
      }
    });
  }

  // Close success pane redirects user
  if (btnSuccessClose) {
    btnSuccessClose.addEventListener('click', () => {
      checkoutModal.classList.remove('active');
      
      // Reload details to clear selections or redirect to clean search
      window.location.reload();
    });
  }

  // ----------------------------------------------------
  // Start Application Load Sequence
  // ----------------------------------------------------
  loadHospitalDetails();
  renderCalendar();
});
