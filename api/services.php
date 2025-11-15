<?php
session_start();
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, GET, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

require_once '../classes/Service.php';

$service = new Service();

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    if (isset($_GET['id'])) {
        $service->id = $_GET['id'];
        $service->readOne();

        echo json_encode([
            'success' => true,
            'service' => [
                'id' => $service->id,
                'name' => $service->name,
                'description' => $service->description,
                'duration' => $service->duration,
                'price' => $service->price
            ]
        ]);
    } else {
        $stmt = $service->readAll();
        $services = [];
        while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
            $services[] = $row;
        }

        echo json_encode([
            'success' => true,
            'services' => $services
        ]);
    }
} elseif ($_SERVER['REQUEST_METHOD'] === 'POST') {
    if (!isset($_SESSION['user_role']) || $_SESSION['user_role'] !== 'admin') {
        echo json_encode([
            'success' => false,
            'message' => 'Admin access required'
        ]);
        exit;
    }

    $data = json_decode(file_get_contents('php://input'), true);

    if (!empty($data['name']) && !empty($data['duration'])) {
        $service->name = $data['name'];
        $service->description = $data['description'] ?? '';
        $service->duration = $data['duration'];
        $service->price = $data['price'] ?? 0;

        if ($service->create()) {
            echo json_encode([
                'success' => true,
                'message' => 'Service created successfully'
            ]);
        } else {
            echo json_encode([
                'success' => false,
                'message' => 'Failed to create service'
            ]);
        }
    } else {
        echo json_encode([
            'success' => false,
            'message' => 'Service name and duration are required'
        ]);
    }
} elseif ($_SERVER['REQUEST_METHOD'] === 'PUT') {
    if (!isset($_SESSION['user_role']) || $_SESSION['user_role'] !== 'admin') {
        echo json_encode([
            'success' => false,
            'message' => 'Admin access required'
        ]);
        exit;
    }

    $data = json_decode(file_get_contents('php://input'), true);

    if (!empty($data['id'])) {
        $service->id = $data['id'];
        $service->readOne();

        $service->name = $data['name'] ?? $service->name;
        $service->description = $data['description'] ?? $service->description;
        $service->duration = $data['duration'] ?? $service->duration;
        $service->price = $data['price'] ?? $service->price;

        if ($service->update()) {
            echo json_encode([
                'success' => true,
                'message' => 'Service updated successfully'
            ]);
        } else {
            echo json_encode([
                'success' => false,
                'message' => 'Failed to update service'
            ]);
        }
    } else {
        echo json_encode([
            'success' => false,
            'message' => 'Service ID is required'
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
        $service->id = $_GET['id'];

        if ($service->delete()) {
            echo json_encode([
                'success' => true,
                'message' => 'Service deleted successfully'
            ]);
        } else {
            echo json_encode([
                'success' => false,
                'message' => 'Failed to delete service'
            ]);
        }
    } else {
        echo json_encode([
            'success' => false,
            'message' => 'Service ID is required'
        ]);
    }
}
?>