// ===============================================
// netlify/functions/save-push-subscription.js
// ===============================================

const { requireSession, corsHeaders } = require('./utils/session');

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

    // 🔐 Sesion obligatoria
    const control = requireSession(event, headers);
    if (control.error) return control.error;

    try {
        const { subscription } = JSON.parse(event.body);
        const technicianId = control.sesion.sub;
        
        if (!subscription) {
            return {
                statusCode: 400,
                headers,
                body: JSON.stringify({ 
                    success: false, 
                    message: 'Datos requeridos faltantes' 
                })
            };
        }

        // Here you would save the push subscription to your database
        // For this example, we'll just return success
        
        console.log(`Saving push subscription for technician ${technicianId}`);
        
        return {
            statusCode: 200,
            headers,
            body: JSON.stringify({
                success: true,
                message: 'Suscripción guardada'
            })
        };

    } catch (error) {
        console.error('Save subscription error:', error);
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({
                success: false,
                message: 'Error guardando suscripción'
            })
        };
    }
};