// Welcome Page JavaScript
document.addEventListener('DOMContentLoaded', function() {
    // Initialize status indicator
    updateBusinessStatus();

    // Initialize tabs
    initializeTabs();

    // Load services
    loadServices();

    // Update status every 30 seconds to catch admin changes quickly
    setInterval(updateBusinessStatus, 30000); // 30 seconds

    // Listen for storage changes (when admin changes status)
    window.addEventListener('storage', function(e) {
        if (e.key === 'businessStatus') {
            console.log('Business status changed by admin, updating welcome page. New value:', e.newValue);
            updateBusinessStatus();
        }
    });

    // Also listen for custom events from same window
    window.addEventListener('businessStatusChanged', function(e) {
        console.log('Business status changed event received, updating welcome page');
        updateBusinessStatus();
    });
});

function updateBusinessStatus() {
    const now = new Date();
    const day = now.getDay(); // 0 = Sunday, 1 = Monday, etc.
    const hour = now.getHours();
    const minute = now.getMinutes();
    const currentTime = hour * 60 + minute; // Convert to minutes since midnight

    const statusLight = document.getElementById('status-light');
    const statusTitle = document.getElementById('status-title');
    const statusMessage = document.getElementById('status-message');

    // Check for manual override first (stored by admin panel)
    const manualStatus = localStorage.getItem('businessStatus');
    console.log('Welcome page checking business status:', manualStatus);

    if (manualStatus) {
        console.log('Manual status override detected:', manualStatus);
        if (manualStatus === 'open') {
            statusLight.style.setProperty('background', '#28a745', 'important'); // GREEN
            statusLight.style.setProperty('box-shadow', '0 0 15px rgba(40, 167, 69, 0.8)', 'important');
            statusLight.style.setProperty('animation', 'pulse 2s infinite', 'important');
            statusTitle.textContent = "We're Open (Admin Override)";
            statusMessage.textContent = "Business status manually set to open by administrator";
        } else if (manualStatus === 'closed') {
            statusLight.style.setProperty('background', '#dc3545', 'important'); // RED
            statusLight.style.setProperty('box-shadow', '0 0 15px rgba(220, 53, 69, 0.8)', 'important');
            statusLight.style.setProperty('animation', 'none', 'important');
            statusTitle.textContent = "We're Closed (Admin Override)";
            statusMessage.textContent = "Business status manually set to closed by administrator";
        }
        return;
    }

    // Automatic status logic
    let isOpen = false;
    let statusText = '';
    let messageText = '';

    // Business hours logic
    if (day >= 1 && day <= 6) { // Monday to Saturday
        const openTime = 8 * 60; // 8:00 AM
        const closeTime = 17 * 60; // 5:00 PM

        if (currentTime >= openTime && currentTime < closeTime) {
            isOpen = true;
            statusText = "We're Open";
            messageText = "Your trusted partner for car parts and detailing services";
        } else {
            isOpen = false;
            if (currentTime < openTime) {
                statusText = "Opening Soon";
                messageText = "We open at 8:00 AM today";
            } else {
                statusText = "We're Closed";
                if (day === 6) { // Saturday
                    messageText = "We reopen Sunday at 8:00 AM";
                } else {
                    messageText = "We reopen tomorrow at 8:00 AM";
                }
            }
        }
    } else if (day === 0) { // Sunday
        const openTime = 8 * 60; // 8:00 AM
        const closeTime = 15 * 60; // 3:00 PM

        if (currentTime >= openTime && currentTime < closeTime) {
            isOpen = true;
            statusText = "We're Open";
            messageText = "Your trusted partner for car parts and detailing services";
        } else {
            isOpen = false;
            if (currentTime < openTime) {
                statusText = "Opening Soon";
                messageText = "We open at 8:00 AM today";
            } else {
                statusText = "We're Closed";
                messageText = "We reopen Monday at 8:00 AM";
            }
        }
    }

    // Update UI
    if (isOpen) {
        statusLight.style.background = '#28a745';
        statusLight.style.boxShadow = '0 0 10px rgba(40, 167, 69, 0.5)';
        statusLight.style.animation = 'pulse 2s infinite';
    } else {
        statusLight.style.background = '#dc3545';
        statusLight.style.boxShadow = '0 0 10px rgba(220, 53, 69, 0.5)';
        statusLight.style.animation = 'none';
    }

    statusTitle.textContent = statusText;
    statusMessage.textContent = messageText;
}

// Admin status toggle functionality (for admin panel integration)
function toggleBusinessStatus() {
    // This would be called from admin panel to toggle open/closed status
    // For now, just update the display
    updateBusinessStatus();
}

// Tab functionality
function initializeTabs() {
    const tabButtons = document.querySelectorAll('.status-tabs .tab-btn');
    const tabContents = document.querySelectorAll('.status-section .tab-content');

    tabButtons.forEach(button => {
        button.addEventListener('click', () => {
            const tabId = button.getAttribute('data-tab');

            // Remove active class from all buttons and contents
            tabButtons.forEach(btn => btn.classList.remove('active'));
            tabContents.forEach(content => content.classList.remove('active'));

            // Add active class to clicked button and corresponding content
            button.classList.add('active');
            document.getElementById(tabId).classList.add('active');
        });
    });
}

// Load services statically (no API calls to prevent issues)
function loadServices() {
    const servicesGrid = document.getElementById('services-grid');
    if (servicesGrid) {
        servicesGrid.innerHTML = `
            <div class="service-card">
                <h3>Change Mags and Tires</h3>
                <p>Professional installation and replacement of mags and tires for optimal performance</p>
            </div>
            <div class="service-card">
                <h3>Alignment</h3>
                <p>Precise wheel alignment service to ensure proper handling and tire longevity</p>
            </div>
            <div class="service-card">
                <h3>Underchassis Repair</h3>
                <p>Comprehensive underchassis inspection and repair services</p>
            </div>
            <div class="service-card">
                <h3>Selling Mags, Tires & Accessories</h3>
                <p>Wide selection of premium mags, tires, and car accessories for your vehicle</p>
            </div>
        `;
    }
}

// Make functions globally available
window.toggleBusinessStatus = toggleBusinessStatus;