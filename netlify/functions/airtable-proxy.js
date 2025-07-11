// 🛡️ Netlify Function - Proxy Seguro para Airtable
// Hospital Susana López de Valencia

const fetch = require('node-fetch');

// 🔐 Configuración segura desde variables de entorno
const AIRTABLE_BASE_ID = process.env.AIRTABLE_BASE_ID;
const AIRTABLE_API_KEY = process.env.AIRTABLE_API_KEY;

// 🔒 Dominios autorizados (opcional para mayor seguridad)
const ALLOWED_ORIGINS = [
    'https://hslvgestiondesolicitudes.com',
    'https://www.hslvgestiondesolicitudes.com',
    'http://localhost:3000',
    'http://127.0.0.1:5500'
];

// 📋 Mapeo de tablas autorizadas
const ALLOWED_TABLES = {
    'solicitudes': 'Solicitudes',
    'tecnicos': 'Tecnicos',
    'usuarios': 'Usuarios',
    'solicitudesAcceso': 'SolicitudesAcceso'
};

exports.handler = async (event, context) => {
    // 🔍 Log de la request para debugging
    console.log('📡 Airtable Proxy Request:', {
        method: event.httpMethod,
        path: event.path,
        origin: event.headers.origin
    });

    // 🛡️ Verificar método HTTP
    if (!['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS'].includes(event.httpMethod)) {
        return {
            statusCode: 405,
            headers: getCORSHeaders(event.headers.origin),
            body: JSON.stringify({ error: 'Método no permitido' })
        };
    }

    // 🌐 Manejar preflight requests
    if (event.httpMethod === 'OPTIONS') {
        return {
            statusCode: 200,
            headers: getCORSHeaders(event.headers.origin),
            body: ''
        };
    }

    // 🔐 Verificar credenciales de Airtable
    if (!AIRTABLE_BASE_ID || !AIRTABLE_API_KEY) {
        console.error('❌ Credenciales de Airtable no configuradas');
        return {
            statusCode: 500,
            headers: getCORSHeaders(event.headers.origin),
            body: JSON.stringify({ 
                error: 'Configuración del servidor incompleta',
                details: 'Variables de entorno de Airtable no configuradas'
            })
        };
    }

    // 🔍 Parsear la ruta de la API
    const pathParts = event.path.replace('/api/airtable/', '').split('/');
    const tableName = pathParts[0];
    const recordId = pathParts[1];

    // 🛡️ Verificar tabla autorizada
    if (!ALLOWED_TABLES[tableName]) {
        return {
            statusCode: 403,
            headers: getCORSHeaders(event.headers.origin),
            body: JSON.stringify({ 
                error: 'Tabla no autorizada',
                allowedTables: Object.keys(ALLOWED_TABLES)
            })
        };
    }

    const actualTableName = ALLOWED_TABLES[tableName];

    try {
        // 🔗 Construir URL de Airtable
        let airtableUrl = `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${actualTableName}`;
        
        if (recordId) {
            airtableUrl += `/${recordId}`;
        }

        // 📋 Agregar query parameters si existen
        if (event.queryStringParameters) {
            const queryString = new URLSearchParams(event.queryStringParameters).toString();
            if (queryString) {
                airtableUrl += `?${queryString}`;
            }
        }

        // 🛠️ Configurar options para fetch
        const fetchOptions = {
            method: event.httpMethod,
            headers: {
                'Authorization': `Bearer ${AIRTABLE_API_KEY}`,
                'Content-Type': 'application/json'
            }
        };

        // 📤 Agregar body para requests POST/PATCH
        if (event.body && ['POST', 'PATCH', 'PUT'].includes(event.httpMethod)) {
            fetchOptions.body = event.body;
        }

        console.log('🔗 Airtable Request:', {
            url: airtableUrl,
            method: event.httpMethod,
            hasBody: !!event.body
        });

        // 📡 Hacer request a Airtable
        const response = await fetch(airtableUrl, fetchOptions);
        
        // 📊 Log de la respuesta
        console.log('📥 Airtable Response:', {
            status: response.status,
            statusText: response.statusText
        });

        // 🔄 Obtener respuesta
        const responseData = await response.text();
        
        // 📋 Preparar respuesta
        const result = {
            statusCode: response.status,
            headers: {
                ...getCORSHeaders(event.headers.origin),
                'Content-Type': 'application/json'
            },
            body: responseData
        };

        // ✅ Log de éxito
        if (response.ok) {
            console.log('✅ Request exitoso a Airtable');
        } else {
            console.error('❌ Error en Airtable:', {
                status: response.status,
                data: responseData
            });
        }

        return result;

    } catch (error) {
        console.error('❌ Error en proxy de Airtable:', error);
        
        return {
            statusCode: 500,
            headers: getCORSHeaders(event.headers.origin),
            body: JSON.stringify({
                error: 'Error interno del servidor',
                message: error.message,
                timestamp: new Date().toISOString()
            })
        };
    }
};

// 🌐 Función para obtener headers de CORS
function getCORSHeaders(origin) {
    // 🔍 Verificar si el origen está en la lista permitida
    const isAllowedOrigin = ALLOWED_ORIGINS.includes(origin) || 
                          origin?.includes('localhost') || 
                          origin?.includes('127.0.0.1');

    return {
        'Access-Control-Allow-Origin': isAllowedOrigin ? origin : ALLOWED_ORIGINS[0],
        'Access-Control-Allow-Headers': 'Content-Type, Authorization, Accept',
        'Access-Control-Allow-Methods': 'GET, POST, PATCH, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Credentials': 'false',
        'Vary': 'Origin'
    };
}

// 🧪 Función de utilidad para testear la conexión
exports.testConnection = async () => {
    try {
        const response = await fetch(`https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/Solicitudes?maxRecords=1`, {
            headers: {
                'Authorization': `Bearer ${AIRTABLE_API_KEY}`,
                'Content-Type': 'application/json'
            }
        });

        return {
            success: response.ok,
            status: response.status,
            timestamp: new Date().toISOString()
        };
    } catch (error) {
        return {
            success: false,
            error: error.message,
            timestamp: new Date().toISOString()
        };
    }
};