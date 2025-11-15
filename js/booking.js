// Vidoltsie Trading Booking Form JavaScript
document.addEventListener('DOMContentLoaded', function() {
    // Set minimum date to today
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('service-date').min = today;

    // Check if user is logged in and pre-fill info
    fetch('../api/auth.php')
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                // User is logged in, pre-fill their info
                document.getElementById('customer-email').value = data.user.email;
                // Could also pre-fill name if available
                fetch(`../api/users.php?id=${data.user.id}`)
                    .then(response => response.json())
                    .then(userData => {
                        if (userData.success) {
                            document.getElementById('customer-name').value = userData.user.name;
                            if (userData.user.phone) {
                                document.getElementById('mobile').value = userData.user.phone;
                            }
                        }
                    })
                    .catch(error => console.error('Error loading user profile:', error));
            }
        })
        .catch(error => {
            console.error('Auth check failed:', error);
            // Fallback to localStorage for backward compatibility
            const userEmail = localStorage.getItem('user_email');
            if (userEmail) {
                document.getElementById('customer-email').value = userEmail;
            }
        });

    // Load services dynamically
    loadServices();

    // Form submission
    document.getElementById('booking-form').addEventListener('submit', handleBookingSubmit);

    // Change Password form
    document.getElementById('change-password-form').addEventListener('submit', changePassword);

    // Edit Account form
    document.getElementById('edit-account-form').addEventListener('submit', updateAccount);

    // Basic form setup
    const serviceDateInput = document.getElementById('service-date');
    const customTimeInput = document.getElementById('custom-time');
    const submitBtn = document.querySelector('.submit-btn');

    // Modal close handlers
    window.onclick = function(event) {
        const myAccountModal = document.getElementById('my-account-modal');
        const changePasswordModal = document.getElementById('change-password-modal');
        if (event.target === myAccountModal) {
            closeMyAccountModal();
        }
        if (event.target === changePasswordModal) {
            closeChangePasswordModal();
        }
    };
});

function loadServices() {
    fetch('../api/services.php')
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                const servicesGrid = document.querySelector('.services-grid');
                servicesGrid.innerHTML = ''; // Clear existing hardcoded services

                data.services.forEach(service => {
                    const serviceLabel = document.createElement('label');
                    serviceLabel.className = 'service-checkbox';
                    serviceLabel.innerHTML = `
                        <input type="checkbox" name="services" value="${service.name}">
                        <span class="checkmark"></span>
                        ${service.name}
                    `;
                    servicesGrid.appendChild(serviceLabel);
                });
            }
        })
        .catch(error => {
            console.error('Error loading services:', error);
        });
}

// Branch functionality removed - now using single branch selection

function handleBookingSubmit(e) {
    e.preventDefault();

    // Check if submit button is disabled (time unavailable)
    const currentSubmitBtn = e.target.querySelector('.submit-btn');
    if (currentSubmitBtn.disabled) {
        return; // Don't proceed if button is disabled
    }

    // Collect form data
    const formData = {
        name: document.getElementById('customer-name').value.trim(),
        email: document.getElementById('customer-email').value.trim(),
        telephone: '', // Not used in customer form
        mobile: document.getElementById('contact-number').value.trim(),
        address: document.getElementById('address').value.trim(),
        carModel: document.getElementById('car-model').value.trim(),
        carYear: document.getElementById('car-year').value.trim(),
        staffAssisted: '', // Removed staff assistance field
        branches: [], // Removed branch selection
        services: Array.from(document.querySelectorAll('input[name="services"]:checked')).map(cb => cb.value),
        otherServices: document.getElementById('other-services').value.trim(),
        serviceDate: document.getElementById('service-date').value,
        serviceTime: '', // No dropdown anymore
        customTime: document.getElementById('custom-time').value.trim(),
        specialNotes: document.getElementById('special-notes').value.trim(),
        submittedAt: new Date().toISOString()
    };

    // Combine telephone and mobile for contact
    formData.contact = formData.mobile + (formData.telephone ? ' / ' + formData.telephone : '');

    // Validate required fields
    if (!formData.name) {
        alert('Please enter your full name');
        document.getElementById('customer-name').focus();
        return;
    }

    if (!formData.email) {
        alert('Please enter your email address');
        document.getElementById('customer-email').focus();
        return;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
        alert('Please enter a valid email address');
        document.getElementById('customer-email').focus();
        return;
    }

    if (!formData.mobile) {
        alert('Please enter your mobile number');
        document.getElementById('mobile').focus();
        return;
    }

    // Basic phone number validation for mobile
    const mobileRegex = /^(\+63|0|63)?[0-9]{10,11}$/;
    if (!mobileRegex.test(formData.mobile.replace(/\s+/g, ''))) {
        alert('Please enter a valid mobile number');
        document.getElementById('mobile').focus();
        return;
    }

    if (!formData.address) {
        alert('Please enter your complete address');
        document.getElementById('address').focus();
        return;
    }

    if (!formData.carModel) {
        alert('Please enter your car model');
        document.getElementById('car-model').focus();
        return;
    }

    if (!formData.carYear) {
        alert('Please enter your car year');
        document.getElementById('car-year').focus();
        return;
    }

    // Validate car year
    const currentYear = new Date().getFullYear();
    const carYear = parseInt(formData.carYear);
    if (carYear < 1900 || carYear > currentYear + 1) {
        alert('Please enter a valid car year');
        document.getElementById('car-year').focus();
        return;
    }

    // Branch selection removed - no validation needed

    if (formData.services.length === 0) {
        alert('Please select at least one service');
        return;
    }

    if (!formData.serviceDate) {
        alert('Please select a preferred service date');
        document.getElementById('service-date').focus();
        return;
    }

    // Validate custom time format (required field)
    if (!formData.customTime.trim()) {
        alert('Please specify your preferred service time');
        document.getElementById('custom-time').focus();
        return;
    }

    const parsedTime = parseTimeInput(formData.customTime.trim());
    if (!parsedTime) {
        alert('Please enter a valid time format (e.g., 10:25 AM, 2:30 PM)');
        document.getElementById('custom-time').focus();
        return;
    }
    formData.customTime = parsedTime; // Store parsed time

    // Allow booking at any time - no business hours restrictions for advance booking

    // Show loading state
    const submitBtn = e.target.querySelector('.submit-btn');
    submitBtn.disabled = true;
    submitBtn.textContent = 'Submitting...';
    submitBtn.style.background = '';

    // Send to API
    fetch('../api/booking.php', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData)
    })
    .then(response => response.json())
    .then(data => {
        submitBtn.disabled = false;
        submitBtn.textContent = 'Book Appointment';
        submitBtn.style.background = '';

        if (data.success) {
            // Show success modal with receipt (center of screen only)
            showSuccessModal(formData);

            // Trigger admin update
            triggerAdminUpdate();

            // Reset form
            e.target.reset();
        } else {
            if (data.error_type === 'time_unavailable' || (data.message && data.message.includes('not available'))) {
                // Time slot already booked
                showTimeConflictModal(formData.serviceDate, formatTime(formData.serviceTime));
            } else {
                // Other error
                alert('Booking failed: ' + (data.message || 'Unknown error'));
            }
        }
    })
    .catch(error => {
        submitBtn.disabled = false;
        submitBtn.textContent = 'Book Appointment';
        submitBtn.style.background = '';
        alert('An error occurred while submitting your booking. Please try again.');
        console.error('Booking error:', error);
    });
}

function showSuccessModal(bookingData) {
    const modal = document.getElementById('success-modal');
    const summary = document.getElementById('booking-summary');

    // Create simple success message with details
    summary.innerHTML = `
        <div style="text-align: center; margin-bottom: 2rem;">
            <div style="font-size: 4rem; margin-bottom: 1rem;">✅</div>
            <h1 style="color: #28a745; margin-bottom: 1rem; font-size: 2.5rem;">You Successfully Booked!</h1>
            <p style="color: #666; font-size: 1.2rem; margin-bottom: 2rem;">Your appointment has been scheduled successfully</p>
        </div>

        <div style="background: #f8f9fa; padding: 2rem; border-radius: 10px; border: 2px solid #28a745;">
            <h2 style="text-align: center; color: #333; margin-bottom: 2rem; font-size: 1.8rem;">📋 Your Booking Details</h2>

            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1.5rem; margin-bottom: 2rem;">
                <div style="background: white; padding: 1rem; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                    <strong style="color: #007bff;">Customer Name:</strong><br>
                    <span style="font-size: 1.1rem;">${bookingData.name}</span>
                </div>
                <div style="background: white; padding: 1rem; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                    <strong style="color: #007bff;">Email:</strong><br>
                    <span style="font-size: 1.1rem;">${bookingData.email}</span>
                </div>
                <div style="background: white; padding: 1rem; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                    <strong style="color: #007bff;">Contact:</strong><br>
                    <span style="font-size: 1.1rem;">${bookingData.contact}</span>
                </div>
                <div style="background: white; padding: 1rem; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                    <strong style="color: #007bff;">Address:</strong><br>
                    <span style="font-size: 1.1rem;">${bookingData.address}</span>
                </div>
            </div>

            <div style="background: white; padding: 1.5rem; border-radius: 8px; margin-bottom: 2rem; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                <strong style="color: #007bff; font-size: 1.2rem;">Vehicle Information:</strong><br>
                <span style="font-size: 1.1rem;">${bookingData.carModel} (${bookingData.carYear})</span>
            </div>

            <div style="background: white; padding: 1.5rem; border-radius: 8px; margin-bottom: 2rem; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                <strong style="color: #007bff; font-size: 1.2rem;">Services Requested:</strong><br>
                <span style="font-size: 1.1rem;">${bookingData.services.join(', ')}${bookingData.otherServices ? ', ' + bookingData.otherServices : ''}</span>
            </div>

            <div style="background: #e3f2fd; padding: 2rem; border-radius: 10px; border-left: 5px solid #007bff; margin-bottom: 2rem;">
                <div style="text-align: center;">
                    <div style="font-size: 2rem; margin-bottom: 1rem;">📅 🕐</div>
                    <div style="font-size: 1.5rem; font-weight: bold; color: #007bff; margin-bottom: 0.5rem;">Appointment Scheduled</div>
                    <div style="font-size: 1.3rem; margin-bottom: 0.5rem;">${formatDate(bookingData.serviceDate)}</div>
                    <div style="font-size: 1.4rem; font-weight: bold; color: #28a745;">${bookingData.customTime ? formatTimeForDisplay(bookingData.customTime) : formatTime(bookingData.serviceTime)}</div>
                </div>
            </div>

            ${bookingData.specialNotes ? `
            <div style="background: #fff3cd; padding: 1.5rem; border-radius: 8px; border-left: 5px solid #ffc107; margin-bottom: 2rem;">
                <strong style="color: #856404; font-size: 1.2rem;">Special Notes:</strong><br>
                <span style="font-size: 1.1rem;">${bookingData.specialNotes}</span>
            </div>
            ` : ''}

            <div style="text-align: center; color: #666; font-size: 1rem; margin-top: 2rem; padding-top: 2rem; border-top: 1px solid #dee2e6;">
                <div><strong>Booking Submitted:</strong> ${formatDateTime(bookingData.submittedAt)}</div>
                <div style="margin-top: 1rem; color: #28a745; font-weight: bold; font-size: 1.1rem;">
                    📞 We will contact you at ${bookingData.contact} to confirm your appointment
                </div>
            </div>
        </div>
    `;

    modal.style.display = 'block';
}

function closeModal() {
    document.getElementById('success-modal').style.display = 'none';
}

function showMyAccount() {
    // Check if user is logged in via API
    fetch('../api/auth.php')
        .then(response => response.json())
        .then(data => {
            if (!data.success) {
                alert('Please login to view your account');
                window.location.href = 'login.html';
                return;
            }

            // Get full user details
            fetch(`../api/users.php?id=${data.user.id}`)
                .then(response => response.json())
                .then(userData => {
                    if (!userData.success) {
                        alert('Account not found. Please login again.');
                        logoutCustomer();
                        return;
                    }

                    const user = userData.user;
                    const modal = document.getElementById('my-account-modal');

                    // Populate account details in the new design
                    document.getElementById('account-name').textContent = user.name;
                    document.getElementById('account-email').textContent = user.email;
                    document.getElementById('account-phone').textContent = user.phone || 'Not provided';
                    document.getElementById('account-created').textContent = new Date(user.created_at).toLocaleDateString();

                    // Show account details, hide edit form
                    document.getElementById('account-details').style.display = 'block';
                    document.getElementById('account-edit-form').style.display = 'none';

                    modal.style.display = 'block';
                })
                .catch(error => {
                    console.error('Error loading user profile:', error);
                    alert('Error loading account information. Please try again.');
                });
        })
        .catch(error => {
            console.error('Auth check failed:', error);
            alert('Please login to view your account');
            window.location.href = 'login.html';
        });
}

function closeMyAccountModal() {
    document.getElementById('my-account-modal').style.display = 'none';
    document.getElementById('account-details').style.display = 'block';
    document.getElementById('account-edit-form').style.display = 'none';
}

function showEditAccount() {
    // Populate edit form with current values
    document.getElementById('edit-name').value = document.getElementById('account-name').textContent;
    document.getElementById('edit-email').value = document.getElementById('account-email').textContent;
    document.getElementById('edit-phone').value = document.getElementById('account-phone').textContent === 'Not provided' ? '' : document.getElementById('account-phone').textContent;

    // Show edit form, hide account details
    document.getElementById('account-details').style.display = 'none';
    document.getElementById('account-edit-form').style.display = 'block';
}

function cancelEdit() {
    // Show account details, hide edit form
    document.getElementById('account-details').style.display = 'block';
    document.getElementById('account-edit-form').style.display = 'none';
}

function updateAccount(e) {
    e.preventDefault();

    const formData = {
        name: document.getElementById('edit-name').value.trim(),
        email: document.getElementById('edit-email').value.trim(),
        phone: document.getElementById('edit-phone').value.trim()
    };

    // Basic validation
    if (!formData.name) {
        alert('Please enter your name');
        document.getElementById('edit-name').focus();
        return;
    }

    if (!formData.email) {
        alert('Please enter your email');
        document.getElementById('edit-email').focus();
        return;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
        alert('Please enter a valid email address');
        document.getElementById('edit-email').focus();
        return;
    }

    // Get current user email from API session
    fetch('../api/auth.php')
        .then(response => response.json())
        .then(data => {
            if (!data.success) {
                alert('Please login again.');
                logoutCustomer();
                return;
            }

            // Update account via API
            fetch(`../api/users.php?email=${encodeURIComponent(data.user.email)}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(formData)
            })
            .then(response => response.json())
            .then(updateData => {
                if (updateData.success) {
                    // Update displayed information
                    document.getElementById('account-name').textContent = formData.name;
                    document.getElementById('account-email').textContent = formData.email;
                    document.getElementById('account-phone').textContent = formData.phone || 'Not provided';

                    // Show success message and return to details view
                    alert('Account information updated successfully!');
                    cancelEdit();
                } else {
                    alert('Failed to update account: ' + (updateData.message || 'Unknown error'));
                }
            })
            .catch(error => {
                console.error('Account update error:', error);
                alert('An error occurred. Please try again.');
            });
        })
        .catch(error => {
            console.error('Auth check failed:', error);
            alert('Please login again.');
            logoutCustomer();
        });
}


function logoutCustomer() {
    // Call API logout
    fetch('../api/auth.php', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action: 'logout' })
    })
    .then(response => response.json())
    .then(data => {
        // Clear localStorage regardless of API response
        localStorage.removeItem('user_role');
        localStorage.removeItem('user_name');
        localStorage.removeItem('user_email');
        window.location.href = 'login.html';
    })
    .catch(error => {
        console.error('Logout error:', error);
        // Clear localStorage even if API fails
        localStorage.removeItem('user_role');
        localStorage.removeItem('user_name');
        localStorage.removeItem('user_email');
        window.location.href = 'login.html';
    });
}


function goHome() {
    window.location.href = '../index.html';
}

function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
}

function formatTime(timeString) {
    if (!timeString) return 'Not specified';
    const [hours, minutes] = timeString.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
}

function formatTimeForDisplay(timeString) {
    if (!timeString) return 'Not specified';
    // If it's already in HH:MM format, convert to display format
    if (timeString.includes(':')) {
        const [hours, minutes] = timeString.split(':');
        const hour = parseInt(hours);
        const ampm = hour >= 12 ? 'PM' : 'AM';
        const displayHour = hour % 12 || 12;
        return `${displayHour}:${minutes} ${ampm}`;
    }
    return timeString;
}

function formatDateTime(dateString) {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

// Real-time validation for custom time input
function validateCustomTime(timeInput, dateInput) {
    const customTimeInput = document.getElementById('custom-time');

    if (!timeInput || !dateInput) {
        customTimeInput.style.borderColor = '#ddd';
        return;
    }

    // Parse the time input (supports formats like "9:30 AM", "2:15 PM", "14:30", etc.)
    const parsedTime = parseTimeInput(timeInput);
    if (!parsedTime) {
        customTimeInput.style.borderColor = '#ffc107'; // Yellow for invalid format
        return;
    }

    // Check if this time slot is already booked
    const bookings = JSON.parse(localStorage.getItem('bookings') || '[]');
    const isBooked = bookings.some(booking => {
        if (booking.serviceDate !== dateInput) return false;

        // Only check customTime bookings (actual bookings)
        return booking.customTime === parsedTime;
    });

    if (isBooked) {
        customTimeInput.style.borderColor = '#dc3545'; // Red for booked
        customTimeInput.title = 'This time slot is already booked';
    } else {
        customTimeInput.style.borderColor = '#28a745'; // Green for available
        customTimeInput.title = 'This time slot is available';
    }
}

function parseTimeInput(timeString) {
    // Handle various time formats
    const timeStr = timeString.toLowerCase().trim();

    // Match patterns like "9:30 am", "2:15 pm", "14:30", "9:30am", etc.
    const timeRegex = /^(\d{1,2}):(\d{2})\s*(am|pm)?$/i;
    const match = timeStr.match(timeRegex);

    if (!match) return null;

    let hours = parseInt(match[1]);
    const minutes = parseInt(match[2]);
    const ampm = match[3];

    if (ampm) {
        if (ampm.toLowerCase() === 'pm' && hours !== 12) {
            hours += 12;
        } else if (ampm.toLowerCase() === 'am' && hours === 12) {
            hours = 0;
        }
    }

    // Validate hours and minutes
    if (hours < 0 || hours > 23 || minutes < 0 || minutes > 59) {
        return null;
    }

    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
}

function formatTimeForComparison(timeString) {
    if (!timeString) return '';
    // Convert HH:MM to HH:MM format for comparison
    return timeString;
}

function triggerAdminUpdate() {
    // Send a message to any open admin windows to refresh their data
    const adminMessage = {
        type: 'booking_update',
        timestamp: Date.now()
    };

    // Try to send message to parent window (if admin is open in another tab/frame)
    if (window.parent && window.parent !== window) {
        window.parent.postMessage(adminMessage, '*');
    }

    // Also send to any other windows
    window.postMessage(adminMessage, '*');
}

// Listen for admin update messages
window.addEventListener('message', function(event) {
    if (event.data && event.data.type === 'booking_update') {
        // If this is an admin window, refresh the data
        if (typeof refreshAllAdminData === 'function') {
            refreshAllAdminData();
        }
    }
});

function showChangePassword() {
    document.getElementById('change-password-modal').style.display = 'block';
    document.getElementById('change-password-form').reset();
    document.getElementById('change-password-message').style.display = 'none';
}

function closeChangePasswordModal() {
    document.getElementById('change-password-modal').style.display = 'none';
}

function changePassword(e) {
    e.preventDefault();

    const messageDiv = document.getElementById('change-password-message');
    const currentPassword = document.getElementById('current-password').value;
    const newPassword = document.getElementById('new-password').value;
    const confirmPassword = document.getElementById('confirm-password').value;

    // Clear previous messages
    messageDiv.style.display = 'none';
    messageDiv.className = 'message';

    // Validate current password is not empty
    if (!currentPassword.trim()) {
        showMessage('Please enter your current password.', 'error');
        return;
    }

    // Validate new password is not empty and minimum length
    if (!newPassword.trim() || newPassword.length < 6) {
        showMessage('New password must be at least 6 characters long.', 'error');
        return;
    }

    // Validate new password confirmation
    if (newPassword !== confirmPassword) {
        showMessage('New password and confirmation do not match.', 'error');
        return;
    }

    // Get current user email from API session
    fetch('../api/auth.php')
        .then(response => response.json())
        .then(data => {
            if (!data.success) {
                showMessage('Please login again.', 'error');
                logoutCustomer();
                return;
            }

            // Update password via API
            fetch(`../api/users.php?email=${encodeURIComponent(data.user.email)}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    currentPassword: currentPassword,
                    newPassword: newPassword
                })
            })
            .then(response => response.json())
            .then(updateData => {
                if (updateData.success) {
                    showMessage('Password changed successfully!', 'success');
                    // Clear form and close modal after delay
                    setTimeout(() => {
                        closeChangePasswordModal();
                    }, 2000);
                } else {
                    showMessage(updateData.message || 'Failed to change password.', 'error');
                }
            })
            .catch(error => {
                console.error('Password change error:', error);
                showMessage('An error occurred. Please try again.', 'error');
            });
        })
        .catch(error => {
            console.error('Auth check failed:', error);
            showMessage('Please login again.', 'error');
            logoutCustomer();
        });
}

function showMessage(message, type) {
    const messageDiv = document.getElementById('change-password-message');
    messageDiv.textContent = message;
    messageDiv.className = `message ${type}`;
    messageDiv.style.display = 'block';
}


function markTimeAsBooked(timeValue) {
    // Mark the time select option as booked
    const options = serviceTimeSelect.options;
    for (let i = 0; i < options.length; i++) {
        if (options[i].value === timeValue) {
            options[i].style.color = '#dc3545';
            options[i].style.fontWeight = 'bold';
            // Only add (Booked) if not already added
            if (!options[i].textContent.includes('(Booked)')) {
                options[i].textContent = options[i].textContent.replace(' (Booked)', '') + ' (Booked)';
            }
            break;
        }
    }

    // Mark custom time input as booked
    if (customTimeInput.value.trim() === timeValue) {
        customTimeInput.style.borderColor = '#dc3545';
        customTimeInput.style.backgroundColor = '#ffe6e6';
    }
}

function resetTimeVisualMarking(timeValue) {
    // Reset the time select option styling
    const options = serviceTimeSelect.options;
    for (let i = 0; i < options.length; i++) {
        if (options[i].value === timeValue) {
            options[i].style.color = '';
            options[i].style.fontWeight = '';
            options[i].textContent = options[i].textContent.replace(' (Booked)', '');
            break;
        }
    }

    // Reset custom time input styling
    if (customTimeInput.value.trim() === timeValue) {
        customTimeInput.style.borderColor = '';
        customTimeInput.style.backgroundColor = '';
    }
}


function showSuccessNotification(message) {
    // Remove existing notifications
    const existingNotifications = document.querySelectorAll('.success-notification');
    existingNotifications.forEach(notification => notification.remove());

    // Create notification element
    const notification = document.createElement('div');
    notification.className = 'success-notification';
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: #28a745;
        color: white;
        padding: 1rem 1.5rem;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.3);
        z-index: 10000;
        font-weight: 500;
        max-width: 400px;
        animation: slideInRight 0.3s ease;
    `;
    notification.innerHTML = `
        <div style="display: flex; align-items: center; gap: 0.5rem;">
            <span>${message}</span>
            <button onclick="this.parentElement.parentElement.remove()" style="
                background: none;
                border: none;
                color: white;
                font-size: 1.2rem;
                cursor: pointer;
                padding: 0;
                margin-left: auto;
            ">×</button>
        </div>
    `;

    document.body.appendChild(notification);

    // Add CSS animation if not already present
    if (!document.getElementById('notification-styles')) {
        const style = document.createElement('style');
        style.id = 'notification-styles';
        style.textContent = `
            @keyframes slideInRight {
                from {
                    transform: translateX(100%);
                    opacity: 0;
                }
                to {
                    transform: translateX(0);
                    opacity: 1;
                }
            }
        `;
        document.head.appendChild(style);
    }

    // Auto remove after 5 seconds
    setTimeout(() => {
        if (notification.parentElement) {
            notification.remove();
        }
    }, 5000);
}

function showTimeConflictModal(date, time) {
    // Create modal overlay
    const modalOverlay = document.createElement('div');
    modalOverlay.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.6);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 10000;
        animation: fadeIn 0.3s ease;
    `;

    // Create modal content
    const modalContent = document.createElement('div');
    modalContent.style.cssText = `
        background: white;
        border-radius: 12px;
        padding: 2rem;
        max-width: 450px;
        width: 90%;
        box-shadow: 0 10px 30px rgba(0,0,0,0.3);
        text-align: center;
        animation: modalSlideIn 0.3s ease;
        position: relative;
    `;

    modalContent.innerHTML = `
        <div style="font-size: 3rem; margin-bottom: 1rem;">😞</div>
        <h3 style="color: #dc3545; margin-bottom: 1rem; font-size: 1.4rem;">Sorry, Time Slot Unavailable</h3>
        <p style="color: #666; margin-bottom: 1.5rem; line-height: 1.5;">
            The time slot <strong>${time}</strong> on <strong>${formatDate(date)}</strong> is already booked by another customer.
            Please select a different date or time to proceed with your booking.
        </p>
        <button onclick="this.closest('.time-conflict-modal').remove()" style="
            background: #dc3545;
            color: white;
            border: none;
            padding: 0.75rem 2rem;
            border-radius: 6px;
            font-size: 1rem;
            font-weight: 500;
            cursor: pointer;
            transition: background-color 0.3s;
        " onmouseover="this.style.background='#c82333'" onmouseout="this.style.background='#dc3545'">
            Choose Different Time
        </button>
    `;

    modalOverlay.className = 'time-conflict-modal';
    modalOverlay.appendChild(modalContent);
    document.body.appendChild(modalOverlay);

    // Add CSS animations if not already present
    if (!document.getElementById('modal-notification-styles')) {
        const style = document.createElement('style');
        style.id = 'modal-notification-styles';
        style.textContent = `
            @keyframes fadeIn {
                from { opacity: 0; }
                to { opacity: 1; }
            }
            @keyframes modalSlideIn {
                from {
                    opacity: 0;
                    transform: scale(0.8) translateY(-20px);
                }
                to {
                    opacity: 1;
                    transform: scale(1) translateY(0);
                }
            }
        `;
        document.head.appendChild(style);
    }
}

function showBookingConflictNotification(time, date) {
    // Create modal overlay
    const modalOverlay = document.createElement('div');
    modalOverlay.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.6);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 10000;
        animation: fadeIn 0.3s ease;
    `;

    // Create modal content
    const modalContent = document.createElement('div');
    modalContent.style.cssText = `
        background: white;
        border-radius: 12px;
        padding: 2rem;
        max-width: 450px;
        width: 90%;
        box-shadow: 0 10px 30px rgba(0,0,0,0.3);
        text-align: center;
        animation: modalSlideIn 0.3s ease;
        position: relative;
    `;

    modalContent.innerHTML = `
        <div style="font-size: 3rem; margin-bottom: 1rem;">⚠️</div>
        <h3 style="color: #dc3545; margin-bottom: 1rem; font-size: 1.4rem;">Time Slot Already Booked</h3>
        <p style="color: #666; margin-bottom: 1.5rem; line-height: 1.5;">
            The time slot <strong>${time}</strong> on <strong>${formatDate(date)}</strong> is already booked by another customer.
            Please select a different time to proceed with your booking.
        </p>
        <button onclick="this.closest('.booking-conflict-modal').remove()" style="
            background: #dc3545;
            color: white;
            border: none;
            padding: 0.75rem 2rem;
            border-radius: 6px;
            font-size: 1rem;
            font-weight: 500;
            cursor: pointer;
            transition: background-color 0.3s;
        " onmouseover="this.style.background='#c82333'" onmouseout="this.style.background='#dc3545'">
            I Understand
        </button>
    `;

    modalOverlay.className = 'booking-conflict-modal';
    modalOverlay.appendChild(modalContent);
    document.body.appendChild(modalOverlay);

    // Add CSS animations if not already present
    if (!document.getElementById('modal-notification-styles')) {
        const style = document.createElement('style');
        style.id = 'modal-notification-styles';
        style.textContent = `
            @keyframes fadeIn {
                from { opacity: 0; }
                to { opacity: 1; }
            }
            @keyframes modalSlideIn {
                from {
                    opacity: 0;
                    transform: scale(0.8) translateY(-20px);
                }
                to {
                    opacity: 1;
                    transform: scale(1) translateY(0);
                }
            }
        `;
        document.head.appendChild(style);
    }
}