<?php
require_once '../classes/User.php';

$user = new User();
$user->email = 'tumayaocjay@gmail.com';

echo "Testing User class from api directory:\n";

if ($user->emailExists()) {
    echo "User found!\n";
    echo "ID: " . $user->id . "\n";
    echo "Name: " . $user->name . "\n";
    echo "Role: " . $user->role . "\n";
    echo "Verified: " . ($user->verified ? 'Yes' : 'No') . "\n";

    // Test password verification
    $testPassword = 'cjaypogi';
    if (password_verify($testPassword, $user->password)) {
        echo "Password verification successful!\n";
    } else {
        echo "Password verification failed!\n";
    }
} else {
    echo "User not found!\n";
}
?>