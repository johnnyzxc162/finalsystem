-- Database schema for Reservation/Appointment System (SQLite version)

-- Users table (for both admin and customers)
CREATE TABLE users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'customer' CHECK (role IN ('admin', 'customer')),
    name TEXT NOT NULL,
    phone TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    verified INTEGER DEFAULT 0,
    verification_token TEXT
);

-- Services table
CREATE TABLE services (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    description TEXT,
    duration INTEGER NOT NULL, -- in minutes
    price REAL DEFAULT 0.00
);

-- Appointments table
CREATE TABLE appointments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    service_id INTEGER NOT NULL,
    appointment_date DATE NOT NULL,
    appointment_time TIME NOT NULL,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'cancelled', 'completed')),
    notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (service_id) REFERENCES services(id) ON DELETE CASCADE
);

-- Availability table (business hours and blocked times)
CREATE TABLE availability (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    is_available INTEGER DEFAULT 1,
    UNIQUE(date, start_time, end_time)
);

-- Insert default admin user
INSERT INTO users (email, password, role, name, verified) VALUES
('admin@example.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'admin', 'System Admin', 1);
-- Password is 'password' hashed with bcrypt

-- Insert sample services
INSERT INTO services (name, description, duration, price) VALUES
('Change Mags and Tires', 'Professional installation and replacement of mags and tires for optimal performance', 60, 100.00),
('Alignment', 'Precise wheel alignment service to ensure proper handling and tire longevity', 30, 50.00),
('Underchassis Repair', 'Comprehensive underchassis inspection and repair services', 45, 75.00),
('Selling Mags, Tires & Accessories', 'Wide selection of premium mags, tires, and car accessories for your vehicle', 30, 0.00);

-- Insert default availability (current date + some days)
INSERT INTO availability (date, start_time, end_time, is_available) VALUES
(date('now'), '08:00:00', '17:00:00', 1),
(date('now', '+1 day'), '08:00:00', '17:00:00', 1),
(date('now', '+2 day'), '08:00:00', '17:00:00', 1),
(date('now', '+3 day'), '08:00:00', '17:00:00', 1),
(date('now', '+4 day'), '08:00:00', '17:00:00', 1);