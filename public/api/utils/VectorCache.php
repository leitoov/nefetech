<?php
/**
 * VectorCache - Semantic Caching con Embeddings de Google Gemini
 * Calcula similitud de coseno para reutilizar respuestas de preguntas similares con 0 tokens de generación.
 */
require_once __DIR__ . '/EnvLoader.php';
require_once __DIR__ . '/ChatDB.php';

class VectorCache {
    /**
     * Calcula similitud de coseno entre dos vectores numéricos
     */
    public static function cosineSimilarity(array $vecA, array $vecB): float {
        $dotProduct = 0.0;
        $normA = 0.0;
        $normB = 0.0;
        $len = min(count($vecA), count($vecB));

        for ($i = 0; $i < $len; $i++) {
            $dotProduct += $vecA[$i] * $vecB[$i];
            $normA += $vecA[$i] * $vecA[$i];
            $normB += $vecB[$i] * $vecB[$i];
        }

        if ($normA <= 0.0 || $normB <= 0.0) {
            return 0.0;
        }

        return $dotProduct / (sqrt($normA) * sqrt($normB));
    }

    /**
     * Genera un embedding vectorial de 3072 dimensiones con Google Gemini
     */
    public static function generateEmbedding(string $text, string $apiKey): ?array {
        $url = "https://generativelanguage.googleapis.com/v1beta/models/gemini-embedding-001:embedContent?key={$apiKey}";
        
        $payload = [
            'content' => [
                'parts' => [
                    ['text' => $text]
                ]
            ]
        ];

        $ch = curl_init($url);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_POST, true);
        curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($payload));
        curl_setopt($ch, CURLOPT_HTTPHEADER, ['Content-Type: application/json']);
        curl_setopt($ch, CURLOPT_TIMEOUT, 10);

        $response = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        curl_close($ch);

        if ($httpCode !== 200 || !$response) {
            return null;
        }

        $res = json_decode($response, true);
        return $res['embedding']['values'] ?? null;
    }

    /**
     * Inicializa la tabla de base de datos para almacenar vectores de preguntas frecuentes
     */
    public static function initTable(): void {
        $db = ChatDB::getConnection();
        $driver = $db->getAttribute(PDO::ATTR_DRIVER_NAME);

        if ($driver === 'sqlite') {
            $db->exec("
                CREATE TABLE IF NOT EXISTS semantic_cache (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    query_text TEXT,
                    response_text TEXT,
                    embedding_json TEXT,
                    hit_count INTEGER DEFAULT 1,
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
                );
            ");
        } else {
            // MySQL
            $db->exec("
                CREATE TABLE IF NOT EXISTS semantic_cache (
                    id BIGINT AUTO_INCREMENT PRIMARY KEY,
                    query_text VARCHAR(500),
                    response_text TEXT,
                    embedding_json LONGTEXT,
                    hit_count INT DEFAULT 1,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
            ");
        }
    }

    /**
     * Busca en la base de datos si existe una pregunta semánticamente similar (>= umbral)
     */
    public static function findSimilar(string $query, string $apiKey, float $threshold = 0.70): ?array {
        self::initTable();

        $queryEmbedding = self::generateEmbedding($query, $apiKey);
        if (!$queryEmbedding) {
            return null;
        }

        $db = ChatDB::getConnection();
        $stmt = $db->query("SELECT id, query_text, response_text, embedding_json, hit_count FROM semantic_cache");
        $candidates = $stmt->fetchAll();

        $bestMatch = null;
        $highestSimilarity = 0.0;

        foreach ($candidates as $row) {
            $cachedVec = json_decode($row['embedding_json'], true);
            if (!$cachedVec) continue;

            $similarity = self::cosineSimilarity($queryEmbedding, $cachedVec);

            if ($similarity > $highestSimilarity) {
                $highestSimilarity = $similarity;
                if ($similarity >= $threshold) {
                    $bestMatch = [
                        'id' => $row['id'],
                        'query_matched' => $row['query_text'],
                        'response' => $row['response_text'],
                        'similarity' => round($similarity, 4),
                        'hit_count' => $row['hit_count']
                    ];
                }
            }
        }

        // Si encontramos coincidencia, incrementamos el contador de aciertos
        if ($bestMatch) {
            $update = $db->prepare("UPDATE semantic_cache SET hit_count = hit_count + 1 WHERE id = ?");
            $update->execute([$bestMatch['id']]);
            return $bestMatch;
        }

        // Si no encontró, devolvemos el vector calculado para que lo guarde luego de generar la respuesta
        return ['query_embedding' => $queryEmbedding];
    }

    /**
     * Guarda una nueva consulta y su vector para futuras búsquedas
     */
    public static function store(string $query, string $response, ?array $embedding = null, string $apiKey = ''): void {
        self::initTable();

        if (!$embedding && !empty($apiKey)) {
            $embedding = self::generateEmbedding($query, $apiKey);
        }

        if (!$embedding) {
            return;
        }

        $db = ChatDB::getConnection();
        $stmt = $db->prepare("
            INSERT INTO semantic_cache (query_text, response_text, embedding_json, hit_count) 
            VALUES (?, ?, ?, 1)
        ");
        $stmt->execute([
            substr($query, 0, 500),
            $response,
            json_encode($embedding)
        ]);
    }
}
