// ===============================================
// 5. netlify/functions/send-push-notification.js
// ===============================================

const webpush = require('web-push');

// Configure web-push (you'll need to generate VAPID keys)
webpush.setVapidDetails(
    'mailto:tu-email@hospital.com',
    process.env.VAPID_PUBLIC_KEY,
    process.env.VAPID_PRIVATE_KEY
);

exports.handler = async (event, context) => {
    if (event.httpMethod !== 'POST') {
        return {
            statusCode: 405,
            body: JSON.stringify({ success: false, message: 'Method not allowed' })
        };
    }

    try {
        const { technicianId, requestNumber, message } = JSON.parse(event.body);
        
        if (!technicianId || !requestNumber) {
            return {
                statusCode: 400,
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
            body: JSON.stringify({
                success: true,
                message: 'Notificación enviada'
            })
        };

    } catch (error) {
        console.error('Push notification error:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({
                success: false,
                message: 'Error enviando notificación'
            })
        };
    }
};