// Debug logging for CSRF token
document.addEventListener('DOMContentLoaded', () => {
  console.group('CSRF Token Debug Info');

  // Check meta tag
  const metaTag = document.querySelector('meta[name="csrf-token"]');
  console.log('Meta Tag Element:', metaTag);
  console.log('Meta Tag Content:', metaTag?.content);

  // Check form input
  const csrfInput = document.querySelector('input[name="_csrf"]');
  console.log('CSRF Input Element:', csrfInput);
  console.log('CSRF Input Value:', csrfInput?.value);

  // Check cookies
  const cookies = document.cookie.split('; ');
  console.log('All Cookies:', cookies);

  const csrfCookie = cookies.find(row => row.startsWith('_csrf='));
  console.log('CSRF Cookie:', csrfCookie);
  console.log('CSRF Cookie Value:', csrfCookie?.split('=')[1]);

  // Log all possible token sources
  const metaToken = metaTag?.content;
  const formToken = csrfInput?.value;
  const cookieToken = csrfCookie?.split('=')[1];

  console.log('=== Token Sources ===');
  console.log('Meta Tag Token:', metaToken);
  console.log('Form Input Token:', formToken);
  console.log('Cookie Token:', cookieToken);

  // Validate CSRF token
  if (!metaToken && !formToken && !cookieToken) {
    console.error('No CSRF token found!');
    showError('Security token missing. Please refresh the page.');
    return;
  }

  // If we don't have a form token but have a cookie token, set it in the form
  if (!formToken && cookieToken) {
    if (csrfInput) {
      csrfInput.value = cookieToken;
      console.log('Updated form token from cookie:', cookieToken);
    }
  }

  console.groupEnd();
});

// Declare variables at the top
const form = document.getElementById('reservationForm');
const dateInput = document.getElementById('date');
const timeSlotInput = document.getElementById('timeSlot');
const successMessage = document.getElementById('successMessage');
const errorMessage = document.getElementById('errorMessage');
const loadingSpinner = document.getElementById('loadingSpinner');
const submitButton = form?.querySelector('button[type="submit"]');
const selectedTimeDisplay = document.querySelector('.selected-time');
const selectedTimeText = document.getElementById('selectedTimeText');
const nameInput = document.getElementById('name');
const emailInput = document.getElementById('email');
const phoneInput = document.getElementById('phone');
let calendar;
let availableSlots = {};

// CSRF Token Management
/** @type {string | null} */
let csrfToken = null;
/** @type {number | null} */
let tokenExpiryTime = null;
const TOKEN_REFRESH_INTERVAL = 12 * 60 * 60 * 1000; // 12 hours
/** @type {boolean} */
let isRefreshingToken = false;

/**
 * Fetches a new CSRF token from the server
 * @returns {Promise<string>} The new CSRF token
 */
async function fetchCsrfToken() {
    if (isRefreshingToken) {
        console.log('Token refresh already in progress');
        return csrfToken || '';
    }

    try {
        isRefreshingToken = true;
        console.log('Fetching new CSRF token...');
        
        const response = await fetch('/csrf-token', {
            method: 'GET',
            credentials: 'include',
            headers: {
                'Accept': 'application/json',
                'Cache-Control': 'no-cache, no-store'
            }
        });
        
        if (!response.ok) {
            throw new Error('Failed to fetch CSRF token');
        }
        
        const data = await response.json();
        csrfToken = data.csrfToken;
        tokenExpiryTime = Date.now() + TOKEN_REFRESH_INTERVAL;
        
        // Update meta tag
        const metaTag = document.querySelector('meta[name="csrf-token"]');
        if (metaTag) {
            metaTag.content = csrfToken;
        }
        
        // Update hidden input if it exists
        const csrfInput = document.querySelector('input[name="_csrf"]');
        if (csrfInput) {
            csrfInput.value = csrfToken;
        }
        
        console.log('Fetched new CSRF Token:', csrfToken);
        console.log('Token will expire at:', new Date(tokenExpiryTime).toISOString());
        
        // Also update the cookie directly
        document.cookie = `_csrf=${csrfToken}; path=/; max-age=${TOKEN_REFRESH_INTERVAL/1000}; SameSite=Lax`;
        
        return csrfToken;
    } catch (error) {
        console.error('Error fetching CSRF token:', error);
        throw error;
    } finally {
        isRefreshingToken = false;
    }
}

/**
 * Ensures a valid CSRF token is available
 * @returns {Promise<string>} The valid CSRF token
 */
async function ensureValidToken() {
    // Check if token exists and is not expired
    if (csrfToken && tokenExpiryTime && Date.now() < tokenExpiryTime) {
        return csrfToken;
    }
    
    // Token is missing or expired, fetch a new one
    return await fetchCsrfToken();
}

// Initialize CSRF token on page load
document.addEventListener('DOMContentLoaded', async () => {
    try {
        // Always fetch a fresh token on page load
        await fetchCsrfToken();
        
        // Debug logging for CSRF token
        console.group('CSRF Token Debug Info');
        
        // Check meta tag
        const metaTag = document.querySelector('meta[name="csrf-token"]');
        console.log('Meta Tag Element:', metaTag);
        console.log('Meta Tag Content:', metaTag?.content);
        
        // Check form input
        const csrfInput = document.querySelector('input[name="_csrf"]');
        console.log('CSRF Input Element:', csrfInput);
        console.log('CSRF Input Value:', csrfInput?.value);
        
        // Check cookies
        const cookies = document.cookie.split('; ');
        console.log('All Cookies:', cookies);
        
        const csrfCookie = cookies.find(row => row.startsWith('_csrf='));
        console.log('CSRF Cookie:', csrfCookie);
        console.log('CSRF Cookie Value:', csrfCookie?.split('=')[1]);
        
        // Log all possible token sources
        const metaToken = metaTag?.content;
        const formToken = csrfInput?.value;
        const cookieToken = csrfCookie?.split('=')[1];
        
        console.log('=== Token Sources ===');
        console.log('Meta Tag Token:', metaToken);
        console.log('Form Input Token:', formToken);
        console.log('Cookie Token:', cookieToken);
        
        // Validate CSRF token
        if (!metaToken && !formToken && !cookieToken) {
            console.error('No CSRF token found!');
            showError('Security token missing. Please refresh the page.');
            return;
        }
        
        console.groupEnd();
    } catch (error) {
        console.error('Failed to initialize CSRF token:', error);
        showError('Security token initialization failed. Please refresh the page.');
    }
});

document.addEventListener('DOMContentLoaded', () => {
  // Initialize form elements after DOM is loaded
  const startTimeSelect = document.getElementById('startTime');
  const endTimeSelect = document.getElementById('endTime');
  const selectedDateDiv = document.getElementById('selectedDate');

  // Debug logging function
  const debug = (message, data = null) => {
    // Check if we're in development mode by looking for debug data
    const debugData = document.getElementById('debug-data');
    if (debugData) {
      console.group(`Debug: ${message}`);
      if (data) console.log(data);
      console.groupEnd();
    }
  };

  // Helper functions
  function showLoading() {
    if (loadingSpinner) loadingSpinner.classList.remove('d-none');
  }

  function hideLoading() {
    if (loadingSpinner) loadingSpinner.classList.add('d-none');
  }

  function showSuccess(message) {
    if (successMessage) {
      successMessage.textContent = message;
      successMessage.style.display = 'block';
    }
    if (errorMessage) errorMessage.style.display = 'none';
  }

  function showError(message) {
    console.error('Error:', message);
    if (errorMessage) {
      errorMessage.textContent = message;
      errorMessage.style.display = 'block';
    }
    if (successMessage) successMessage.style.display = 'none';
  }

  function hideMessages() {
    if (errorMessage) errorMessage.style.display = 'none';
    if (successMessage) successMessage.style.display = 'none';
  }

  // Initialize the form
  try {
    debug('Starting form initialization');

    // Validate form existence
    if (!form) {
      throw new Error('Form not found. Please refresh the page.');
    }

    // Validate required elements
    if (!startTimeSelect || !endTimeSelect || !selectedDateDiv || !nameInput || !emailInput || !phoneInput) {
      throw new Error('Required form elements not found. Please refresh the page.');
    }

    // Debug: Check if FullCalendar is loaded
    if (typeof FullCalendar === 'undefined') {
      throw new Error('Calendar library not loaded. Please refresh the page.');
    }

    // Initialize FullCalendar
    const calendarEl = document.getElementById('calendar');
    if (!calendarEl) {
      throw new Error('Calendar element not found');
    }

    calendar = new FullCalendar.Calendar(calendarEl, {
      initialView: 'dayGridMonth',
      locale: 'bg',
      themeSystem: 'bootstrap5',
      headerToolbar: {
        left: 'prev',
        center: 'title',
        right: 'next'
      },
      buttonIcons: {
        prev: 'chevron-left',
        next: 'chevron-right'
      },
      dateClick: handleDateClick,
      height: 'auto',
      validRange: {
        start: new Date()
      },
      weekends: true,
      fixedWeekCount: false,
      showNonCurrentDates: false,
      firstDay: 1
    });

    calendar.render();
    debug('Calendar initialized successfully');
  } catch (error) {
    console.error('Initialization error:', error);
    showError(error.message);
    return;
  }

  // Format phone number as user types
  if (phoneInput) {
    phoneInput.addEventListener('input', (e) => {
      // Remove any non-digits and existing spaces
      let value = e.target.value.replace(/\D/g, '');
      // Add a space after every 3 digits
      value = value.replace(/(\d{3})(?=\d)/g, '$1 ').trim();
      e.target.value = value;
    });
  }

  // Handle date selection
  function handleDateClick(info) {
    try {
      const selectedDate = new Date(info.dateStr);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      selectedDate.setHours(0, 0, 0, 0);

      // Check if selected date is in the past
      if (selectedDate < today) {
        showError('Не може да избирате минала дата');
        return;
      }

      const formattedDate = selectedDate.toLocaleDateString('bg-BG', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
      });

      debug('Date selected', { date: formattedDate });

      selectedDateDiv.textContent = formattedDate;
      selectedDateDiv.classList.remove('is-invalid'); // Remove error state if exists
      hideMessages(); // Clear any existing error messages
      startTimeSelect.value = '';
      endTimeSelect.value = '';
      startTimeSelect.disabled = false;
      endTimeSelect.disabled = true;

      // Highlight selected date
      const allDates = document.querySelectorAll('.fc-day');
      allDates.forEach(date => date.classList.remove('selected-date'));
      info.dayEl.classList.add('selected-date');
    } catch (error) {
      console.error('Date selection error:', error);
      showError('Error selecting date');
    }
  }

  // Populate end time based on start time selection
  startTimeSelect.addEventListener('change', () => {
    try {
      const selectedTime = startTimeSelect.value;
      if (!selectedTime) {
        endTimeSelect.innerHTML = '<option value="">Избери час</option>';
        endTimeSelect.disabled = true;
        return;
      }

      const [hours, minutes] = selectedTime.split(':').map(Number);
      endTimeSelect.innerHTML = '<option value="">Избери час</option>';

      // Calculate end time (30 minutes after start time)
      let endHour = hours;
      let endMinutes = minutes + 30;

      // If minutes exceed 60, add an hour and adjust minutes
      if (endMinutes >= 60) {
        endHour += Math.floor(endMinutes / 60);
        endMinutes = endMinutes % 60;
      }

      const endTime = `${String(endHour).padStart(2, '0')}:${String(endMinutes).padStart(2, '0')}`;
      endTimeSelect.innerHTML += `<option value="${endTime}">${endTime} ч</option>`;

      endTimeSelect.disabled = false;
      debug('Time options updated', {
        startTime: selectedTime,
        endTimeOptions: Array.from(endTimeSelect.options).map(opt => opt.value)
      });
    } catch (error) {
      console.error('Time selection error:', error);
      showError('Error updating time options');
    }
  });

  // Handle form submission
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    hideMessages();
    
    try {
        // Get form data
        const formData = {
            date: selectedDateDiv.textContent,
            startTime: startTimeSelect.value,
            endTime: endTimeSelect.value,
            name: nameInput.value,
            phone: phoneInput.value.replace(/\s/g, ''),
            email: emailInput.value.trim().toLowerCase()
            // CSRF token temporarily not needed for API endpoints
        };

        // Debug logging for form submission
        console.group('Form Submission Debug');
        console.log('Form Data:', formData);
        console.log('CSRF Token Status: Disabled for debugging');
        console.groupEnd();

        // Validate form data
        if (!formData.date || !formData.startTime || !formData.endTime ||
            !formData.name || !formData.phone || !formData.email) {
            throw new Error('Моля, попълнете всички полета');
        }

        // Validate phone number
        if (formData.phone.length !== 10) {
            throw new Error('Моля, въведете валиден телефонен номер (10 цифри)');
        }

        // Validate email
        if (!formData.email.endsWith('@gmail.com')) {
            throw new Error('Моля, използвайте Gmail адрес (@gmail.com)');
        }

        // Show loading state
        const originalButtonText = submitButton.innerHTML;
        submitButton.disabled = true;
        submitButton.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Изпращане...';
        
        try {
            // Send the request
            const response = await fetch('/api/reservations', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                credentials: 'include',
                body: JSON.stringify(formData)
            });

            // Log response details for debugging
            console.group('Response Debug');
            console.log('Status:', response.status);
            console.log('Status Text:', response.statusText);
            console.log('Headers:', Object.fromEntries([...response.headers]));
            console.log('Type:', response.type);
            console.groupEnd();

            // Check if response is OK
            if (!response.ok) {
                // Try to parse as JSON, but handle cases where it's not JSON
                let errorMessage = 'Възникна грешка при изпращането на резервацията';
                
                try {
                    const contentType = response.headers.get('content-type');
                    if (contentType && contentType.includes('application/json')) {
                        const errorData = await response.json();
                        errorMessage = errorData.error || errorMessage;
                    } else {
                        // If not JSON, try to get text
                        const text = await response.text();
                        console.log('Non-JSON response:', text);
                    }
                } catch (parseError) {
                    console.error('Error parsing response:', parseError);
                }
                
                throw new Error(errorMessage);
            }

            // Try to parse the success response
            let data;
            try {
                const contentType = response.headers.get('content-type');
                if (contentType && contentType.includes('application/json')) {
                    data = await response.json();
                } else {
                    // If not JSON, get as text
                    const text = await response.text();
                    console.log('Response text:', text);
                    data = { success: true, message: 'Reservation successful' };
                }
            } catch (parseError) {
                console.warn('Could not parse response as JSON, but request was successful');
                data = { success: true };
            }

            // Success - show message and reset form
            if (successMessage) {
                successMessage.textContent = 'Резервацията е успешно направена! Ще получите потвърждение на имейл.';
                successMessage.style.display = 'block';
            }

            // Reset form
            form.reset();
            selectedDateDiv.textContent = '';
            startTimeSelect.value = '';
            endTimeSelect.value = '';
            endTimeSelect.disabled = true;

            // Optionally refresh available slots
            if (calendar) {
                calendar.refetchEvents();
            }
        } finally {
            // Reset button state
            submitButton.disabled = false;
            submitButton.innerHTML = originalButtonText;
        }
    } catch (error) {
        console.error('Form submission error:', error);
        if (errorMessage) {
            errorMessage.textContent = error.message;
            errorMessage.style.display = 'block';
        }
    }
  });
});
