<?php
/**
 * Admin Auth - Login para panel de administración (credenciales desde .env)
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

$secret = EnvLoader::get('JWT_SECRET', '');
$adminEmail = EnvLoader::get('ADMIN_EMAIL', '');
$adminUsername = EnvLoader::get('ADMIN_USERNAME', '');
$adminPassword = EnvLoader::get('ADMIN_PASSWORD', '');

if (empty($secret) || empty($adminPassword) || (empty($adminEmail) && empty($adminUsername))) {
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => 'Configuración de autenticación incompleta en el servidor.']);
    exit;
}

$raw = file_get_contents('php://input');
$data = json_decode($raw, true) ?: [];

$user = trim($data['username'] ?? '');
$password = trim($data['password'] ?? '');

$validUsers = array_filter([$adminEmail, $adminUsername], fn($v) => $v !== '');

if ($user !== '' && in_array(strtolower($user), array_map('strtolower', $validUsers), true) && hash_equals($adminPassword, $password)) {
    // Generar token JWT con rol admin (duración 8 horas)
    $payload = [
        'sub' => 'admin_' . ($adminUsername ?: 'user'),
        'email' => $adminEmail,
        'role' => 'admin',
        'domain' => 'nefetech.online'
    ];

    $token = JWT::encode($payload, $secret, 28800);

    echo json_encode([
        'success' => true,
        'token' => $token,
        'user' => [
            'username' => $adminUsername,
            'email' => $adminEmail,
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
