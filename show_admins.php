<?php
require_once 'config/database.php';

$db = new Database();
$conn = $db->getConnection();

if ($conn) {
    try {
        $stmt = $conn->prepare("SELECT id, email, role, name, phone, verified, created_at FROM users WHERE role = 'admin' ORDER BY created_at DESC");

        $stmt->execute();

        echo "Admin accounts in database:\n\n";

        $admins = $stmt->fetchAll(PDO::FETCH_ASSOC);

        if (count($admins) > 0) {
            foreach ($admins as $admin) {
                echo "ID: " . $admin['id'] . "\n";
                echo "Email: " . $admin['email'] . "\n";
                echo "Role: " . $admin['role'] . "\n";
                echo "Name: " . $admin['name'] . "\n";
                echo "Phone: " . $admin['phone'] . "\n";
                echo "Verified: " . ($admin['verified'] ? 'Yes' : 'No') . "\n";
                echo "Created: " . $admin['created_at'] . "\n";
                echo "------------------------\n";
            }
        } else {
            echo "No admin accounts found.\n";
        }
    } catch (PDOException $e) {
        echo "Error: " . $e->getMessage() . "\n";
    }
} else {
    echo "Failed to connect to database.\n";
}
?>