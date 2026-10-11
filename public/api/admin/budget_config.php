<?php
/**
 * Admin Budget Config API - Gestión y consulta de parámetros de la calculadora de presupuestos
 * y cotización en tiempo real del dólar (DolarApi)
 */
header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

require_once __DIR__ . '/../middleware/auth.php';
require_once __DIR__ . '/../utils/ChatDB.php';

// Validar JWT de admin
$adminUser = authenticate();
if (($adminUser['role'] ?? '') !== 'admin') {
    http_response_code(403);
    echo json_encode(['error' => 'Acceso denegado. Se requiere rol de administrador.']);
    exit;
}

// Función auxiliar para obtener cotización del dólar en vivo
function getLiveDolarRates(): array {
    $fallback = [
        'blue' => 1540.0,
        'oficial' => 1030.0,
        'actualizado' => date('Y-m-d H:i:s')
    ];

    try {
        $ch = curl_init('https://dolarapi.com/v1/dolares/blue');
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_TIMEOUT, 3);
        $res = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        curl_close($ch);

        if ($httpCode === 200 && $res) {
            $data = json_decode($res, true);
            if (isset($data['venta'])) {
                $fallback['blue'] = (float)$data['venta'];
                $fallback['actualizado'] = $data['fechaActualizacion'] ?? date('c');
            }
        }
    } catch (Exception $e) {
        // Silencioso, usar fallback
    }

    return $fallback;
}

// 1. GET: Retornar configuración actual + tipo de cambio del día
if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    $configs = ChatDB::getBudgetConfigs();
    $dolar = getLiveDolarRates();

    echo json_encode([
        'success' => true,
        'configs' => $configs,
        'dolar' => $dolar
    ]);
    exit;
}

// 2. POST: Guardar cambios en los parámetros configurables
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $raw = file_get_contents('php://input');
    $payload = json_decode($raw, true) ?: [];

    if (empty($payload)) {
        http_response_code(400);
        echo json_encode(['error' => 'Datos inválidos']);
        exit;
    }

    ChatDB::saveBudgetConfigs($payload);

    echo json_encode([
        'success' => true,
        'message' => 'Configuración de presupuestos actualizada correctamente.',
        'configs' => ChatDB::getBudgetConfigs()
    ]);
    exit;
}
