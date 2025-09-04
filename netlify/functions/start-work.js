/ ===============================================
// 3. netlify/functions/start-work.js
// ===============================================

const fetch = require('node-fetch');

exports.handler = async (event, context) => {
    if (event.httpMethod !== 'POST') {
        return {
            statusCode: 405,
            body: JSON.stringify({ success: false, message: 'Method not allowed' })
        };
    }

    try {
        const { requestId, technicianId } = JSON.parse(event.body);
        
        if (!requestId || !technicianId) {
            return {
                statusCode: 400,
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
            throw new Error('Error updating request');
        }

        return {
            statusCode: 200,
            body: JSON.stringify({
                success: true,
                message: 'Trabajo iniciado correctamente'
            })
        };

    } catch (error) {
        console.error('Start work error:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({
                success: false,
                message: 'Error al iniciar trabajo'
            })
        };
    }
};
