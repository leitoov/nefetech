<?php
/**
 * DB Helper - Maneja almacenamiento en SQLite / MySQL y sesiones de chat
 */
require_once __DIR__ . '/EnvLoader.php';

class ChatDB {
    private static $pdo = null;

    public static function getConnection(): PDO {
        if (self::$pdo !== null) {
            return self::$pdo;
        }

        EnvLoader::load();

        $dbHost = EnvLoader::get('DB_HOST', '');
        $dbName = EnvLoader::get('DB_DATABASE', '');
        $dbUser = EnvLoader::get('DB_USERNAME', '');
        $dbPass = EnvLoader::get('DB_PASSWORD', '');

        // Si hay credenciales de MySQL en el .env, conectar a MySQL
        if (!empty($dbHost) && !empty($dbName)) {
            $dsn = "mysql:host={$dbHost};dbname={$dbName};charset=utf8mb4";
            self::$pdo = new PDO($dsn, $dbUser, $dbPass, [
                PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
                PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC
            ]);
        } else {
            // Si aún no se configuró MySQL, usar SQLite local automáticamente
            $storageDir = __DIR__ . '/../storage';
            if (!is_dir($storageDir)) {
                mkdir($storageDir, 0755, true);
            }
            $sqlitePath = $storageDir . '/chats.sqlite';
            self::$pdo = new PDO("sqlite:{$sqlitePath}", null, null, [
                PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
                PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC
            ]);
        }

        self::initTables();
        return self::$pdo;
    }

    private static function initTables(): void {
        $driver = self::$pdo->getAttribute(PDO::ATTR_DRIVER_NAME);

        if ($driver === 'sqlite') {
            self::$pdo->exec("
                CREATE TABLE IF NOT EXISTS chat_sessions (
                    session_id TEXT PRIMARY KEY,
                    ip_address TEXT,
                    user_agent TEXT,
                    message_count INTEGER DEFAULT 0,
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    last_activity DATETIME DEFAULT CURRENT_TIMESTAMP
                );

                CREATE TABLE IF NOT EXISTS chat_messages (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    session_id TEXT,
                    sender TEXT,
                    message TEXT,
                    tokens_estimate INTEGER,
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
                );
            ");
        } else {
            // MySQL
            self::$pdo->exec("
                CREATE TABLE IF NOT EXISTS chat_sessions (
                    session_id VARCHAR(64) PRIMARY KEY,
                    ip_address VARCHAR(45),
                    user_agent TEXT,
                    message_count INT DEFAULT 0,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    last_activity TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
                ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

                CREATE TABLE IF NOT EXISTS chat_messages (
                    id BIGINT AUTO_INCREMENT PRIMARY KEY,
                    session_id VARCHAR(64),
                    sender ENUM('user', 'bot', 'system'),
                    message TEXT,
                    tokens_estimate INT,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    INDEX (session_id)
                ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
            ");
        }
    }

    /**
     * Obtiene o inicializa la sesión y cuenta de mensajes
     */
    public static function getSession(string $sessionId, string $ip = '', string $userAgent = ''): array {
        $db = self::getConnection();
        $stmt = $db->prepare("SELECT * FROM chat_sessions WHERE session_id = ?");
        $stmt->execute([$sessionId]);
        $session = $stmt->fetch();

        if (!$session) {
            $stmt = $db->prepare("
                INSERT INTO chat_sessions (session_id, ip_address, user_agent, message_count) 
                VALUES (?, ?, ?, 0)
            ");
            $stmt->execute([$sessionId, $ip, substr($userAgent, 0, 255)]);
            return [
                'session_id' => $sessionId,
                'message_count' => 0
            ];
        }

        return $session;
    }

    /**
     * Incrementa la cuenta de mensajes de la sesión
     */
    public static function incrementMessageCount(string $sessionId): int {
        $db = self::getConnection();
        $stmt = $db->prepare("
            UPDATE chat_sessions 
            SET message_count = message_count + 1, last_activity = CURRENT_TIMESTAMP 
            WHERE session_id = ?
        ");
        $stmt->execute([$sessionId]);

        $stmt = $db->prepare("SELECT message_count FROM chat_sessions WHERE session_id = ?");
        $stmt->execute([$sessionId]);
        return (int)$stmt->fetchColumn();
    }

    /**
     * Registra un mensaje en el historial
     */
    public static function logMessage(string $sessionId, string $sender, string $message, int $tokens = 0): void {
        $db = self::getConnection();
        $stmt = $db->prepare("
            INSERT INTO chat_messages (session_id, sender, message, tokens_estimate) 
            VALUES (?, ?, ?, ?)
        ");
        $stmt->execute([$sessionId, $sender, $message, $tokens]);
    }

    /**
     * Obtiene el historial completo de mensajes de una sesión
     */
    public static function getHistory(string $sessionId): array {
        $db = self::getConnection();
        $stmt = $db->prepare("SELECT sender, message, created_at FROM chat_messages WHERE session_id = ? ORDER BY id ASC");
        $stmt->execute([$sessionId]);
        return $stmt->fetchAll();
    }
}
