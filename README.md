# Appointment Booking System

A complete web-based appointment booking system with separate admin and customer panels.

## Features

### Admin Panel
- Dashboard with statistics
- Manage appointments (view, edit, delete)
- Manage users (view, delete)
- Manage services (create, edit, delete)
- User authentication

### Customer Panel
- Book appointments
- View appointment history
- Profile management
- User registration and login

### Core Features
- User authentication with role-based access
- Appointment booking with availability checking
- Service management
- Email verification for registration
- Responsive design

## Technology Stack

- **Frontend:** HTML, CSS, JavaScript
- **Backend:** PHP
- **Database:** MySQL
- **Architecture:** RESTful API

## Installation

1. **Database Setup:**
   - Create a MySQL database
   - Import the schema from `db/schema.sql`
   - Update database credentials in `config/database.php`

2. **Web Server Setup:**
   - Place the project files in your web server's document root
   - Ensure PHP and MySQL are installed and running
   - Make sure the `api/` directory is accessible

3. **Configuration:**
   - Update database connection settings in `config/database.php`
   - Configure email settings for notifications (if implementing email features)

## File Structure

```
/
├── admin/           # Admin panel files
│   └── index.html
├── api/            # PHP API endpoints
│   ├── auth.php
│   ├── appointments.php
│   ├── services.php
│   └── users.php
├── classes/        # PHP classes
│   ├── User.php
│   ├── Appointment.php
│   └── Service.php
├── config/         # Configuration files
│   └── database.php
├── css/            # Stylesheets
│   ├── style.css
│   ├── admin.css
│   └── customer.css
├── customer/       # Customer panel files
│   └── index.html
├── db/             # Database files
│   └── schema.sql
├── js/             # JavaScript files
│   ├── auth.js
│   ├── admin.js
│   └── customer.js
└── index.html      # Main login/registration page
```

## Usage

1. **Access the system:**
   - Open `index.html` in your web browser

2. **Admin Login:**
   - Email: admin@example.com
   - Password: password

3. **Customer Registration:**
   - Click "Register" tab
   - Fill in the registration form
   - Verify email (feature placeholder)

4. **Booking Appointments:**
   - Login as customer
   - Select service and date/time
   - Submit booking

## API Endpoints

### Authentication
- `POST /api/auth.php` - Login/Register/Logout

### Appointments
- `GET /api/appointments.php` - Get appointments
- `POST /api/appointments.php` - Create appointment
- `PUT /api/appointments.php` - Update appointment
- `DELETE /api/appointments.php` - Delete appointment

### Services
- `GET /api/services.php` - Get services
- `POST /api/services.php` - Create service (Admin only)
- `PUT /api/services.php` - Update service (Admin only)
- `DELETE /api/services.php` - Delete service (Admin only)

### Users
- `GET /api/users.php` - Get users (Admin only)
- `PUT /api/users.php` - Update user (Admin only)
- `DELETE /api/users.php` - Delete user (Admin only)

## Security Features

- Password hashing with bcrypt
- Session-based authentication
- Role-based access control
- Input sanitization
- SQL injection prevention with prepared statements

## Future Enhancements

- Email notifications for appointments
- Calendar view for availability
- Payment integration
- SMS notifications
- Advanced reporting
- Multi-language support

## License

This project is open source and available under the MIT License.