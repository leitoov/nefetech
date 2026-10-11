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
$currentSessionCount = (int)$session['message_count'];

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

// CASO A: Si la sesión ya alcanzó el límite (mensaje >= 10) y el usuario está respondiendo
if ($currentSessionCount >= $maxQuestions) {
    $contacts = LeadMailer::extractContactInfo($userMessage);
    $hasEmail = !empty($contacts['emails']);
    $hasPhone = !empty($contacts['phones']);

    // Si NO contiene ni email ni número de teléfono
    if (!$hasEmail && !$hasPhone) {
        $attempts = ChatDB::incrementSessionContactAttempts($sessionId);

        // Si ya se le pidieron 2 veces los datos de contacto y no los pasó, SE TERMINA EL CHAT
        if ($attempts >= 2) {
            $endChatReply = "Has alcanzado el límite de consultas disponibles. Para coordinar una reunión o recibir atención comercial personalizada, puedes escribirnos directamente a comercial@nefetech.online o por WhatsApp al +54 9 11 7060-5129.";
            ChatDB::logMessage($sessionId, 'bot', $endChatReply, 0);

            echo json_encode([
                'success' => true,
                'ask_contact_info' => false,
                'need_contact_data' => false,
                'limit_reached' => true,
                'remaining_messages' => 0,
                'respuesta' => $endChatReply
            ]);
            exit;
        }

        // Primer intento de re-solicitud
        $noContactReply = "Para poder comunicarnos y enviarte la propuesta personalizada, por favor incluye en tu mensaje un correo electrónico (ej: tu@email.com) o un número de WhatsApp/teléfono. ¿Cómo preferís que te contactemos?";
        ChatDB::logMessage($sessionId, 'bot', $noContactReply, 0);

        echo json_encode([
            'success' => true,
            'ask_contact_info' => true,
            'need_contact_data' => true,
            'limit_reached' => false,
            'remaining_messages' => 0,
            'respuesta' => $noContactReply
        ]);
        exit;
    }

    // SI CONTIENE DATOS DE CONTACTO: Guardar en tabla leads de MySQL y notificar por correo
    $leadEmail = $contacts['emails'][0] ?? null;
    $leadPhone = $contacts['phones'][0] ?? null;

    try {
        ChatDB::saveLead($sessionId, $leadEmail, $leadPhone, $userMessage, $ip);
        LeadMailer::sendLeadNotification($sessionId, $userMessage, $ip, $userAgent);
    } catch (Exception $e) {
        // Silencioso
    }

    $finalReply = "¡Muchas gracias! Ya recibimos tu consulta y tus datos de contacto con éxito. Nuestro equipo comercial analizará los requerimientos de tu proyecto y se comunicará a la brevedad.\n\n(Si en algún momento prefieres escribirnos directamente, también estamos disponibles por WhatsApp o en comercial@nefetech.online).";
    ChatDB::logMessage($sessionId, 'bot', $finalReply, 0);

    echo json_encode([
        'success' => true,
        'lead_submitted' => true,
        'limit_reached' => true,
        'respuesta' => $finalReply
    ]);
    exit;
}

// CASO B: Si este mensaje es exactamente el número 10, le pedimos amablemente que nos deje sus datos y necesidad (Intento 1)
if ($currentCount >= $maxQuestions) {
    ChatDB::incrementSessionContactAttempts($sessionId);
    $leadPrompt = "Para profundizar en tu idea y armarte una propuesta a medida, déjanos en un solo mensaje tu necesidad y datos de contacto (email o WhatsApp). Nuestro equipo comercial te responderá a la brevedad.";
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
// Si el mensaje es únicamente un saludo simple, respondemos de inmediato con la bienvenida oficial
$saludosRegex = '/^(hola[\s,!\?]*|buenas[\s,!\?]*|buen dia[\s,!\?]*|buenas tardes[\s,!\?]*|buenas noches[\s,!\?]*|saludos[\s,!\?]*|que tal[\s,!\?]*|como estas[\s,!\?]*|todo bien[\s,!\?]*|hola como estas[\s,!\?]*|hola que tal[\s,!\?]*|hola todo bien[\s,!\?]*|saludos todo bien[\s,!\?]*)+$/iu';

$cleanMsg = trim(preg_replace('/[¿?¡!.,;\-]/u', ' ', mb_strtolower($userMessage, 'UTF-8')));
$cleanMsg = preg_replace('/\s+/', ' ', $cleanMsg);

if (preg_match($saludosRegex, $cleanMsg) || in_array($cleanMsg, ['hola', 'buenas', 'que tal', 'como estas', 'todo bien', 'hola que tal', 'hola como estas', 'hola todo bien', 'saludos', 'saludos todo bien', 'buen dia', 'buenas tardes', 'buenas noches'])) {
    $saludoResponse = "¡Hola! Soy el asistente de Nefetech.\n¿En qué puedo ayudarte?";
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
    $precioResponse = "Cada proyecto tiene un alcance, complejidad y requerimientos particulares, por lo que no manejamos precios fijos ni tarifas estándar. Elaboramos presupuestos personalizados y a medida según las necesidades de tu negocio.\n\nPara cotizar tu idea o consultar disponibilidad y tiempos estimados, escríbenos directamente por WhatsApp al +54 9 11 7060-5129 o por correo a comercial@nefetech.online.";
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
    // Si falla el caché semántico, continuar con el flujo normal de Gemini
}

// 7. SYSTEM INSTRUCTION COMERCIAL BLINDADA (OBTENIDA DE LA VERSIÓN ACTIVA EN BD)
$systemInstruction = ChatDB::getActivePrompt();

// 8. LLAMADA A GOOGLE GEMINI
$url = "https://generativelanguage.googleapis.com/v1beta/models/{$model}:generateContent?key={$apiKey}";

$payload = [
    'systemInstruction' => [
        'parts' => [
            ['text' => $systemInstruction]
        ]
    ],
    'contents' => [
        [
            'role' => 'user',
            'parts' => [
                ['text' => $userMessage]
            ]
        ]
    ],
    'generationConfig' => [
        'temperature' => 0.4,
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

// Guardar en Caché Semántico Vectorial para futuras consultas similares
try {
    VectorCache::store($userMessage, $botReply, $cachedVector, $apiKey);
} catch (Exception $e) {
    // Si falla el guardado del vector, no interrumpe la respuesta
}

echo json_encode([
    'success' => true,
    'model' => $model,
    'messages_used' => $currentCount,
    'remaining_messages' => max(0, $maxQuestions - $currentCount),
    'respuesta' => $botReply
]);
