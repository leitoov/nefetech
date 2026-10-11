<?php
/**
 * Configuración privada del Backend de Nefetech (Alternativa a .env)
 * ¡NUNCA expongas este archivo en repositorios públicos!
 */

$CONFIG = [
    // Clave de Google Gemini API
    'GEMINI_API_KEY' => 'TU_GEMINI_KEY_AQUI',
    'GEMINI_MODEL'   => 'gemini-3.5-flash-lite',

    // Secreto JWT
    'JWT_SECRET'     => 'nefetech_jwt_super_secret_key_2026',

    // Base de datos (opcional si usas .env)
    'DB_HOST'        => 'localhost',
    'DB_DATABASE'    => 'tu_base_de_datos',
    'DB_USERNAME'    => 'tu_usuario',
    'DB_PASSWORD'    => 'tu_password',
];
