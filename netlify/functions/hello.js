// 🧪 Función de test súper básica
// netlify/functions/hello.js

exports.handler = async (event, context) => {
    console.log('🎉 Función hello ejecutándose!');
    
    const headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Content-Type': 'application/json'
    };

    // Manejar preflight OPTIONS
    if (event.httpMethod === 'OPTIONS') {
        return {
            statusCode: 200,
            headers,
            body: ''
        };
    }

    try {
        const response = {
            success: true,
            message: '🎉 ¡Función Netlify funcionando correctamente!',
            timestamp: new Date().toISOString(),
            method: event.httpMethod,
            path: event.path,
            environment: {
                nodeVersion: process.version,
                platform: process.platform,
                hasAirtableKey: !!process.env.AIRTABLE_API_KEY,
                hasAirtableBase: !!process.env.AIRTABLE_BASE_ID
            },
            netlifyInfo: {
                functionName: context.functionName,
                functionVersion: context.functionVersion,
                region: process.env.AWS_REGION || 'unknown'
            }
        };

        console.log('✅ Respuesta preparada:', JSON.stringify(response, null, 2));

        return {
            statusCode: 200,
            headers,
            body: JSON.stringify(response, null, 2)
        };

    } catch (error) {
        console.error('❌ Error en función hello:', error);

        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({
                success: false,
                error: 'Error interno',
                message: error.message,
                timestamp: new Date().toISOString()
            }, null, 2)
        };
    }
};