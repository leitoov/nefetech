<?php
/**
 * API: /api/demo/rag.php
 * Procesa documentos PDF / Texto:
 * - action=index: Recibe texto extraído del PDF o documento de prueba, lo fragmenta (chunking) y calcula vectores (embeddings) con Gemini o embeddings semánticos locales.
 * - action=ask: Recibe la pregunta del usuario, busca los fragmentos más relevantes por similitud de coseno y genera la respuesta contextualizada con Gemini.
 */

header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

require_once __DIR__ . '/../utils/EnvLoader.php';
require_once __DIR__ . '/../utils/VectorCache.php';
require_once __DIR__ . '/../utils/ChatDB.php';
require_once __DIR__ . '/../utils/LeadMailer.php';
EnvLoader::load();

$action = $_GET['action'] ?? '';
$input = json_decode(file_get_contents('php://input'), true) ?? [];
$apiKey = getenv('GEMINI_API_KEY') ?: 'AQ.Ab8RN6JubsWRM_13vrwiZauRibBPfPmU6KmrJGT8vVeyovQ9ew';
$model = getenv('GEMINI_MODEL') ?: 'gemini-2.5-flash';

// Detección de IP del usuario
$clientIp = $_SERVER['HTTP_CF_CONNECTING_IP'] ?? $_SERVER['HTTP_X_FORWARDED_FOR'] ?? $_SERVER['REMOTE_ADDR'] ?? '0.0.0.0';
if (strpos($clientIp, ',') !== false) {
    $clientIp = trim(explode(',', $clientIp)[0]);
}

try {
    switch ($action) {
        case 'usage':
            // Devuelve el estado de uso de preguntas y contacto de la IP
            $details = ChatDB::getDemoPdfDetails($clientIp);
            $usedQuestions = (int)($details['question_count'] ?? 0);
            $contactAttempts = (int)($details['contact_attempts'] ?? 0);
            $hasLeadContact = !empty($details['lead_contact']);
            $leadRequested = (bool)($details['lead_requested'] ?? false);
            
            // Si alcanzó las 5 preguntas y se le pidió contacto 2 veces sin datos, el chat está terminado
            $isTerminated = ($usedQuestions >= 5 && !$hasLeadContact && $contactAttempts >= 2);

            echo json_encode([
                'success' => true,
                'ip' => $clientIp,
                'used_questions' => $usedQuestions,
                'max_questions' => 5,
                'remaining' => max(0, 5 - $usedQuestions),
                'is_blocked' => $usedQuestions >= 5,
                'has_contact' => $hasLeadContact,
                'lead_contact' => $details['lead_contact'] ?? null,
                'contact_attempts' => $contactAttempts,
                'is_terminated' => $isTerminated
            ]);
            break;

        case 'lead':
            // Endpoint directo para guardar datos de contacto y "Pedir presupuesto a un asesor"
            if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
                throw new Exception('Método no permitido', 405);
            }

            $contact = trim($input['contact'] ?? '');
            $userMessage = trim($input['message'] ?? 'Solicitud de presupuesto y asesoramiento para implementación RAG / IA.');
            $documentName = trim($input['document_name'] ?? 'Documento Demo PDF');

            if (empty($contact)) {
                throw new Exception('Por favor ingresa tu email o teléfono de contacto.');
            }

            // Validar si el texto contiene email o teléfono
            $extracted = LeadMailer::extractContactInfo($contact);
            $hasEmail = !empty($extracted['emails']);
            $hasPhone = !empty($extracted['phones']);

            if (!$hasEmail && !$hasPhone && !filter_var($contact, FILTER_VALIDATE_EMAIL)) {
                throw new Exception('Por favor ingresa un correo electrónico válido o un número de teléfono / WhatsApp.');
            }

            // Guardar lead en la base de datos
            ChatDB::saveDemoPdfLead($clientIp, $contact, $documentName, $userMessage);

            // Enviar notificación por mail al equipo comercial
            try {
                $userAgent = $_SERVER['HTTP_USER_AGENT'] ?? 'Demo RAG Web';
                $demoSessionId = 'demo_' . md5($clientIp);
                LeadMailer::sendLeadNotification($demoSessionId, "Contacto: {$contact}\nDocumento: {$documentName}\nConsulta: {$userMessage}", $clientIp, $userAgent);
            } catch (Exception $e) {
                // Silencioso
            }

            echo json_encode([
                'success' => true,
                'lead_saved' => true,
                'message' => '¡Excelente! Hemos recibido tus datos. Un asesor de Nefetech se contactará contigo a la brevedad con la cotización.',
                'lead_contact' => $contact
            ]);
            break;

        case 'index':
            if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
                throw new Exception('Método no permitido', 405);
            }

            $documentName = trim($input['name'] ?? 'Documento.pdf');
            $rawText = trim($input['text'] ?? '');

            if (empty($rawText)) {
                throw new Exception('El contenido del documento no puede estar vacío.');
            }

            // 1. Fragmentación semántica (Chunking) en bloques de ~400 a 600 caracteres
            $paragraphs = preg_split('/(\r\n|\n|\r){2,}/', $rawText);
            $chunks = [];
            $currentChunk = '';

            foreach ($paragraphs as $p) {
                $p = trim($p);
                if (empty($p)) continue;
                if (strlen($currentChunk . ' ' . $p) < 650) {
                    $currentChunk .= (empty($currentChunk) ? '' : "\n\n") . $p;
                } else {
                    if (!empty($currentChunk)) {
                        $chunks[] = $currentChunk;
                    }
                    $currentChunk = $p;
                }
            }
            if (!empty($currentChunk)) {
                $chunks[] = $currentChunk;
            }

            if (count($chunks) === 0) {
                $chunks = [substr($rawText, 0, 1000)];
            }

            // Limitar a máximo 20 chunks para la demo en vivo para rendimiento ultra rápido
            $chunks = array_slice($chunks, 0, 20);

            // 2. Vectorización (Embeddings)
            $vectorStore = [];
            foreach ($chunks as $idx => $chunkText) {
                $embedding = VectorCache::generateEmbedding($chunkText, $apiKey);
                $vectorStore[] = [
                    'id' => $idx + 1,
                    'text' => $chunkText,
                    'embedding' => $embedding,
                    'preview' => mb_substr($chunkText, 0, 100) . '...'
                ];
            }

            echo json_encode([
                'success' => true,
                'message' => 'Documento indexado vectorialmente con éxito.',
                'document' => [
                    'name' => $documentName,
                    'total_chunks' => count($vectorStore),
                    'vectors' => $vectorStore,
                    'char_count' => strlen($rawText)
                ]
            ]);
            break;

        case 'ask':
            if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
                throw new Exception('Método no permitido', 405);
            }

            $question = trim($input['question'] ?? '');
            $documentName = trim($input['document_name'] ?? 'Documento.pdf');
            $vectors = $input['vectors'] ?? [];

            if (empty($question)) {
                throw new Exception('La pregunta no puede estar vacía.');
            }

            // Obtener estado actual de la IP
            $details = ChatDB::getDemoPdfDetails($clientIp);
            $currentIpUsage = (int)($details['question_count'] ?? 0);
            $contactAttempts = (int)($details['contact_attempts'] ?? 0);
            $hasLeadContact = !empty($details['lead_contact']);

            // Detectar si el mensaje enviado contiene datos de contacto (email o teléfono)
            $contactCheck = LeadMailer::extractContactInfo($question);
            $foundEmail = !empty($contactCheck['emails']);
            $foundPhone = !empty($contactCheck['phones']);

            if ($foundEmail || $foundPhone) {
                $contactVal = $foundEmail ? $contactCheck['emails'][0] : $contactCheck['phones'][0];
                ChatDB::saveDemoPdfLead($clientIp, $contactVal, $documentName, $question);
                try {
                    $userAgent = $_SERVER['HTTP_USER_AGENT'] ?? 'Demo RAG Web';
                    $demoSessionId = 'demo_' . md5($clientIp);
                    LeadMailer::sendLeadNotification($demoSessionId, $question, $clientIp, $userAgent);
                } catch (Exception $e) {}

                $thankReply = "¡Muchas gracias! Ya recibimos tus datos de contacto con éxito ({$contactVal}). Puedes pedir un presupuesto personalizado a uno de nuestros asesores cuando lo desees.";
                echo json_encode([
                    'success' => true,
                    'lead_saved' => true,
                    'has_contact' => true,
                    'lead_contact' => $contactVal,
                    'answer' => $thankReply,
                    'used_questions' => $currentIpUsage,
                    'is_blocked' => $currentIpUsage >= 5,
                    'is_terminated' => false
                ]);
                exit;
            }

            // SI YA SE ALCANZARON LAS 5 PREGUNTAS:
            if ($currentIpUsage >= 5) {
                // Incrementar intento de solicitud de datos de contacto
                $newAttempts = ChatDB::incrementDemoContactAttempts($clientIp);

                // Si ya se le pidió 2 veces los datos de contacto y no los pasó, SE TERMINA EL CHAT
                if ($newAttempts >= 2) {
                    echo json_encode([
                        'success' => true,
                        'limit_reached' => true,
                        'is_blocked' => true,
                        'is_terminated' => true,
                        'used_questions' => 5,
                        'answer' => 'Has alcanzado el límite de 5 preguntas. El chat ha finalizado. Para cotizaciones o una demostración para tu empresa, puedes contactarnos a comercial@nefetech.online o por WhatsApp al +54 9 11 7060-5129.'
                    ]);
                    exit;
                }

                // Primer intento de pedir los datos tras vencerse el límite
                echo json_encode([
                    'success' => true,
                    'ask_contact_info' => true,
                    'is_blocked' => true,
                    'is_terminated' => false,
                    'used_questions' => 5,
                    'answer' => 'Has alcanzado las 5 preguntas del documento. Por favor indícanos tu correo electrónico o WhatsApp y tu consulta para que un asesor te arme un presupuesto personalizado.'
                ]);
                exit;
            }

            if (empty($vectors) || !is_array($vectors)) {
                throw new Exception('No hay índice vectorial cargado para consultar.');
            }

            // Incrementar uso de la IP de forma atómica en BD
            $newIpUsage = ChatDB::incrementDemoPdfUsage($clientIp);

            // 1. Vectorizar la pregunta
            $queryEmbedding = VectorCache::generateEmbedding($question, $apiKey);

            // 2. Búsqueda semántica por similitud de coseno
            $scoredChunks = [];
            foreach ($vectors as $chunk) {
                $sim = 0.0;
                if ($queryEmbedding && !empty($chunk['embedding'])) {
                    $sim = VectorCache::cosineSimilarity($queryEmbedding, $chunk['embedding']);
                } else {
                    // Fallback de similitud textual básica si falla el servicio de embedding
                    similar_text(mb_strtolower($question), mb_strtolower($chunk['text']), $percent);
                    $sim = $percent / 100.0;
                }

                $scoredChunks[] = [
                    'id' => $chunk['id'],
                    'text' => $chunk['text'],
                    'score' => round($sim, 4)
                ];
            }

            // Ordenar por mayor similitud
            usort($scoredChunks, fn($a, $b) => $b['score'] <=> $a['score']);

            // Tomar los 3 mejores fragmentos más relevantes (Top-K)
            $topContexts = array_slice($scoredChunks, 0, 3);
            $contextText = "";
            foreach ($topContexts as $tc) {
                $contextText .= "[Fragmento #{$tc['id']} - Relevancia: " . round($tc['score'] * 100) . "%]:\n" . $tc['text'] . "\n\n";
            }

            // 3. Generar respuesta fundamentada con Gemini
            $systemInstruction = "Eres un asistente de Inteligencia Artificial especializado en responder preguntas basadas ESTRICTAMENTE en el contenido del documento proporcionado. 
Si la respuesta no está contenida en los fragmentos de contexto proporcionados, aclara cordialmente que esa información no figura en el documento analizado. 
Sé preciso, profesional, claro y cita el número de fragmento cuando corresponda.";

            $prompt = "CONTEXTO EXTRAÍDO DEL DOCUMENTO VECTORIAL:\n{$contextText}\n\nPREGUNTA DEL USUARIO:\n{$question}\n\nRESPUESTA FUNDAMENTADA:";

            $geminiUrl = "https://generativelanguage.googleapis.com/v1beta/models/{$model}:generateContent?key={$apiKey}";
            $payload = [
                'systemInstruction' => [
                    'parts' => [['text' => $systemInstruction]]
                ],
                'contents' => [
                    [
                        'role' => 'user',
                        'parts' => [['text' => $prompt]]
                    ]
                ],
                'generationConfig' => [
                    'temperature' => 0.2,
                    'maxOutputTokens' => 500,
                ]
            ];

            $ch = curl_init($geminiUrl);
            curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
            curl_setopt($ch, CURLOPT_POST, true);
            curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($payload));
            curl_setopt($ch, CURLOPT_HTTPHEADER, ['Content-Type: application/json']);
            curl_setopt($ch, CURLOPT_TIMEOUT, 20);

            $response = curl_exec($ch);
            $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
            curl_close($ch);

            $answer = "No se pudo generar respuesta en este momento.";
            if ($httpCode === 200 && $response) {
                $resData = json_decode($response, true);
                $answer = $resData['candidates'][0]['content']['parts'][0]['text'] ?? $answer;
            } else {
                // Si la cuota de la API está en cooldown, generar respuesta sintética basada en los fragmentos recuperados
                $answer = "Basado en los fragmentos más relevantes del documento:\n\n" . $topContexts[0]['text'];
            }

            echo json_encode([
                'success' => true,
                'question' => $question,
                'answer' => $answer,
                'relevant_chunks' => $topContexts,
                'used_questions' => $newIpUsage,
                'is_blocked' => $newIpUsage >= 5,
                'has_contact' => $hasLeadContact,
                'lead_contact' => $details['lead_contact'] ?? null,
                'prompt_contact' => ($newIpUsage >= 4 && !$hasLeadContact)
            ]);
            break;

        default:
            throw new Exception('Acción no soportada.', 400);
    }
} catch (Exception $e) {
    http_response_code(400);
    echo json_encode([
        'success' => false,
        'error' => $e->getMessage()
    ]);
}
