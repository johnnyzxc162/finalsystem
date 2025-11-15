<?php
// Enable full error reporting to see any issues in the Netlify build logs.
error_reporting(E_ALL);
ini_set('display_errors', 1);

echo "--- Starting Database Setup Script ---\n";

try {
    // Since setup.php is in the root, we can directly include the config file.
    require_once __DIR__ . '/config/database.php';

    // Establish a database connection.
    $database = new Database();
    $pdo = $database->getConnection();

    if ($pdo) {
        echo "Database connection successful.\n";
    } else {
        // If getConnection() returns null or false, throw an exception.
        throw new Exception("Failed to get a database connection.");
    }
    
    // --- IMPORTANT ---
    // The SQL commands below are converted for POSTGRESQL.
    // This will create all the tables your application needs.
    $sql = <<<SQL
        -- Drop tables if they exist to ensure a clean setup
        DROP TABLE IF EXISTS availability;
        DROP TABLE IF EXISTS appointments;
        DROP TABLE IF EXISTS services;
        DROP TABLE IF EXISTS users;

        -- Create users table
        CREATE TABLE users (
            id SERIAL PRIMARY KEY,
            email VARCHAR(255) UNIQUE NOT NULL,
            password VARCHAR(255) NOT NULL,
            role VARCHAR(20) NOT NULL DEFAULT 'customer' CHECK (role IN ('admin', 'customer')),
            name VARCHAR(255) NOT NULL,
            phone VARCHAR(20),
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            verified BOOLEAN DEFAULT FALSE,
            verification_token VARCHAR(255)
        );

        -- Create services table
        CREATE TABLE services (
            id SERIAL PRIMARY KEY,
            name VARCHAR(255) NOT NULL,
            description TEXT,
            duration INT,
            price NUMERIC(10, 2)
        );

        -- Create appointments table
        CREATE TABLE appointments (
            id SERIAL PRIMARY KEY,
            user_id INT NOT NULL REFERENCES users(id),
            service_id INT NOT NULL REFERENCES services(id),
            appointment_time TIMESTAMP NOT NULL,
            status VARCHAR(20) NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'completed', 'cancelled')),
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );

        -- Create availability table
        CREATE TABLE availability (
            id SERIAL PRIMARY KEY,
            date DATE NOT NULL,
            start_time TIME NOT NULL,
            end_time TIME NOT NULL,
            is_available BOOLEAN DEFAULT TRUE
        );

        -- Insert initial admin user
        -- The plain text password here is 'adminpassword'
        INSERT INTO users (email, password, role, name) VALUES ('admin@example.com', '\$2y\$10\$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'admin', 'Admin User');

    SQL;

    // Execute the entire SQL block.
    $pdo->exec($sql);

    echo "Database setup successful: All tables and initial data have been created.\n";
    echo "--- Database Setup Script Finished ---\n";

} catch (Exception $e) {
    // If any error occurs, print it to the Netlify log and fail the build.
    echo "--- DATABASE SETUP FAILED ---\n";
    echo "Error: " . $e->getMessage() . "\n";
    // Exit with a non-zero status code to indicate a build failure.
    exit(1);
}

// Exit with a zero status code to indicate a successful build step.
exit(0);

?>