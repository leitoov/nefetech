<?php
/**
 * Nefetech - API Backend para Google Gemini IA con optimización comercial y RAG
 */

header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With, X-Client-Signature, X-Client-Timestamp');

// Pre-flight CORS
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['error' => 'Método no permitido. Utilizar POST.']);
    exit;
}

// 1. AUTENTICACIÓN JWT OBLIGATORIA
require_once __DIR__ . '/utils/EnvLoader.php';
require_once __DIR__ . '/utils/ChatDB.php';
require_once __DIR__ . '/middleware/auth.php';
EnvLoader::load();

$authenticatedUser = authenticate();

// 2. IDENTIFICAR SESIÓN DEL USUARIO
$ip = $_SERVER['REMOTE_ADDR'] ?? '0.0.0.0';
$userAgent = $_SERVER['HTTP_USER_AGENT'] ?? '';
$sessionId = $authenticatedUser['sub'] ?? ('session_' . md5($ip . $userAgent));

require_once __DIR__ . '/utils/LeadMailer.php';

// 3. GESTIÓN DE SESIÓN Y LÍMITE DE CONSULTAS
$session = ChatDB::getSession($sessionId, $ip, $userAgent);
$maxQuestions = ChatDB::getChatMaxMessages(); // Límite configurable desde el admin
$currentSessionCount = (int)($session['message_count'] ?? 0);
$isClosed = !empty($session['is_closed']);
$contactAttempts = (int)($session['contact_attempts'] ?? 0);

// CASO 0: Si la sesión ya fue cerrada definitivamente
if ($isClosed) {
    $closedMsg = "Esta conversación ha finalizado. Si deseas comunicarte con nuestro equipo, escríbenos directamente por WhatsApp al [+54 9 11 7060-5129](https://wa.me/5491170605129?text=Hola,%20vengo%20del%20chat%20de%20Nefetech%20y%20quiero%20hacer%20una%20consulta.) o por correo a [comercial@nefetech.online](mailto:comercial@nefetech.online). ¡Que tengas un excelente día!";
    echo json_encode([
        'success' => true,
        'limit_reached' => true,
        'session_closed' => true,
        'remaining_messages' => 0,
        'respuesta' => $closedMsg
    ]);
    exit;
}

// 4. VALIDAR INTEGRIDAD Y FIRMA DE LA PETICIÓN
$rawInput = file_get_contents('php://input');
validateRequestSignature($rawInput);

// Validar input y formato
$data = json_decode($rawInput, true);
$userMessage = isset($data['mensaje']) ? trim($data['mensaje']) : '';

if (empty($userMessage)) {
    http_response_code(400);
    echo json_encode(['error' => 'El mensaje no puede estar vacío.']);
    exit;
}

if (mb_strlen($userMessage, 'UTF-8') > 500) {
    http_response_code(400);
    echo json_encode([
        'error' => 'Tu mensaje supera el límite de caracteres. Por favor envía un resumen de tu consulta o datos de contacto.'
    ]);
    exit;
}

// Registrar mensaje del usuario en base de datos
ChatDB::logMessage($sessionId, 'user', $userMessage, (int)(mb_strlen($userMessage) / 4));
$currentCount = ChatDB::incrementMessageCount($sessionId);

// CAPTURA AUTOMÁTICA EN SEGUNDO PLANO: Si en cualquier mensaje el usuario comparte email o teléfono, registrar lead
$earlyContacts = LeadMailer::extractContactInfo($userMessage);
if (!empty($earlyContacts['emails']) || !empty($earlyContacts['phones'])) {
    try {
        $eMail = $earlyContacts['emails'][0] ?? null;
        $ePhone = $earlyContacts['phones'][0] ?? null;
        ChatDB::saveLead($sessionId, $eMail, $ePhone, $userMessage, $ip);
        LeadMailer::sendLeadNotification($sessionId, $userMessage, $ip, $userAgent);
    } catch (Exception $e) {
        // Silencioso
    }
}

// CASO A: Si el usuario ya está en etapa de pedir contacto o ya superó el límite de preguntas
if ($currentSessionCount >= $maxQuestions || $contactAttempts > 0) {
    $contacts = LeadMailer::extractContactInfo($userMessage);
    $hasEmail = !empty($contacts['emails']);
    $hasPhone = !empty($contacts['phones']);

    // SI CONTIENE DATOS DE CONTACTO: Guardar lead y cerrar chat exitosamente
    if ($hasEmail || $hasPhone) {
        $leadEmail = $contacts['emails'][0] ?? null;
        $leadPhone = $contacts['phones'][0] ?? null;

        try {
            ChatDB::saveLead($sessionId, $leadEmail, $leadPhone, $userMessage, $ip);
            LeadMailer::sendLeadNotification($sessionId, $userMessage, $ip, $userAgent);
        } catch (Exception $e) {}

        ChatDB::closeSession($sessionId);

        $finalReply = "¡Muchas gracias! Ya recibimos tu consulta y tus datos de contacto con éxito. Nuestro equipo comercial analizará los requerimientos de tu proyecto y se comunicará a la brevedad.\n\n(También estamos disponibles por WhatsApp al [+54 9 11 7060-5129](https://wa.me/5491170605129?text=Hola,%20vengo%20del%20chat%20de%20Nefetech) o en comercial@nefetech.online).";
        ChatDB::logMessage($sessionId, 'bot', $finalReply, 0);

        echo json_encode([
            'success' => true,
            'lead_submitted' => true,
            'limit_reached' => true,
            'session_closed' => true,
            'respuesta' => $finalReply
        ]);
        exit;
    }

    // SI NO CONTIENE DATOS: Contar intento de insistencia
    $newAttempts = ChatDB::incrementContactAttempts($sessionId);

    // Si ya le pedimos 2 veces y sigue sin pasarlos o esquivando -> CERRAR EL CHAT
    if ($newAttempts >= 2) {
        ChatDB::closeSession($sessionId);

        $closingReply = "¡No hay problema! Cuando estés listo para coordinar tu propuesta o desees atención directa, escríbenos a nuestro WhatsApp al [+54 9 11 7060-5129](https://wa.me/5491170605129?text=Hola,%20vengo%20del%20chat%20de%20Nefetech%20y%20quiero%20hacer%20una%20consulta.) o por correo a [comercial@nefetech.online](mailto:comercial@nefetech.online).\n\n¡Muchas gracias por contactarte con Nefetech y que tengas un excelente día!";
        ChatDB::logMessage($sessionId, 'bot', $closingReply, 0);

        echo json_encode([
            'success' => true,
            'limit_reached' => true,
            'session_closed' => true,
            'respuesta' => $closingReply
        ]);
        exit;
    }

    // Primer recordatorio empático (intento 1)
    $cleanCheck = mb_strtolower($userMessage, 'UTF-8');
    if (str_contains($cleanCheck, 'mail') || str_contains($cleanCheck, 'correo') || str_contains($cleanCheck, 'telefono') || str_contains($cleanCheck, 'whatsapp') || str_contains($cleanCheck, 'que')) {
        $clarifyReply = "Exacto, puedes dejarnos tu correo electrónico (ej: tu@email.com) o tu número de WhatsApp para que te enviemos la propuesta comercial a medida. ¿Cuál medio te queda más cómodo?";
    } else {
        $clarifyReply = "Para poder evaluar tu caso y hacerte llegar una propuesta a medida necesitamos un medio de contacto. ¿Podrías indicarnos tu correo o número de WhatsApp?";
    }

    ChatDB::logMessage($sessionId, 'bot', $clarifyReply, 0);
    echo json_encode([
        'success' => true,
        'ask_contact_info' => true,
        'need_contact_data' => true,
        'attempts' => $newAttempts,
        'remaining_messages' => 0,
        'respuesta' => $clarifyReply
    ]);
    exit;
}

// CASO B: Si este mensaje es el número que alcanza el límite ($maxQuestions)
if ($currentCount >= $maxQuestions) {
    ChatDB::incrementContactAttempts($sessionId);
    $leadPrompt = "Para profundizar en tu idea y prepararte una propuesta personalizada a medida, déjanos tu requerimiento y un medio de contacto (email o WhatsApp). Nuestro equipo comercial te responderá a la brevedad.";
    ChatDB::logMessage($sessionId, 'bot', $leadPrompt, 0);

    echo json_encode([
        'success' => true,
        'ask_contact_info' => true,
        'remaining_messages' => 0,
        'respuesta' => $leadPrompt
    ]);
    exit;
}

// 5. INTERCEPCIÓN RÁPIDA DE SALUDOS BREVES (0 tokens de IA ni embeddings)
$saludosRegex = '/^(hola[\s,!\?]*|buenas[\s,!\?]*|buen dia[\s,!\?]*|buenas tardes[\s,!\?]*|buenas noches[\s,!\?]*|saludos[\s,!\?]*|que tal[\s,!\?]*|como estas[\s,!\?]*|todo bien[\s,!\?]*|hola como estas[\s,!\?]*|hola que tal[\s,!\?]*|hola todo bien[\s,!\?]*|saludos todo bien[\s,!\?]*)+$/iu';

$cleanMsg = trim(preg_replace('/[¿?¡!.,;\-]/u', ' ', mb_strtolower($userMessage, 'UTF-8')));
$cleanMsg = preg_replace('/\s+/', ' ', $cleanMsg);

if (preg_match($saludosRegex, $cleanMsg) || in_array($cleanMsg, ['hola', 'buenas', 'que tal', 'como estas', 'todo bien', 'hola que tal', 'hola como estas', 'hola todo bien', 'saludos', 'saludos todo bien', 'buen dia', 'buenas tardes', 'buenas noches'])) {
    // Si ya le dijimos hola antes, no repetir robóticamente "¡Hola! Soy el asistente de Nefetech..."
    if ($currentCount > 1) {
        $saludoResponse = "¿En qué servicio o proyecto te gustaría que te asesoremos hoy?";
    } else {
        $saludoResponse = "¡Hola! Soy el asistente de Nefetech.\n¿En qué puedo ayudarte?";
    }
    ChatDB::logMessage($sessionId, 'bot', $saludoResponse, 0);

    echo json_encode([
        'success' => true,
        'greeting_intercepted' => true,
        'messages_used' => $currentCount,
        'remaining_messages' => max(0, $maxQuestions - $currentCount),
        'respuesta' => $saludoResponse
    ]);
    exit;
}

// 5.1 INTERCEPCIÓN RÁPIDA DE CONSULTAS DE PRECIOS, COSTOS Y PRESUPUESTOS (0 tokens)
$preciosRegex = '/\b(costo|costos|cuanto cuesta|cuanto sale|precio|precios|presupuesto|presupuestos|cuanto cobran|cuanto por hora|valor por hora|tarifa|tarifas|cuanto vale|cotizacion|cotizar)\b/iu';

if (preg_match($preciosRegex, $cleanMsg)) {
    $precioResponse = "Cada proyecto tiene un alcance, complejidad y requerimientos particulares, por lo que no manejamos precios fijos ni tarifas estándar. Elaboramos presupuestos personalizados y a medida según las necesidades de tu negocio.\n\nPara cotizar tu idea o consultar disponibilidad y tiempos estimados, escríbenos directamente por WhatsApp al [+54 9 11 7060-5129](https://wa.me/5491170605129?text=Hola,%20vengo%20del%20chat%20de%20Nefetech) o por correo a [comercial@nefetech.online](mailto:comercial@nefetech.online).";
    ChatDB::logMessage($sessionId, 'bot', $precioResponse, 0);

    echo json_encode([
        'success' => true,
        'pricing_intercepted' => true,
        'messages_used' => $currentCount,
        'remaining_messages' => max(0, $maxQuestions - $currentCount),
        'respuesta' => $precioResponse
    ]);
    exit;
}

// 6. CARGAR CREDENCIALES DE GEMINI
$apiKey = EnvLoader::get('GEMINI_API_KEY', '');
$model = EnvLoader::get('GEMINI_MODEL', 'gemini-3.5-flash-lite');

if (empty($apiKey) || str_starts_with($apiKey, 'tu_')) {
    echo json_encode([
        'success' => true,
        'authenticated_as' => $sessionId,
        'remaining_messages' => max(0, $maxQuestions - $currentCount),
        'respuesta' => "¡Hola! Soy el asistente de Nefetech.\n¿En qué puedo ayudarte?",
        'modo' => 'demo'
    ]);
    exit;
}

// 6. VERIFICAR CACHÉ SEMÁNTICO VECTORIAL (RAG)
require_once __DIR__ . '/utils/VectorCache.php';
$cachedVector = null;

// Solo buscar en caché semántico si el mensaje tiene suficiente longitud y no es una respuesta corta
if (mb_strlen($userMessage) >= 15) {
    try {
        $searchResult = VectorCache::findSimilar($userMessage, $apiKey, 0.88);
        if ($searchResult && isset($searchResult['response'])) {
            $cachedReply = $searchResult['response'];
            ChatDB::logMessage($sessionId, 'bot', $cachedReply, 0);

            echo json_encode([
                'success' => true,
                'cached' => true,
                'similarity' => $searchResult['similarity'],
                'matched_query' => $searchResult['query_matched'],
                'messages_used' => $currentCount,
                'remaining_messages' => max(0, $maxQuestions - $currentCount),
                'respuesta' => $cachedReply
            ]);
            exit;
        } elseif ($searchResult && isset($searchResult['query_embedding'])) {
            $cachedVector = $searchResult['query_embedding'];
        }
    } catch (Exception $e) {
        // Silencioso
    }
}

// 7. ARMAR HISTORIAL DE CONVERSACIÓN RECIENTE (Últimos 6 mensajes para contexto conversacional)
$recentHistory = ChatDB::getHistory($sessionId);
$geminiContents = [];

// Seleccionar los últimos 6 mensajes previos (excluyendo el último que acabamos de guardar como usuario)
$historySlice = array_slice($recentHistory, -7, 6);
foreach ($historySlice as $h) {
    $role = ($h['sender'] === 'user') ? 'user' : 'model';
    $geminiContents[] = [
        'role' => $role,
        'parts' => [
            ['text' => (string)$h['message']]
        ]
    ];
}

// Agregar el mensaje actual del usuario
$geminiContents[] = [
    'role' => 'user',
    'parts' => [
        ['text' => $userMessage]
    ]
];

// 8. SYSTEM INSTRUCTION COMERCIAL BLINDADA
$systemInstruction = ChatDB::getActivePrompt();

// Instrucción contextual adicional para evitar respuestas robóticas o repetitivas
$systemInstruction .= "\n\nREGLA ADICIONAL CRÍTICA DE CONVERSACIÓN:
- Adapta tu respuesta al flujo natural y al historial de la conversación.
- Si el usuario dice 'nose', 'no se', 'jaja', 'ok', o respuestas cortas, sé amigable, empático y guía con preguntas sencillas sin repetir exactamente tu mensaje anterior.
- Si el usuario muestra dudas o bromea, responde con naturalidad y amabilidad.
- NUNCA repitas el mismo párrafo textual dos veces seguidas.";

// 9. LLAMADA A GOOGLE GEMINI
$url = "https://generativelanguage.googleapis.com/v1beta/models/{$model}:generateContent?key={$apiKey}";

$payload = [
    'systemInstruction' => [
        'parts' => [
            ['text' => $systemInstruction]
        ]
    ],
    'contents' => $geminiContents,
    'generationConfig' => [
        'temperature' => 0.5,
        'maxOutputTokens' => 220,
    ]
];

$ch = curl_init($url);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_POST, true);
curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($payload));
curl_setopt($ch, CURLOPT_HTTPHEADER, ['Content-Type: application/json']);
curl_setopt($ch, CURLOPT_TIMEOUT, 20);

$response = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
$curlError = curl_error($ch);
curl_close($ch);

if ($curlError) {
    http_response_code(500);
    echo json_encode(['error' => 'Error al comunicarse con la IA.']);
    exit;
}

$result = json_decode($response, true);

if ($httpCode !== 200 || !isset($result['candidates'][0]['content']['parts'][0]['text'])) {
    http_response_code(502);
    echo json_encode(['error' => 'Error al procesar respuesta de la IA.']);
    exit;
}

$botReply = trim($result['candidates'][0]['content']['parts'][0]['text']);

// Registrar respuesta en base de datos
ChatDB::logMessage($sessionId, 'bot', $botReply, (int)(mb_strlen($botReply) / 4));

// Guardar en Caché Semántico Vectorial solo si la consulta fue sustancial
if (mb_strlen($userMessage) >= 20) {
    try {
        VectorCache::store($userMessage, $botReply, $cachedVector, $apiKey);
    } catch (Exception $e) {}
}

echo json_encode([
    'success' => true,
    'model' => $model,
    'messages_used' => $currentCount,
    'remaining_messages' => max(0, $maxQuestions - $currentCount),
    'respuesta' => $botReply
]);
