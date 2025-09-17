<?php

class Database {
    private static $instance = null;
    
    public static function connect() {
        if (self::$instance === null) {
            try {
                $host = getenv('DB_HOST') ?: 'db';
                $port = getenv('DB_PORT') ?: '5432';
                $dbname = getenv('DB_NAME') ?: 'app';
                $user = getenv('DB_USER') ?: 'user';
                $password = getenv('DB_PASSWORD') ?: 'pass';
                
                self::$instance = new PDO(
                    "pgsql:host={$host};port={$port};dbname={$dbname}", 
                    $user, 
                    $password
                );
                self::$instance->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
            } catch (PDOException $e) {
                http_response_code(500);
                echo json_encode(['error' => 'Database connection failed: ' . $e->getMessage()]);
                exit;
            }
        }
        return self::$instance;
    }
}
