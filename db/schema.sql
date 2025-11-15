-- Database schema for Reservation/Appointment System

CREATE DATABASE IF NOT EXISTS appointment_system;
USE appointment_system;

-- Users table (for both admin and customers)
CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    role ENUM('admin', 'customer') NOT NULL DEFAULT 'customer',
    name VARCHAR(255) NOT NULL,
    phone VARCHAR(20),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    verified BOOLEAN DEFAULT FALSE,
    verification_token VARCHAR(255)
);

-- Services table
CREATE TABLE services (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    duration INT NOT NULL, -- in minutes
    price DECIMAL(10,2) DEFAULT 0.00
);

-- Appointments table
CREATE TABLE appointments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    service_id INT NOT NULL,
    appointment_date DATE NOT NULL,
    appointment_time TIME NOT NULL,
    status ENUM('pending', 'confirmed', 'cancelled', 'completed') DEFAULT 'pending',
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (service_id) REFERENCES services(id) ON DELETE CASCADE
);

-- Availability table (business hours and blocked times)
CREATE TABLE availability (
    id INT AUTO_INCREMENT PRIMARY KEY,
    date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    is_available BOOLEAN DEFAULT TRUE,
    UNIQUE KEY unique_date_time (date, start_time, end_time)
);

-- Insert default admin user
INSERT INTO users (email, password, role, name, verified) VALUES
('admin@example.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'admin', 'System Admin', TRUE);
-- Password is 'password' hashed with bcrypt

-- Insert sample services
INSERT INTO services (name, description, duration, price) VALUES
('Consultation', 'General consultation service', 60, 100.00),
('Meeting', 'Business meeting appointment', 30, 50.00),
('Follow-up', 'Follow-up appointment', 45, 75.00);

-- Insert default availability (Monday to Friday, 9 AM to 5 PM)
INSERT INTO availability (date, start_time, end_time, is_available) VALUES
('2024-01-01', '09:00:00', '17:00:00', TRUE),
('2024-01-02', '09:00:00', '17:00:00', TRUE),
('2024-01-03', '09:00:00', '17:00:00', TRUE),
('2024-01-04', '09:00:00', '17:00:00', TRUE),
('2024-01-05', '09:00:00', '17:00:00', TRUE);