<?php
/**
 * Auth Middleware - Valida el token JWT en la cabecera Authorization: Bearer <token>
 */
require_once __DIR__ . '/../utils/EnvLoader.php';
require_once __DIR__ . '/../utils/JWT.php';

function authenticate(): array {
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

/**
 * Valida la firma de integridad de la petición (anti-tampering y anti-scraping)
 */
function validateRequestSignature(string $rawBody): void {
    $clientSig = $_SERVER['HTTP_X_CLIENT_SIGNATURE'] ?? '';
    $timestamp = $_SERVER['HTTP_X_CLIENT_TIMESTAMP'] ?? '';

    // Si la cabecera está presente, validar rigurosamente la firma y frescura temporal (máx 5 minutos)
    if (!empty($clientSig)) {
        $nowMs = (int)(microtime(true) * 1000);
        $reqTime = (int)$timestamp;
        
        // Ventana de 5 minutos (300,000 ms) para prevenir ataques de repetición (replay attacks)
        if (abs($nowMs - $reqTime) > 300000) {
            http_response_code(403);
            echo json_encode(['success' => false, 'error' => 'Petición expirada o fuera de ventana temporal.']);
            exit;
        }

        $apiSalt = 'nefetech_api_integrity_sign_v1_2026';
        $expectedHash = hash('sha256', "{$rawBody}|{$timestamp}|{$apiSalt}");

        if (!hash_equals($expectedHash, $clientSig)) {
            http_response_code(403);
            echo json_encode(['success' => false, 'error' => 'Firma de integridad de la petición inválida.']);
            exit;
        }
    }
}
