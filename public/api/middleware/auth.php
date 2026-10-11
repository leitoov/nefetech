<?php
/**
 * Auth Middleware - Valida el token JWT en la cabecera Authorization: Bearer <token>
 */
require_once __DIR__ . '/../utils/EnvLoader.php';
require_once __DIR__ . '/../utils/JWT.php';

function authenticate(): array {
    EnvLoader::load();
    $secret = EnvLoader::get('JWT_SECRET', 'nefetech_jwt_super_secret_key_2026');

    if (file_exists(__DIR__ . '/../config.php')) {
        include __DIR__ . '/../config.php';
        if (isset($CONFIG['JWT_SECRET'])) {
            $secret = $CONFIG['JWT_SECRET'];
        }
    }

    $authHeader = '';

    if (isset($_SERVER['HTTP_AUTHORIZATION'])) {
        $authHeader = $_SERVER['HTTP_AUTHORIZATION'];
    } elseif (isset($_SERVER['REDIRECT_HTTP_AUTHORIZATION'])) {
        $authHeader = $_SERVER['REDIRECT_HTTP_AUTHORIZATION'];
    } elseif (function_exists('apache_request_headers')) {
        $headers = apache_request_headers();
        if (isset($headers['Authorization'])) {
            $authHeader = $headers['Authorization'];
        }
    }

    if (empty($authHeader) || !preg_match('/Bearer\s(\S+)/', $authHeader, $matches)) {
        http_response_code(401);
        echo json_encode([
            'success' => false,
            'error' => 'No autorizado. Se requiere token Bearer JWT en la cabecera Authorization.'
        ]);
        exit;
    }

    $jwt = $matches[1];
    $payload = JWT::decode($jwt, $secret);

    if (!$payload) {
        http_response_code(401);
        echo json_encode([
            'success' => false,
            'error' => 'Token JWT inválido o expirado. Por favor, vuelve a autenticarte.'
        ]);
        exit;
    }

    return $payload;
}
