// Admin Panel JavaScript
document.addEventListener('DOMContentLoaded', function() {
    // Check authentication
    checkAuth();

    // Navigation
    const navButtons = document.querySelectorAll('.nav-btn');
    navButtons.forEach(btn => {
        btn.addEventListener('click', function() {
            const section = this.getAttribute('data-section');
            showSection(section);
        });
    });

    // Logout
    document.getElementById('logout-btn').addEventListener('click', logout);


    // Appointments - refresh button removed

    // Calendar
    document.getElementById('prev-month').addEventListener('click', () => changeMonth(-1));
    document.getElementById('next-month').addEventListener('click', () => changeMonth(1));

    // Users
    document.getElementById('refresh-users').addEventListener('click', loadUsers);

    // Services
    document.getElementById('add-service-btn').addEventListener('click', () => showServiceModal());
    document.getElementById('refresh-services').addEventListener('click', loadServices);


    // Service modal
    const serviceModal = document.getElementById('service-modal');
    const serviceCloseBtn = serviceModal.querySelector('.close');
    serviceCloseBtn.onclick = function() {
        console.log('Close button clicked');
        serviceModal.style.display = 'none';
    };

    // Date modal
    const dateModal = document.getElementById('date-modal');
    const dateCloseBtn = dateModal.querySelector('.close');
    dateCloseBtn.onclick = () => closeDateModal();

    window.onclick = (event) => {
        if (event.target === serviceModal) {
            serviceModal.style.display = 'none';
        }
        if (event.target === dateModal) {
            closeDateModal();
        }
    };

    document.getElementById('service-form').addEventListener('submit', saveService);



    // Load initial data
    loadDashboard();
    loadAppointments();
    loadUsers();
    loadServices();
    loadAdminAccounts();

    // Initialize business status after a short delay to ensure DOM is ready
    setTimeout(() => {
        console.log('Initializing business status...');
        updateAdminBusinessStatus();
    }, 100);

    // Status control buttons
    const forceOpenBtn = document.getElementById('force-open-btn');
    const forceClosedBtn = document.getElementById('force-closed-btn');
    const resetStatusBtn = document.getElementById('reset-status-btn');

    console.log('Status control buttons found:', {
        forceOpen: !!forceOpenBtn,
        forceClosed: !!forceClosedBtn,
        resetStatus: !!resetStatusBtn
    });

    if (forceOpenBtn) {
        forceOpenBtn.addEventListener('click', () => {
            console.log('Force Open button clicked');
            setBusinessStatus('open');
        });
    }
    if (forceClosedBtn) {
        forceClosedBtn.addEventListener('click', () => {
            console.log('Force Closed button clicked');
            setBusinessStatus('closed');
        });
    }
    if (resetStatusBtn) {
        resetStatusBtn.addEventListener('click', () => {
            console.log('Reset to Auto button clicked');
            setBusinessStatus('auto');
        });
    }
    initializeCalendar();

    // Auto-refresh all admin data every 30 seconds
    setInterval(refreshAllAdminData, 30000);

    // Listen for booking updates from customer forms
    window.addEventListener('message', function(event) {
        if (event.data && event.data.type === 'booking_update') {
            console.log('Received booking update, refreshing data...');
            refreshAllAdminData();

            // If zoom view is open, refresh it immediately
            if (document.getElementById('calendar-zoom').style.display === 'block') {
                const currentDate = currentDateDetails;
                if (currentDate) {
                    loadZoomTimes(currentDate);
                }
            }
        }
    });
});

function checkAuth() {
    // Check admin authentication via API
    fetch('../api/auth.php')
        .then(response => response.json())
        .then(data => {
            if (!data.success || data.user.role !== 'admin') {
                console.log('Admin authentication failed, redirecting to login');
                window.location.href = 'login.html';
            } else {
                console.log('Admin authenticated:', data.user.name);
                document.getElementById('user-name').textContent = data.user.name;
            }
        })
        .catch(error => {
            console.error('Auth check failed:', error);
            window.location.href = 'login.html';
        });
}

function logout() {
    // Use API for logout
    fetch('../api/auth.php', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action: 'logout' })
    })
    .then(response => response.json())
    .then(data => {
        console.log('Logout response:', data);
        // Always redirect to login, regardless of API response
        window.location.href = 'login.html';
    })
    .catch(error => {
        console.error('Logout error:', error);
        // Still redirect even if logout fails
        window.location.href = 'login.html';
    });
}

function showSection(sectionName) {
    // Hide all sections
    document.querySelectorAll('.section').forEach(section => {
        section.classList.remove('active');
    });

    // Remove active class from nav buttons
    document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.classList.remove('active');
    });

    // Show selected section
    document.getElementById(sectionName + '-section').classList.add('active');
    document.querySelector(`[data-section="${sectionName}"]`).classList.add('active');

    // If switching to calendar, immediately show current month
    if (sectionName === 'calendar') {
        const now = new Date();
        const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
                           'July', 'August', 'September', 'October', 'November', 'December'];
        document.getElementById('calendar-title').textContent = `${monthNames[now.getMonth()]} ${now.getFullYear()}`;
    }

    // Refresh data when switching sections
    refreshAllAdminData();
}

function loadDashboard() {
    // Load appointments count
    fetch('../api/appointments.php')
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                const appointments = data.appointments;
                document.getElementById('total-appointments').textContent = appointments.length;
                const pending = appointments.filter(app => app.status === 'pending').length;
                document.getElementById('pending-appointments').textContent = pending;
            }
        });

    // Load users count
    fetch('../api/users.php')
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                document.getElementById('total-users').textContent = data.users.length;
            }
        });

    // Load services count
    fetch('../api/services.php')
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                document.getElementById('total-services').textContent = data.services.length;
            }
        });
}

function loadAppointments() {
    // Load from API
    fetch('../api/appointments.php')
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                const tbody = document.getElementById('appointments-tbody');
                tbody.innerHTML = '';

                data.appointments.forEach(appointment => {
                    const row = createAppointmentRow(appointment);
                    tbody.appendChild(row);
                });

                // Update dashboard counts
                const totalAppointments = data.appointments.length;
                const pendingAppointments = data.appointments.filter(app => app.status === 'pending').length;

                document.getElementById('total-appointments').textContent = totalAppointments;
                document.getElementById('pending-appointments').textContent = pendingAppointments;
            }
        })
        .catch(error => {
            console.error('Failed to load appointments:', error);
        });
}

function createAppointmentRow(appointment) {
    const row = document.createElement('tr');

    const statusClass = 'status-' + appointment.status;

    // Handle both API format and localStorage format
    const id = appointment.id;
    const userId = appointment.user_id || 'N/A';
    const customerName = appointment.name || appointment.user_name || 'N/A';
    const customerEmail = appointment.email || appointment.user_email || 'N/A';

    // Get phone from user table or extract from notes
    let customerPhone = appointment.phone || appointment.user_phone || 'N/A';
    if (customerPhone === 'N/A' && appointment.notes) {
        // Try to extract phone from notes (for bookings made without login)
        const notes = appointment.notes;
        const mobileMatch = notes.match(/Mobile:\s*([^\n]+)/);
        if (mobileMatch) {
            customerPhone = mobileMatch[1].trim();
        }
    }

    const services = Array.isArray(appointment.services) ? appointment.services.join(', ') : (appointment.service_name || 'N/A');
    const date = appointment.serviceDate || appointment.appointment_date || 'N/A';
    const time = appointment.customTime || appointment.serviceTime || appointment.appointment_time || 'N/A';
    const notes = appointment.notes || '';
    const status = appointment.status || 'pending';

    // Truncate notes for display
    const truncatedNotes = notes.length > 50 ? notes.substring(0, 50) + '...' : notes;

    row.innerHTML = `
        <td>${id}</td>
        <td>${userId}</td>
        <td>${customerName}</td>
        <td>${customerEmail}</td>
        <td>${customerPhone}</td>
        <td>${services}</td>
        <td>${date}</td>
        <td>${time}</td>
        <td title="${notes}">${truncatedNotes}</td>
        <td><span class="status-badge ${statusClass}">${status}</span></td>
        <td>
            <button class="action-btn view" onclick="toggleAppointmentDetails(this, '${id}')">View Details</button>
            <select class="status-select" onchange="updateAppointmentStatus('${id}', this.value)">
                <option value="pending" ${status === 'pending' ? 'selected' : ''}>Pending</option>
                <option value="confirmed" ${status === 'confirmed' ? 'selected' : ''}>Confirmed</option>
                <option value="completed" ${status === 'completed' ? 'selected' : ''}>Completed</option>
                <option value="cancelled" ${status === 'cancelled' ? 'selected' : ''}>Cancelled</option>
            </select>
            <button class="action-btn delete" onclick="deleteAppointment('${id}')">Delete</button>
        </td>
    `;

    return row;
}

function updateAppointmentStatus(id, newStatus) {
    // Update via API
    fetch('../api/appointments.php', {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            id: id,
            status: newStatus
        })
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            loadAppointments();
            loadDashboard();
        } else {
            alert('Failed to update appointment');
        }
    })
    .catch(error => {
        console.error('Failed to update appointment:', error);
        alert('Failed to update appointment');
    });
}

function deleteAppointment(id) {
    if (confirm('Are you sure you want to delete this appointment?')) {
        // Delete via API
        fetch(`../api/appointments.php?id=${id}`, {
            method: 'DELETE'
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                loadAppointments();
                loadDashboard();
            } else {
                alert('Failed to delete appointment');
            }
        })
        .catch(error => {
            console.error('Failed to delete appointment:', error);
            alert('Failed to delete appointment');
        });
    }
}

function toggleAppointmentDetails(button, id) {
    const row = button.closest('tr');
    let detailsRow = row.nextElementSibling;

    // If details row exists, toggle it
    if (detailsRow && detailsRow.classList.contains('appointment-details-row')) {
        detailsRow.remove();
        button.textContent = 'View Details';
        return;
    }

    // Load appointment details and create details row
    console.log('Loading appointment details for ID:', id);
    fetch(`../api/appointments.php?id=${id}`)
        .then(response => response.json())
        .then(data => {
            console.log('API response:', data);
            if (data.success && data.appointment) {
                const detailsRow = createAppointmentDetailsRow(data.appointment);
                row.parentNode.insertBefore(detailsRow, row.nextSibling);
                button.textContent = 'Hide Details';
            } else {
                console.error('API returned error or no appointment:', data);
                alert('Failed to load appointment details: ' + (data.message || 'Unknown error'));
            }
        })
        .catch(error => {
            console.error('Failed to load appointment details:', error);
            alert('Failed to load appointment details: Network error');
        });
}

function displayAppointmentDetails(appointment) {
    console.log('Displaying appointment details for:', appointment);
    const modal = document.getElementById('appointment-details-modal');
    const content = document.getElementById('appointment-details-content');

    if (!modal) {
        console.error('Appointment details modal not found');
        return;
    }

    // Parse data from API format
    const notes = appointment.notes || '';
    const name = appointment.user_name || 'N/A';
    const email = appointment.user_email || 'N/A';
    const contact = appointment.user_phone || 'N/A';
    const services = appointment.service_name || 'Service';
    const date = appointment.appointment_date || 'N/A';
    const time = appointment.appointment_time || 'N/A';
    const status = appointment.status || 'pending';
    const submittedAt = appointment.created_at || 'N/A';

    // Parse comprehensive information from notes (for legacy bookings)
    let address = 'N/A', carModel = 'N/A', carYear = 'N/A', specialNotes = 'None', otherServices = 'None';
    console.log('Parsing notes:', notes);

    // Parse address
    const addressMatch = notes.match(/Address:\s*(.+?)(?:\n|$)/);
    if (addressMatch) {
        address = addressMatch[1].trim();
        console.log('Found address:', address);
    }

    // Parse vehicle info
    const vehicleMatch = notes.match(/Vehicle:\s*([^()]+)\s*\(([^)]+)\)/);
    if (vehicleMatch) {
        carModel = vehicleMatch[1].trim();
        carYear = vehicleMatch[2].trim();
        console.log('Found vehicle:', carModel, carYear);
    }

    // Parse services
    const servicesMatch = notes.match(/Services:\s*(.+?)(?:\n|$)/);
    if (servicesMatch) {
        let servicesList = servicesMatch[1].trim();
        const otherMatch = servicesList.match(/,\s*(.+)$/);
        if (otherMatch) {
            otherServices = otherMatch[1].trim();
            servicesList = servicesList.replace(/,\s*[^,]+$/, '');
        }
        console.log('Found services:', servicesList, 'Other:', otherServices);
    }

    // Parse special notes
    const notesMatch = notes.match(/Special Notes:\s*(.+?)(?:\n|$)/);
    if (notesMatch) {
        specialNotes = notesMatch[1].trim();
        console.log('Found special notes:', specialNotes);
    }

    // Split contact into telephone and mobile if it contains both
    let telephone = 'N/A', mobile = contact;
    if (contact && contact.includes(' / ')) {
        const parts = contact.split(' / ');
        mobile = parts[0].trim();
        telephone = parts[1].trim();
    }

    content.innerHTML = `
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 2rem; border-radius: 15px 15px 0 0; margin: -2.5rem -2.5rem 2rem -2.5rem; text-align: center;">
            <h2 style="margin: 0; font-size: 1.8rem; font-weight: 700;">📋 Appointment Details</h2>
            <p style="margin: 0.5rem 0 0 0; opacity: 0.9; font-size: 1.1rem;">Booking ID: ${appointment.id}</p>
        </div>

        <div style="background: #f8f9fa; padding: 2rem; border-radius: 12px; margin-bottom: 1.5rem; border: 2px solid #e9ecef;">
            <h3 style="margin: 0 0 1.5rem 0; color: #495057; font-size: 1.4rem; font-weight: 600; text-align: center;">👤 Customer Information</h3>
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1.5rem;">
                <div style="background: white; padding: 1.5rem; border-radius: 8px; border: 1px solid #dee2e6;">
                    <h4 style="margin: 0 0 1rem 0; color: #007bff; font-size: 1.1rem;">Personal Details</h4>
                    <p style="margin: 0.5rem 0; color: #495057;"><strong>Full Name:</strong> ${name}</p>
                    <p style="margin: 0.5rem 0; color: #495057;"><strong>Email:</strong> ${email}</p>
                    <p style="margin: 0.5rem 0; color: #495057;"><strong>Telephone:</strong> ${telephone}</p>
                    <p style="margin: 0.5rem 0; color: #495057;"><strong>Mobile:</strong> ${mobile}</p>
                </div>
                <div style="background: white; padding: 1.5rem; border-radius: 8px; border: 1px solid #dee2e6;">
                    <h4 style="margin: 0 0 1rem 0; color: #28a745; font-size: 1.1rem;">Address & Account</h4>
                    <p style="margin: 0.5rem 0; color: #495057;"><strong>Address:</strong> ${address}</p>
                    <p style="margin: 0.5rem 0; color: #495057;"><strong>Password:</strong> ${user.password}</p>
                    <p style="margin: 0.5rem 0; color: #495057;"><strong>Submitted:</strong> ${submittedAt}</p>
                </div>
            </div>
            ${email ? `<div style="text-align: center; margin-top: 1.5rem;"><button onclick="emailCustomer('${email}', '${name}', '${appointment.id}')" class="btn-primary" style="padding: 0.75rem 2rem; font-size: 1rem;">📧 Email Customer</button></div>` : ''}
        </div>

        <div style="background: #f8f9fa; padding: 2rem; border-radius: 12px; margin-bottom: 1.5rem; border: 2px solid #e9ecef;">
            <h3 style="margin: 0 0 1.5rem 0; color: #495057; font-size: 1.4rem; font-weight: 600; text-align: center;">🚗 Vehicle Details</h3>
            <div style="background: white; padding: 1.5rem; border-radius: 8px; border: 1px solid #dee2e6;">
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;">
                    <p style="margin: 0.5rem 0; color: #495057;"><strong>Car Model:</strong> ${carModel}</p>
                    <p style="margin: 0.5rem 0; color: #495057;"><strong>Car Year:</strong> ${carYear}</p>
                </div>
            </div>
        </div>

        <div style="background: #f8f9fa; padding: 2rem; border-radius: 12px; margin-bottom: 1.5rem; border: 2px solid #e9ecef;">
            <h3 style="margin: 0 0 1.5rem 0; color: #495057; font-size: 1.4rem; font-weight: 600; text-align: center;">🔧 Requested Services</h3>
            <div style="background: white; padding: 1.5rem; border-radius: 8px; border: 1px solid #dee2e6;">
                <p style="margin: 0.5rem 0; color: #495057;"><strong>Primary Services:</strong> ${services}</p>
                ${otherServices !== 'None' ? `<p style="margin: 0.5rem 0; color: #495057;"><strong>Other Services:</strong> ${otherServices}</p>` : ''}
            </div>
        </div>

        <div style="background: #f8f9fa; padding: 2rem; border-radius: 12px; margin-bottom: 1.5rem; border: 2px solid #e9ecef;">
            <h3 style="margin: 0 0 1.5rem 0; color: #495057; font-size: 1.4rem; font-weight: 600; text-align: center;">📅 Appointment Schedule</h3>
            <div style="background: linear-gradient(135deg, #e3f2fd 0%, #bbdefb 100%); padding: 2rem; border-radius: 10px; border: 2px solid #2196f3; box-shadow: 0 4px 15px rgba(33, 150, 243, 0.2);">
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 2rem; text-align: center;">
                    <div>
                        <p style="margin: 0.5rem 0; color: #1565c0; font-weight: 700; font-size: 1.2rem;"><strong>📆 Date</strong></p>
                        <p style="margin: 0.5rem 0; color: #1565c0; font-size: 1.1rem;">${date}</p>
                    </div>
                    <div>
                        <p style="margin: 0.5rem 0; color: #1565c0; font-weight: 700; font-size: 1.2rem;"><strong>🕐 Time</strong></p>
                        <p style="margin: 0.5rem 0; color: #1565c0; font-size: 1.1rem;">${time}</p>
                    </div>
                </div>
            </div>
        </div>

        ${specialNotes !== 'None' ? `
        <div style="background: #f8f9fa; padding: 2rem; border-radius: 12px; margin-bottom: 1.5rem; border: 2px solid #e9ecef;">
            <h3 style="margin: 0 0 1.5rem 0; color: #495057; font-size: 1.4rem; font-weight: 600; text-align: center;">📝 Special Notes / Requests</h3>
            <div style="background: linear-gradient(135deg, #fff3cd 0%, #ffeaa7 100%); padding: 2rem; border-radius: 10px; border: 2px solid #ffc107; box-shadow: 0 4px 15px rgba(255, 193, 7, 0.2);">
                <p style="margin: 0; color: #856404; line-height: 1.6; font-size: 1rem;">${specialNotes}</p>
            </div>
        </div>
        ` : ''}

        <div style="background: #f8f9fa; padding: 2rem; border-radius: 12px; margin-bottom: 1.5rem; border: 2px solid #e9ecef;">
            <h3 style="margin: 0 0 1.5rem 0; color: #495057; font-size: 1.4rem; font-weight: 600; text-align: center;">📊 Booking Status</h3>
            <div style="background: linear-gradient(135deg, #d4edda 0%, #c3e6cb 100%); padding: 2rem; border-radius: 10px; border: 2px solid #28a745; box-shadow: 0 4px 15px rgba(40, 167, 69, 0.2); text-align: center;">
                <div style="display: flex; justify-content: center; align-items: center; gap: 2rem;">
                    <span style="font-weight: 700; color: #155724; font-size: 1.3rem;">Status: ${status.toUpperCase()}</span>
                    <span class="status-badge status-${status}" style="padding: 0.75rem 1.5rem; border-radius: 25px; font-size: 1rem; font-weight: 700;">${status}</span>
                </div>
            </div>
        </div>
    `;

    modal.style.display = 'block';
}

function createAppointmentDetailsRow(appointment) {
    const detailsRow = document.createElement('tr');
    detailsRow.className = 'appointment-details-row';

    // Parse data from API format
    const notes = appointment.notes || '';
    const name = appointment.user_name || 'N/A';
    const email = appointment.user_email || 'N/A';
    const contact = appointment.user_phone || 'N/A';
    const services = appointment.service_name || 'Service';
    const date = appointment.appointment_date || 'N/A';
    const time = appointment.appointment_time || 'N/A';
    const status = appointment.status || 'pending';
    const submittedAt = appointment.created_at || 'N/A';

    // Parse comprehensive information from notes
    let address = 'N/A', carModel = 'N/A', carYear = 'N/A', specialNotes = 'None', otherServices = 'None';

    // Parse address
    const addressMatch = notes.match(/Address:\s*(.+?)(?:\n|$)/);
    if (addressMatch) {
        address = addressMatch[1].trim();
    }

    // Parse vehicle info
    const vehicleMatch = notes.match(/Vehicle:\s*([^()]+)\s*\(([^)]+)\)/);
    if (vehicleMatch) {
        carModel = vehicleMatch[1].trim();
        carYear = vehicleMatch[2].trim();
    }

    // Parse services
    const servicesMatch = notes.match(/Services:\s*(.+?)(?:\n|$)/);
    if (servicesMatch) {
        let servicesList = servicesMatch[1].trim();
        const otherMatch = servicesList.match(/,\s*(.+)$/);
        if (otherMatch) {
            otherServices = otherMatch[1].trim();
            servicesList = servicesList.replace(/,\s*[^,]+$/, '');
        }
    }

    // Parse special notes
    const notesMatch = notes.match(/Special Notes:\s*(.+?)(?:\n|$)/);
    if (notesMatch) {
        specialNotes = notesMatch[1].trim();
    }

    // Display contact as single field
    let mobile = contact || 'N/A';
    let telephone = 'N/A'; // Not used anymore

    detailsRow.innerHTML = `
        <td colspan="10" style="padding: 0;">
            <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 1rem; border-radius: 8px 8px 0 0; margin: 10px; text-align: center;">
                <h3 style="margin: 0; font-size: 1.4rem; font-weight: 700;">📋 Appointment Details - ID: ${appointment.id}</h3>
            </div>

            <div style="margin: 10px; background: #f8f9fa; padding: 1.5rem; border-radius: 8px; border: 2px solid #e9ecef;">
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1.5rem; margin-bottom: 1.5rem;">
                    <div style="background: white; padding: 1.5rem; border-radius: 8px; border: 1px solid #dee2e6;">
                        <h4 style="margin: 0 0 1rem 0; color: #007bff; font-size: 1.1rem;">👤 Customer Information</h4>
                        <p style="margin: 0.5rem 0; color: #495057;"><strong>Full Name:</strong> ${name}</p>
                        <p style="margin: 0.5rem 0; color: #495057;"><strong>Email:</strong> ${email}</p>
                        <p style="margin: 0.5rem 0; color: #495057;"><strong>Contact Number:</strong> ${mobile}</p>
                        <p style="margin: 0.5rem 0; color: #495057;"><strong>Address:</strong> ${address}</p>
                        <p style="margin: 0.5rem 0; color: #495057;"><strong>Submitted:</strong> ${submittedAt}</p>
                    </div>
                    <div style="background: white; padding: 1.5rem; border-radius: 8px; border: 1px solid #dee2e6;">
                        <h4 style="margin: 0 0 1rem 0; color: #28a745; font-size: 1.1rem;">🚗 Vehicle Details</h4>
                        <p style="margin: 0.5rem 0; color: #495057;"><strong>Car Model:</strong> ${carModel}</p>
                        <p style="margin: 0.5rem 0; color: #495057;"><strong>Car Year:</strong> ${carYear}</p>
                        <h5 style="margin: 1rem 0 0.5rem 0; color: #28a745;">🔧 Requested Services</h5>
                        <p style="margin: 0.5rem 0; color: #495057;"><strong>Primary:</strong> ${services}</p>
                        ${otherServices !== 'None' ? `<p style="margin: 0.5rem 0; color: #495057;"><strong>Other:</strong> ${otherServices}</p>` : ''}
                    </div>
                </div>

                <div style="background: linear-gradient(135deg, #e3f2fd 0%, #bbdefb 100%); padding: 1.5rem; border-radius: 8px; border: 2px solid #2196f3; text-align: center;">
                    <h4 style="margin: 0 0 1rem 0; color: #1565c0; font-size: 1.2rem;">📅 Appointment Schedule</h4>
                    <div style="display: flex; justify-content: center; gap: 2rem;">
                        <div>
                            <p style="margin: 0.5rem 0; color: #1565c0; font-weight: 700;">📆 Date</p>
                            <p style="margin: 0.5rem 0; color: #1565c0;">${date}</p>
                        </div>
                        <div>
                            <p style="margin: 0.5rem 0; color: #1565c0; font-weight: 700;">🕐 Time</p>
                            <p style="margin: 0.5rem 0; color: #1565c0;">${time}</p>
                        </div>
                        <div>
                            <p style="margin: 0.5rem 0; color: #1565c0; font-weight: 700;">📊 Status</p>
                            <span class="status-badge status-${status}" style="padding: 0.5rem 1rem; border-radius: 20px; font-size: 0.9rem;">${status}</span>
                        </div>
                    </div>
                </div>

                ${specialNotes !== 'None' ? `
                <div style="background: linear-gradient(135deg, #fff3cd 0%, #ffeaa7 100%); padding: 1.5rem; border-radius: 8px; border: 2px solid #ffc107; margin-top: 1rem;">
                    <h4 style="margin: 0 0 1rem 0; color: #856404; font-size: 1.1rem;">📝 Special Notes / Requests</h4>
                    <p style="margin: 0; color: #856404; line-height: 1.6;">${specialNotes}</p>
                </div>
                ` : ''}
            </div>
        </td>
    `;

    return detailsRow;
}

function closeAppointmentDetailsModal() {
    console.log('Closing appointment details modal');
    const modal = document.getElementById('appointment-details-modal');
    if (modal) {
        modal.style.display = 'none';
        console.log('Modal closed');
    } else {
        console.error('Modal not found');
    }
}


function showUserDetails(userEmail) {
    // Get user data from API by email
    fetch(`../api/users.php?email=${encodeURIComponent(userEmail)}`)
        .then(response => response.json())
        .then(data => {
            if (!data.success || !data.user) {
                alert('User data not found');
                return;
            }

            const user = data.user;

            // Get user's bookings from API
            fetch('../api/appointments.php')
                .then(response => response.json())
                .then(appointmentData => {
                    const allAppointments = appointmentData.success ? appointmentData.appointments : [];
                    const userBookings = allAppointments.filter(appointment => appointment.user_id == user.id);

                    const modal = document.getElementById('appointment-details-modal');
                    const content = document.getElementById('appointment-details-content');

                    content.innerHTML = `
                        <div class="appointment-detail-section">
                            <h4>User Account Information</h4>
                            <p><strong>Name:</strong> ${user.name}</p>
                            <p><strong>Email:</strong> ${user.email}</p>
                            <p style="margin: 0.5rem 0; color: #333;"><strong>Password:</strong> ${user.password}</p>
                            <p><strong>Phone:</strong> ${user.phone || 'N/A'}</p>
                            <p><strong>Role:</strong> ${user.role}</p>
                            <p><strong>Status:</strong> ${user.verified ? 'Verified' : 'Unverified'}</p>
                            <p><strong>Account Created:</strong> ${new Date(user.created_at).toLocaleDateString()}</p>
                            <p><strong>Total Bookings:</strong> ${userBookings.length}</p>
                        </div>

                        <div class="appointment-detail-section">
                            <h4>Recent Bookings</h4>
                            ${userBookings.length === 0 ? '<p>No bookings found</p>' :
                                userBookings.slice(0, 5).map(booking => {
                                    const notes = booking.notes || '';
                                    let carModel = 'N/A', carYear = 'N/A';
                                    const vehicleMatch = notes.match(/Vehicle:\s*([^()]+)\s*\(([^)]+)\)/);
                                    if (vehicleMatch) {
                                        carModel = vehicleMatch[1].trim();
                                        carYear = vehicleMatch[2].trim();
                                    }
                                    return `
                                        <div style="margin-bottom: 1rem; padding: 0.5rem; background: rgba(0,0,0,0.05); border-radius: 5px;">
                                            <p><strong>Booking ID:</strong> ${booking.id}</p>
                                            <p><strong>Vehicle:</strong> ${carModel} (${carYear})</p>
                                            <p><strong>Services:</strong> ${booking.service_name}</p>
                                            <p><strong>Date:</strong> ${booking.appointment_date}</p>
                                            <p><strong>Status:</strong> ${booking.status}</p>
                                        </div>
                                    `;
                                }).join('')
                            }
                        </div>
                    `;

                    modal.style.display = 'block';
                });
        })
        .catch(error => {
            console.error('Failed to load user details:', error);
            alert('Failed to load user details');
        });
}

function emailCustomer(email, name, appointmentId) {
    // Get appointment details from API
    fetch(`../api/appointments.php?id=${appointmentId}`)
        .then(response => response.json())
        .then(data => {
            if (!data.success || !data.appointment) {
                alert('Appointment details not found');
                return;
            }

            const appointment = data.appointment;
            const notes = appointment.notes || '';
            const services = appointment.service_name || 'Service';
            const date = appointment.appointment_date || 'N/A';
            const time = appointment.appointment_time || 'N/A';
            const status = appointment.status || 'pending';

            // Parse vehicle info from notes
            let carModel = 'N/A', carYear = 'N/A';
            const vehicleMatch = notes.match(/Vehicle:\s*([^()]+)\s*\(([^)]+)\)/);
            if (vehicleMatch) {
                carModel = vehicleMatch[1].trim();
                carYear = vehicleMatch[2].trim();
            }

            // Create email content
            const subject = `Car Service Appointment Update - ${appointmentId}`;
            const body = `Dear ${name},

Regarding your car service appointment (ID: ${appointmentId}):

Vehicle: ${carModel} (${carYear})
Services: ${services}
Preferred Date: ${date}
Preferred Time: ${time}
Status: ${status}

Please let us know if you have any questions.

Best regards,
Car Detailing Service Team`;

            // Encode for mailto link
            const encodedSubject = encodeURIComponent(subject);
            const encodedBody = encodeURIComponent(body);

            // Open default email client
            const mailtoLink = `mailto:${email}?subject=${encodedSubject}&body=${encodedBody}`;
            window.open(mailtoLink);

            // Show confirmation
            alert(`Email client opened for ${email}.`);
        })
        .catch(error => {
            console.error('Failed to load appointment for email:', error);
            alert('Failed to load appointment details');
        });
}

function loadUsers() {
    // Load users from API
    fetch('../api/users.php')
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                // Get booking data to calculate total bookings per user
                fetch('../api/appointments.php')
                    .then(response => response.json())
                    .then(appointmentData => {
                        const appointments = appointmentData.success ? appointmentData.appointments : [];

                        // Create a map to count bookings per user
                        const bookingCounts = new Map();
                        appointments.forEach(appointment => {
                            const userId = appointment.user_id;
                            bookingCounts.set(userId, (bookingCounts.get(userId) || 0) + 1);
                        });

                        // Prepare users data with booking counts
                        const users = data.users.map(user => ({
                            id: user.id,
                            name: user.name,
                            email: user.email,
                            phone: user.phone,
                            password: user.password, // Include password for admin viewing
                            role: user.role || 'customer',
                            verified: user.verified,
                            registrationDate: user.created_at,
                            totalBookings: bookingCounts.get(user.id) || 0
                        }));

                        const tbody = document.getElementById('users-tbody');
                        tbody.innerHTML = '';

                        users.forEach(user => {
                            const row = createUserRow(user);
                            tbody.appendChild(row);
                        });

                        // Update dashboard user count
                        document.getElementById('total-users').textContent = users.length;
                    });
            }
        })
        .catch(error => {
            console.error('Failed to load users:', error);
        });
}

function createUserRow(user) {
    const row = document.createElement('tr');

    row.innerHTML = `
        <td>${user.id}</td>
        <td>${user.name}</td>
        <td>${user.email}</td>
        <td>${user.role}</td>
        <td>${user.verified ? 'Active' : 'Inactive'}</td>
        <td>
            <button class="action-btn view" onclick="showUserDetails('${user.email}')">View Details</button>
            <button class="action-btn delete" onclick="deleteUser('${user.email}')">Delete</button>
        </td>
    `;

    return row;
}

function editUser(userKey) {
    // For now, show user details since editing is complex without a full user management system
    showUserDetails(userKey);
    // Could be extended to allow editing user information in the future
}

function deleteUser(userKey) {
    if (confirm('Are you sure you want to delete this user account? This will also remove all their bookings. This action cannot be undone.')) {
        // Remove user from registeredUsers
        const registeredUsers = JSON.parse(localStorage.getItem('registeredUsers') || '[]');
        const filteredUsers = registeredUsers.filter(user =>
            user.email.toLowerCase() !== userKey.toLowerCase()
        );

        // Remove all bookings for this user
        const bookings = JSON.parse(localStorage.getItem('bookings') || '[]');
        const filteredBookings = bookings.filter(booking =>
            !booking.email || booking.email.toLowerCase() !== userKey.toLowerCase()
        );

        localStorage.setItem('registeredUsers', JSON.stringify(filteredUsers));
        localStorage.setItem('bookings', JSON.stringify(filteredBookings));

        // Reload data
        loadUsers();
        loadAppointments();
        loadDashboard();
    }
}

function loadServices() {
    fetch('../api/services.php')
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                const tbody = document.getElementById('services-tbody');
                tbody.innerHTML = '';

                data.services.forEach(service => {
                    const row = createServiceRow(service);
                    tbody.appendChild(row);
                });
            }
        });
}

function createServiceRow(service) {
    const row = document.createElement('tr');

    row.innerHTML = `
        <td>${service.id}</td>
        <td>${service.name}</td>
        <td>${service.description || 'N/A'}</td>
    `;

    return row;
}

function showServiceModal(serviceId = null) {
    const modal = document.getElementById('service-modal');
    const form = document.getElementById('service-form');
    const title = document.getElementById('service-modal-title');

    if (serviceId) {
        title.textContent = 'Edit Service';
        // Load service data
        fetch(`../api/services.php?id=${serviceId}`)
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    document.getElementById('service-id').value = data.service.id;
                    document.getElementById('service-name').value = data.service.name;
                    document.getElementById('service-description').value = data.service.description;
                    document.getElementById('service-duration').value = data.service.duration;
                    document.getElementById('service-price').value = data.service.price;
                }
            });
    } else {
        title.textContent = 'Add Service';
        form.reset();
        document.getElementById('service-id').value = '';
    }

    modal.style.display = 'block';
    console.log('Appointment details modal should now be visible');
}

function editService(id) {
    showServiceModal(id);
}

function deleteService(id) {
    if (confirm('Are you sure you want to delete this service?')) {
        fetch(`../api/services.php?id=${id}`, {
            method: 'DELETE'
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                loadServices();
                loadDashboard();
            } else {
                alert('Failed to delete service');
            }
        });
    }
}

function saveService(e) {
    e.preventDefault();

    const formData = {
        id: document.getElementById('service-id').value,
        name: document.getElementById('service-name').value,
        description: document.getElementById('service-description').value,
        duration: document.getElementById('service-duration').value,
        price: document.getElementById('service-price').value
    };

    const method = formData.id ? 'PUT' : 'POST';
    const url = '../api/services.php';

    fetch(url, {
        method: method,
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData)
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            document.getElementById('service-modal').style.display = 'none';
            loadServices();
            loadDashboard();
        } else {
            alert('Failed to save service');
        }
    });
}


// Business Status Functions
function updateAdminBusinessStatus() {
    console.log('Updating admin business status...');
    const now = new Date();
    const day = now.getDay();
    const hour = now.getHours();
    const minute = now.getMinutes();
    const currentTime = hour * 60 + minute;

    console.log('Current time:', hour + ':' + minute, 'Day:', day, 'Total minutes:', currentTime);

    const statusLight = document.getElementById('admin-status-light');
    const statusTitle = document.getElementById('admin-status-title');
    const statusMessage = document.getElementById('admin-status-message');

    if (!statusLight || !statusTitle || !statusMessage) {
        console.error('Status elements not found');
        return;
    }

    // Check for manual override first (stored in localStorage)
    const manualStatus = localStorage.getItem('businessStatus');

    if (manualStatus && manualStatus !== 'auto') {
        if (manualStatus === 'open') {
            statusLight.style.background = '#28a745';
            statusLight.style.boxShadow = '0 0 15px rgba(40, 167, 69, 0.6)';
            statusLight.style.animation = 'pulse 2s infinite';
            statusTitle.textContent = 'Manually Set: Open';
            statusMessage.textContent = 'Business status manually overridden to open';
        } else if (manualStatus === 'closed') {
            statusLight.style.background = '#dc3545';
            statusLight.style.boxShadow = '0 0 15px rgba(220, 53, 69, 0.6)';
            statusLight.style.animation = 'none';
            statusTitle.textContent = 'Manually Set: Closed';
            statusMessage.textContent = 'Business status manually overridden to closed';
        }
        return;
    }

    // Automatic status logic
    let isOpen = false;
    let statusText = '';
    let messageText = '';

    if (day >= 1 && day <= 6) { // Monday to Saturday
        const openTime = 8 * 60;
        const closeTime = 17 * 60;

        if (currentTime >= openTime && currentTime < closeTime) {
            isOpen = true;
            statusText = "We're Open (Auto)";
            messageText = "Monday-Saturday business hours";
        } else {
            isOpen = false;
            statusText = "We're Closed (Auto)";
            messageText = "Outside Monday-Saturday business hours";
        }
    } else if (day === 0) { // Sunday
        const openTime = 8 * 60;
        const closeTime = 15 * 60;

        if (currentTime >= openTime && currentTime < closeTime) {
            isOpen = true;
            statusText = "We're Open (Auto)";
            messageText = "Sunday business hours";
        } else {
            isOpen = false;
            statusText = "We're Closed (Auto)";
            messageText = "Outside Sunday business hours";
        }
    }

    if (isOpen) {
        statusLight.style.background = '#28a745';
        statusLight.style.boxShadow = '0 0 15px rgba(40, 167, 69, 0.6)';
        statusLight.style.animation = 'pulse 2s infinite';
    } else {
        statusLight.style.background = '#dc3545';
        statusLight.style.boxShadow = '0 0 15px rgba(220, 53, 69, 0.6)';
        statusLight.style.animation = 'none';
    }

    statusTitle.textContent = statusText;
    statusMessage.textContent = messageText;

    console.log('Status updated to:', statusText, messageText);
}

function setBusinessStatus(status) {
    console.log('Setting business status to:', status);
    if (status === 'auto') {
        localStorage.removeItem('businessStatus');
        console.log('Removed business status override, now using automatic mode');
    } else {
        localStorage.setItem('businessStatus', status);
    }
    updateAdminBusinessStatus();

    // Trigger storage event for other windows/tabs (like welcome page)
    const oldValue = localStorage.getItem('businessStatus');
    window.dispatchEvent(new StorageEvent('storage', {
        key: 'businessStatus',
        newValue: status === 'auto' ? null : status,
        oldValue: oldValue
    }));

    // Also dispatch custom event for same window
    window.dispatchEvent(new CustomEvent('businessStatusChanged', {
        detail: { status: status }
    }));

    // Show confirmation
    let message = '';
    if (status === 'open') {
        message = 'Business status set to OPEN - Welcome page updated';
    } else if (status === 'closed') {
        message = 'Business status set to CLOSED - Welcome page updated';
    } else {
        message = 'Business status reset to automatic mode - Welcome page updated';
    }

    console.log('Status change message:', message);

    // Simple notification
    const notification = document.createElement('div');
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: #28a745;
        color: white;
        padding: 1rem;
        border-radius: 8px;
        box-shadow: 0 4px 15px rgba(0,0,0,0.2);
        z-index: 1000;
        animation: slideIn 0.3s ease;
    `;
    notification.textContent = message;

    document.body.appendChild(notification);

    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

// Add CSS animations for notifications
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
    }
    @keyframes slideOut {
        from { transform: translateX(0); opacity: 1; }
        to { transform: translateX(100%); opacity: 0; }
    }
`;
document.head.appendChild(style);

// Calendar Functions
let currentCalendarDate = new Date();

function initializeCalendar() {
    renderCalendar();
}

function changeMonth(delta) {
    currentCalendarDate.setMonth(currentCalendarDate.getMonth() + delta);
    renderCalendar();
}

function refreshCalendar() {
    const button = document.getElementById('refresh-calendar');
    const originalText = button.textContent;

    // Show loading state
    button.textContent = '🔄 Refreshing...';
    button.disabled = true;

    // Refresh calendar data
    const currentYear = currentCalendarDate.getFullYear();
    const currentMonth = currentCalendarDate.getMonth();
    loadCalendarAppointments(currentYear, currentMonth);

    // Reset button after a short delay
    setTimeout(() => {
        button.textContent = originalText;
        button.disabled = false;
    }, 1000);
}

function renderCalendar() {
    const year = currentCalendarDate.getFullYear();
    const month = currentCalendarDate.getMonth();

    // Update title
    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
                       'July', 'August', 'September', 'October', 'November', 'December'];
    document.getElementById('calendar-title').textContent = `${monthNames[month]} ${year}`;

    // Get first day of month and last day
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - firstDay.getDay()); // Start from Sunday

    const endDate = new Date(lastDay);
    endDate.setDate(endDate.getDate() + (6 - lastDay.getDay())); // End on Saturday

    // Clear calendar
    const calendarDays = document.getElementById('calendar-days');
    calendarDays.innerHTML = '';

    // Generate calendar days
    let currentDate = new Date(startDate);
    while (currentDate <= endDate) {
        const dayElement = createCalendarDay(currentDate, month);
        calendarDays.appendChild(dayElement);
        currentDate.setDate(currentDate.getDate() + 1);
    }

    // Load appointments for the month
    loadCalendarAppointments(year, month);
}

function createCalendarDay(date, currentMonth) {
    const dayElement = document.createElement('div');
    dayElement.className = 'calendar-day';

    const isCurrentMonth = date.getMonth() === currentMonth;
    const isToday = date.toDateString() === new Date().toDateString();
    // Create date string in YYYY-MM-DD format without timezone issues
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const dateString = `${year}-${month}-${day}`;
    // Only mark as past if it's actually before today (not including today)
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const isPastDate = date < today;

    if (!isCurrentMonth) {
        dayElement.classList.add('other-month');
    }
    if (isToday) {
        dayElement.classList.add('today');
    }
    if (isPastDate) {
        dayElement.classList.add('inspected');
    } else {
        // Default to available for future dates
        dayElement.classList.add('available');
    }

    dayElement.innerHTML = `
        <div class="calendar-day-number">${date.getDate()}</div>
        <div class="calendar-appointments" id="appointments-${dateString}">
            <!-- Appointments will be loaded here -->
        </div>
    `;

    // Add click handler for date details
    if (isCurrentMonth) {
        dayElement.addEventListener('click', () => showDateDetails(dateString));
    }

    return dayElement;
}

function loadCalendarAppointments(year, month) {
    const startDate = new Date(year, month, 1).toISOString().split('T')[0];
    const endDate = new Date(year, month + 1, 0).toISOString().split('T')[0];

    // Load appointments from API
    fetch('../api/appointments.php')
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                // Group appointments by date
                const appointmentsByDate = {};
                data.appointments.forEach(appointment => {
                    const date = appointment.appointment_date;
                    if (!appointmentsByDate[date]) {
                        appointmentsByDate[date] = [];
                    }
                    appointmentsByDate[date].push(appointment);
                });

                // Update calendar days
                Object.keys(appointmentsByDate).forEach(date => {
                    const appointmentsDiv = document.getElementById(`appointments-${date}`);
                    if (appointmentsDiv) {
                        appointmentsDiv.innerHTML = '';

                        // Count pending bookings
                        const pendingBookings = appointmentsByDate[date].filter(app => app.status === 'pending');
                        const totalBookings = appointmentsByDate[date].length;

                        // Show pending booking info
                        if (pendingBookings.length > 0) {
                            const pendingElement = document.createElement('div');
                            pendingElement.className = 'appointment-item pending-note';
                            pendingElement.textContent = `${pendingBookings.length} pending`;
                            appointmentsDiv.appendChild(pendingElement);
                        }

                        // Show up to 2 regular appointments
                        appointmentsByDate[date].slice(0, 2).forEach(booking => {
                            const appointmentElement = document.createElement('div');
                            appointmentElement.className = 'appointment-item';
                            const time = booking.appointment_time;
                            const services = booking.service_name || 'Service';
                            appointmentElement.textContent = `${time} ${services}`;
                            appointmentsDiv.appendChild(appointmentElement);
                        });

                        if (appointmentsByDate[date].length > 2) {
                            const moreElement = document.createElement('div');
                            moreElement.className = 'appointment-item';
                            moreElement.textContent = `+${appointmentsByDate[date].length - 2} more`;
                            appointmentsDiv.appendChild(moreElement);
                        }

                        // Update day styling
                        const dayElement = appointmentsDiv.parentElement;
                        dayElement.classList.remove('available', 'booked', 'unavailable');
                        dayElement.classList.add('booked');
                    }
                });
            }
        })
        .catch(error => {
            console.error('Failed to load calendar appointments:', error);
        });

    // Load availability
    fetch(`../api/availability.php?start_date=${startDate}&end_date=${endDate}`)
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                data.availabilities.forEach(availability => {
                    const dayElement = document.querySelector(`#appointments-${availability.date}`);
                    if (dayElement) {
                        const calendarDay = dayElement.parentElement;
                        // Only update if not already booked or inspected (past dates)
                        if (!calendarDay.classList.contains('booked') && !calendarDay.classList.contains('inspected')) {
                            calendarDay.classList.remove('available', 'unavailable');
                            calendarDay.classList.add(availability.is_available ? 'available' : 'unavailable');
                        }
                    }
                });
            }
        })
        .catch(error => {
            console.error('Failed to load availability:', error);
        });
}

// Date Details Modal Functions
let currentDateDetails = null;

// Date Inspection Functions
function markDateAsInspected(dateString) {
    const inspectedDates = JSON.parse(localStorage.getItem('inspected_dates') || '[]');
    if (!inspectedDates.includes(dateString)) {
        inspectedDates.push(dateString);
        localStorage.setItem('inspected_dates', JSON.stringify(inspectedDates));
    }
}

function isDateInspected(dateString) {
    const inspectedDates = JSON.parse(localStorage.getItem('inspected_dates') || '[]');
    return inspectedDates.includes(dateString);
}

function updateCalendarDayVisual(dateString) {
    const dayElement = document.querySelector(`#appointments-${dateString}`);
    if (dayElement) {
        const calendarDay = dayElement.parentElement;
        // Remove existing status classes
        calendarDay.classList.remove('available', 'booked', 'unavailable');
        // Add inspected class
        calendarDay.classList.add('inspected');
    }
}

function showDateDetails(dateString) {
    currentDateDetails = dateString;

    // Highlight the selected date
    document.querySelectorAll('.calendar-day').forEach(day => {
        day.classList.remove('selected');
    });

    const selectedDayElement = document.querySelector(`#appointments-${dateString}`);
    if (selectedDayElement) {
        selectedDayElement.parentElement.classList.add('selected');
    }

    const zoomContainer = document.getElementById('calendar-zoom');
    const zoomTitle = document.getElementById('zoom-date-title');
    const zoomStatus = document.getElementById('zoom-date-status');

    // Format date for display
    const date = new Date(dateString + 'T00:00:00');
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    zoomTitle.textContent = date.toLocaleDateString('en-US', options);

    // Determine status
    const dayElement = document.querySelector(`#appointments-${dateString}`);
    if (dayElement) {
        const calendarDay = dayElement.parentElement;
        if (calendarDay.classList.contains('available')) {
            zoomStatus.textContent = 'Available for bookings';
            zoomStatus.style.color = '#28a745';
        } else if (calendarDay.classList.contains('booked')) {
            zoomStatus.textContent = 'Has bookings scheduled';
            zoomStatus.style.color = '#ffc107';
        } else if (calendarDay.classList.contains('unavailable')) {
            zoomStatus.textContent = 'Unavailable for bookings';
            zoomStatus.style.color = '#dc3545';
        } else if (calendarDay.classList.contains('inspected')) {
            zoomStatus.textContent = 'Past date';
            zoomStatus.style.color = '#dc3545';
        }
    }

    // Load bookings for this date
    loadDateBookings(dateString);

    // Load saved notes
    loadZoomNotes(dateString);

    // Show zoom view
    zoomContainer.style.display = 'block';
}

function closeDateModal() {
    document.getElementById('date-modal').style.display = 'none';
}

function loadAvailableTimes(dateString) {
    const timesList = document.getElementById('available-times-list');
    timesList.innerHTML = '<div class="time-slot">Loading...</div>';

    // Generate business hours in 5-minute intervals (8:05 AM to 5:00 PM)
    const businessHours = [];
    const startTime = 8 * 60 + 5; // 8:05 AM in minutes
    const endTime = 17 * 60; // 5:00 PM in minutes

    for (let minutes = startTime; minutes <= endTime; minutes += 5) {
        const hour = Math.floor(minutes / 60);
        const minute = minutes % 60;
        const timeString = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
        businessHours.push(timeString);
    }

    // Get appointments for this date to mark booked slots
    fetch('../api/appointments.php')
        .then(response => response.json())
        .then(appointmentData => {
            const dateAppointments = appointmentData.success ?
                appointmentData.appointments.filter(app => app.appointment_date === dateString) : [];

            // Check availability for each time slot
            fetch(`../api/availability.php?date=${dateString}`)
                .then(response => response.json())
                .then(availabilityData => {
                    timesList.innerHTML = '';

                    if (availabilityData.success && availabilityData.availabilities.length > 0) {
                        // Use API data if available
                        availabilityData.availabilities.forEach(availability => {
                            const timeSlot = createTimeSlot(availability.time, availability.is_available, dateAppointments, dateString);
                            timesList.appendChild(timeSlot);
                        });
                    } else {
                        // Fallback to generated business hours
                        businessHours.forEach(time => {
                            // Check if this time slot has a booking
                            const booking = dateAppointments.find(app => {
                                const appTime = app.appointment_time.substring(0, 5); // Get HH:MM format
                                return appTime === time;
                            });
                            const isAvailable = !booking;
                            const timeSlot = createTimeSlot(time, isAvailable, dateAppointments, dateString);
                            timesList.appendChild(timeSlot);
                        });
                    }
                })
                .catch(() => {
                    // Fallback to generated business hours
                    timesList.innerHTML = '';
                    businessHours.forEach(time => {
                        // Check if this time slot has a booking
                        const booking = dateAppointments.find(app => {
                            const appTime = app.appointment_time.substring(0, 5); // Get HH:MM format
                            return appTime === time;
                        });
                        const isAvailable = !booking;
                        const timeSlot = createTimeSlot(time, isAvailable, dateAppointments, dateString);
                        timesList.appendChild(timeSlot);
                    });
                });
        })
        .catch(() => {
            // Fallback without appointment data
            timesList.innerHTML = '';
            businessHours.forEach(time => {
                const timeSlot = createTimeSlot(time, true, [], dateString);
                timesList.appendChild(timeSlot);
            });
        });
}

function createTimeSlot(time, isAvailable, appointments, dateString) {
    const timeSlot = document.createElement('div');
    timeSlot.className = 'time-slot';

    // Check if this time slot has a booking (more flexible matching)
    const booking = appointments.find(app => {
        const appTime = app.appointment_time.substring(0, 5); // Get HH:MM format
        return appTime === time;
    });

    if (booking) {
        timeSlot.classList.add('booked');
        timeSlot.innerHTML = `
            <div class="time">${time}</div>
            <div class="booking-info">${booking.name || booking.user_name || 'Customer'}</div>
        `;
        timeSlot.title = `Click to view details for ${booking.name || booking.user_name || 'Customer'}`;
        timeSlot.addEventListener('click', () => showBookingDetails(booking, dateString));
    } else if (!isAvailable) {
        timeSlot.classList.add('unavailable');
        timeSlot.textContent = time;
    } else {
        timeSlot.textContent = time;
    }

    return timeSlot;
}


function loadDateNotes(dateString) {
    const notesTextarea = document.getElementById('date-notes');

    // Load notes from localStorage (you could implement API storage later)
    const notesKey = `date_notes_${dateString}`;
    const savedNotes = localStorage.getItem(notesKey) || '';
    notesTextarea.value = savedNotes;
}

function saveDateNotes() {
    if (!currentDateDetails) return;

    const notesTextarea = document.getElementById('date-notes');
    const notesKey = `date_notes_${currentDateDetails}`;
    localStorage.setItem(notesKey, notesTextarea.value);

    // Show success message
    const button = event.target;
    const originalText = button.textContent;
    button.textContent = 'Saved!';
    button.style.background = '#28a745';

    setTimeout(() => {
        button.textContent = originalText;
        button.style.background = '';
    }, 2000);
}

function showBookingDetails(booking, dateString) {
    // Remove selected class from all time slots
    document.querySelectorAll('.time-slot').forEach(slot => {
        slot.classList.remove('selected');
    });

    // Add selected class to clicked time slot
    event.target.classList.add('selected');

    const bookingTitle = document.getElementById('booking-title');
    const bookingInfo = document.getElementById('booking-info');
    const customerDetails = document.getElementById('customer-details');
    const customerNotes = document.getElementById('customer-notes');

    // Update title
    bookingTitle.textContent = `Booking Details - ${booking.appointment_time}`;

    // Show customer details
    customerDetails.innerHTML = `
        <p><strong>Name:</strong> ${booking.name || booking.user_name || 'N/A'}</p>
        <p><strong>Email:</strong> ${booking.email || 'N/A'}</p>
        <p><strong>Phone:</strong> ${booking.phone || 'N/A'}</p>
        <p><strong>Service:</strong> ${booking.service_name || booking.services || 'N/A'}</p>
        <p><strong>Status:</strong> ${booking.status || 'pending'}</p>
        <p><strong>Notes:</strong> ${booking.notes || 'None'}</p>
    `;

    // Load customer-specific notes
    const customerNotesKey = `customer_notes_${dateString}_${booking.appointment_time}_${booking.id || booking.name}`;
    const savedNotes = localStorage.getItem(customerNotesKey) || '';
    customerNotes.value = savedNotes;

    // Show booking info section
    bookingInfo.style.display = 'block';
}

// Global variable to store current booking details
let currentBookingDetails = null;

function showBookingDetails(booking, dateString) {
    currentBookingDetails = booking;

    // Remove selected class from all time slots
    document.querySelectorAll('.time-slot').forEach(slot => {
        slot.classList.remove('selected');
    });

    // Add selected class to clicked time slot
    event.target.classList.add('selected');

    const bookingTitle = document.getElementById('booking-title');
    const bookingInfo = document.getElementById('booking-info');
    const customerDetails = document.getElementById('customer-details');
    const customerNotes = document.getElementById('customer-notes');

    // Update title
    bookingTitle.textContent = `Booking Details - ${booking.appointment_time}`;

    // Show customer details
    customerDetails.innerHTML = `
        <p><strong>Name:</strong> ${booking.name || booking.user_name || 'N/A'}</p>
        <p><strong>Email:</strong> ${booking.email || 'N/A'}</p>
        <p><strong>Phone:</strong> ${booking.phone || 'N/A'}</p>
        <p><strong>Service:</strong> ${booking.service_name || booking.services || 'N/A'}</p>
        <p><strong>Status:</strong> ${booking.status || 'pending'}</p>
        <p><strong>Notes:</strong> ${booking.notes || 'None'}</p>
    `;

    // Load customer-specific notes
    const customerNotesKey = `customer_notes_${dateString}_${booking.appointment_time}_${booking.id || booking.name || 'unknown'}`;
    const savedNotes = localStorage.getItem(customerNotesKey) || '';
    customerNotes.value = savedNotes;

    // Show booking info section
    bookingInfo.style.display = 'block';
}

function saveCustomerNotes() {
    if (!currentBookingDetails || !currentDateDetails) return;

    const customerNotes = document.getElementById('customer-notes');
    const notesKey = `customer_notes_${currentDateDetails}_${currentBookingDetails.appointment_time}_${currentBookingDetails.id || currentBookingDetails.name || 'unknown'}`;
    localStorage.setItem(notesKey, customerNotes.value);

    // Show success message
    const button = event.target;
    const originalText = button.textContent;
    button.textContent = 'Saved!';
    button.style.background = '#28a745';

    setTimeout(() => {
        button.textContent = originalText;
        button.style.background = '';
    }, 2000);
}

// Zoom View Functions
function loadDateBookings(dateString) {
    const timesGrid = document.getElementById('zoom-times-grid');
    timesGrid.innerHTML = '<div class="booking-item">Loading bookings...</div>';

    // Get appointments for this date from API
    fetch('../api/appointments.php')
        .then(response => response.json())
        .then(data => {
            const dateBookings = data.success ? data.appointments.filter(appointment => appointment.appointment_date === dateString) : [];

            // Clear and show bookings
            timesGrid.innerHTML = '';

            if (dateBookings.length === 0) {
                timesGrid.innerHTML = '<div class="booking-item no-bookings">No bookings for this date</div>';
                return;
            }

            // Display each booking
            dateBookings.forEach(booking => {
                const bookingElement = createBookingListItem(booking, dateString);
                timesGrid.appendChild(bookingElement);
            });
        })
        .catch(error => {
            console.error('Failed to load date bookings:', error);
            timesGrid.innerHTML = '<div class="booking-item error">Failed to load bookings</div>';
        });
}

function createBookingListItem(booking, dateString) {
    const bookingElement = document.createElement('div');
    bookingElement.className = 'booking-item';

    // Extract data from API format (appointment table) or notes
    const notes = booking.notes || '';
    const name = booking.name || booking.user_name || 'N/A';
    const email = booking.email || 'N/A';
    const contact = booking.contact || booking.phone || 'N/A';
    const services = booking.service_name || 'Service';
    const time = booking.appointment_time || booking.customTime || booking.serviceTime;
    const status = booking.status || 'pending';

    // Parse vehicle info from notes if available
    let carModel = 'N/A', carYear = 'N/A';
    const vehicleMatch = notes.match(/Vehicle:\s*([^()]+)\s*\(([^)]+)\)/);
    if (vehicleMatch) {
        carModel = vehicleMatch[1].trim();
        carYear = vehicleMatch[2].trim();
    }

    const formattedTime = formatTimeForDisplay(time);

    bookingElement.innerHTML = `
        <div class="booking-header">
            <div class="booking-time">${formattedTime}</div>
            <div class="booking-status status-${status}">${status}</div>
        </div>
        <div class="booking-customer">
            <strong>${name}</strong>
        </div>
        <div class="booking-services">
            ${services}
        </div>
        <div class="booking-vehicle">
            ${carModel} (${carYear})
        </div>
        <div class="booking-contact">
            ${contact} | ${email}
        </div>
    `;

    bookingElement.title = 'Click to view full details';
    bookingElement.addEventListener('click', () => showZoomBookingDetails(booking, dateString));

    return bookingElement;
}

function formatTimeForDisplay(timeString) {
    if (!timeString) return 'Not specified';
    // Convert HH:MM to 12-hour format
    const [hours, minutes] = timeString.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
}

function showZoomBookingDetails(booking, dateString) {
    // For zoom view, we'll show a simple alert with booking details
    // since the zoom view is meant to be more focused on time slots
    const notes = booking.notes || '';
    const name = booking.name || booking.user_name || 'N/A';
    const email = booking.email || 'N/A';
    const contact = booking.contact || booking.phone || 'N/A';
    const services = booking.service_name || 'Service';
    const time = booking.appointment_time || booking.customTime || booking.serviceTime;
    const status = booking.status || 'pending';

    // Parse additional info from notes
    let address = 'N/A', carModel = 'N/A', carYear = 'N/A', specialNotes = 'None';
    const addressMatch = notes.match(/Address:\s*(.+?)(?:\n|$)/);
    if (addressMatch) address = addressMatch[1].trim();

    const vehicleMatch = notes.match(/Vehicle:\s*([^()]+)\s*\(([^)]+)\)/);
    if (vehicleMatch) {
        carModel = vehicleMatch[1].trim();
        carYear = vehicleMatch[2].trim();
    }

    const notesMatch = notes.match(/Special Notes:\s*(.+?)(?:\n|$)/);
    if (notesMatch) specialNotes = notesMatch[1].trim();

    const details = `BOOKING DETAILS:

Customer: ${name}
Email: ${email}
Phone: ${contact}
Address: ${address}
Vehicle: ${carModel} (${carYear})
Services: ${services}
Date: ${dateString}
Time: ${time}
Status: ${status}
Notes: ${specialNotes}
Submitted: ${booking.created_at || booking.submittedAt || 'N/A'}`;

    alert(details);
}

function loadZoomNotes(dateString) {
    const notesTextarea = document.getElementById('zoom-notes-textarea');

    // Load notes from localStorage
    const notesKey = `date_notes_${dateString}`;
    const savedNotes = localStorage.getItem(notesKey) || '';
    notesTextarea.value = savedNotes;
}

function saveZoomNotes() {
    if (!currentDateDetails) return;

    const notesTextarea = document.getElementById('zoom-notes-textarea');
    const notesKey = `date_notes_${currentDateDetails}`;
    localStorage.setItem(notesKey, notesTextarea.value);

    // Show success message
    const button = event.target;
    const originalText = button.textContent;
    button.textContent = 'Saved!';
    button.style.background = '#667eea';

    setTimeout(() => {
        button.textContent = originalText;
        button.style.background = '';
    }, 2000);
}

function closeCalendarZoom() {
    document.getElementById('calendar-zoom').style.display = 'none';
}


function refreshAllAdminData() {
    // Refresh dashboard data (counts, stats)
    loadDashboard();

    // Refresh appointments list
    loadAppointments();

    // Refresh calendar data
    const currentYear = currentCalendarDate.getFullYear();
    const currentMonth = currentCalendarDate.getMonth();
    loadCalendarAppointments(currentYear, currentMonth);

    // Refresh users and services data
    loadUsers();
    loadServices();
    loadAdminAccounts();

    // Update business status
    updateAdminBusinessStatus();
}