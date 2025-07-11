const AIRTABLE_BASE_ID = process.env.AIRTABLE_BASE_ID;
const AIRTABLE_API_KEY = process.env.AIRTABLE_API_KEY;

const ALLOWED_TABLES = {
    'Solicitudes': 'Solicitudes',
    'Tecnicos': 'Tecnicos',
    'Usuarios': 'Usuarios',
    'SolicitudesAcceso': 'SolicitudesAcceso'
};

exports.handler = async (event, context) => {
    console.log('📡 Proxy request:', event.httpMethod, event.path);

    if (event.httpMethod === 'OPTIONS') {
        return {
            statusCode: 200,
            headers: {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Headers': 'Content-Type, Authorization, Accept',
                'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS'
            },
            body: ''
        };
    }

    if (!AIRTABLE_BASE_ID || !AIRTABLE_API_KEY) {
        return {
            statusCode: 500,
            headers: { 'Access-Control-Allow-Origin': '*' },
            body: JSON.stringify({ 
                error: 'Variables de entorno no configuradas',
                missing: !AIRTABLE_BASE_ID ? 'AIRTABLE_BASE_ID' : 'AIRTABLE_API_KEY'
            })
        };
    }

    try {
        const pathParts = event.path.replace('/.netlify/functions/airtable-proxy/', '').split('/');
        const tableName = pathParts[0];
        const recordId = pathParts[1];

        if (!ALLOWED_TABLES[tableName]) {
            return {
                statusCode: 403,
                headers: { 'Access-Control-Allow-Origin': '*' },
                body: JSON.stringify({ error: 'Tabla no autorizada', tabla: tableName })
            };
        }

        let airtableUrl = `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${tableName}`;
        if (recordId) airtableUrl += `/${recordId}`;
        if (event.queryStringParameters) {
            const queryString = new URLSearchParams(event.queryStringParameters).toString();
            if (queryString) airtableUrl += `?${queryString}`;
        }

        const fetchOptions = {
            method: event.httpMethod,
            headers: {
                'Authorization': `Bearer ${AIRTABLE_API_KEY}`,
                'Content-Type': 'application/json'
            }
        };

        if (event.body && ['POST', 'PATCH', 'PUT'].includes(event.httpMethod)) {
            fetchOptions.body = event.body;
        }

        const response = await fetch(airtableUrl, fetchOptions);
        const responseData = await response.text();

        return {
            statusCode: response.status,
            headers: {
                'Access-Control-Allow-Origin': '*',
                'Content-Type': 'application/json'
            },
            body: responseData
        };

    } catch (error) {
        console.error('❌ Error:', error);
        return {
            statusCode: 500,
            headers: { 'Access-Control-Allow-Origin': '*' },
            body: JSON.stringify({ error: error.message })
        };
    }
};