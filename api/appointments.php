<?php
session_start();
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, GET, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

require_once '../classes/Appointment.php';
require_once '../classes/Service.php';
require_once '../classes/User.php';

$appointment = new Appointment();
$service = new Service();
$user = new User();

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    if (isset($_GET['id'])) {
        $appointment->id = $_GET['id'];
        $appointment->readOne();

        $service->id = $appointment->service_id;
        $service->readOne();

        $user->id = $appointment->user_id;
        $user->readOne();

        echo json_encode([
            'success' => true,
            'appointment' => [
                'id' => $appointment->id,
                'user_id' => $appointment->user_id,
                'user_name' => $user->name,
                'user_email' => $user->email,
                'user_phone' => $user->phone,
                'service_id' => $appointment->service_id,
                'service_name' => $service->name,
                'appointment_date' => $appointment->appointment_date,
                'appointment_time' => $appointment->appointment_time,
                'status' => $appointment->status,
                'notes' => $appointment->notes,
                'created_at' => $appointment->created_at
            ]
        ]);
    } else {
        if (isset($_SESSION['user_role']) && $_SESSION['user_role'] === 'admin') {
            $stmt = $appointment->readAll();
        } elseif (isset($_SESSION['user_id'])) {
            $stmt = $appointment->readByUser($_SESSION['user_id']);
        } else {
            echo json_encode([
                'success' => false,
                'message' => 'Authentication required'
            ]);
            exit;
        }

        $appointments = [];
        while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
            $appointments[] = $row;
        }

        echo json_encode([
            'success' => true,
            'appointments' => $appointments
        ]);
    }
} elseif ($_SERVER['REQUEST_METHOD'] === 'POST') {
    if (!isset($_SESSION['user_id'])) {
        echo json_encode([
            'success' => false,
            'message' => 'Authentication required'
        ]);
        exit;
    }

    $data = json_decode(file_get_contents('php://input'), true);

    if (!empty($data['service_id']) && !empty($data['appointment_date']) && !empty($data['appointment_time'])) {
        // Check availability
        if (!$appointment->checkAvailability($data['appointment_date'], $data['appointment_time'], $data['service_id'])) {
            echo json_encode([
                'success' => false,
                'message' => 'Time slot not available'
            ]);
            exit;
        }

        $appointment->user_id = $_SESSION['user_id'];
        $appointment->service_id = $data['service_id'];
        $appointment->appointment_date = $data['appointment_date'];
        $appointment->appointment_time = $data['appointment_time'];
        $appointment->status = 'pending';
        $appointment->notes = $data['notes'] ?? '';

        if ($appointment->create()) {
            echo json_encode([
                'success' => true,
                'message' => 'Appointment created successfully'
            ]);
        } else {
            echo json_encode([
                'success' => false,
                'message' => 'Failed to create appointment'
            ]);
        }
    } else {
        echo json_encode([
            'success' => false,
            'message' => 'Service, date and time are required'
        ]);
    }
} elseif ($_SERVER['REQUEST_METHOD'] === 'PUT') {
    if (!isset($_SESSION['user_id'])) {
        echo json_encode([
            'success' => false,
            'message' => 'Authentication required'
        ]);
        exit;
    }

    $data = json_decode(file_get_contents('php://input'), true);

    if (!empty($data['id'])) {
        $appointment->id = $data['id'];
        $appointment->readOne();

        // Check if user owns this appointment or is admin
        if ($appointment->user_id != $_SESSION['user_id'] && $_SESSION['user_role'] !== 'admin') {
            echo json_encode([
                'success' => false,
                'message' => 'Unauthorized'
            ]);
            exit;
        }

        $appointment->appointment_date = $data['appointment_date'] ?? $appointment->appointment_date;
        $appointment->appointment_time = $data['appointment_time'] ?? $appointment->appointment_time;
        $appointment->status = $data['status'] ?? $appointment->status;
        $appointment->notes = $data['notes'] ?? $appointment->notes;

        if ($appointment->update()) {
            echo json_encode([
                'success' => true,
                'message' => 'Appointment updated successfully'
            ]);
        } else {
            echo json_encode([
                'success' => false,
                'message' => 'Failed to update appointment'
            ]);
        }
    } else {
        echo json_encode([
            'success' => false,
            'message' => 'Appointment ID is required'
        ]);
    }
} elseif ($_SERVER['REQUEST_METHOD'] === 'DELETE') {
    if (!isset($_SESSION['user_id'])) {
        echo json_encode([
            'success' => false,
            'message' => 'Authentication required'
        ]);
        exit;
    }

    if (isset($_GET['id'])) {
        $appointment->id = $_GET['id'];
        $appointment->readOne();

        // Check if user owns this appointment or is admin
        if ($appointment->user_id != $_SESSION['user_id'] && $_SESSION['user_role'] !== 'admin') {
            echo json_encode([
                'success' => false,
                'message' => 'Unauthorized'
            ]);
            exit;
        }

        if ($appointment->delete()) {
            echo json_encode([
                'success' => true,
                'message' => 'Appointment deleted successfully'
            ]);
        } else {
            echo json_encode([
                'success' => false,
                'message' => 'Failed to delete appointment'
            ]);
        }
    } else {
        echo json_encode([
            'success' => false,
            'message' => 'Appointment ID is required'
        ]);
    }
}
?>