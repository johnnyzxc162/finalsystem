// Booking Form JavaScript
document.addEventListener('DOMContentLoaded', function() {
    // Branch management
    const addBranchBtn = document.getElementById('add-branch');
    const branchesContainer = document.getElementById('branches-container');

    addBranchBtn.addEventListener('click', addBranch);

    // Form submission
    const bookingForm = document.getElementById('booking-form');
    bookingForm.addEventListener('submit', handleBookingSubmit);

    // Set minimum date for service date
    const serviceDateInput = document.getElementById('service-date');
    const today = new Date().toISOString().split('T')[0];
    serviceDateInput.min = today;
});

function addBranch() {
    const branchItem = document.createElement('div');
    branchItem.className = 'branch-item';

    branchItem.innerHTML = `
        <select class="branch-select" required>
            <option value="">Select Branch</option>
            <option value="Makati">Makati</option>
            <option value="BGC">BGC (Bonifacio Global City)</option>
            <option value="Quezon City">Quezon City</option>
            <option value="Manila">Manila</option>
            <option value="Pasig">Pasig</option>
        </select>
        <button type="button" class="remove-branch">Remove</button>
    `;

    // Add remove functionality
    const removeBtn = branchItem.querySelector('.remove-branch');
    removeBtn.addEventListener('click', function() {
        branchItem.remove();
    });

    // Show remove buttons for all items when there are multiple
    const allRemoveBtns = branchesContainer.querySelectorAll('.remove-branch');
    allRemoveBtns.forEach(btn => btn.style.display = 'block');

    branchesContainer.appendChild(branchItem);
}

function handleBookingSubmit(e) {
    e.preventDefault();

    // Collect form data
    const formData = {
        name: document.getElementById('customer-name').value,
        contact: document.getElementById('contact-number').value,
        address: document.getElementById('address').value,
        carModel: document.getElementById('car-model').value,
        staffAssisted: document.getElementById('staff-assisted').value,
        branches: Array.from(document.querySelectorAll('.branch-select')).map(select => select.value).filter(val => val),
        services: Array.from(document.querySelectorAll('input[name="services"]:checked')).map(cb => cb.value),
        accessories: document.getElementById('accessories').value,
        serviceDate: document.getElementById('service-date').value,
        specialNotes: document.getElementById('special-notes').value
    };

    // Basic validation
    if (!formData.name || !formData.contact || !formData.address || !formData.carModel || !formData.staffAssisted || formData.branches.length === 0 || !formData.serviceDate) {
        alert('Please fill in all required fields.');
        return;
    }

    if (formData.branches.includes('')) {
        alert('Please select all branch locations.');
        return;
    }

    // Show loading state
    const submitBtn = e.target.querySelector('.submit-btn');
    const originalText = submitBtn.textContent;
    submitBtn.textContent = 'Submitting...';
    submitBtn.disabled = true;

    // Here you would typically send the data to your backend
    // For now, we'll just simulate a successful submission
    setTimeout(() => {
        console.log('Booking Data:', formData);

        // Show success message
        alert('Booking submitted successfully! We will contact you soon.');

        // Reset form
        e.target.reset();

        // Remove extra branches
        const extraBranches = branchesContainer.querySelectorAll('.branch-item:not(:first-child)');
        extraBranches.forEach(branch => branch.remove());

        // Hide remove buttons
        const removeBtns = branchesContainer.querySelectorAll('.remove-branch');
        removeBtns.forEach(btn => btn.style.display = 'none');

        // Reset submit button
        submitBtn.textContent = originalText;
        submitBtn.disabled = false;

    }, 2000);
}

// Make functions globally available
window.addBranch = addBranch;
window.handleBookingSubmit = handleBookingSubmit;