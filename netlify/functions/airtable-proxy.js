const { isValidSession, unauthorizedResponse } = require('./utils/session');

// Este proxy es genérico (reenvía cualquier tabla/método a Airtable) y lo usan
// tanto el portal público de solicitudes como el portal de gestión, así que la
// protección se decide por tabla+método, no de forma global:
//   - Público (sin sesión): GET de cualquier tabla, POST a Solicitudes y
//     SolicitudesAcceso (crear una solicitud o pedir acceso).
//   - SolicitudesAcceso además recibe un PATCH público justo después de
//     crearse, para completar campos opcionales (telefono, servicioHospitalario,
//     cargo, justificacion) — ver airtable-config.js#createSolicitudAccesoMinimal.
//     Ese PATCH nunca toca "estado"; solo la aprobación administrativa lo hace.
//   - Administrativo (requiere sesión): crear/editar Usuarios o Tecnicos,
//     cambiar el estado de una Solicitud, aprobar una SolicitudAcceso
//     (PATCH con "estado" en el body), y cualquier DELETE.
function requiereSesionAdmin(tableName, method, bodyFields) {
    const table = (tableName || '').split('/')[0];

    if (method === 'DELETE') return true;

    if (table === 'Usuarios' || table === 'Tecnicos') {
        return method === 'POST' || method === 'PATCH';
    }

    if (table === 'Solicitudes' && method === 'PATCH') {
        return true;
    }

    if (table === 'SolicitudesAcceso' && method === 'PATCH') {
        return Boolean(bodyFields && Object.prototype.hasOwnProperty.call(bodyFields, 'estado'));
    }

    return false;
}

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

    const method = event.httpMethod || 'GET';
    let bodyFields = null;
    if (event.body) {
        try {
            const parsedBody = JSON.parse(event.body);
            bodyFields = parsedBody && parsedBody.fields;
        } catch (parseError) {
            // Cuerpo no-JSON: se deja pasar, Airtable devolverá su propio error de formato.
        }
    }

    if (requiereSesionAdmin(path, method, bodyFields) && !isValidSession(event)) {
        return unauthorizedResponse();
    }

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

        // Airtable returns JSON for both success and error responses, so we deliberately
        // forward the error payload with Airtable's real status code instead of throwing.
        // A gateway failure upstream can still return an HTML/plain-text body on error,
        // so that path is parsed defensively instead of crashing on JSON.parse.
        if (!response.ok) {
            let errorData;
            try {
                errorData = await response.json();
            } catch (parseError) {
                errorData = { error: `Respuesta no válida de Airtable (status ${response.status})` };
            }
            return {
                statusCode: response.status,
                headers: {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*',
                    'Access-Control-Allow-Headers': 'Content-Type',
                    'Access-Control-Allow-Methods': 'GET, POST, PATCH, DELETE, OPTIONS'
                },
                body: JSON.stringify(errorData)
            };
        }

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

// Exportado aparte solo para poder probar la regla de acceso de forma aislada.
exports.requiereSesionAdmin = requiereSesionAdmin;