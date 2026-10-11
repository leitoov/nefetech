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

                CREATE TABLE IF NOT EXISTS leads (
                    id BIGINT AUTO_INCREMENT PRIMARY KEY,
                    session_id VARCHAR(64),
                    email VARCHAR(255),
                    phone VARCHAR(50),
                    status ENUM('nuevo', 'en_contacto', 'presupuestado', 'cerrado') DEFAULT 'nuevo',
                    lead_message TEXT,
                    ip_address VARCHAR(45),
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                    INDEX (session_id),
                    INDEX (email),
                    INDEX (status)
                ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

                CREATE TABLE IF NOT EXISTS lead_replies (
                    id BIGINT AUTO_INCREMENT PRIMARY KEY,
                    lead_id BIGINT,
                    sender VARCHAR(50) DEFAULT 'admin',
                    channel ENUM('email', 'whatsapp') DEFAULT 'email',
                    subject VARCHAR(255),
                    message TEXT,
                    recipient VARCHAR(255),
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    INDEX (lead_id)
                ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

                CREATE TABLE IF NOT EXISTS budget_configs (
                    config_key VARCHAR(100) PRIMARY KEY,
                    config_value TEXT,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
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

    /**
     * Guarda un nuevo lead o actualiza uno existente para la misma sesión
     */
    public static function saveLead(string $sessionId, ?string $email, ?string $phone, string $leadMessage, string $ip = ''): int {
        $db = self::getConnection();
        self::initTables();

        $stmt = $db->prepare("
            INSERT INTO leads (session_id, email, phone, lead_message, ip_address, status)
            VALUES (?, ?, ?, ?, ?, 'nuevo')
        ");
        $stmt->execute([$sessionId, $email, $phone, $leadMessage, $ip]);
        return (int)$db->lastInsertId();
    }

    /**
     * Lista todos los leads ordenados por los más recientes, con contador de respuestas
     */
    public static function getAllLeads(): array {
        $db = self::getConnection();
        self::initTables();

        $query = "
            SELECT l.*, 
                   (SELECT COUNT(*) FROM lead_replies r WHERE r.lead_id = l.id) as reply_count,
                   (SELECT MAX(created_at) FROM lead_replies r WHERE r.lead_id = l.id) as last_reply_at
            FROM leads l
            ORDER BY l.created_at DESC
        ";
        return $db->query($query)->fetchAll();
    }

    /**
     * Obtiene los datos detallados de un lead por su ID
     */
    public static function getLeadById(int $leadId): ?array {
        $db = self::getConnection();
        self::initTables();

        $stmt = $db->prepare("SELECT * FROM leads WHERE id = ?");
        $stmt->execute([$leadId]);
        $lead = $stmt->fetch();
        return $lead ?: null;
    }

    /**
     * Actualiza el estado de un lead
     */
    public static function updateLeadStatus(int $leadId, string $status): void {
        $db = self::getConnection();
        $stmt = $db->prepare("UPDATE leads SET status = ? WHERE id = ?");
        $stmt->execute([$status, $leadId]);
    }

    /**
     * Guarda una respuesta enviada a un lead (por email o WhatsApp)
     */
    public static function saveLeadReply(int $leadId, string $channel, string $message, string $recipient, string $subject = ''): int {
        $db = self::getConnection();
        self::initTables();

        $stmt = $db->prepare("
            INSERT INTO lead_replies (lead_id, sender, channel, subject, message, recipient)
            VALUES (?, 'admin', ?, ?, ?, ?)
        ");
        $stmt->execute([$leadId, $channel, $subject, $message, $recipient]);

        // Cambiar estado a 'en_contacto' si estaba en 'nuevo'
        $db->prepare("UPDATE leads SET status = 'en_contacto' WHERE id = ? AND status = 'nuevo'")->execute([$leadId]);

        return (int)$db->lastInsertId();
    }

    /**
     * Obtiene el hilo de respuestas para un lead
     */
    public static function getLeadReplies(int $leadId): array {
        $db = self::getConnection();
        self::initTables();

        $stmt = $db->prepare("SELECT * FROM lead_replies WHERE lead_id = ? ORDER BY created_at ASC");
        $stmt->execute([$leadId]);
        return $stmt->fetchAll();
    }

    /**
     * Obtiene la configuración de parámetros de la calculadora de presupuestos
     */
    public static function getBudgetConfigs(): array {
        $db = self::getConnection();
        self::initTables();

        $stmt = $db->query("SELECT config_key, config_value FROM budget_configs");
        $rows = $stmt->fetchAll();
        $configs = [];
        foreach ($rows as $r) {
            $configs[$r['config_key']] = json_decode($r['config_value'], true) ?? $r['config_value'];
        }

        // Valores por defecto predefinidos en USD si la tabla está vacía
        $defaults = [
            'hourly_rate' => 35, // USD por hora base
            'frontend_techs' => [
                ['name' => 'React / Next.js', 'factor' => 1.15],
                ['name' => 'Vue.js / Nuxt', 'factor' => 1.10],
                ['name' => 'Angular', 'factor' => 1.20],
                ['name' => 'HTML / CSS / Vanilla JS', 'factor' => 0.90],
                ['name' => 'Flutter / React Native (Mobile)', 'factor' => 1.30]
            ],
            'backend_techs' => [
                ['name' => 'Node.js / Express / NestJS', 'factor' => 1.15],
                ['name' => 'PHP / Laravel', 'factor' => 1.05],
                ['name' => 'Python / FastAPI / Django', 'factor' => 1.25],
                ['name' => 'Go / Golang', 'factor' => 1.30],
                ['name' => 'Java / Spring Boot', 'factor' => 1.30],
                ['name' => '.NET / C#', 'factor' => 1.25],
                ['name' => 'Serverless / Firebase / Supabase', 'factor' => 1.00]
            ],
            'stack_combos' => [
                [
                    'name' => 'MERN (React + Node.js)',
                    'frontend' => 'React / Next.js',
                    'backend' => 'Node.js / Express / NestJS',
                    'factor' => 1.20
                ],
                [
                    'name' => 'Fullstack Laravel (Laravel + React/Vue)',
                    'frontend' => 'React / Next.js',
                    'backend' => 'PHP / Laravel',
                    'factor' => 1.15
                ],
                [
                    'name' => 'AI Stack (React + Python FastAPI)',
                    'frontend' => 'React / Next.js',
                    'backend' => 'Python / FastAPI / Django',
                    'factor' => 1.30
                ],
                [
                    'name' => 'Serverless Jamstack (Next.js + Supabase)',
                    'frontend' => 'React / Next.js',
                    'backend' => 'Serverless / Firebase / Supabase',
                    'factor' => 1.10
                ]
            ],
            'ia_modules' => [
                ['name' => 'Sin IA', 'cost_usd' => 0],
                ['name' => 'Integración Básica (OpenAI / Gemini API)', 'cost_usd' => 250],
                ['name' => 'RAG Semántico con Base Vectorial', 'cost_usd' => 600],
                ['name' => 'Agente Autónomo con Function Calling', 'cost_usd' => 1100],
                ['name' => 'Automatización de Tareas Complejas (Multi-agentes)', 'cost_usd' => 1800]
            ],
            'infrastructure' => [
                'domain_annual_usd' => 18,
                'server_basic_monthly_usd' => 15,
                'server_vps_monthly_usd' => 35,
                'server_cloud_dedicated_monthly_usd' => 90
            ],
            'design_levels' => [
                ['name' => 'Sin diseño (Usar plantilla existente)', 'cost_usd' => 0],
                ['name' => 'UI Kit Moderno & Responsive (Tailwind)', 'cost_usd' => 180],
                ['name' => 'Diseño UI/UX a Medida en Figma + Prototipo', 'cost_usd' => 450],
                ['name' => 'Diseño Premium State-of-the-Art + Microanimaciones', 'cost_usd' => 850]
            ],
            'consultoria_modules' => [
                ['name' => 'Sin asesoría', 'cost_usd' => 0],
                ['name' => 'Diagnóstico Inicial de Procesos y Arquitectura', 'cost_usd' => 150],
                ['name' => 'Asesoría Integral de Selección Tecnológica y Roadmap', 'cost_usd' => 350],
                ['name' => 'Auditoría de Código, Seguridad y Performance', 'cost_usd' => 500],
                ['name' => 'Acompañamiento Tecnológico Mensual Continuo', 'cost_usd' => 800]
            ]
        ];

        return array_merge($defaults, $configs);
    }

    /**
     * Guarda la configuración de la calculadora
     */
    public static function saveBudgetConfigs(array $configs): void {
        $db = self::getConnection();
        self::initTables();

        $stmt = $db->prepare("
            INSERT INTO budget_configs (config_key, config_value) 
            VALUES (?, ?) 
            ON DUPLICATE KEY UPDATE config_value = VALUES(config_value)
        ");

        foreach ($configs as $key => $val) {
            $valueStr = is_array($val) ? json_encode($val) : (string)$val;
            $stmt->execute([$key, $valueStr]);
        }
    }
}
