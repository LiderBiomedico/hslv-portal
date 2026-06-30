exports.handler = async (event, context) => {
    // 🔐 La clave SOLO debe venir de la variable de entorno de Netlify.
    // Sin fallback incrustado: si falta, la funcion responde 500 en vez de exponer un token.
    const API_KEY = process.env.AIRTABLE_API_KEY;
    const BASE_ID = process.env.AIRTABLE_BASE_ID || 'appFyEBCedQGOeJyV';

    if (!API_KEY) {
        return {
            statusCode: 500,
            headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
            body: JSON.stringify({ error: 'AIRTABLE_API_KEY no configurada en variables de entorno' })
        };
    }
    
    // Extraer la ruta sin el prefijo de la función
    let path = event.path.replace('/.netlify/functions/airtable-proxy/', '');
    
    // Construir la URL base
    let url = `https://api.airtable.com/v0/${BASE_ID}/${path}`;
    
    // CRÍTICO: Agregar TODOS los query parameters
    const queryString = event.rawQuery || '';
    if (queryString) {
        url += `?${queryString}`;
        console.log('Query string:', queryString);
    } else if (event.queryStringParameters) {
        // Fallback si rawQuery no está disponible
        const params = new URLSearchParams(event.queryStringParameters);
        url += `?${params.toString()}`;
    }
    
    console.log('Proxy request to:', url);
    
    try {
        const response = await fetch(url, {
            method: event.httpMethod || 'GET',
            headers: {
                'Authorization': `Bearer ${API_KEY}`,
                'Content-Type': 'application/json'
            },
            body: event.httpMethod !== 'GET' ? event.body : undefined
        });
        
        const data = await response.json();
        
        return {
            statusCode: response.status,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Headers': 'Content-Type',
                'Access-Control-Allow-Methods': 'GET, POST, PATCH, DELETE, OPTIONS'
            },
            body: JSON.stringify(data)
        };
    } catch (error) {
        console.error('Proxy error:', error);
        return {
            statusCode: 500,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            body: JSON.stringify({ error: error.message })
        };
    }
};