<?php
/**
 * API: /api/admin/mentorias.php
 * Vista de administración para el panel de control:
 * Métricas, usuarios registrados, estado de validación, último login y progreso de cursos
 */

header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

require_once __DIR__ . '/../utils/ChatDB.php';

$action = $_GET['action'] ?? 'overview';

try {
    switch ($action) {
        case 'overview':
            $data = ChatDB::getAdminMentoriasOverview();
            echo json_encode([
                'success' => true,
                'data' => $data
            ]);
            break;

        default:
            throw new Exception('Acción desconocida.');
    }
} catch (Exception $e) {
    http_response_code(400);
    echo json_encode([
        'success' => false,
        'error' => $e->getMessage()
    ]);
}
