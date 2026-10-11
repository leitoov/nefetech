<?php
/**
 * Nefetech - API Backend para Google Gemini IA con optimización de tokens y límite de sesión
 */

header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

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
// Usamos el ID del JWT o huella de IP para vincular la sesión persistentemente
$ip = $_SERVER['REMOTE_ADDR'] ?? '0.0.0.0';
$userAgent = $_SERVER['HTTP_USER_AGENT'] ?? '';
$sessionId = $authenticatedUser['sub'] ?? ('session_' . md5($ip . $userAgent));

// 3. VALIDAR LÍMITE DE MENSAJES (MÁXIMO 10 MENSAJES POR SESIÓN)
$session = ChatDB::getSession($sessionId, $ip, $userAgent);
$maxMessages = 10;

if ($session['message_count'] >= $maxMessages) {
    echo json_encode([
        'success' => true,
        'limit_reached' => true,
        'derivacion' => true,
        'respuesta' => "Para brindarte un asesoramiento detallado y personalizado sobre tu proyecto, te derivaré con nuestro equipo comercial para seguir este tema directamente por WhatsApp.",
        'whatsapp_url' => "https://wa.me/5491170605129?text=Hola,%20estaba%20consultando%20con%20el%20asistente%20de%20IA%20y%20quiero%20continuar%20mi%20consulta."
    ]);
    exit;
}

// 4. VALIDAR INPUT (Límite estricto de caracteres para evitar abuso de tokens)
$rawInput = file_get_contents('php://input');
$data = json_decode($rawInput, true);
$userMessage = isset($data['mensaje']) ? trim($data['mensaje']) : '';

if (empty($userMessage)) {
    http_response_code(400);
    echo json_encode(['error' => 'El mensaje no puede estar vacío.']);
    exit;
}

// BUENA PRÁCTICA DE TOKENS: Límite de 350 caracteres por mensaje
if (mb_strlen($userMessage, 'UTF-8') > 350) {
    http_response_code(400);
    echo json_encode([
        'error' => 'Tu mensaje supera el límite de 350 caracteres para consultas rápidas. Por favor envía una pregunta más concisa o contáctanos por WhatsApp.'
    ]);
    exit;
}

// Registrar mensaje del usuario en base de datos
ChatDB::logMessage($sessionId, 'user', $userMessage, (int)(mb_strlen($userMessage) / 4));
$currentCount = ChatDB::incrementMessageCount($sessionId);

// Si este era el mensaje número 10, responder con derivación directa sin llamar a la IA
if ($currentCount >= $maxMessages) {
    $derivacionMsg = "Para brindarte un asesoramiento detallado y personalizado sobre tu proyecto, te derivaré con nuestro equipo comercial para seguir este tema directamente por WhatsApp.";
    ChatDB::logMessage($sessionId, 'bot', $derivacionMsg);
    echo json_encode([
        'success' => true,
        'limit_reached' => true,
        'derivacion' => true,
        'respuesta' => $derivacionMsg,
        'whatsapp_url' => "https://wa.me/5491170605129?text=Hola,%20estaba%20consultando%20con%20el%20asistente%20de%20IA%20y%20quiero%20continuar%20mi%20consulta."
    ]);
    exit;
}

// 5. CARGAR CREDENCIALES DE GEMINI
$apiKey = EnvLoader::get('GEMINI_API_KEY', '');
$model = EnvLoader::get('GEMINI_MODEL', 'gemini-3.5-flash-lite');

if (empty($apiKey) || str_starts_with($apiKey, 'tu_')) {
    echo json_encode([
        'success' => true,
        'authenticated_as' => $sessionId,
        'remaining_messages' => $maxMessages - $currentCount,
        'respuesta' => "¡Hola! Soy el asistente de Nefetech.\n¿En qué puedo ayudarte?",
        'modo' => 'demo'
    ]);
    exit;
}

// 6. VERIFICAR CACHÉ SEMÁNTICO VECTORIAL (RAG)
require_once __DIR__ . '/utils/VectorCache.php';
$cachedVector = null;

try {
    $searchResult = VectorCache::findSimilar($userMessage, $apiKey, 0.70);
    if ($searchResult && isset($searchResult['response'])) {
        // ¡COINCIDENCIA SEMÁNTICA ENCONTRADA! 0 TOKENS CONSUMIDOS EN GENERACIÓN
        $cachedReply = $searchResult['response'];
        ChatDB::logMessage($sessionId, 'bot', $cachedReply, 0);

        echo json_encode([
            'success' => true,
            'cached' => true,
            'similarity' => $searchResult['similarity'],
            'matched_query' => $searchResult['query_matched'],
            'messages_used' => $currentCount,
            'remaining_messages' => $maxMessages - $currentCount,
            'respuesta' => $cachedReply
        ]);
        exit;
    } elseif ($searchResult && isset($searchResult['query_embedding'])) {
        $cachedVector = $searchResult['query_embedding'];
    }
} catch (Exception $e) {
    // Si falla el caché semántico, continuar con el flujo normal de Gemini
}

// 7. SYSTEM INSTRUCTION OPTIMIZADA (Extremadamente concisa para ahorrar tokens)
$systemInstruction = "Eres el asistente de Nefetech (software a medida, IA y consultoría). " .
"REGLA CRÍTICA DE BREVEDAD: Responde SIEMPRE en un máximo de 2 a 3 oraciones muy directas y claras. " .
"No hagas introducciones largas ni repitas lo que dijo el usuario. " .
"Contacto: comercial@nefetech.online o WhatsApp +54 9 11 7060-5129.";

// 7. LLAMADA A GOOGLE GEMINI (maxOutputTokens reducido a 220 para minimizar consumo)
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
        'temperature' => 0.6,
        'maxOutputTokens' => 220, // Ahorro masivo de tokens de salida
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

// Guardar en Caché Semántico Vectorial para futuras consultas similares (0 tokens futuro)
try {
    VectorCache::store($userMessage, $botReply, $cachedVector, $apiKey);
} catch (Exception $e) {
    // Si falla el guardado del vector, no interrumpe la respuesta al usuario
}

echo json_encode([
    'success' => true,
    'model' => $model,
    'messages_used' => $currentCount,
    'remaining_messages' => $maxMessages - $currentCount,
    'respuesta' => $botReply
]);
