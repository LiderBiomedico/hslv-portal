// ===============================================
// 2. netlify/functions/get-technician-requests.js
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
        const { technicianId } = JSON.parse(event.body);
        
        if (!technicianId) {
            return {
                statusCode: 400,
                body: JSON.stringify({ 
                    success: false, 
                    message: 'ID del técnico requerido' 
                })
            };
        }

        // Get technician info first
        const techResponse = await fetch(`https://api.airtable.com/v0/${process.env.AIRTABLE_BASE_ID}/Tecnicos/${technicianId}`, {
            headers: {
                'Authorization': `Bearer ${process.env.AIRTABLE_API_KEY}`,
                'Content-Type': 'application/json'
            }
        });

        const techData = await techResponse.json();
        const technicianName = techData.fields?.nombre;

        if (!technicianName) {
            return {
                statusCode: 404,
                body: JSON.stringify({ 
                    success: false, 
                    message: 'Técnico no encontrado' 
                })
            };
        }

        // Get all requests assigned to this technician
        const requestsUrl = `https://api.airtable.com/v0/${process.env.AIRTABLE_BASE_ID}/Solicitudes`;
        const filterFormula = `{tecnicoAsignado} = "${technicianName}"`;
        
        const response = await fetch(`${requestsUrl}?filterByFormula=${encodeURIComponent(filterFormula)}`, {
            headers: {
                'Authorization': `Bearer ${process.env.AIRTABLE_API_KEY}`,
                'Content-Type': 'application/json'
            }
        });

        const data = await response.json();
        
        const requests = data.records.map(record => ({
            id: record.id,
            numero: record.fields.numero,
            equipo: record.fields.equipo,
            ubicacion: record.fields.ubicacion,
            descripcion: record.fields.descripcion,
            estado: record.fields.estado,
            prioridad: record.fields.prioridad,
            servicioIngenieria: record.fields.servicioIngenieria,
            fechaCreacion: record.fields.fechaCreacion,
            fechaAsignacion: record.fields.fechaAsignacion,
            fechaCompletado: record.fields.fechaCompletado,
            observaciones: record.fields.observaciones,
            tipoServicio: record.fields.tipoServicio
        }));

        return {
            statusCode: 200,
            body: JSON.stringify({
                success: true,
                requests: requests
            })
        };

    } catch (error) {
        console.error('Get requests error:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({
                success: false,
                message: 'Error al obtener solicitudes'
            })
        };
    }
};