/ ===============================================
// 6. netlify/functions/save-push-subscription.js
// ===============================================

exports.handler = async (event, context) => {
    if (event.httpMethod !== 'POST') {
        return {
            statusCode: 405,
            body: JSON.stringify({ success: false, message: 'Method not allowed' })
        };
    }

    try {
        const { technicianId, subscription } = JSON.parse(event.body);
        
        if (!technicianId || !subscription) {
            return {
                statusCode: 400,
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
            body: JSON.stringify({
                success: true,
                message: 'Suscripción guardada'
            })
        };

    } catch (error) {
        console.error('Save subscription error:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({
                success: false,
                message: 'Error guardando suscripción'
            })
        };
    }
};