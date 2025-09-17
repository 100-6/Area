<?php

class Auth {
    
    public static function createToken($userId) {
        $payload = json_encode(['user_id' => $userId, 'exp' => time() + 3600]);

        return base64_encode($payload);
    }
    
    public static function validateToken($token) {
        $payload = json_decode(base64_decode($token), true);

        if (!$payload || $payload['exp'] < time())
            return false;
        return $payload;
    }
    
    public static function getTokenFromHeader() {
        $headers = getallheaders();

        if (isset($headers['Authorization']))
            return str_replace('Bearer ', '', $headers['Authorization']);
        return null;
    }
    
    public static function requireAuth() {
        $token = self::getTokenFromHeader();

        if (!$token) {
            http_response_code(401);
            echo json_encode(['error' => 'Token missing']);
            exit;
        }
        $payload = self::validateToken($token);
        if (!$payload) {
            http_response_code(401);
            echo json_encode(['error' => 'Invalid token']);
            exit;
        }
        return $payload;
    }
}
