<?php
/**
 * Admin Leads API - Obtener listado de leads o detalle individual con historial
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

$leadId = isset($_GET['id']) ? (int)$_GET['id'] : 0;

if ($leadId > 0) {
    // Detalle de un lead específico con historial de chat y respuestas previas
    $lead = ChatDB::getLeadById($leadId);
    if (!$lead) {
        http_response_code(404);
        echo json_encode(['error' => 'Lead no encontrado']);
        exit;
    }

    $history = ChatDB::getHistory($lead['session_id']);
    $replies = ChatDB::getLeadReplies($leadId);

    echo json_encode([
        'success' => true,
        'lead' => $lead,
        'chat_history' => $history,
        'replies' => $replies
    ]);
} else {
    // Listado general de leads
    $leads = ChatDB::getAllLeads();
    echo json_encode([
        'success' => true,
        'leads' => $leads
    ]);
}
