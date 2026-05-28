/**
 * MediLink Client Authentication Scripts
 */

document.addEventListener('DOMContentLoaded', () => {
  const loginForm = document.getElementById('loginForm');
  const registerForm = document.getElementById('registerForm');
  const alertBox = document.getElementById('alertBox');

  /**
   * Helper to display form messages.
   */
  function displayAlert(message, type = 'danger') {
    if (!alertBox) return;
    alertBox.textContent = message;
    alertBox.className = `alert-popup ${type}`;
    alertBox.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }

  // Handle Login Form Submit
  if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      
      const email = document.getElementById('email').value;
      const password = document.getElementById('password').value;

      try {
        const response = await fetch('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password })
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || 'Login failed');
        }

        displayAlert('Login successful! Redirecting...', 'success');
        
        // Cache user details locally if helpful
        localStorage.setItem('medilink_user', JSON.stringify(data.user));

        // Role-based redirection
        setTimeout(() => {
          if (data.user.role === 'admin') {
            window.location.href = '/admin';
          } else {
            // Check if there is a pending booking flow redirect
            const redirectUrl = sessionStorage.getItem('medilink_booking_redirect');
            if (redirectUrl) {
              sessionStorage.removeItem('medilink_booking_redirect');
              window.location.href = redirectUrl;
            } else {
              window.location.href = '/';
            }
          }
        }, 1000);

      } catch (error) {
        displayAlert(error.message);
      }
    });
  }

  // OTP Client-side Logic
  const btnSendOtp = document.getElementById('btnSendOtp');
  const btnVerifyOtp = document.getElementById('btnVerifyOtp');
  const otpInput = document.getElementById('otpInput');
  const otpFieldContainer = document.getElementById('otpFieldContainer');
  const otpHelpText = document.getElementById('otpHelpText');
  const btnSubmitRegister = document.getElementById('btnSubmitRegister');
  const emailInput = document.getElementById('email');

  let isEmailVerified = false;

  if (btnSendOtp) {
    btnSendOtp.addEventListener('click', async () => {
      const email = emailInput.value.trim();
      if (!email || !email.includes('@')) {
        displayAlert('Please enter a valid email address first.');
        return;
      }

      btnSendOtp.disabled = true;
      btnSendOtp.textContent = 'Sending...';
      displayAlert('Requesting OTP...', 'success');

      try {
        const response = await fetch('/api/auth/send-otp', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email })
        });

        const data = await response.json();
        if (!response.ok) {
          throw new Error(data.error || 'Failed to send OTP');
        }

        displayAlert(`Mock OTP Sent! Enter OTP code: ${data.otp}`, 'success');
        
        // Show OTP field
        otpFieldContainer.style.display = 'block';
        otpHelpText.textContent = `For simulation, use the code: ${data.otp}`;
        otpHelpText.style.color = 'var(--accent)';
        
        btnSendOtp.disabled = false;
        btnSendOtp.textContent = 'Resend OTP';

      } catch (error) {
        displayAlert(error.message);
        btnSendOtp.disabled = false;
        btnSendOtp.textContent = 'Send OTP';
      }
    });
  }

  if (btnVerifyOtp) {
    btnVerifyOtp.addEventListener('click', async () => {
      const email = emailInput.value.trim();
      const otp = otpInput.value.trim();

      if (!otp || otp.length !== 6) {
        displayAlert('Please enter a 6-digit OTP code.');
        return;
      }

      btnVerifyOtp.disabled = true;
      btnVerifyOtp.textContent = 'Verifying...';

      try {
        const response = await fetch('/api/auth/verify-otp', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, otp })
        });

        const data = await response.json();
        if (!response.ok) {
          throw new Error(data.error || 'OTP does not match');
        }

        displayAlert('Email verified successfully! You can now create your account.', 'success');
        
        // Lock fields
        emailInput.readOnly = true;
        otpInput.readOnly = true;
        btnSendOtp.style.display = 'none';
        btnVerifyOtp.style.display = 'none';
        
        // Enable signup submit button
        btnSubmitRegister.removeAttribute('disabled');
        isEmailVerified = true;

      } catch (error) {
        displayAlert(error.message || 'OTP does not match');
        btnVerifyOtp.disabled = false;
        btnVerifyOtp.textContent = 'Verify OTP';
      }
    });
  }

  // Handle Registration Form Submit
  if (registerForm) {
    registerForm.addEventListener('submit', async (e) => {
      e.preventDefault();

      if (!isEmailVerified) {
        displayAlert('Please verify your email address via OTP first.');
        return;
      }

      const name = document.getElementById('name').value;
      const email = emailInput.value;
      const password = document.getElementById('password').value;
      const roleVal = document.querySelector('input[name="role"]:checked').value;

      try {
        const response = await fetch('/api/auth/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name, email, password, role: roleVal })
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || 'Registration failed');
        }

        displayAlert('Registration successful! Redirecting...', 'success');
        localStorage.setItem('medilink_user', JSON.stringify(data.user));

        setTimeout(() => {
          if (data.user.role === 'admin') {
            window.location.href = '/admin';
          } else {
            const redirectUrl = sessionStorage.getItem('medilink_booking_redirect');
            if (redirectUrl) {
              sessionStorage.removeItem('medilink_booking_redirect');
              window.location.href = redirectUrl;
            } else {
              window.location.href = '/';
            }
          }
        }, 1000);

      } catch (error) {
        displayAlert(error.message);
      }
    });
  }
});
