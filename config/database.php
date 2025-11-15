<?php

class Database {
    private $conn;

    public function getConnection() {
        $this->conn = null;

        // Get the database URL from Netlify's environment variables
        $dbUrl = getenv('NETLIFY_DATABASE_URL');

        if ($dbUrl === false) {
            die("Connection error: Database URL not found. Make sure NETLIFY_DATABASE_URL is set.");
        }

        // Parse the URL to get the connection details
        $dbopts = parse_url($dbUrl);
        $host = $dbopts['host'];
        $port = $dbopts['port'];
        $dbname = ltrim($dbopts['path'], '/');
        $username = $dbopts['user'];
        $password = $dbopts['pass'];

        try {
            // Create a PostgreSQL PDO connection string
            $dsn = "pgsql:host=$host;port=$port;dbname=$dbname";
            $this->conn = new PDO($dsn, $username, $password);
            $this->conn->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

        } catch(PDOException $exception) {
            echo "Connection error: " . $exception->getMessage();
        }

        return $this->conn;
    }
}
?>