<?php
/**
 * JWT Utility - Implementación estándar RFC 7519 (HMAC SHA-256)
 * Libre de dependencias externas para máxima portabilidad y rendimiento.
 */
class JWT {
    private static function base64UrlEncode(string $data): string {
        return rtrim(strtr(base64_encode($data), '+/', '-_'), '=');
    }

    private static function base64UrlDecode(string $data): string {
        return base64_decode(strtr($data, '-_', '+/'));
    }

    /**
     * Genera un token JWT firmado
     */
    public static function encode(array $payload, string $secret, int $expirySeconds = 3600): string {
        $header = [
            'typ' => 'JWT',
            'alg' => 'HS256'
        ];

        $now = time();
        $payload['iat'] = $now;
        $payload['exp'] = $now + $expirySeconds;

        $base64Header = self::base64UrlEncode(json_encode($header));
        $base64Payload = self::base64UrlEncode(json_encode($payload));

        $signature = hash_hmac('sha256', $base64Header . '.' . $base64Payload, $secret, true);
        $base64Signature = self::base64UrlEncode($signature);

        return $base64Header . '.' . $base64Payload . '.' . $base64Signature;
    }

    /**
     * Valida y decodifica un token JWT
     */
    public static function decode(string $token, string $secret): ?array {
        $parts = explode('.', $token);
        if (count($parts) !== 3) {
            return null;
        }

        list($base64Header, $base64Payload, $base64Signature) = $parts;

        // Verificar firma
        $expectedSignature = self::base64UrlEncode(
            hash_hmac('sha256', $base64Header . '.' . $base64Payload, $secret, true)
        );

        if (!hash_equals($expectedSignature, $base64Signature)) {
            return null; // Firma inválida
        }

        $payload = json_decode(self::base64UrlDecode($base64Payload), true);
        if (!$payload || !isset($payload['exp'])) {
            return null;
        }

        // Verificar expiración
        if (time() >= $payload['exp']) {
            return null; // Token expirado
        }

        return $payload;
    }
}
