<?php

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed']);
    exit;
}

$auth = Auth::requireAuth();

$db = Database::connect();

$stmt = $db->prepare("SELECT id, email, name, created_at FROM users WHERE id = ?");
$stmt->execute([$auth['user_id']]);
$user = $stmt->fetch(PDO::FETCH_ASSOC);

if (!$user) {
    http_response_code(404);
    echo json_encode(['error' => 'User not found']);
    exit;
}

echo json_encode([
    'user' => [
        'id' => $user['id'],
        'email' => $user['email'],
        'name' => $user['name'],
        'created_at' => $user['created_at']
    ]
]);
