<?php
session_start();
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

require_once '../classes/User.php';

$user = new User();

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $data = json_decode(file_get_contents('php://input'), true);

    if (isset($data['action'])) {
        switch ($data['action']) {
            case 'login':
                if (!empty($data['email']) && !empty($data['password'])) {
                    $user->email = $data['email'];

                    $exists = $user->emailExists();

                    if ($exists) {
                        // Check if password is hashed (starts with $2y) or plain text
                        if (password_get_info($user->password)['algo']) {
                            // Password is hashed
                            $passwordValid = password_verify($data['password'], $user->password);
                        } else {
                            // Password is plain text
                            $passwordValid = $data['password'] === $user->password;
                        }

                        if ($passwordValid) {
                            $_SESSION['user_id'] = $user->id;
                            $_SESSION['user_role'] = $user->role;
                            $_SESSION['user_name'] = $user->name;

                            echo json_encode([
                                'success' => true,
                                'message' => 'Login successful',
                                'user' => [
                                    'id' => $user->id,
                                    'name' => $user->name,
                                    'role' => $user->role
                                ]
                            ]);
                        } else {
                            echo json_encode([
                                'success' => false,
                                'message' => 'Invalid password'
                            ]);
                        }
                    } else {
                        error_log("User not found: " . $data['email']);
                        echo json_encode([
                            'success' => false,
                            'message' => 'User not found'
                        ]);
                    }
                } else {
                    echo json_encode([
                        'success' => false,
                        'message' => 'Email and password are required'
                    ]);
                }
                break;

            case 'register':
                if (!empty($data['email']) && !empty($data['password']) && !empty($data['name'])) {
                    $user->email = $data['email'];

                    if (!$user->emailExists()) {
                        $user->password = $data['password'];
                        $user->name = $data['name'];
                        $user->phone = $data['phone'] ?? '';
                        $user->role = 'customer';

                        if ($user->create()) {
                            echo json_encode([
                                'success' => true,
                                'message' => 'Registration successful! You can now login with your credentials.'
                            ]);
                        } else {
                            echo json_encode([
                                'success' => false,
                                'message' => 'Registration failed'
                            ]);
                        }
                    } else {
                        echo json_encode([
                            'success' => false,
                            'message' => 'Email already exists'
                        ]);
                    }
                } else {
                    echo json_encode([
                        'success' => false,
                        'message' => 'Name, email and password are required'
                    ]);
                }
                break;

            case 'logout':
                session_destroy();
                echo json_encode([
                    'success' => true,
                    'message' => 'Logged out successfully'
                ]);
                break;

            default:
                echo json_encode([
                    'success' => false,
                    'message' => 'Invalid action'
                ]);
        }
    } else {
        echo json_encode([
            'success' => false,
            'message' => 'Action is required'
        ]);
    }
} elseif ($_SERVER['REQUEST_METHOD'] === 'GET') {
    if (isset($_SESSION['user_id'])) {
        // Get user email from database
        $user->id = $_SESSION['user_id'];
        $user->readOne();

        echo json_encode([
            'success' => true,
            'user' => [
                'id' => $_SESSION['user_id'],
                'name' => $_SESSION['user_name'],
                'email' => $user->email,
                'role' => $_SESSION['user_role']
            ]
        ]);
    } else {
        echo json_encode([
            'success' => false,
            'message' => 'Not logged in'
        ]);
    }
}
?>