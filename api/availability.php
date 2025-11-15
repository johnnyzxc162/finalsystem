<?php
session_start();
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

require_once '../config/database.php';

class Availability {
    private $conn;
    private $table_name = 'availability';

    public $id;
    public $date;
    public $start_time;
    public $end_time;
    public $is_available;

    public function __construct() {
        $database = new Database();
        $this->conn = $database->getConnection();
    }

    public function getAvailability($date) {
        $query = "SELECT id, date, start_time, end_time, is_available
                  FROM " . $this->table_name . "
                  WHERE date = ? ORDER BY start_time";

        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(1, $date);
        $stmt->execute();

        return $stmt;
    }

    public function getAvailabilityRange($start_date, $end_date) {
        $query = "SELECT id, date, start_time, end_time, is_available
                  FROM " . $this->table_name . "
                  WHERE date BETWEEN ? AND ? ORDER BY date, start_time";

        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(1, $start_date);
        $stmt->bindParam(2, $end_date);
        $stmt->execute();

        return $stmt;
    }

    public function create() {
        $query = "INSERT INTO " . $this->table_name . "
                  SET date=:date, start_time=:start_time, end_time=:end_time, is_available=:is_available";

        $stmt = $this->conn->prepare($query);

        $this->date = htmlspecialchars(strip_tags($this->date));
        $this->start_time = htmlspecialchars(strip_tags($this->start_time));
        $this->end_time = htmlspecialchars(strip_tags($this->end_time));
        $this->is_available = htmlspecialchars(strip_tags($this->is_available));

        $stmt->bindParam(':date', $this->date);
        $stmt->bindParam(':start_time', $this->start_time);
        $stmt->bindParam(':end_time', $this->end_time);
        $stmt->bindParam(':is_available', $this->is_available);

        if($stmt->execute()) {
            return true;
        }
        return false;
    }

    public function update() {
        $query = "UPDATE " . $this->table_name . "
                  SET is_available = :is_available
                  WHERE id = :id";

        $stmt = $this->conn->prepare($query);

        $this->is_available = htmlspecialchars(strip_tags($this->is_available));

        $stmt->bindParam(':is_available', $this->is_available);
        $stmt->bindParam(':id', $this->id);

        if($stmt->execute()) {
            return true;
        }
        return false;
    }

    public function delete() {
        $query = "DELETE FROM " . $this->table_name . " WHERE id = ?";

        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(1, $this->id);

        if($stmt->execute()) {
            return true;
        }
        return false;
    }
}

$availability = new Availability();

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    if (isset($_GET['date'])) {
        $stmt = $availability->getAvailability($_GET['date']);
    } elseif (isset($_GET['start_date']) && isset($_GET['end_date'])) {
        $stmt = $availability->getAvailabilityRange($_GET['start_date'], $_GET['end_date']);
    } else {
        // Default to current month
        $start_date = date('Y-m-01');
        $end_date = date('Y-m-t');
        $stmt = $availability->getAvailabilityRange($start_date, $end_date);
    }

    $availabilities = [];
    while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
        $availabilities[] = $row;
    }

    echo json_encode([
        'success' => true,
        'availabilities' => $availabilities
    ]);
} elseif ($_SERVER['REQUEST_METHOD'] === 'POST') {
    if (!isset($_SESSION['user_role']) || $_SESSION['user_role'] !== 'admin') {
        echo json_encode([
            'success' => false,
            'message' => 'Admin access required'
        ]);
        exit;
    }

    $data = json_decode(file_get_contents('php://input'), true);

    if (!empty($data['date']) && !empty($data['start_time']) && !empty($data['end_time'])) {
        $availability->date = $data['date'];
        $availability->start_time = $data['start_time'];
        $availability->end_time = $data['end_time'];
        $availability->is_available = $data['is_available'] ?? 1;

        if ($availability->create()) {
            echo json_encode([
                'success' => true,
                'message' => 'Availability created successfully'
            ]);
        } else {
            echo json_encode([
                'success' => false,
                'message' => 'Failed to create availability'
            ]);
        }
    } else {
        echo json_encode([
            'success' => false,
            'message' => 'Date, start time and end time are required'
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
        $availability->id = $data['id'];
        $availability->is_available = $data['is_available'] ?? 1;

        if ($availability->update()) {
            echo json_encode([
                'success' => true,
                'message' => 'Availability updated successfully'
            ]);
        } else {
            echo json_encode([
                'success' => false,
                'message' => 'Failed to update availability'
            ]);
        }
    } else {
        echo json_encode([
            'success' => false,
            'message' => 'Availability ID is required'
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
        $availability->id = $_GET['id'];

        if ($availability->delete()) {
            echo json_encode([
                'success' => true,
                'message' => 'Availability deleted successfully'
            ]);
        } else {
            echo json_encode([
                'success' => false,
                'message' => 'Failed to delete availability'
            ]);
        }
    } else {
        echo json_encode([
            'success' => false,
            'message' => 'Availability ID is required'
        ]);
    }
}
?>