<?php
/**
 * Admin Reply API - Responder a un lead por Email o registrar contacto de WhatsApp
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

require_once __DIR__ . '/../middleware/auth.php';
require_once __DIR__ . '/../utils/ChatDB.php';

// Validar JWT de admin
$adminUser = authenticate();
if (($adminUser['role'] ?? '') !== 'admin') {
    http_response_code(403);
    echo json_encode(['error' => 'Acceso denegado. Se requiere rol de administrador.']);
    exit;
}

$raw = file_get_contents('php://input');
$data = json_decode($raw, true) ?: [];

$leadId = (int)($data['lead_id'] ?? 0);
$channel = $data['channel'] ?? 'email'; // 'email' o 'whatsapp'
$message = trim($data['message'] ?? '');
$subject = trim($data['subject'] ?? 'Respuesta a tu consulta de proyecto en Nefetech');

if ($leadId <= 0 || empty($message)) {
    http_response_code(400);
    echo json_encode(['error' => 'Faltan campos obligatorios (lead_id y message).']);
    exit;
}

$lead = ChatDB::getLeadById($leadId);
if (!$lead) {
    http_response_code(404);
    echo json_encode(['error' => 'Lead no encontrado']);
    exit;
}

$recipient = ($channel === 'email') ? ($lead['email'] ?? '') : ($lead['phone'] ?? '');

if ($channel === 'email') {
    if (empty($recipient) || !filter_var($recipient, FILTER_VALIDATE_EMAIL)) {
        http_response_code(400);
        echo json_encode(['error' => 'El lead no tiene un correo electrónico válido registrado.']);
        exit;
    }

    // Historial previo para continuar la cadena de email
    $history = ChatDB::getHistory($lead['session_id']);
    $prevChatHtml = '';
    foreach ($history as $h) {
        $emisor = $h['sender'] === 'user' ? 'Tú (Cliente)' : 'Asistente Nefetech';
        $prevChatHtml .= "<div style='margin-bottom: 8px; font-size: 12px; color: #555;'><strong style='color: #222;'>{$emisor}:</strong> " . htmlspecialchars($h['message']) . "</div>";
    }

    $emailBody = "
    <!DOCTYPE html>
    <html>
    <head><meta charset='utf-8'></head>
    <body style='font-family: Arial, sans-serif; background-color: #ffffff; color: #1e293b; line-height: 1.6; padding: 20px;'>
        <div style='max-width: 650px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 8px; padding: 24px;'>
            <div style='border-bottom: 2px solid #2563eb; padding-bottom: 12px; margin-bottom: 20px;'>
                <h2 style='margin: 0; color: #0f172a; font-size: 20px;'>NEFETECH</h2>
                <div style='font-size: 12px; color: #64748b;'>Desarrollo de Software a Medida • Inteligencia Artificial • Consultoría</div>
            </div>

            <div style='font-size: 14px; color: #0f172a; margin-bottom: 24px; white-space: pre-line;'>
                " . htmlspecialchars($message) . "
            </div>

            <div style='margin-top: 30px; padding-top: 16px; border-top: 1px dashed #cbd5e1;'>
                <div style='font-size: 12px; font-weight: bold; color: #475569; margin-bottom: 8px;'>Historial de tu consulta en nefetech.online:</div>
                <div style='background: #f8fafc; padding: 12px; border-radius: 6px; border-left: 3px solid #2563eb;'>
                    <div style='font-size: 12px; color: #0f172a; margin-bottom: 10px;'><strong>Tu necesidad planteada:</strong> " . nl2br(htmlspecialchars($lead['lead_message'])) . "</div>
                    {$prevChatHtml}
                </div>
            </div>

            <div style='margin-top: 24px; font-size: 11px; color: #94a3b8; text-align: center;'>
                Nefetech • comercial@nefetech.online • +54 9 11 7060-5129 • https://nefetech.online
            </div>
        </div>
    </body>
    </html>
    ";

    $headers = [
        'MIME-Version: 1.0',
        'Content-type: text/html; charset=utf-8',
        'From: Leonel Vincent - Nefetech <comercial@nefetech.online>',
        'Reply-To: comercial@nefetech.online',
        'Bcc: leonelexequielvincent@gmail.com',
        'X-Mailer: PHP/' . phpversion()
    ];

    $sent = mail($recipient, $subject, $emailBody, implode("\r\n", $headers));
    if (!$sent) {
        http_response_code(500);
        echo json_encode(['error' => 'No se pudo despachar el correo electrónico desde el servidor.']);
        exit;
    }
}

// Guardar registro de la respuesta en la base de datos
$replyId = ChatDB::saveLeadReply($leadId, $channel, $message, $recipient, $subject);

echo json_encode([
    'success' => true,
    'reply_id' => $replyId,
    'message' => 'Respuesta registrada y despachada con éxito'
]);
