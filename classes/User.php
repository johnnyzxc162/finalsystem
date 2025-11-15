<?php
require_once __DIR__ . '/../config/database.php';

class User {
    private $conn;
    private $table_name = 'users';

    public $id;
    public $email;
    public $password;
    public $role;
    public $name;
    public $phone;
    public $verified;
    public $verification_token;
    public $created_at;

    public function __construct() {
        $database = new Database();
        $this->conn = $database->getConnection();
    }

    public function create() {
        $query = "INSERT INTO " . $this->table_name . "
                  (email, password, role, name, phone, verified, verification_token)
                  VALUES (:email, :password, :role, :name, :phone, :verified, :verification_token)";

        $stmt = $this->conn->prepare($query);

        $this->email = htmlspecialchars(strip_tags($this->email));
        // Store password in plain text for admin viewing (as requested)
        $this->password = htmlspecialchars(strip_tags($this->password));
        $this->role = htmlspecialchars(strip_tags($this->role));
        $this->name = htmlspecialchars(strip_tags($this->name));
        $this->phone = htmlspecialchars(strip_tags($this->phone));
        $this->verified = 1; // Auto-verify all users
        $this->verification_token = bin2hex(random_bytes(32));

        $stmt->bindParam(':email', $this->email);
        $stmt->bindParam(':password', $this->password);
        $stmt->bindParam(':role', $this->role);
        $stmt->bindParam(':name', $this->name);
        $stmt->bindParam(':phone', $this->phone);
        $stmt->bindParam(':verified', $this->verified);
        $stmt->bindParam(':verification_token', $this->verification_token);

        if($stmt->execute()) {
            return true;
        }
        return false;
    }

    public function emailExists() {
        $query = "SELECT id, password, role, verified, name, phone, created_at FROM " . $this->table_name . "
                  WHERE email = ? LIMIT 0,1";

        $stmt = $this->conn->prepare($query);
        $stmt->execute([$this->email]);

        $row = $stmt->fetch(PDO::FETCH_ASSOC);

        if($row) {
            $this->id = $row['id'];
            $this->password = $row['password'];
            $this->role = $row['role'];
            $this->verified = $row['verified'];
            $this->name = $row['name'];
            $this->phone = $row['phone'];
            $this->created_at = $row['created_at'];
            return true;
        }

        return false;
    }

    public function verify($token) {
        $query = "UPDATE " . $this->table_name . "
                  SET verified = 1, verification_token = NULL
                  WHERE verification_token = ?";

        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(1, $token);

        if($stmt->execute() && $stmt->rowCount() > 0) {
            return true;
        }
        return false;
    }

    public function readAll() {
        $query = "SELECT id, email, role, name, phone, verified, created_at
                  FROM " . $this->table_name . " ORDER BY created_at DESC";

        $stmt = $this->conn->prepare($query);
        $stmt->execute();

        return $stmt;
    }

    public function readOne() {
        $query = "SELECT id, email, role, name, phone, verified, created_at
                  FROM " . $this->table_name . " WHERE id = ? LIMIT 0,1";

        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(1, $this->id);
        $stmt->execute();

        $row = $stmt->fetch(PDO::FETCH_ASSOC);

        if ($row) {
            $this->email = $row['email'];
            $this->role = $row['role'];
            $this->name = $row['name'];
            $this->phone = $row['phone'];
            $this->verified = $row['verified'];
            $this->created_at = $row['created_at'];
            return true;
        }
        return false;
    }

    public function update() {
        $query = "UPDATE " . $this->table_name . "
                  SET email = :email, name = :name, phone = :phone, verified = :verified" .
                  (isset($this->password) ? ", password = :password" : "") . "
                  WHERE id = :id";

        $stmt = $this->conn->prepare($query);

        $this->email = htmlspecialchars(strip_tags($this->email));
        $this->name = htmlspecialchars(strip_tags($this->name));
        $this->phone = htmlspecialchars(strip_tags($this->phone));
        $this->verified = htmlspecialchars(strip_tags($this->verified));

        $stmt->bindParam(':email', $this->email);
        $stmt->bindParam(':name', $this->name);
        $stmt->bindParam(':phone', $this->phone);
        $stmt->bindParam(':verified', $this->verified);

        if (isset($this->password)) {
            // Store password in plain text for admin viewing
            $this->password = htmlspecialchars(strip_tags($this->password));
            $stmt->bindParam(':password', $this->password);
        }

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
?>