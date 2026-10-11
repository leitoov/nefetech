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

// 1. GET: Retornar configuración actual + tipo de cambio del día + historial de cambios
if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    $action = $_GET['action'] ?? '';

    if ($action === 'history') {
        echo json_encode([
            'success' => true,
            'history' => ChatDB::getConfigHistory(50)
        ]);
        exit;
    }

    if ($action === 'sent_quotations') {
        echo json_encode([
            'success' => true,
            'quotations' => ChatDB::getSentQuotations(50)
        ]);
        exit;
    }

    if ($action === 'prompts') {
        echo json_encode([
            'success' => true,
            'prompts' => ChatDB::getAllPrompts(),
            'active_prompt' => ChatDB::getActivePrompt()
        ]);
        exit;
    }

    $configs = ChatDB::getBudgetConfigs();
    $dolar = getLiveDolarRates();
    $history = ChatDB::getConfigHistory(10);
    $sentQuotations = ChatDB::getSentQuotations(10);
    $prompts = ChatDB::getAllPrompts();

    echo json_encode([
        'success' => true,
        'configs' => $configs,
        'dolar' => $dolar,
        'history' => $history,
        'sent_quotations' => $sentQuotations,
        'prompts' => $prompts,
        'active_prompt' => ChatDB::getActivePrompt()
    ]);
    exit;
}

// 2. POST: Guardar cambios o aplicar aumentos porcentuales
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $raw = file_get_contents('php://input');
    $payload = json_decode($raw, true) ?: [];

    $action = $payload['action'] ?? 'save';

    if ($action === 'create_prompt') {
        $versionName = trim($payload['version_name'] ?? '');
        $promptText = trim($payload['prompt_text'] ?? '');
        $activateImmediately = !empty($payload['activate_immediately']);

        if (empty($versionName) || empty($promptText)) {
            http_response_code(400);
            echo json_encode(['error' => 'Nombre de versión y contenido del prompt son obligatorios.']);
            exit;
        }

        $adminName = $adminUser['username'] ?? 'admin';
        $newPrompt = ChatDB::createPrompt($versionName, $promptText, $activateImmediately, $adminName);

        echo json_encode([
            'success' => true,
            'message' => 'Nueva versión de prompt guardada con éxito.',
            'prompt' => $newPrompt,
            'prompts' => ChatDB::getAllPrompts()
        ]);
        exit;
    }

    if ($action === 'activate_prompt') {
        $promptId = (int)($payload['prompt_id'] ?? 0);
        if ($promptId <= 0) {
            http_response_code(400);
            echo json_encode(['error' => 'ID de prompt inválido.']);
            exit;
        }

        $ok = ChatDB::activatePrompt($promptId);
        if (!$ok) {
            http_response_code(404);
            echo json_encode(['error' => 'No se encontró el prompt especificado.']);
            exit;
        }

        echo json_encode([
            'success' => true,
            'message' => 'Versión de prompt activada correctamente.',
            'prompts' => ChatDB::getAllPrompts(),
            'active_prompt' => ChatDB::getActivePrompt()
        ]);
        exit;
    }

    if ($action === 'percentage_increase') {
        $percent = (float)($payload['percentage'] ?? 0);
        if ($percent == 0) {
            http_response_code(400);
            echo json_encode(['error' => 'El porcentaje de aumento no puede ser 0']);
            exit;
        }

        $adminName = $adminUser['username'] ?? 'admin';
        $updatedConfigs = ChatDB::applyPercentageIncrease($percent, $adminName);

        echo json_encode([
            'success' => true,
            'message' => "Aumento del {$percent}% aplicado con éxito a todas las tarifas.",
            'configs' => $updatedConfigs,
            'history' => ChatDB::getConfigHistory(10)
        ]);
        exit;
    }

    $configsToSave = $payload['configs'] ?? $payload;
    unset($configsToSave['action']);

    if (empty($configsToSave)) {
        http_response_code(400);
        echo json_encode(['error' => 'Datos inválidos']);
        exit;
    }

    ChatDB::saveBudgetConfigs($configsToSave);
    
    // Registrar cambio manual en historial
    $adminName = $adminUser['username'] ?? 'admin';
    ChatDB::logConfigHistory('manual_update', 'Actualización manual de parámetros y tarifas', null, $configsToSave, $adminName);

    echo json_encode([
        'success' => true,
        'message' => 'Configuración de presupuestos actualizada correctamente.',
        'configs' => ChatDB::getBudgetConfigs(),
        'history' => ChatDB::getConfigHistory(10)
    ]);
    exit;
}
