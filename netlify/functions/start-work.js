// ===============================================
// netlify/functions/start-work.js
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
        const { requestId } = JSON.parse(event.body);
        // El tecnico se toma del token, no del cuerpo de la peticion
        const technicianId = control.sesion.sub;
        
        if (!requestId || !technicianId) {
            return {
                statusCode: 400,
                headers,
                body: JSON.stringify({ 
                    success: false, 
                    message: 'ID de solicitud y técnico requeridos' 
                })
            };
        }

        // Update request status to "EN_PROCESO" and set start time
        const updateData = {
            fields: {
                estado: 'EN_PROCESO',
                fechaInicioTrabajo: new Date().toISOString()
            }
        };

        const response = await fetch(`https://api.airtable.com/v0/${process.env.AIRTABLE_BASE_ID}/Solicitudes/${requestId}`, {
            method: 'PATCH',
            headers: {
                'Authorization': `Bearer ${process.env.AIRTABLE_API_KEY}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(updateData)
        });

        if (!response.ok) {
            const detalle = await response.text().catch(() => '');
            throw new Error(`Airtable ${response.status}: ${detalle.slice(0, 200)}`);
        }

        return {
            statusCode: 200,
            headers,
            body: JSON.stringify({
                success: true,
                message: 'Trabajo iniciado correctamente'
            })
        };

    } catch (error) {
        console.error('Start work error:', error);
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({
                success: false,
                message: 'Error al iniciar trabajo'
            })
        };
    }
};
