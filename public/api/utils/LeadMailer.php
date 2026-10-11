<?php
/**
 * LeadMailer - Notifica al equipo de Nefetech sobre nuevos leads recibidos en el chat web
 * Formato: Planilla formal sin iconos, limpia y optimizada para impresión (Print-ready).
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

        // Detección de teléfonos
        if (preg_match_all('/(?:\+?\d{1,3}[\s-]?)?(?:\(?\d{2,4}\)?[\s-]?)?\d{3,4}[\s-]?\d{3,4}/', $text, $matches)) {
            foreach ($matches[0] as $candidate) {
                $digits = preg_replace('/\D/', '', $candidate);
                if (strlen($digits) >= 8 && strlen($digits) <= 15) {
                    $contacts['phones'][] = trim($candidate);
                }
            }
            $contacts['phones'] = array_unique($contacts['phones']);
        }

        return $contacts;
    }

    /**
     * Envía un email en formato de planilla formal para impresión
     */
    public static function sendLeadNotification(string $sessionId, string $leadMessage, string $ip = '', string $userAgent = ''): bool {
        $contacts = self::extractContactInfo($leadMessage);
        $emailList = !empty($contacts['emails']) ? implode(', ', $contacts['emails']) : 'No especificado';
        $phoneList = !empty($contacts['phones']) ? implode(', ', $contacts['phones']) : 'No especificado';
        $fechaActual = date('d/m/Y H:i:s');

        // Obtener historial completo de la conversación
        $history = ChatDB::getHistory($sessionId);
        $historyRows = '';
        $itemNum = 1;

        foreach ($history as $h) {
            $emisor = $h['sender'] === 'user' ? 'Cliente / Interesado' : 'Asistente Comercial';
            $fechaMensaje = !empty($h['created_at']) ? htmlspecialchars($h['created_at']) : '-';
            $contenido = nl2br(htmlspecialchars($h['message']));

            $historyRows .= "
                <tr>
                    <td style='border: 1px solid #333333; padding: 6px 8px; text-align: center; font-size: 11px; vertical-align: top; width: 35px;'>{$itemNum}</td>
                    <td style='border: 1px solid #333333; padding: 6px 8px; font-size: 11px; vertical-align: top; width: 140px; font-weight: bold;'>{$emisor}</td>
                    <td style='border: 1px solid #333333; padding: 6px 8px; font-size: 11px; vertical-align: top; width: 110px; color: #555555;'>{$fechaMensaje}</td>
                    <td style='border: 1px solid #333333; padding: 6px 8px; font-size: 11px; vertical-align: top; line-height: 1.4;'>{$contenido}</td>
                </tr>
            ";
            $itemNum++;
        }

        $to = 'comercial@nefetech.online';
        $cc = 'leonelexequielvincent@gmail.com';
        $subject = 'SOLICITUD DE PRESUPUESTO Y CONTACTO - ' . ($contacts['emails'][0] ?? $contacts['phones'][0] ?? $sessionId);

        $bodyHtml = "
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset='utf-8'>
            <title>Planilla de Requerimiento y Presupuesto - Nefetech</title>
            <style>
                @media print {
                    body { margin: 0; padding: 0; background-color: #ffffff; }
                    .page-container { width: 100% !important; border: none !important; }
                }
            </style>
        </head>
        <body style='font-family: Arial, sans-serif; background-color: #ffffff; color: #000000; margin: 0; padding: 20px;'>
            <div class='page-container' style='max-width: 780px; margin: 0 auto; background-color: #ffffff; border: 1px solid #000000; padding: 24px;'>
                
                <!-- Encabezado de Planilla Formal -->
                <table style='width: 100%; border-collapse: collapse; margin-bottom: 20px; border-bottom: 2px solid #000000; padding-bottom: 12px;'>
                    <tr>
                        <td style='vertical-align: top;'>
                            <div style='font-size: 18px; font-weight: bold; text-transform: uppercase; letter-spacing: 0.5px;'>NEFETECH</div>
                            <div style='font-size: 12px; color: #333333; margin-top: 3px;'>Desarrollo de Software a Medida | Soluciones de IA | Consultoria</div>
                            <div style='font-size: 11px; color: #555555; margin-top: 2px;'>Web: nefetech.online | Email: comercial@nefetech.online</div>
                        </td>
                        <td style='vertical-align: top; text-align: right;'>
                            <div style='font-size: 14px; font-weight: bold; text-transform: uppercase;'>PLANILLA DE CONTACTO Y REQUERIMIENTO</div>
                            <div style='font-size: 11px; color: #333333; margin-top: 4px;'>ID Registro: " . htmlspecialchars($sessionId) . "</div>
                            <div style='font-size: 11px; color: #333333;'>Fecha de Emision: {$fechaActual}</div>
                        </td>
                    </tr>
                </table>

                <!-- Seccion 1: Datos de Contacto del Solicitante -->
                <div style='font-size: 12px; font-weight: bold; text-transform: uppercase; background-color: #f2f2f2; border: 1px solid #333333; padding: 5px 8px; margin-bottom: -1px;'>
                    1. DATOS DEL CLIENTE / SOLICITANTE
                </div>
                <table style='width: 100%; border-collapse: collapse; margin-bottom: 20px;'>
                    <tr>
                        <td style='border: 1px solid #333333; padding: 7px 10px; width: 25%; font-size: 11px; font-weight: bold; background-color: #fafafa;'>Correo Electronico:</td>
                        <td style='border: 1px solid #333333; padding: 7px 10px; width: 75%; font-size: 12px;'><strong>" . htmlspecialchars($emailList) . "</strong></td>
                    </tr>
                    <tr>
                        <td style='border: 1px solid #333333; padding: 7px 10px; font-size: 11px; font-weight: bold; background-color: #fafafa;'>Telefono / WhatsApp:</td>
                        <td style='border: 1px solid #333333; padding: 7px 10px; font-size: 12px;'><strong>" . htmlspecialchars($phoneList) . "</strong></td>
                    </tr>
                    <tr>
                        <td style='border: 1px solid #333333; padding: 7px 10px; font-size: 11px; font-weight: bold; background-color: #fafafa;'>Direccion IP de Origen:</td>
                        <td style='border: 1px solid #333333; padding: 7px 10px; font-size: 11px; color: #444444;'>" . htmlspecialchars($ip) . "</td>
                    </tr>
                </table>

                <!-- Seccion 2: Detalle de la Propuesta / Necesidad Planteada -->
                <div style='font-size: 12px; font-weight: bold; text-transform: uppercase; background-color: #f2f2f2; border: 1px solid #333333; padding: 5px 8px; margin-bottom: -1px;'>
                    2. DESCRIPCION DEL REQUERIMIENTO O CONSULTA
                </div>
                <div style='border: 1px solid #333333; padding: 12px; font-size: 12px; line-height: 1.5; margin-bottom: 20px; min-height: 50px; background-color: #ffffff;'>
                    " . nl2br(htmlspecialchars($leadMessage)) . "
                </div>

                <!-- Seccion 3: Historial Cronologico de Conversacion -->
                <div style='font-size: 12px; font-weight: bold; text-transform: uppercase; background-color: #f2f2f2; border: 1px solid #333333; padding: 5px 8px; margin-bottom: -1px;'>
                    3. REGISTRO CRONOLOGICO DE CONSULTAS (INTERCAMBIO EN CHAT)
                </div>
                <table style='width: 100%; border-collapse: collapse; margin-bottom: 24px;'>
                    <thead>
                        <tr style='background-color: #ebebeb;'>
                            <th style='border: 1px solid #333333; padding: 6px 8px; font-size: 11px; text-align: center; width: 35px;'>Nro</th>
                            <th style='border: 1px solid #333333; padding: 6px 8px; font-size: 11px; text-align: left; width: 140px;'>Interlocutor</th>
                            <th style='border: 1px solid #333333; padding: 6px 8px; font-size: 11px; text-align: left; width: 110px;'>Fecha / Hora</th>
                            <th style='border: 1px solid #333333; padding: 6px 8px; font-size: 11px; text-align: left;'>Mensaje Registrado</th>
                        </tr>
                    </thead>
                    <tbody>
                        {$historyRows}
                    </tbody>
                </table>

                <!-- Seccion 4: Firmas / Pie de Pagina de Control -->
                <table style='width: 100%; border-collapse: collapse; margin-top: 30px; border-top: 1px dashed #666666; padding-top: 16px;'>
                    <tr>
                        <td style='font-size: 10px; color: #666666; vertical-align: top; width: 60%;'>
                            Documento generado automaticamente por la plataforma de Nefetech.<br>
                            Valido para analisis comercial y seguimiento de requerimiento de software.
                        </td>
                        <td style='font-size: 11px; text-align: right; vertical-align: top; width: 40%;'>
                            <div style='margin-top: 25px; border-top: 1px solid #000000; display: inline-block; width: 180px; text-align: center; padding-top: 4px;'>
                                Responsable Comercial
                            </div>
                        </td>
                    </tr>
                </table>

            </div>
        </body>
        </html>
        ";

        $headers = [
            'MIME-Version: 1.0',
            'Content-type: text/html; charset=utf-8',
            'From: Nefetech Notificaciones <comercial@nefetech.online>',
            'Reply-To: comercial@nefetech.online',
            'Cc: ' . $cc,
            'X-Mailer: PHP/' . phpversion()
        ];

        return mail($to, $subject, $bodyHtml, implode("\r\n", $headers));
    }
}
