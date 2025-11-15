<?php
require_once 'config/database.php';

$db = new Database();
$conn = $db->getConnection();

if ($conn) {
    $sql = file_get_contents('db/schema_sqlite.sql');
    try {
        $conn->exec($sql);
        echo "Database setup completed successfully!\n";
    } catch (PDOException $e) {
        echo "Error setting up database: " . $e->getMessage() . "\n";
    }
} else {
    echo "Failed to connect to database.\n";
}
?>