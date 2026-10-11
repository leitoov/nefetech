<?php
/**
 * EnvLoader - Parser liviano y seguro para archivos .env sin dependencias
 */
class EnvLoader {
    private static $loaded = false;

    public static function load(string $path = ''): void {
        if (self::$loaded && empty($path)) {
            return;
        }

        // Buscar .env en orden de prioridad
        $candidates = [
            $path,
            __DIR__ . '/../.env',
            __DIR__ . '/../../.env',
            dirname(__DIR__, 2) . '/.env'
        ];

        $envFile = null;
        foreach ($candidates as $candidate) {
            if (!empty($candidate) && file_exists($candidate) && is_readable($candidate)) {
                $envFile = $candidate;
                break;
            }
        }

        if (!$envFile) {
            return;
        }

        $lines = file($envFile, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
        foreach ($lines as $line) {
            $line = trim($line);
            // Ignorar comentarios
            if (empty($line) || str_starts_with($line, '#')) {
                continue;
            }

            // Parsear clave=valor
            if (strpos($line, '=') !== false) {
                list($key, $value) = explode('=', $line, 2);
                $key = trim($key);
                $value = trim($value);

                // Remover comillas si tiene
                if ((str_starts_with($value, '"') && str_ends_with($value, '"')) ||
                    (str_starts_with($value, "'") && str_ends_with($value, "'"))) {
                    $value = substr($value, 1, -1);
                }

                // Guardar en variables de entorno del proceso
                putenv("{$key}={$value}");
                $_ENV[$key] = $value;
                $_SERVER[$key] = $value;
            }
        }

        self::$loaded = true;
    }

    public static function get(string $key, $default = null) {
        self::load();
        $val = getenv($key);
        if ($val !== false) {
            return $val;
        }
        if (isset($_ENV[$key])) {
            return $_ENV[$key];
        }
        if (isset($_SERVER[$key])) {
            return $_SERVER[$key];
        }
        return $default;
    }
}
