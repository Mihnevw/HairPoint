// Debug logging for CSRF token
document.addEventListener('DOMContentLoaded', () => {
    console.group('CSRF Token Debug Info');
    const metaToken = document.querySelector('meta[name="csrf-token"]')?.content;
    const formToken = document.querySelector('input[name="_csrf"]')?.value;
    const cookieToken = document.cookie
        .split('; ')
        .find(row => row.startsWith('XSRF-TOKEN='))
        ?.split('=')[1];

    console.log('Meta Tag Token:', metaToken);
    console.log('Form Input Token:', formToken);
    console.log('Cookie Token:', cookieToken);
    console.log('All Cookies:', document.cookie);
    console.groupEnd();

    // If we don't have a form token but have a cookie token, set it in the form
    if (!formToken && cookieToken) {
        const csrfInput = document.querySelector('input[name="_csrf"]');
        if (csrfInput) {
            csrfInput.value = cookieToken;
            console.log('Updated form token from cookie');
        }
    }
});

// Declare variables at the top
const form = document.getElementById('reservationForm');
const dateInput = document.getElementById('date');
const timeSlotInput = document.getElementById('timeSlot');
const successMessage = document.getElementById('successMessage');
const errorMessage = document.getElementById('errorMessage');
const loadingSpinner = document.getElementById('loadingSpinner');
const submitButton = form.querySelector('button[type="submit"]');
const selectedTimeDisplay = document.querySelector('.selected-time');
const selectedTimeText = document.getElementById('selectedTimeText');
let calendar;
let availableSlots = {};

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
            successMessage.classList.remove('d-none');
        }
        if (errorMessage) errorMessage.classList.add('d-none');
    }

    function showError(message) {
        console.error('Error:', message);
        if (errorMessage) {
            errorMessage.textContent = message;
            errorMessage.classList.remove('d-none');
        }
        if (successMessage) successMessage.classList.add('d-none');
    }

    function hideMessages() {
        if (errorMessage) errorMessage.classList.add('d-none');
        if (successMessage) successMessage.classList.add('d-none');
    }

    // CSRF Token validation
    const validateCsrfToken = () => {
        debug('Validating CSRF token');
        
        // Check form element
        if (!form) {
            debug('Form element not found', {
                formId: 'reservationForm',
                allForms: document.forms
            });
            throw new Error('Reservation form not found in DOM');
        }

        // First try to get CSRF token from meta tag
        const metaToken = document.querySelector('meta[name="csrf-token"]');
        if (metaToken && metaToken.content) {
            debug('Found CSRF token in meta tag');
            return metaToken.content;
        }

        // Then try to get it from the form input
        const csrfInput = form.querySelector('input[name="_csrf"]');
        if (!csrfInput) {
            debug('CSRF input element not found', {
                formElements: Array.from(form.elements).map(el => ({
                    name: el.name,
                    type: el.type,
                    id: el.id
                })),
                hiddenInputs: Array.from(form.querySelectorAll('input[type="hidden"]')).map(el => ({
                    name: el.name,
                    value: el.value ? 'present' : 'missing'
                }))
            });
            throw new Error('CSRF input element not found in form');
        }

        const csrfToken = csrfInput.value;
        if (!csrfToken) {
            debug('CSRF token value is empty', {
                input: {
                    name: csrfInput.name,
                    type: csrfInput.type,
                    attributes: Array.from(csrfInput.attributes).map(attr => ({
                        name: attr.name,
                        value: attr.value
                    }))
                }
            });
            throw new Error('CSRF token value is empty');
        }

        debug('CSRF token validation successful');
        return csrfToken;
    };

    // Initialize the form
    try {
        debug('Starting form initialization');
        
        // Validate form existence
        if (!form) {
            throw new Error('Form not found. Please refresh the page.');
        }

        const csrfToken = validateCsrfToken();
        debug('Form initialization started', { 
            formFound: !!form,
            csrfTokenFound: !!csrfToken
        });

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
    const phoneInput = document.getElementById('phone');
    phoneInput.addEventListener('input', (e) => {
        // Remove any non-digits and existing spaces
        let value = e.target.value.replace(/\D/g, '');
        // Add a space after every 3 digits
        value = value.replace(/(\d{3})(?=\d)/g, '$1').trim();
        e.target.value = value;
    });

    // Handle date selection
    function handleDateClick(info) {
        try {
            const selectedDate = new Date(info.dateStr);
            const today = new Date();
            today.setHours(0, 0, 0, 0);

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
            
            // Add only one 30-minute slot after the start time
            const endHour = hours;
            const endMinutes = (minutes + 30) % 60;
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

    // Form submission
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        hideMessages();

        try {
            // Get CSRF token from meta tag or form input
            const csrfToken = document.querySelector('meta[name="csrf-token"]')?.content || 
                             document.querySelector('input[name="_csrf"]')?.value;

            if (!csrfToken) {
                throw new Error('Security token missing. Please refresh the page.');
            }

            // Get form data
            const formData = {
                date: selectedDateDiv.textContent,
                startTime: startTimeSelect.value,
                endTime: endTimeSelect.value,
                name: nameInput.value,
                phone: phoneInput.value.replace(/\s/g, ''),
                email: emailInput.value.trim().toLowerCase(),
                _csrf: csrfToken
            };

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

            // Send the request
            const response = await fetch('/api/reservations', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-Token': csrfToken
                },
                credentials: 'include',
                body: JSON.stringify(formData)
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Възникна грешка при изпращането на резервацията');
            }

            // Show success message
            if (successMessage) {
                successMessage.textContent = 'Резервацията е успешно направена! Ще получите потвърждение на имейл.';
                successMessage.classList.remove('d-none');
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

        } catch (error) {
            console.error('Error:', error);
            if (errorMessage) {
                errorMessage.textContent = error.message;
                errorMessage.classList.remove('d-none');
            }
        } finally {
            // Reset button state
            submitButton.disabled = false;
            submitButton.innerHTML = originalButtonText;
        }
    });
});
