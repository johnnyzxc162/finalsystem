// Admin Login JavaScript
document.addEventListener('DOMContentLoaded', function() {
    // Check if already logged in as admin
    checkExistingAdminSession();

    // Form submission
    document.getElementById('admin-login-form').addEventListener('submit', handleAdminLogin);
});

function checkExistingAdminSession() {
    fetch('../api/auth.php')
        .then(response => response.json())
        .then(data => {
            if (data.success && data.user.role === 'admin') {
                // Already logged in as admin, redirect to admin panel
                window.location.href = 'index.html';
            }
        })
        .catch(error => {
            console.log('No existing session');
        });
}

function handleAdminLogin(e) {
    e.preventDefault();

    const email = document.getElementById('admin-email').value;
    const password = document.getElementById('admin-password').value;

    // Uncomment below for real API integration when PHP/MySQL is available
    const formData = {
        action: 'login',
        email: email,
        password: password
    };

    const submitBtn = e.target.querySelector('button[type="submit"]');
    submitBtn.disabled = true;
    submitBtn.textContent = 'Logging in...';

    fetch('../api/auth.php', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData)
    })
    .then(response => response.json())
    .then(data => {
        submitBtn.disabled = false;
        submitBtn.textContent = 'Login as Admin';

        if (data.success) {
            if (data.user.role === 'admin') {
                showMessage('Login successful! Redirecting to admin panel...', 'success');
                setTimeout(() => {
                    window.location.href = 'index.html';
                }, 1000);
            } else {
                showMessage('Access denied. Admin privileges required.', 'error');
            }
        } else {
            showMessage(data.message || 'Login failed', 'error');
        }
    })
    .catch(error => {
        submitBtn.disabled = false;
        submitBtn.textContent = 'Login as Admin';
        showMessage('An error occurred. Please try again.', 'error');
    });

    // Demo login - check stored admin accounts
    /*
    const adminAccounts = JSON.parse(localStorage.getItem('admin_accounts') || '[]');
    const admin = adminAccounts.find(a => a.email === email);

    if (admin && admin.password === password) {
        showMessage('Login successful! Redirecting to admin panel...', 'success');
        // Simulate session storage for demo
        localStorage.setItem('user_role', 'admin');
        localStorage.setItem('user_name', admin.name);
        setTimeout(() => {
            window.location.href = 'index.html';
        }, 1000);
    } else {
        showMessage('Invalid credentials. Please check your email and password.', 'error');
    }
    */
}

function showMessage(message, type) {
    // Remove existing messages
    const existingMessages = document.querySelectorAll('.message');
    existingMessages.forEach(msg => msg.remove());

    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${type}`;
    messageDiv.textContent = message;

    const container = document.querySelector('.login-container');
    const formContainer = document.querySelector('.login-form-container');
    container.insertBefore(messageDiv, formContainer);

    // Auto remove after 5 seconds
    setTimeout(() => {
        messageDiv.remove();
    }, 5000);
}