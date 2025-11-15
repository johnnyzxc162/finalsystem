<?php
session_start();
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, GET, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

require_once '../classes/Appointment.php';
require_once '../classes/Service.php';
require_once '../classes/User.php';
require_once '../config/database.php';

$appointment = new Appointment();
$service = new Service();
$user = new User();
$db = new Database();
$conn = $db->getConnection();

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $data = json_decode(file_get_contents('php://input'), true);

    // Validate required fields
    if (empty($data['name']) || empty($data['email']) || empty($data['contact']) || empty($data['address']) ||
        empty($data['carModel']) || empty($data['carYear']) || empty($data['services']) || empty($data['serviceDate'])) {
        echo json_encode([
            'success' => false,
            'message' => 'All required fields must be filled'
        ]);
        exit;
    }

    // Check if user exists, if not create
    $user->email = $data['email'];
    if ($user->emailExists()) {
        $userId = $user->id;
    } else {
        // Create new user
        $user->name = $data['name'];
        $user->email = $data['email'];
        $user->phone = $data['contact'];
        $user->password = 'defaultpassword'; // Will be hashed in create()
        $user->role = 'customer';
        $user->create();
        $userId = $user->id;
    }

    // For multiple services, create one appointment with first service and store others in notes
    $firstService = $data['services'][0];

    // Get service by name
    $query = "SELECT id FROM services WHERE name = ? LIMIT 1";
    $stmt = $conn->prepare($query);
    $stmt->execute([$firstService]);
    $serviceRow = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$serviceRow) {
        echo json_encode([
            'success' => false,
            'message' => 'Service not found'
        ]);
        exit;
    }

    $serviceId = $serviceRow['id'];

    // Determine time
    $time = $data['customTime'] ?: $data['serviceTime'];

    // Check availability - ensure no duplicate bookings at same date/time
    if (!$appointment->checkAvailability($data['serviceDate'], $time, $serviceId)) {
        echo json_encode([
            'success' => false,
            'message' => 'Sorry, this date and time is already booked. Please choose a different date or time.',
            'error_type' => 'time_unavailable'
        ]);
        exit;
    }

    // Create appointment
    $appointment->user_id = $userId;
    $appointment->service_id = $serviceId;
    $appointment->appointment_date = $data['serviceDate'];
    $appointment->appointment_time = $time;
    $appointment->status = 'pending';

    // Store additional data in notes
    $notes = "Vehicle: {$data['carModel']} ({$data['carYear']})\n";
    $notes .= "Address: {$data['address']}\n";
    $notes .= "Services: " . implode(', ', $data['services']);
    if (!empty($data['otherServices'])) {
        $notes .= ", {$data['otherServices']}";
    }
    $notes .= "\n";
    if (!empty($data['specialNotes'])) {
        $notes .= "Special Notes: {$data['specialNotes']}";
    }

    $appointment->notes = $notes;

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
        'message' => 'Method not allowed'
    ]);
}
?>