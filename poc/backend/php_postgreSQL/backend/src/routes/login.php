<?php

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed']);
    exit;
}

$data = json_decode(file_get_contents('php://input'), true);

if (!isset($data['email']) || !isset($data['password'])) {
    http_response_code(400);
    echo json_encode(['error' => 'Email and password are required']);
    exit;
}

$db = Database::connect();

$stmt = $db->prepare("SELECT id, email, password, name FROM users WHERE email = ?");
$stmt->execute([$data['email']]);
$user = $stmt->fetch(PDO::FETCH_ASSOC);

if (!$user || !password_verify($data['password'], $user['password'])) {
    http_response_code(401);
    echo json_encode(['error' => 'Invalid credentials']);
    exit;
}

$token = Auth::createToken($user['id']);

echo json_encode([
    'message' => 'Login successful',
    'token' => $token,
    'user' => [
        'id' => $user['id'],
        'email' => $user['email'],
        'name' => $user['name']
    ]
]);
