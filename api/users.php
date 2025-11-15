<?php
session_start();
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

require_once '../classes/User.php';

$user = new User();

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    // Allow customers to view their own data, admins to view all
    $isAdmin = isset($_SESSION['user_role']) && $_SESSION['user_role'] === 'admin';
    $isCustomer = isset($_SESSION['user_id']);

    if (!$isAdmin && !$isCustomer) {
        echo json_encode([
            'success' => false,
            'message' => 'Authentication required'
        ]);
        exit;
    }

    if (isset($_GET['id'])) {
        $user->id = $_GET['id'];
        if (!$user->readOne()) {
            echo json_encode([
                'success' => false,
                'message' => 'User not found'
            ]);
            exit;
        }

        // Check if user can access this data
        if (!$isAdmin && $user->id != $_SESSION['user_id']) {
            echo json_encode([
                'success' => false,
                'message' => 'Unauthorized'
            ]);
            exit;
        }

        echo json_encode([
            'success' => true,
            'user' => [
                'id' => $user->id,
                'email' => $user->email,
                'name' => $user->name,
                'phone' => $user->phone,
                'role' => $user->role,
                'verified' => $user->verified,
                'created_at' => $user->created_at
            ]
        ]);
    } elseif (isset($_GET['email'])) {
        // Allow customers to get their own data by email
        $user->email = $_GET['email'];
        if ($user->emailExists()) {
            // Check if user can access this data
            if (!$isAdmin && $user->id != $_SESSION['user_id']) {
                echo json_encode([
                    'success' => false,
                    'message' => 'Unauthorized'
                ]);
                exit;
            }

            echo json_encode([
                'success' => true,
                'user' => [
                    'id' => $user->id,
                    'email' => $user->email,
                    'name' => $user->name,
                    'phone' => $user->phone,
                    'role' => $user->role,
                    'verified' => $user->verified,
                    'created_at' => $user->created_at,
                    'password' => $user->password
                ]
            ]);
        } else {
            echo json_encode([
                'success' => false,
                'message' => 'User not found'
            ]);
        }
    } else {
        // Only admins can list all users
        if (!$isAdmin) {
            echo json_encode([
                'success' => false,
                'message' => 'Admin access required'
            ]);
            exit;
        }

        $stmt = $user->readAll();
        $users = [];
        while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
            $users[] = $row;
        }

        echo json_encode([
            'success' => true,
            'users' => $users
        ]);
    }
} elseif ($_SERVER['REQUEST_METHOD'] === 'PUT') {
    // Allow customers to update their own data, admins to update any
    $isAdmin = isset($_SESSION['user_role']) && $_SESSION['user_role'] === 'admin';
    $isCustomer = isset($_SESSION['user_id']);

    if (!$isAdmin && !$isCustomer) {
        echo json_encode([
            'success' => false,
            'message' => 'Authentication required'
        ]);
        exit;
    }

    $data = json_decode(file_get_contents('php://input'), true);

    if (isset($_GET['email'])) {
        // Update by email (for customers updating their own account)
        $user->email = $_GET['email'];
        if (!$user->emailExists()) {
            echo json_encode([
                'success' => false,
                'message' => 'User not found'
            ]);
            exit;
        }

        // Check if user can update this account
        if (!$isAdmin && $user->id != $_SESSION['user_id']) {
            echo json_encode([
                'success' => false,
                'message' => 'Unauthorized'
            ]);
            exit;
        }

        $user->email = $data['email'] ?? $user->email;
        $user->name = $data['name'] ?? $user->name;
        $user->phone = $data['phone'] ?? $user->phone;

        // Handle password change with current password verification
        if (isset($data['newPassword']) && !empty($data['newPassword'])) {
            // Verify current password if provided
            if (isset($data['currentPassword'])) {
                if (!password_verify($data['currentPassword'], $user->password)) {
                    echo json_encode([
                        'success' => false,
                        'message' => 'Current password is incorrect'
                    ]);
                    exit;
                }
            }
            $user->password = $data['newPassword']; // Will be hashed in update method
        } elseif (isset($data['password']) && !empty($data['password'])) {
            $user->password = $data['password']; // Will be hashed in update method
        }

        if ($user->update()) {
            echo json_encode([
                'success' => true,
                'message' => 'User updated successfully'
            ]);
        } else {
            echo json_encode([
                'success' => false,
                'message' => 'Failed to update user'
            ]);
        }
    } elseif (!empty($data['id'])) {
        // Admin updating by ID
        if (!$isAdmin) {
            echo json_encode([
                'success' => false,
                'message' => 'Admin access required'
            ]);
            exit;
        }

        $user->id = $data['id'];
        $user->readOne();

        $user->email = $data['email'] ?? $user->email;
        $user->name = $data['name'] ?? $user->name;
        $user->phone = $data['phone'] ?? $user->phone;

        if ($user->update()) {
            echo json_encode([
                'success' => true,
                'message' => 'User updated successfully'
            ]);
        } else {
            echo json_encode([
                'success' => false,
                'message' => 'Failed to update user'
            ]);
        }
    } else {
        echo json_encode([
            'success' => false,
            'message' => 'User identifier required'
        ]);
    }
} elseif ($_SERVER['REQUEST_METHOD'] === 'DELETE') {
    if (!isset($_SESSION['user_role']) || $_SESSION['user_role'] !== 'admin') {
        echo json_encode([
            'success' => false,
            'message' => 'Admin access required'
        ]);
        exit;
    }

    if (isset($_GET['id'])) {
        $user->id = $_GET['id'];

        if ($user->delete()) {
            echo json_encode([
                'success' => true,
                'message' => 'User deleted successfully'
            ]);
        } else {
            echo json_encode([
                'success' => false,
                'message' => 'Failed to delete user'
            ]);
        }
    } else {
        echo json_encode([
            'success' => false,
            'message' => 'User ID is required'
        ]);
    }
}
?>