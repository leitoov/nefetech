<?php
/**
 * Admin Auth - Login para panel de administración
 * Credenciales autorizadas: leonelexequielvincent@gmail.com o lvincent | pass: Codigo.1818@@
 */
header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['error' => 'Método no permitido']);
    exit;
}

require_once __DIR__ . '/../utils/EnvLoader.php';
require_once __DIR__ . '/../utils/JWT.php';
EnvLoader::load();

$secret = EnvLoader::get('JWT_SECRET', 'nefetech_jwt_super_secret_key_2026');

$raw = file_get_contents('php://input');
$data = json_decode($raw, true) ?: [];

$user = trim($data['username'] ?? '');
$password = trim($data['password'] ?? '');

$validUsers = ['leonelexequielvincent@gmail.com', 'lvincent'];
$validPass = 'Codigo.1818@@';

if (in_array(strtolower($user), array_map('strtolower', $validUsers)) && $password === $validPass) {
    // Generar token JWT con rol admin (duración 8 horas)
    $payload = [
        'sub' => 'admin_lvincent',
        'email' => 'leonelexequielvincent@gmail.com',
        'role' => 'admin',
        'domain' => 'nefetech.online'
    ];

    $token = JWT::encode($payload, $secret, 28800);

    echo json_encode([
        'success' => true,
        'token' => $token,
        'user' => [
            'username' => 'lvincent',
            'email' => 'leonelexequielvincent@gmail.com',
            'role' => 'admin'
        ]
    ]);
} else {
    http_response_code(401);
    echo json_encode([
        'success' => false,
        'error' => 'Usuario o contraseña incorrectos.'
    ]);
}
