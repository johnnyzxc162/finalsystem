<?php
require_once '../config/database.php';

class Appointment {
    private $conn;
    private $table_name = 'appointments';

    public $id;
    public $user_id;
    public $service_id;
    public $appointment_date;
    public $appointment_time;
    public $status;
    public $notes;
    public $created_at;

    public function __construct() {
        $database = new Database();
        $this->conn = $database->getConnection();
    }

    public function create() {
        $query = "INSERT INTO " . $this->table_name . "
                  (user_id, service_id, appointment_date, appointment_time, status, notes)
                  VALUES (:user_id, :service_id, :appointment_date, :appointment_time, :status, :notes)";

        $stmt = $this->conn->prepare($query);

        $this->user_id = htmlspecialchars(strip_tags($this->user_id));
        $this->service_id = htmlspecialchars(strip_tags($this->service_id));
        $this->appointment_date = htmlspecialchars(strip_tags($this->appointment_date));
        $this->appointment_time = htmlspecialchars(strip_tags($this->appointment_time));
        $this->status = htmlspecialchars(strip_tags($this->status));
        $this->notes = htmlspecialchars(strip_tags($this->notes));

        $stmt->bindParam(':user_id', $this->user_id);
        $stmt->bindParam(':service_id', $this->service_id);
        $stmt->bindParam(':appointment_date', $this->appointment_date);
        $stmt->bindParam(':appointment_time', $this->appointment_time);
        $stmt->bindParam(':status', $this->status);
        $stmt->bindParam(':notes', $this->notes);

        if($stmt->execute()) {
            return true;
        }
        return false;
    }

    public function readAll() {
        $query = "SELECT a.id, a.appointment_date, a.appointment_time, a.status, a.notes,
                         u.name as user_name, u.email as user_email,
                         s.name as service_name, s.duration, s.price
                  FROM " . $this->table_name . " a
                  LEFT JOIN users u ON a.user_id = u.id
                  LEFT JOIN services s ON a.service_id = s.id
                  ORDER BY a.appointment_date DESC, a.appointment_time DESC";

        $stmt = $this->conn->prepare($query);
        $stmt->execute();

        return $stmt;
    }

    public function readByUser($user_id) {
        $query = "SELECT a.id, a.appointment_date, a.appointment_time, a.status, a.notes,
                         s.name as service_name, s.duration, s.price
                  FROM " . $this->table_name . " a
                  LEFT JOIN services s ON a.service_id = s.id
                  WHERE a.user_id = ?
                  ORDER BY a.appointment_date DESC, a.appointment_time DESC";

        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(1, $user_id);
        $stmt->execute();

        return $stmt;
    }

    public function readOne() {
        $query = "SELECT a.id, a.user_id, a.service_id, a.appointment_date,
                         a.appointment_time, a.status, a.notes, a.created_at,
                         u.name as user_name, u.email as user_email,
                         s.name as service_name, s.duration, s.price
                  FROM " . $this->table_name . " a
                  LEFT JOIN users u ON a.user_id = u.id
                  LEFT JOIN services s ON a.service_id = s.id
                  WHERE a.id = ? LIMIT 0,1";

        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(1, $this->id);
        $stmt->execute();

        $row = $stmt->fetch(PDO::FETCH_ASSOC);

        $this->user_id = $row['user_id'];
        $this->service_id = $row['service_id'];
        $this->appointment_date = $row['appointment_date'];
        $this->appointment_time = $row['appointment_time'];
        $this->status = $row['status'];
        $this->notes = $row['notes'];
        $this->created_at = $row['created_at'];
    }

    public function update() {
        $query = "UPDATE " . $this->table_name . "
                  SET appointment_date = :appointment_date,
                      appointment_time = :appointment_time,
                      status = :status, notes = :notes
                  WHERE id = :id";

        $stmt = $this->conn->prepare($query);

        $this->appointment_date = htmlspecialchars(strip_tags($this->appointment_date));
        $this->appointment_time = htmlspecialchars(strip_tags($this->appointment_time));
        $this->status = htmlspecialchars(strip_tags($this->status));
        $this->notes = htmlspecialchars(strip_tags($this->notes));

        $stmt->bindParam(':appointment_date', $this->appointment_date);
        $stmt->bindParam(':appointment_time', $this->appointment_time);
        $stmt->bindParam(':status', $this->status);
        $stmt->bindParam(':notes', $this->notes);
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

    public function checkAvailability($date, $time, $service_id) {
        // Simple check: ensure no appointment exists at the exact same date and time
        $query = "SELECT COUNT(*) as count FROM " . $this->table_name . "
                  WHERE appointment_date = ? AND appointment_time = ? AND status != 'cancelled'";

        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(1, $date);
        $stmt->bindParam(2, $time);
        $stmt->execute();
        $result = $stmt->fetch(PDO::FETCH_ASSOC);

        return $result['count'] == 0;
    }
}
?>