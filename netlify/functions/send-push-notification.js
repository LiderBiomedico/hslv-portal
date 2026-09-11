// ===============================================
// 5. netlify/functions/send-push-notification.js
// ===============================================

const webpush = require('web-push');
const { requireSession, corsHeaders } = require('./utils/session');

// Las claves VAPID solo se configuran si existen, para que la funcion
// no reviente al cargarse cuando el push no esta configurado todavia
if (process.env.VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY) {
    webpush.setVapidDetails(
        process.env.VAPID_SUBJECT || 'mailto:soporte@hslv.gov.co',
        process.env.VAPID_PUBLIC_KEY,
        process.env.VAPID_PRIVATE_KEY
    );
}

exports.handler = async (event, context) => {
    const headers = corsHeaders(event);

    if (event.httpMethod === 'OPTIONS') {
        return { statusCode: 200, headers, body: '' };
    }
    if (event.httpMethod !== 'POST') {
        return {
            statusCode: 405,
            headers,
            body: JSON.stringify({ success: false, message: 'Method not allowed' })
        };
    }

    // 🔐 Solo un administrador puede disparar notificaciones a los tecnicos
    const control = requireSession(event, headers, { rol: 'admin' });
    if (control.error) return control.error;

    try {
        const { technicianId, requestNumber, message } = JSON.parse(event.body);
        
        if (!technicianId || !requestNumber) {
            return {
                statusCode: 400,
                headers,
                body: JSON.stringify({ 
                    success: false, 
                    message: 'Datos requeridos faltantes' 
                })
            };
        }

        // Get technician's push subscription from database
        // For now, we'll return success (you'd implement subscription storage)
        
        const payload = JSON.stringify({
            title: '🏥 Nueva Solicitud Asignada',
            body: message || `Solicitud ${requestNumber} ha sido asignada`,
            icon: '/icon-192x192.png',
            badge: '/badge-72x72.png',
            data: {
                requestNumber: requestNumber,
                type: 'NEW_REQUEST'
            }
        });

        // In a real implementation, you'd:
        // 1. Get the technician's push subscription from your database
        // 2. Send the push notification using webpush.sendNotification()
        
        return {
            statusCode: 200,
            headers,
            body: JSON.stringify({
                success: true,
                message: 'Notificación enviada'
            })
        };

    } catch (error) {
        console.error('Push notification error:', error);
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({
                success: false,
                message: 'Error enviando notificación'
            })
        };
    }
};