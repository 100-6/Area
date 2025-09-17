<?php

header("Content-Type: application/json");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

require_once 'Database.php';
require_once 'Auth.php';

$path = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
$path = rtrim($path, '/');

switch ($path) {
    case '/health':
        require 'routes/health.php';
        break;
    case '/register':
        require 'routes/register.php';
        break;
    case '/login':
        require 'routes/login.php';
        break;
    case '/me':
        require 'routes/me.php';
        break;
    default:
        http_response_code(404);
        echo json_encode(['error' => 'Route not found']);
        break;
}
