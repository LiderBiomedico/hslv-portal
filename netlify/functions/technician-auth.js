const fetch = require('node-fetch');

exports.handler = async (event, context) => {
    if (event.httpMethod !== 'POST') {
        return {
            statusCode: 405,
            body: JSON.stringify({ success: false, message: 'Method not allowed' })
        };
    }

    try {
        const { email, code } = JSON.parse(event.body);
        
        if (!email || !code) {
            return {
                statusCode: 400,
                body: JSON.stringify({ 
                    success: false, 
                    message: 'Email y código son requeridos' 
                })
            };
        }

        // Get technician from Airtable using the existing API
        const airtableUrl = `https://api.airtable.com/v0/${process.env.AIRTABLE_BASE_ID}/Tecnicos`;
        
        const response = await fetch(airtableUrl, {
            headers: {
                'Authorization': `Bearer ${process.env.AIRTABLE_API_KEY}`,
                'Content-Type': 'application/json'
            }
        });

        const data = await response.json();
        
        // Find technician by email
        const technician = data.records.find(record => {
            const techEmail = record.fields.email || '';
            return techEmail.toLowerCase() === email.toLowerCase();
        });

        if (!technician) {
            return {
                statusCode: 401,
                body: JSON.stringify({ 
                    success: false, 
                    message: 'Usuario no encontrado' 
                })
            };
        }

        // For demo purposes, accept any 4-digit code
        // In production, you'd validate against a stored access code
        if (code.length !== 4 || !/^\d{4}$/.test(code)) {
            return {
                statusCode: 401,
                body: JSON.stringify({ 
                    success: false, 
                    message: 'Código inválido' 
                })
            };
        }

        // Return user data
        const userData = {
            id: technician.id,
            nombre: technician.fields.nombre,
            email: technician.fields.email,
            area: technician.fields.area,
            tipo: technician.fields.tipo,
            estado: technician.fields.estado
        };

        return {
            statusCode: 200,
            body: JSON.stringify({
                success: true,
                user: userData
            })
        };

    } catch (error) {
        console.error('Auth error:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({
                success: false,
                message: 'Error interno del servidor'
            })
        };
    }
};