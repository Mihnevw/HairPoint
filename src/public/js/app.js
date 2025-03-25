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
            let hasErrors = false;

            // Date validation
            if (!selectedDateDiv.textContent || selectedDateDiv.textContent === 'Изберете дата от календара') {
                showError('Моля, изберете дата от календара');
                selectedDateDiv.classList.add('is-invalid');
                hasErrors = true;
                return;
            }

            // Start time validation
            const startTime = startTimeSelect.value;
            if (!startTime) {
                showError('Моля, изберете начален час');
                startTimeSelect.classList.add('is-invalid');
                hasErrors = true;
                return;
            }

            // End time validation
            const endTime = endTimeSelect.value;
            if (!endTime) {
                showError('Моля, изберете краен час');
                endTimeSelect.classList.add('is-invalid');
                hasErrors = true;
                return;
            }

            // Name validation
            const nameInput = document.getElementById('name');
            if (!nameInput.value.trim()) {
                showError('Моля, въведете вашето име');
                nameInput.classList.add('is-invalid');
                hasErrors = true;
                return;
            }

            // Phone validation
            const phoneInput = document.getElementById('phone');
            const phoneValue = phoneInput.value.replace(/\s/g, ''); // Remove spaces for validation
            if (!phoneValue || phoneValue.length < 10) {
                showError('Моля, въведете валиден телефонен номер (10 цифри)');
                phoneInput.classList.add('is-invalid');
                hasErrors = true;
                return;
            }

            // Email validation
            const emailInput = document.getElementById('email');
            const emailValue = emailInput.value.trim().toLowerCase();
            if (!emailValue) {
                showError('Моля, въведете имейл адрес');
                emailInput.classList.add('is-invalid');
                hasErrors = true;
                return;
            }
            
            // Specific Gmail validation
            if (!emailValue.endsWith('@gmail.com')) {
                showError('Моля, използвайте Gmail адрес (@gmail.com)');
                emailInput.classList.add('is-invalid');
                hasErrors = true;
                return;
            }

            if (hasErrors) {
                return;
            }

            // Remove any previous validation styling
            const formInputs = form.querySelectorAll('.form-control, .form-select');
            formInputs.forEach(input => input.classList.remove('is-invalid'));

            // Get CSRF token from the hidden input field
            const csrfToken = document.querySelector('input[name="_csrf"]')?.value;

            if (!csrfToken) {
                debug('CSRF token not found in form', {
                    cookies: document.cookie,
                    metaToken: document.querySelector('meta[name="csrf-token"]')?.content,
                    inputToken: document.querySelector('input[name="_csrf"]')?.value
                });
                throw new Error('Security token missing. Please refresh the page.');
            }

            // Verify all form elements exist
            if (!nameInput || !phoneInput || !emailInput) {
                throw new Error('Form elements not found. Please refresh the page.');
            }

            const formData = {
                date: selectedDateDiv.textContent,
                startTime: startTimeSelect.value,
                endTime: endTimeSelect.value,
                name: nameInput.value,
                phone: phoneValue,
                email: emailValue,
                _csrf: csrfToken
            };

            // Add input event listeners for real-time validation
            document.addEventListener('DOMContentLoaded', () => {
                // ... existing DOMContentLoaded code ...

                // Real-time email validation
                emailInput.addEventListener('input', () => {
                    const email = emailInput.value.trim().toLowerCase();
                    if (email && !email.endsWith('@gmail.com')) {
                        emailInput.classList.add('is-invalid');
                        showError('Моля, използвайте Gmail адрес (@gmail.com)');
                    } else {
                        emailInput.classList.remove('is-invalid');
                        hideMessages();
                    }
                });

                // Real-time phone validation
                phoneInput.addEventListener('input', () => {
                    const phone = phoneInput.value.replace(/\s/g, '');
                    if (phone && phone.length !== 10) {
                        phoneInput.classList.add('is-invalid');
                        showError('Телефонният номер трябва да е 10 цифри');
                    } else {
                        phoneInput.classList.remove('is-invalid');
                        hideMessages();
                    }
                });

                // Real-time name validation
                nameInput.addEventListener('input', () => {
                    if (!nameInput.value.trim()) {
                        nameInput.classList.add('is-invalid');
                        showError('Моля, въведете вашето име');
                    } else {
                        nameInput.classList.remove('is-invalid');
                        hideMessages();
                    }
                });

                // Time selection validation
                startTimeSelect.addEventListener('change', () => {
                    if (!startTimeSelect.value) {
                        startTimeSelect.classList.add('is-invalid');
                        showError('Моля, изберете начален час');
                    } else {
                        startTimeSelect.classList.remove('is-invalid');
                        hideMessages();
                    }
                });

                endTimeSelect.addEventListener('change', () => {
                    if (!endTimeSelect.value) {
                        endTimeSelect.classList.add('is-invalid');
                        showError('Моля, изберете краен час');
                    } else {
                        endTimeSelect.classList.remove('is-invalid');
                        hideMessages();
                    }
                });
            });

            debug('Submitting form', { 
                formData: { ...formData, _csrf: 'HIDDEN' }
            });

            showLoading();
            
            const response = await fetch('/api/reservations', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'CSRF-Token': csrfToken
                },
                credentials: 'include',
                body: JSON.stringify(formData)
            });

            const data = await response.json();
            
            debug('Response received', { 
                status: response.status,
                statusText: response.statusText,
                data: data
            });

            if (!response.ok) {
                if (response.status === 403) {
                    throw new Error('Security token expired. Please refresh the page.');
                } else if (response.status === 400) {
                    throw new Error(data.message || 'Please check your input and try again.');
                } else {
                    throw new Error(data.message || 'Не успяхте да запазите час, защото часът е зает. Моля, изберете друг час/дата!');
                }
            }

            showSuccess('Успешно запазихте час!');
            form.reset();
            selectedDateDiv.textContent = 'Изберете дата от календара';
            startTimeSelect.value = '';
            endTimeSelect.value = '';
            endTimeSelect.disabled = true;

            // Optionally refresh available slots
            if (calendar) {
                calendar.refetchEvents();
            }

        } catch (error) {
            console.error('Form submission error:', error);
            showError(error.message || 'Error submitting form. Please try again.');
        } finally {
            hideLoading();
        }
    });
});
