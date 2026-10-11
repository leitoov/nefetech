<?php
/**
 * API: /api/mentorias/dashboard.php
 * Endpoints de alumno:
 * - list: mentorías disponibles y avance del alumno
 * - progress: actualizar avance en módulos
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

$action = $_GET['action'] ?? 'list';
$input = json_decode(file_get_contents('php://input'), true) ?? [];

try {
    switch ($action) {
        case 'list':
            $userId = (int)($_GET['user_id'] ?? 0);
            if (!$userId) {
                throw new Exception('ID de usuario requerido.');
            }

            $courses = ChatDB::getUserMentoriaDashboard($userId);

            echo json_encode([
                'success' => true,
                'courses' => $courses
            ]);
            break;

        case 'update-progress':
            if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
                throw new Exception('Método no permitido', 405);
            }

            $userId = (int)($input['user_id'] ?? 0);
            $courseId = (int)($input['course_id'] ?? 0);
            $completedModules = (int)($input['completed_modules'] ?? 0);

            if (!$userId || !$courseId) {
                throw new Exception('Datos insuficientes.');
            }

            $result = ChatDB::updateEnrollmentProgress($userId, $courseId, $completedModules);

            echo json_encode([
                'success' => true,
                'message' => 'Progreso actualizado exitosamente.',
                'progress' => $result
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
