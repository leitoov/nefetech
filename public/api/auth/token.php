<?php
/**
 * Auth Token Endpoint - Genera un JWT para comunicación con la API
 */
header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With, X-Client-Signature, X-Client-Timestamp');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['error' => 'Método no permitido. Utilizar POST.']);
    exit;
}

require_once __DIR__ . '/../utils/EnvLoader.php';
require_once __DIR__ . '/../utils/JWT.php';
EnvLoader::load();

$secret = EnvLoader::get('JWT_SECRET', '');

if (file_exists(__DIR__ . '/../config.php')) {
    include __DIR__ . '/../config.php';
    if (isset($CONFIG['JWT_SECRET'])) {
        $secret = $CONFIG['JWT_SECRET'];
    }
}

if (empty($secret)) {
    http_response_code(500);
    echo json_encode(['error' => 'JWT_SECRET no configurado en el servidor']);
    exit;
}

// Leer cliente o sesión
$raw = file_get_contents('php://input');
$data = json_decode($raw, true) ?: [];

$clientId = isset($data['client_id']) ? preg_replace('/[^a-zA-Z0-9_-]/', '', $data['client_id']) : 'web_visitor_' . bin2hex(random_bytes(4));

$payload = [
    'sub' => $clientId,
    'role' => 'client',
    'domain' => 'nefetech.online'
];

// Token válido por 2 horas (7200s)
$token = JWT::encode($payload, $secret, 7200);

echo json_encode([
    'success' => true,
    'token_type' => 'Bearer',
    'access_token' => $token,
    'expires_in' => 7200,
    'user' => [
        'id' => $clientId,
        'role' => 'client'
    ]
]);
