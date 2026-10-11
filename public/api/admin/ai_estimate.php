<?php
/**
 * Admin AI Estimator Assistant API - Asistente de IA para calcular presupuestos conversacionales
 * Lee la idea o descripción y genera la estimación y sugerencia de parámetros estructurada en JSON
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
require_once __DIR__ . '/../utils/EnvLoader.php';
require_once __DIR__ . '/../utils/ChatDB.php';
EnvLoader::load();

$adminUser = authenticate();
if (($adminUser['role'] ?? '') !== 'admin') {
    http_response_code(403);
    echo json_encode(['error' => 'Acceso denegado. Se requiere rol admin.']);
    exit;
}

$raw = file_get_contents('php://input');
$data = json_decode($raw, true) ?: [];
$prompt = trim($data['prompt'] ?? '');

if (empty($prompt)) {
    http_response_code(400);
    echo json_encode(['error' => 'La descripción del proyecto no puede estar vacía.']);
    exit;
}

$apiKey = EnvLoader::get('GEMINI_API_KEY', '');
$model = EnvLoader::get('GEMINI_MODEL', 'gemini-3.5-flash-lite');

if (empty($apiKey)) {
    http_response_code(500);
    echo json_encode(['error' => 'Falta configurar GEMINI_API_KEY en el servidor.']);
    exit;
}

$budgetConfig = ChatDB::getBudgetConfigs();
$configJson = json_encode($budgetConfig, JSON_UNESCAPED_UNICODE);

$systemInstruction = <<<SYS
Eres un estimador y cotizador técnico-comercial senior de Nefetech.
Tu objetivo es analizar la idea o requerimiento de software planteado por el usuario y recomendar los parámetros ideales para la calculadora de presupuestos de la empresa.

PARÁMETROS Y COSTOS DE REFERENCIA DE NEFETECH:
{$configJson}

DEBES RESPONDER EXCLUSIVAMENTE CON UN OBJETO JSON VÁLIDO (sin bloques de código markdown, sin texto antes ni después) con la siguiente estructura exacta:
{
  "analisis": "Breve explicación de 2 a 3 oraciones sobre por qué se sugieren estas horas y tecnologías",
  "horas_sugeridas": 60,
  "stack_tipo": "combo",
  "combo_sugerido": "MERN (React + Node.js)",
  "frontend_sugerido": "React / Next.js",
  "backend_sugerido": "Node.js / Express / NestJS",
  "ia_modulo_sugerido": "RAG Semántico con Base Vectorial",
  "diseno_sugerido": "UI Kit Moderno & Responsive (Tailwind)",
  "servidor_sugerido": "server_basic_monthly_usd",
  "meses_servidor": 12,
  "incluir_dominio": true,
  "asesoria_modulo_sugerido": "Diagnóstico Inicial de Procesos y Arquitectura",
  "margen_sugerido": 15
}
SYS;

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
                ['text' => "Por favor estima este proyecto: " . $prompt]
            ]
        ]
    ],
    'generationConfig' => [
        'temperature' => 0.2,
        'responseMimeType' => 'application/json',
        'maxOutputTokens' => 600
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
curl_close($ch);

if ($httpCode !== 200 || !$response) {
    http_response_code(502);
    echo json_encode(['error' => 'Error al comunicarse con la IA estimadora']);
    exit;
}

$resJson = json_decode($response, true);
$replyText = $resJson['candidates'][0]['content']['parts'][0]['text'] ?? '{}';
$estimatedData = json_decode($replyText, true);

echo json_encode([
    'success' => true,
    'estimation' => $estimatedData
]);
