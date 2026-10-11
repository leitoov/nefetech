<?php
/**
 * API: /api/mentorias/auth.php
 * Endpoints de autenticación de Mentorías:
 * - register: registro con nombre, apellido, email, password, birth_date, country (mínimo 16 años)
 * - verify: validación de cuenta por token
 * - login: inicio de sesión
 * - forgot-password: pide restablecer contraseña
 * - reset-password: fija nueva contraseña con token
 * - change-password: cambio de contraseña logueado
 */

header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

require_once __DIR__ . '/../utils/ChatDB.php';
require_once __DIR__ . '/../utils/MentoriaMailer.php';

$action = $_GET['action'] ?? '';
$input = json_decode(file_get_contents('php://input'), true) ?? [];

try {
    switch ($action) {
        case 'register':
            if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
                throw new Exception('Método no permitido', 405);
            }

            $firstName = trim($input['first_name'] ?? '');
            $lastName = trim($input['last_name'] ?? '');
            $email = trim($input['email'] ?? '');
            $password = $input['password'] ?? '';
            $birthDate = trim($input['birth_date'] ?? '');
            $country = trim($input['country'] ?? '');

            if (!$firstName || !$lastName || !$email || !$password || !$birthDate || !$country) {
                throw new Exception('Todos los campos son obligatorios: Nombre, Apellido, Email, Contraseña, Fecha de nacimiento y País de residencia.');
            }

            if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
                throw new Exception('El formato de correo electrónico es inválido.');
            }

            if (strlen($password) < 6) {
                throw new Exception('La contraseña debe tener al menos 6 caracteres.');
            }

            // Validación de edad mínima: 16 años
            $dob = DateTime::createFromFormat('Y-m-d', $birthDate);
            if (!$dob) {
                throw new Exception('Formato de fecha de nacimiento inválido (esperado AAAA-MM-DD).');
            }
            $today = new DateTime();
            $ageInterval = $today->diff($dob);
            if ($dob > $today || $ageInterval->y < 16) {
                throw new Exception('Debes tener al menos 16 años cumplidos para registrarte en la plataforma de mentorías.');
            }

            $user = ChatDB::registerMentoriaUser([
                'first_name' => $firstName,
                'last_name' => $lastName,
                'email' => $email,
                'password' => $password,
                'birth_date' => $birthDate,
                'country' => $country
            ]);

            // Enviar email de validación
            $mailSent = MentoriaMailer::sendVerificationEmail($user['email'], $user['first_name'], $user['verification_token']);

            echo json_encode([
                'success' => true,
                'message' => 'Registro completado con éxito. Hemos enviado un correo de validación a ' . $user['email'] . '. Por favor revisa tu bandeja de entrada o spam.',
                'email' => $user['email'],
                'mail_sent' => $mailSent
            ]);
            break;

        case 'verify':
            $token = trim($_GET['token'] ?? $input['token'] ?? '');
            if (!$token) {
                throw new Exception('Token de verificación faltante.');
            }

            $user = ChatDB::verifyMentoriaEmail($token);
            if (!$user) {
                throw new Exception('El enlace de validación es inválido o ya ha sido utilizado.');
            }

            echo json_encode([
                'success' => true,
                'message' => 'Cuenta validada',
                'user' => [
                    'id' => $user['id'],
                    'first_name' => $user['first_name'],
                    'last_name' => $user['last_name'],
                    'email' => $user['email']
                ]
            ]);
            break;

        case 'login':
            if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
                throw new Exception('Método no permitido', 405);
            }

            $email = trim($input['email'] ?? '');
            $password = $input['password'] ?? '';

            if (!$email || !$password) {
                throw new Exception('Debes ingresar tu correo y contraseña.');
            }

            $user = ChatDB::loginMentoriaUser($email, $password);

            echo json_encode([
                'success' => true,
                'message' => 'Inicio de sesión exitoso.',
                'user' => $user
            ]);
            break;

        case 'forgot-password':
            if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
                throw new Exception('Método no permitido', 405);
            }

            $email = trim($input['email'] ?? '');
            if (!$email || !filter_var($email, FILTER_VALIDATE_EMAIL)) {
                throw new Exception('Debes ingresar un correo electrónico válido.');
            }

            $resetData = ChatDB::createMentoriaPasswordReset($email);
            if ($resetData) {
                MentoriaMailer::sendPasswordResetEmail($resetData['email'], $resetData['first_name'], $resetData['token']);
            }

            // Por seguridad, se responde exitoso incluso si el correo no existe para evitar enumeración
            echo json_encode([
                'success' => true,
                'message' => 'Si el correo está registrado, recibirás un enlace de restablecimiento en breve.'
            ]);
            break;

        case 'reset-password':
            if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
                throw new Exception('Método no permitido', 405);
            }

            $token = trim($input['token'] ?? '');
            $newPassword = $input['new_password'] ?? '';

            if (!$token) {
                throw new Exception('El token de restablecimiento es requerido.');
            }

            if (strlen($newPassword) < 6) {
                throw new Exception('La nueva contraseña debe tener al menos 6 caracteres.');
            }

            ChatDB::resetMentoriaPassword($token, $newPassword);

            echo json_encode([
                'success' => true,
                'message' => 'Contraseña restablecida con éxito. Ya puedes iniciar sesión con tu nueva contraseña.'
            ]);
            break;

        case 'change-password':
            if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
                throw new Exception('Método no permitido', 405);
            }

            $userId = (int)($input['user_id'] ?? 0);
            $currentPassword = $input['current_password'] ?? '';
            $newPassword = $input['new_password'] ?? '';

            if (!$userId) {
                throw new Exception('Sesión no identificada.');
            }

            if (strlen($newPassword) < 6) {
                throw new Exception('La nueva contraseña debe contener al menos 6 caracteres.');
            }

            ChatDB::changeMentoriaPassword($userId, $currentPassword, $newPassword);

            echo json_encode([
                'success' => true,
                'message' => 'Contraseña actualizada correctamente.'
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
