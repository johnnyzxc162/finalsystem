// Customer Login/Register JavaScript
document.addEventListener('DOMContentLoaded', function() {
    // Tab switching
    const tabButtons = document.querySelectorAll('.tab-btn');
    tabButtons.forEach(btn => {
        btn.addEventListener('click', function() {
            const tab = this.getAttribute('data-tab');
            showTab(tab);
        });
    });

    // Form submissions
    document.getElementById('customer-login-form').addEventListener('submit', handleCustomerLogin);
    document.getElementById('customer-register-form').addEventListener('submit', handleCustomerRegister);

    // Forgot password link
    document.getElementById('forgot-password-link').addEventListener('click', handleForgotPassword);
});

function showTab(tabName) {
    // Hide all tabs
    document.querySelectorAll('.tab-content').forEach(tab => {
        tab.classList.remove('active');
    });

    // Remove active class from tab buttons
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.remove('active');
    });

    // Show selected tab
    document.getElementById(tabName + '-tab').classList.add('active');
    document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');
}

function handleCustomerLogin(e) {
    e.preventDefault();

    const email = document.getElementById('customer-email').value.trim();
    const password = document.getElementById('customer-password').value;

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        showMessage('Please enter a valid email address.', 'error');
        return;
    }

    // Show loading
    const submitBtn = e.target.querySelector('button[type="submit"]');
    submitBtn.disabled = true;
    submitBtn.textContent = 'Logging in...';

    // Use API for authentication
    fetch('../api/auth.php', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            action: 'login',
            email: email,
            password: password
        })
    })
    .then(response => response.json())
    .then(data => {
        submitBtn.disabled = false;
        submitBtn.textContent = 'Login';

        if (data.success) {
            showMessage('Login successful! Redirecting to customer panel...', 'success');

            // Store session info in localStorage for client-side use
            localStorage.setItem('user_role', data.user.role);
            localStorage.setItem('user_name', data.user.name);
            localStorage.setItem('user_email', data.user.email);

            setTimeout(() => {
                window.location.href = 'index.html';
            }, 1000);
        } else {
            showMessage(data.message || 'Login failed. Please try again.', 'error');
        }
    })
    .catch(error => {
        submitBtn.disabled = false;
        submitBtn.textContent = 'Login';
        showMessage('An error occurred. Please try again.', 'error');
        console.error('Login error:', error);
    });
}

function handleCustomerRegister(e) {
    e.preventDefault();

    const name = document.getElementById('register-name').value.trim();
    const email = document.getElementById('register-email').value.trim();
    const phone = document.getElementById('register-phone').value.trim();
    const password = document.getElementById('register-password').value;
    const confirmPassword = document.getElementById('register-confirm-password').value;

    // Validate required fields
    if (!name || !email || !password) {
        showMessage('Please fill in all required fields.', 'error');
        return;
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        showMessage('Please enter a valid email address.', 'error');
        return;
    }

    // Validate password length
    if (password.length < 6) {
        showMessage('Password must be at least 6 characters long.', 'error');
        return;
    }

    // Check password confirmation
    if (password !== confirmPassword) {
        showMessage('Passwords do not match. Please try again.', 'error');
        return;
    }

    // Show loading
    const submitBtn = e.target.querySelector('button[type="submit"]');
    submitBtn.disabled = true;
    submitBtn.textContent = 'Registering...';

    // Use API for registration
    fetch('../api/auth.php', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            action: 'register',
            name: name,
            email: email,
            password: password,
            phone: phone
        })
    })
    .then(response => response.json())
    .then(data => {
        submitBtn.disabled = false;
        submitBtn.textContent = 'Register';

        if (data.success) {
            showMessage('Registration successful! You can now login with your credentials.', 'success');
            e.target.reset();
            showTab('login');
        } else {
            showMessage(data.message || 'Registration failed. Please try again.', 'error');
        }
    })
    .catch(error => {
        submitBtn.disabled = false;
        submitBtn.textContent = 'Register';
        showMessage('An error occurred. Please try again.', 'error');
        console.error('Registration error:', error);
    });
}

function handleForgotPassword(e) {
    e.preventDefault();

    const email = prompt('Enter your email address to reset your password:');
    if (!email) return;

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        showMessage('Please enter a valid email address.', 'error');
        return;
    }

    // Check if user exists
    const registeredUsers = JSON.parse(localStorage.getItem('registeredUsers') || '[]');
    const user = registeredUsers.find(u => u.email.toLowerCase() === email.toLowerCase());

    if (!user) {
        showMessage('No account found with this email address.', 'error');
        return;
    }

    // Generate reset code
    const resetCode = Math.random().toString(36).substring(2, 8).toUpperCase();

    // Store reset info
    localStorage.setItem('passwordReset', JSON.stringify({
        email: email.toLowerCase(),
        code: resetCode,
        timestamp: Date.now()
    }));

    showMessage(`Password reset code sent to ${email}. Code: ${resetCode} (Demo - normally sent via email)`, 'info');

    // Ask for verification code
    setTimeout(() => {
        const enteredCode = prompt('Enter the 6-digit reset code sent to your email:');
        if (enteredCode && enteredCode.toUpperCase() === resetCode) {
            const newPassword = prompt('Enter your new password (minimum 6 characters):');
            if (newPassword && newPassword.length >= 6) {
                // Update password
                user.password = newPassword;
                localStorage.setItem('registeredUsers', JSON.stringify(registeredUsers));
                localStorage.removeItem('passwordReset');
                showMessage('Password reset successful! You can now login with your new password.', 'success');
            } else {
                showMessage('Password must be at least 6 characters long.', 'error');
            }
        } else {
            showMessage('Invalid reset code. Please try again.', 'error');
        }
    }, 1000);
}

function showMessage(message, type) {
    // Remove existing messages
    const existingMessages = document.querySelectorAll('.message');
    existingMessages.forEach(msg => msg.remove());

    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${type}`;
    messageDiv.textContent = message;

    const container = document.querySelector('.login-container');
    const tabs = document.querySelector('.auth-tabs');
    container.insertBefore(messageDiv, tabs);

    // Auto remove after 5 seconds
    setTimeout(() => {
        messageDiv.remove();
    }, 5000);
}