<?php
/**
 * MentoriaMailer - Servicio de emails para la plataforma de Mentorías de Nefetech
 * Remitente obligatorio: mentoria@nefetech.online
 */

class MentoriaMailer {
    const FROM_EMAIL = 'mentoria@nefetech.online';
    const FROM_NAME = 'Nefetech Mentorías';
    const BASE_URL = 'https://mentorias.nefetech.online';

    /**
     * Envía correo de confirmación y validación de cuenta al registrarse
     */
    public static function sendVerificationEmail(string $toEmail, string $firstName, string $token): bool {
        $verificationUrl = self::BASE_URL . '/?action=verify&token=' . urlencode($token);
        $subject = 'Valida tu cuenta en Nefetech Mentorías';

        $bodyHtml = "
        <!DOCTYPE html>
        <html lang='es'>
        <head>
            <meta charset='UTF-8'>
            <title>Validación de Cuenta</title>
        </head>
        <body style='margin: 0; padding: 0; background-color: #0b0f19; font-family: -apple-system, BlinkMacSystemFont, \"Segoe UI\", Roboto, Helvetica, Arial, sans-serif; color: #ffffff;'>
            <table width='100%' cellpadding='0' cellspacing='0' style='background-color: #0b0f19; padding: 40px 20px;'>
                <tr>
                    <td align='center'>
                        <table width='600' cellpadding='0' cellspacing='0' style='background-color: #111827; border: 1px solid #1f2937; border-radius: 16px; overflow: hidden; box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.5);'>
                            <!-- Header -->
                            <tr>
                                <td style='background: linear-gradient(135deg, #0ea5e9 0%, #3b82f6 100%); padding: 32px 40px; text-align: center;'>
                                    <h1 style='margin: 0; font-size: 24px; font-weight: 800; color: #ffffff; letter-spacing: -0.5px;'>NEFETECH MENTORÍAS</h1>
                                    <p style='margin: 6px 0 0 0; font-size: 14px; color: rgba(255,255,255,0.9);'>Plataforma de Formación Tecnológica y Alto Rendimiento</p>
                                </td>
                            </tr>
                            <!-- Content -->
                            <tr>
                                <td style='padding: 40px;'>
                                    <h2 style='margin: 0 0 16px 0; font-size: 20px; font-weight: 700; color: #f9fafb;'>¡Hola " . htmlspecialchars($firstName) . "!</h2>
                                    <p style='margin: 0 0 20px 0; font-size: 15px; line-height: 1.6; color: #9ca3af;'>
                                        Gracias por registrarte en nuestra plataforma de mentorías. Para activar tu cuenta y comenzar a explorar tus cursos y avances, confirma tu dirección de correo electrónico haciendo clic en el siguiente botón:
                                    </p>
                                    
                                    <!-- Botón Principal -->
                                    <table width='100%' cellpadding='0' cellspacing='0' style='margin: 32px 0;'>
                                        <tr>
                                            <td align='center'>
                                                <a href='" . htmlspecialchars($verificationUrl) . "' target='_blank' style='display: inline-block; background: #0ea5e9; color: #ffffff; font-size: 16px; font-weight: 600; text-decoration: none; padding: 14px 32px; border-radius: 10px; box-shadow: 0 4px 14px 0 rgba(14, 165, 233, 0.39);'>
                                                    Validar mi cuenta
                                                </a>
                                            </td>
                                        </tr>
                                    </table>

                                    <p style='margin: 0 0 10px 0; font-size: 13px; color: #6b7280; line-height: 1.5;'>
                                        O copia y pega el siguiente enlace directo en tu navegador:
                                    </p>
                                    <p style='margin: 0 0 24px 0; font-size: 12px; color: #38bdf8; word-break: break-all; background-color: #1f2937; padding: 10px 14px; border-radius: 8px;'>
                                        " . htmlspecialchars($verificationUrl) . "
                                    </p>

                                    <p style='margin: 0; font-size: 13px; color: #6b7280; line-height: 1.5;'>
                                        Si no solicitaste este registro, puedes ignorar este correo de forma segura.
                                    </p>
                                </td>
                            </tr>
                            <!-- Footer -->
                            <tr>
                                <td style='background-color: #0d131f; padding: 24px 40px; text-align: center; border-top: 1px solid #1f2937;'>
                                    <p style='margin: 0; font-size: 12px; color: #6b7280;'>
                                        &copy; " . date('Y') . " Nefetech. Todos los derechos reservados.<br>
                                        Soporte y Consultas: <a href='mailto:mentoria@nefetech.online' style='color: #0ea5e9; text-decoration: none;'>mentoria@nefetech.online</a>
                                    </p>
                                </td>
                            </tr>
                        </table>
                    </td>
                </tr>
            </table>
        </body>
        </html>
        ";

        return self::sendMail($toEmail, $subject, $bodyHtml);
    }

    /**
     * Envía correo para restablecer la contraseña
     */
    public static function sendPasswordResetEmail(string $toEmail, string $firstName, string $token): bool {
        $resetUrl = self::BASE_URL . '/?action=reset&token=' . urlencode($token);
        $subject = 'Restablecer contraseña - Nefetech Mentorías';

        $bodyHtml = "
        <!DOCTYPE html>
        <html lang='es'>
        <head>
            <meta charset='UTF-8'>
            <title>Restablecer Contraseña</title>
        </head>
        <body style='margin: 0; padding: 0; background-color: #0b0f19; font-family: -apple-system, BlinkMacSystemFont, \"Segoe UI\", Roboto, Helvetica, Arial, sans-serif; color: #ffffff;'>
            <table width='100%' cellpadding='0' cellspacing='0' style='background-color: #0b0f19; padding: 40px 20px;'>
                <tr>
                    <td align='center'>
                        <table width='600' cellpadding='0' cellspacing='0' style='background-color: #111827; border: 1px solid #1f2937; border-radius: 16px; overflow: hidden; box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.5);'>
                            <!-- Header -->
                            <tr>
                                <td style='background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%); padding: 32px 40px; text-align: center;'>
                                    <h1 style='margin: 0; font-size: 24px; font-weight: 800; color: #ffffff; letter-spacing: -0.5px;'>NEFETECH MENTORÍAS</h1>
                                    <p style='margin: 6px 0 0 0; font-size: 14px; color: rgba(255,255,255,0.9);'>Recuperación de Contraseña</p>
                                </td>
                            </tr>
                            <!-- Content -->
                            <tr>
                                <td style='padding: 40px;'>
                                    <h2 style='margin: 0 0 16px 0; font-size: 20px; font-weight: 700; color: #f9fafb;'>¡Hola " . htmlspecialchars($firstName) . "!</h2>
                                    <p style='margin: 0 0 20px 0; font-size: 15px; line-height: 1.6; color: #9ca3af;'>
                                        Hemos recibido una solicitud para restablecer la contraseña de tu cuenta en Nefetech Mentorías. Haz clic en el botón siguiente para definir una nueva contraseña:
                                    </p>
                                    
                                    <!-- Botón Principal -->
                                    <table width='100%' cellpadding='0' cellspacing='0' style='margin: 32px 0;'>
                                        <tr>
                                            <td align='center'>
                                                <a href='" . htmlspecialchars($resetUrl) . "' target='_blank' style='display: inline-block; background: #6366f1; color: #ffffff; font-size: 16px; font-weight: 600; text-decoration: none; padding: 14px 32px; border-radius: 10px; box-shadow: 0 4px 14px 0 rgba(99, 102, 241, 0.39);'>
                                                    Restablecer mi Contraseña
                                                </a>
                                            </td>
                                        </tr>
                                    </table>

                                    <p style='margin: 0 0 10px 0; font-size: 13px; color: #6b7280; line-height: 1.5;'>
                                        Este enlace es válido por 2 horas. Si no puedes pulsar el botón, usa el siguiente enlace:
                                    </p>
                                    <p style='margin: 0 0 24px 0; font-size: 12px; color: #a5b4fc; word-break: break-all; background-color: #1f2937; padding: 10px 14px; border-radius: 8px;'>
                                        " . htmlspecialchars($resetUrl) . "
                                    </p>

                                    <p style='margin: 0; font-size: 13px; color: #6b7280; line-height: 1.5;'>
                                        Si no fuiste tú quien solicitó restablecer la contraseña, no te preocupes, tu cuenta permanece segura y puedes desestimar este mensaje.
                                    </p>
                                </td>
                            </tr>
                            <!-- Footer -->
                            <tr>
                                <td style='background-color: #0d131f; padding: 24px 40px; text-align: center; border-top: 1px solid #1f2937;'>
                                    <p style='margin: 0; font-size: 12px; color: #6b7280;'>
                                        &copy; " . date('Y') . " Nefetech. Todos los derechos reservados.<br>
                                        Remitente oficial: <a href='mailto:mentoria@nefetech.online' style='color: #6366f1; text-decoration: none;'>mentoria@nefetech.online</a>
                                    </p>
                                </td>
                            </tr>
                        </table>
                    </td>
                </tr>
            </table>
        </body>
        </html>
        ";

        return self::sendMail($toEmail, $subject, $bodyHtml);
    }

    /**
     * Utilidad interna para enviar emails con cabeceras MIME
     */
    private static function sendMail(string $to, string $subject, string $html): bool {
        $headers = [
            'MIME-Version: 1.0',
            'Content-type: text/html; charset=utf-8',
            'From: ' . self::FROM_NAME . ' <' . self::FROM_EMAIL . '>',
            'Reply-To: ' . self::FROM_EMAIL,
            'X-Mailer: PHP/' . phpversion()
        ];

        return mail($to, $subject, $html, implode("\r\n", $headers));
    }
}
