// netlify/functions/airtable-proxy.js
// Proxy mejorado para manejar solicitudes de acceso correctamente

exports.handler = async (event, context) => {
    console.log('🚀 Airtable Proxy - Request received');
    console.log('Method:', event.httpMethod);
    console.log('Path:', event.path);
    
    // Solo permitir ciertos métodos
    const allowedMethods = ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'];
    if (!allowedMethods.includes(event.httpMethod)) {
        return {
            statusCode: 405,
            headers: {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Headers': 'Content-Type',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ error: 'Method not allowed' })
        };
    }

    // Handle CORS preflight
    if (event.httpMethod === 'OPTIONS') {
        return {
            statusCode: 200,
            headers: {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Headers': 'Content-Type, Authorization',
                'Access-Control-Allow-Methods': 'GET, POST, PATCH, DELETE, OPTIONS'
            },
            body: ''
        };
    }

    try {
        // Extraer el endpoint desde la URL
        const pathParts = event.path.split('/.netlify/functions/airtable-proxy/');
        const endpoint = pathParts[1] || '';
        
        console.log('📍 Endpoint:', endpoint);
        
        // Validar que tengamos un endpoint
        if (!endpoint) {
            throw new Error('No endpoint specified');
        }

        // Configuración de Airtable
        const AIRTABLE_API_KEY = process.env.AIRTABLE_API_KEY || 'patev8QTzDMA5EGSK.777efed543e6fac49d2c830659a6d0c508b617ff90c352921d626fd9c929e570';
        const AIRTABLE_BASE_ID = process.env.AIRTABLE_BASE_ID || 'appFyEBCedQGOeJyV';
        const AIRTABLE_API_URL = `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}`;

        // Construir la URL completa
        const url = `${AIRTABLE_API_URL}/${endpoint}`;
        console.log('🎯 Full URL:', url);

        // Preparar opciones de fetch
        const fetchOptions = {
            method: event.httpMethod,
            headers: {
                'Authorization': `Bearer ${AIRTABLE_API_KEY}`,
                'Content-Type': 'application/json'
            }
        };

        // Agregar body si existe
        if (event.body && (event.httpMethod === 'POST' || event.httpMethod === 'PATCH')) {
            console.log('📝 Request body:', event.body);
            fetchOptions.body = event.body;
        }

        // Hacer la petición a Airtable
        console.log('📡 Making request to Airtable...');
        const response = await fetch(url, fetchOptions);
        
        console.log('📨 Airtable response status:', response.status);
        
        // Obtener la respuesta
        const responseText = await response.text();
        console.log('📄 Response text:', responseText.substring(0, 200) + '...');
        
        let responseData;
        try {
            responseData = JSON.parse(responseText);
        } catch (e) {
            console.error('❌ Failed to parse response as JSON');
            responseData = { error: 'Invalid JSON response', raw: responseText };
        }

        // Manejar errores específicos de Airtable
        if (!response.ok) {
            console.error('❌ Airtable error:', response.status, responseData);
            
            // Proporcionar información detallada del error
            return {
                statusCode: response.status,
                headers: {
                    'Access-Control-Allow-Origin': '*',
                    'Access-Control-Allow-Headers': 'Content-Type',
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    error: `Airtable API Error: ${response.status}`,
                    airtableError: responseData,
                    endpoint: endpoint,
                    method: event.httpMethod
                })
            };
        }

        // Logging exitoso con detalles
        if (responseData.records) {
            console.log(`✅ Success - Retrieved ${responseData.records.length} records`);
        } else if (responseData.id) {
            console.log(`✅ Success - Record ID: ${responseData.id}`);
        } else {
            console.log('✅ Success - Response received');
        }

        // Respuesta exitosa
        return {
            statusCode: 200,
            headers: {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Headers': 'Content-Type',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(responseData)
        };

    } catch (error) {
        console.error('❌ Proxy error:', error);
        
        return {
            statusCode: 500,
            headers: {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Headers': 'Content-Type',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                error: 'Internal server error',
                message: error.message,
                endpoint: event.path,
                timestamp: new Date().toISOString()
            })
        };
    }
};