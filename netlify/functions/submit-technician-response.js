// ===============================================
// 4. netlify/functions/submit-technician-response.js
// ===============================================

const multipart = require('lambda-multipart-parser');
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
        // Parse multipart form data
        const result = await multipart.parse(event);
        
        const { requestId, status, comments } = result;
        // El tecnico se toma del token de sesion
        const technicianId = control.sesion.sub;
        
        if (!requestId || !status) {
            return {
                statusCode: 400,
                headers,
                body: JSON.stringify({ 
                    success: false, 
                    message: 'Datos requeridos faltantes' 
                })
            };
        }

        // Prepare update data
        const updateFields = {
            estado: status,
            observacionesTecnico: comments || '',
            fechaRespuestaTecnico: new Date().toISOString()
        };

        // If completed, set completion date
        if (status === 'COMPLETADA') {
            updateFields.fechaCompletado = new Date().toISOString();
            
            // Also update technician status to available
            await updateTechnicianStatus(technicianId, 'disponible');
        }

        // Handle photo uploads
        const attachments = [];
        
        // Maximo 2 fotos, subidas de a una: Airtable limita a 5 peticiones/segundo
        if (result.files && result.files.length > 0) {
            for (let i = 0; i < result.files.length && i < 2; i++) {
                const file = result.files[i];
                
                try {
                    // Upload to Airtable as attachment
                    const attachment = await uploadPhotoToAirtable(file);
                    if (attachment) {
                        attachments.push(attachment);
                    }
                } catch (uploadError) {
                    console.error('Photo upload error:', uploadError);
                }
            }
        }

        // Add attachments if any were uploaded
        if (attachments.length > 0) {
            updateFields.evidenciaFotografica = attachments;
        }

        // Update the request
        const response = await fetch(`https://api.airtable.com/v0/${process.env.AIRTABLE_BASE_ID}/Solicitudes/${requestId}`, {
            method: 'PATCH',
            headers: {
                'Authorization': `Bearer ${process.env.AIRTABLE_API_KEY}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                fields: updateFields
            })
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
                message: 'Respuesta enviada correctamente'
            })
        };

    } catch (error) {
        console.error('Submit response error:', error);
        return {
            statusCode: 500,
            headers,
            // No se devuelve error.message: puede filtrar rutas internas
            body: JSON.stringify({
                success: false,
                message: 'Error al enviar la respuesta'
            })
        };
    }
};

// Helper function to upload photo to Airtable
async function uploadPhotoToAirtable(file) {
    try {
        // First, upload to a temporary service (you could use Cloudinary, AWS S3, etc.)
        // For now, we'll create a data URL attachment
        
        const attachment = {
            url: `data:${file.contentType};base64,${file.content.toString('base64')}`,
            filename: file.filename || `photo_${Date.now()}.jpg`,
            type: file.contentType
        };
        
        return attachment;
    } catch (error) {
        console.error('Upload photo error:', error);
        return null;
    }
}

// Helper function to update technician status
async function updateTechnicianStatus(technicianId, status) {
    try {
        const response = await fetch(`https://api.airtable.com/v0/${process.env.AIRTABLE_BASE_ID}/Tecnicos/${technicianId}`, {
            method: 'PATCH',
            headers: {
                'Authorization': `Bearer ${process.env.AIRTABLE_API_KEY}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                fields: {
                    estado: status
                }
            })
        });
        
        return response.ok;
    } catch (error) {
        console.error('Update technician status error:', error);
        return false;
    }
}