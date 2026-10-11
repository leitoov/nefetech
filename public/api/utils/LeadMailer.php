<?php
/**
 * LeadMailer - Notifica al equipo de Nefetech sobre nuevos leads recibidos en el chat web
 */
require_once __DIR__ . '/ChatDB.php';

class LeadMailer {
    /**
     * Detecta si un mensaje contiene email o número telefónico
     */
    public static function extractContactInfo(string $text): array {
        $contacts = [
            'emails' => [],
            'phones' => []
        ];

        // Detección de emails
        if (preg_match_all('/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/', $text, $matches)) {
            $contacts['emails'] = array_unique($matches[0]);
        }

        // Detección de teléfonos (formatos comunes: +54, 11..., 15..., con guiones o espacios)
        if (preg_match_all('/(?:\+?\d{1,3}[\s-]?)?(?:\(?\d{2,4}\)?[\s-]?)?\d{3,4}[\s-]?\d{3,4}/', $text, $matches)) {
            foreach ($matches[0] as $candidate) {
                $digits = preg_replace('/\D/', '', $candidate);
                // Si tiene al menos 8 dígitos numéricos, lo consideramos teléfono
                if (strlen($digits) >= 8 && strlen($digits) <= 15) {
                    $contacts['phones'][] = trim($candidate);
                }
            }
            $contacts['phones'] = array_unique($contacts['phones']);
        }

        return $contacts;
    }

    /**
     * Envía un email con los datos de contacto y el historial completo del chat
     */
    public static function sendLeadNotification(string $sessionId, string $leadMessage, string $ip = '', string $userAgent = ''): bool {
        $contacts = self::extractContactInfo($leadMessage);
        $emailList = !empty($contacts['emails']) ? implode(', ', $contacts['emails']) : 'No especificado';
        $phoneList = !empty($contacts['phones']) ? implode(', ', $contacts['phones']) : 'No especificado';

        // Obtener historial completo de la conversación
        $history = ChatDB::getHistory($sessionId);
        $historyHtml = '';
        foreach ($history as $h) {
            $senderLabel = $h['sender'] === 'user' ? '👤 Usuario' : '🤖 Asistente Nefetech';
            $senderColor = $h['sender'] === 'user' ? '#2563eb' : '#475569';
            $time = htmlspecialchars($h['created_at']);
            $msg = nl2br(htmlspecialchars($h['message']));

            $historyHtml .= "
                <div style='margin-bottom: 12px; padding: 10px 14px; background: #f8fafc; border-left: 3px solid {$senderColor}; border-radius: 6px;'>
                    <div style='font-size: 11px; color: #94a3b8; margin-bottom: 4px;'><strong>{$senderLabel}</strong> • {$time}</div>
                    <div style='font-size: 13px; color: #1e293b; line-height: 1.5;'>{$msg}</div>
                </div>
            ";
        }

        $to = 'comercial@nefetech.online';
        $cc = 'leonelexequielvincent@gmail.com';
        $subject = '🚀 Nuevo Lead Recibido desde el Chat de Nefetech';

        $bodyHtml = "
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset='utf-8'>
            <title>Nuevo Lead Nefetech</title>
        </head>
        <body style='font-family: -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, Helvetica, Arial, sans-serif; background-color: #f1f5f9; padding: 25px; margin: 0;'>
            <div style='max-width: 620px; margin: 0 auto; background: #ffffff; border-radius: 14px; overflow: hidden; border: 1px solid #e2e8f0; box-shadow: 0 4px 12px rgba(0,0,0,0.05);'>
                <div style='background: linear-gradient(135deg, #2563eb 0%, #4f46e5 100%); padding: 24px; color: #ffffff;'>
                    <h2 style='margin: 0; font-size: 20px; font-weight: 700;'>Nuevo Lead desde nefetech.online</h2>
                    <p style='margin: 6px 0 0; font-size: 13px; opacity: 0.9;'>Un usuario ha compartido sus datos de contacto y requerimiento en el chat inteligente.</p>
                </div>

                <div style='padding: 24px;'>
                    <h3 style='margin: 0 0 14px; font-size: 15px; color: #0f172a;'>📋 Datos de Contacto Detectados</h3>
                    <table style='width: 100%; border-collapse: collapse; margin-bottom: 24px; font-size: 13px;'>
                        <tr>
                            <td style='padding: 8px 12px; background: #f8fafc; font-weight: 600; width: 140px; color: #475569; border: 1px solid #e2e8f0;'>📧 Email:</td>
                            <td style='padding: 8px 12px; color: #0f172a; border: 1px solid #e2e8f0;'><strong>{$emailList}</strong></td>
                        </tr>
                        <tr>
                            <td style='padding: 8px 12px; background: #f8fafc; font-weight: 600; color: #475569; border: 1px solid #e2e8f0;'>📱 Teléfono / WA:</td>
                            <td style='padding: 8px 12px; color: #0f172a; border: 1px solid #e2e8f0;'><strong>{$phoneList}</strong></td>
                        </tr>
                        <tr>
                            <td style='padding: 8px 12px; background: #f8fafc; font-weight: 600; color: #475569; border: 1px solid #e2e8f0;'>🌐 IP / Origen:</td>
                            <td style='padding: 8px 12px; color: #64748b; border: 1px solid #e2e8f0;'>{$ip}</td>
                        </tr>
                    </table>

                    <h3 style='margin: 0 0 10px; font-size: 15px; color: #0f172a;'>💬 Mensaje de Cierre / Necesidad</h3>
                    <div style='background: #eff6ff; border: 1px solid #bfdbfe; padding: 14px; border-radius: 8px; color: #1e3a8a; font-size: 13px; line-height: 1.5; margin-bottom: 24px;'>
                        " . nl2br(htmlspecialchars($leadMessage)) . "
                    </div>

                    <h3 style='margin: 0 0 14px; font-size: 15px; color: #0f172a;'>📜 Historial Completo de la Conversación</h3>
                    <div style='max-height: 400px; overflow-y: auto;'>
                        {$historyHtml}
                    </div>
                </div>

                <div style='background: #f8fafc; padding: 16px 24px; text-align: center; font-size: 11px; color: #94a3b8; border-top: 1px solid #e2e8f0;'>
                    Nefetech AI Platform • Notificación automática de lead • https://nefetech.online
                </div>
            </div>
        </body>
        </html>
        ";

        $headers = [
            'MIME-Version: 1.0',
            'Content-type: text/html; charset=utf-8',
            'From: Nefetech Chat <comercial@nefetech.online>',
            'Reply-To: comercial@nefetech.online',
            'Cc: ' . $cc,
            'X-Mailer: PHP/' . phpversion()
        ];

        return mail($to, $subject, $bodyHtml, implode("\r\n", $headers));
    }
}
