-- Database schema for Reservation/Appointment System (PostgreSQL)

-- Users table (for both admin and customers)
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL DEFAULT 'customer' CHECK (role IN ('admin', 'customer')),
    name VARCHAR(255) NOT NULL,
    phone VARCHAR(20),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    verified BOOLEAN DEFAULT FALSE,
    verification_token VARCHAR(255)
);

-- Services table
CREATE TABLE services (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    duration INTEGER NOT NULL, -- in minutes
    price DECIMAL(10,2) DEFAULT 0.00
);

-- Appointments table
CREATE TABLE appointments (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL,
    service_id INTEGER NOT NULL,
    appointment_date DATE NOT NULL,
    appointment_time TIME NOT NULL,
    status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'cancelled', 'completed')),
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (service_id) REFERENCES services(id) ON DELETE CASCADE
);

-- Availability table (business hours and blocked times)
CREATE TABLE availability (
    id SERIAL PRIMARY KEY,
    date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    is_available BOOLEAN DEFAULT TRUE,
    UNIQUE (date, start_time, end_time)
);

-- Insert default admin user
INSERT INTO users (email, password, role, name, verified) VALUES
('admin@example.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'admin', 'System Admin', TRUE);
-- Password is 'password' hashed with bcrypt

-- Insert sample services
INSERT INTO services (name, description, duration, price) VALUES
('Change Mags and Tires', 'Professional installation and replacement of mags and tires for optimal performance', 60, 100.00),
('Alignment', 'Precise wheel alignment service to ensure proper handling and tire longevity', 30, 50.00),
('Underchassis Repair', 'Comprehensive underchassis inspection and repair services', 45, 75.00),
('Selling Mags, Tires & Accessories', 'Wide selection of premium mags, tires, and car accessories for your vehicle', 30, 0.00);

-- Insert default availability (current date + some days)
INSERT INTO availability (date, start_time, end_time, is_available) VALUES
(CURRENT_DATE, '08:00:00', '17:00:00', TRUE),
(CURRENT_DATE + INTERVAL '1 day', '08:00:00', '17:00:00', TRUE),
(CURRENT_DATE + INTERVAL '2 day', '08:00:00', '17:00:00', TRUE),
(CURRENT_DATE + INTERVAL '3 day', '08:00:00', '17:00:00', TRUE),
(CURRENT_DATE + INTERVAL '4 day', '08:00:00', '17:00:00', TRUE);