// 🧪 Función de test para verificar configuración
// netlify/functions/test-config.js

exports.handler = async (event, context) => {
    console.log('🧪 === TEST CONFIG FUNCTION ===');
    
    // Headers de respuesta
    const headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Content-Type': 'application/json'
    };

    // Manejar preflight
    if (event.httpMethod === 'OPTIONS') {
        return {
            statusCode: 200,
            headers,
            body: JSON.stringify({ message: 'CORS OK' })
        };
    }

    try {
        // Verificar variables de entorno
        const AIRTABLE_API_KEY = process.env.AIRTABLE_API_KEY;
        const AIRTABLE_BASE_ID = process.env.AIRTABLE_BASE_ID;

        console.log('🔍 Verificando variables...');
        console.log('API Key:', AIRTABLE_API_KEY ? `Presente (${AIRTABLE_API_KEY.substring(0, 10)}...)` : 'FALTANTE');
        console.log('Base ID:', AIRTABLE_BASE_ID ? `Presente (${AIRTABLE_BASE_ID})` : 'FALTANTE');

        const resultado = {
            success: true,
            timestamp: new Date().toISOString(),
            environment: {
                hasApiKey: !!AIRTABLE_API_KEY,
                hasBaseId: !!AIRTABLE_BASE_ID,
                apiKeyPreview: AIRTABLE_API_KEY ? AIRTABLE_API_KEY.substring(0, 10) + '...' : 'NO CONFIGURADA',
                baseId: AIRTABLE_BASE_ID || 'NO CONFIGURADA'
            },
            netlify: {
                region: process.env.AWS_REGION || 'unknown',
                functionName: context.functionName,
                requestId: context.awsRequestId
            },
            request: {
                method: event.httpMethod,
                path: event.path,
                headers: event.headers
            }
        };

        console.log('✅ Test completado exitosamente');

        return {
            statusCode: 200,
            headers,
            body: JSON.stringify(resultado, null, 2)
        };

    } catch (error) {
        console.error('❌ Error en test:', error);

        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({
                success: false,
                error: error.message,
                stack: error.stack,
                timestamp: new Date().toISOString()
            }, null, 2)
        };
    }
};