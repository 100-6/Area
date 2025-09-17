<?php

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed']);
    exit;
}

$data = json_decode(file_get_contents('php://input'), true);

if (!isset($data['email']) || !isset($data['password']) || !isset($data['name'])) {
    http_response_code(400);
    echo json_encode(['error' => 'Email, password and name are required']);
    exit;
}

if (!filter_var($data['email'], FILTER_VALIDATE_EMAIL)) {
    http_response_code(400);
    echo json_encode(['error' => 'Invalid email format']);
    exit;
}

if (strlen($data['password']) < 6) {
    http_response_code(400);
    echo json_encode(['error' => 'Password must be at least 6 characters']);
    exit;
}

$db = Database::connect();

$stmt = $db->prepare("SELECT id FROM users WHERE email = ?");
$stmt->execute([$data['email']]);
if ($stmt->fetch()) {
    http_response_code(409);
    echo json_encode(['error' => 'Email already exists']);
    exit;
}

$hashedPassword = password_hash($data['password'], PASSWORD_DEFAULT);
$stmt = $db->prepare("INSERT INTO users (email, password, name) VALUES (?, ?, ?) RETURNING id");
$stmt->execute([$data['email'], $hashedPassword, $data['name']]);
$userId = $stmt->fetchColumn();

$token = Auth::createToken($userId);

http_response_code(201);
echo json_encode([
    'message' => 'User created successfully',
    'token' => $token,
    'user' => [
        'id' => $userId,
        'email' => $data['email'],
        'name' => $data['name']
    ]
]);
