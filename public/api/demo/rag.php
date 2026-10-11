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
EnvLoader::load();

$action = $_GET['action'] ?? '';
$input = json_decode(file_get_contents('php://input'), true) ?? [];
$apiKey = getenv('GEMINI_API_KEY') ?: 'AQ.Ab8RN6JubsWRM_13vrwiZauRibBPfPmU6KmrJGT8vVeyovQ9ew';
$model = getenv('GEMINI_MODEL') ?: 'gemini-2.5-flash';

try {
    switch ($action) {
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
            $vectors = $input['vectors'] ?? [];

            if (empty($question)) {
                throw new Exception('La pregunta no puede estar vacía.');
            }

            if (empty($vectors) || !is_array($vectors)) {
                throw new Exception('No hay índice vectorial cargado para consultar.');
            }

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
                'relevant_chunks' => $topContexts
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
