// ===============================================
// netlify/functions/airtable-proxy.js  (version endurecida)
//
// El proxy anterior reenviaba CUALQUIER ruta y CUALQUIER metodo a Airtable
// usando la API key del servidor, sin autenticacion. Eso permitia a cualquiera
// leer la tabla Usuarios (con los codigos de acceso) o borrar registros.
//
// Ahora: lista blanca de tablas y metodos, sesion obligatoria salvo el
// formulario publico, y depuracion de campos sensibles en la respuesta.
// ===============================================

const { getSession, corsHeaders } = require('./utils/session');

// Que se puede hacer contra cada tabla, y quien puede hacerlo.
// 'publico' = sin sesion | 'usuario' = sesion valida | 'admin' = sesion con rol admin
const REGLAS = {
    Solicitudes:        { GET: 'usuario', POST: 'usuario', PATCH: 'usuario' },
    Tecnicos:           { GET: 'usuario' },
    SolicitudesAcceso:  { POST: 'publico', GET: 'admin', PATCH: 'admin' }
    // Usuarios NO aparece aqui a proposito: se gestiona solo por user-management.js
};

// Campos que nunca deben salir hacia el navegador, aparezcan en la tabla que aparezcan
const CAMPOS_PROHIBIDOS = new Set([
    'codigoAcceso',
    'codigoAccesoHash',
    'password',
    'apiKey',
    'token',
    'intentosFallidos',
    'bloqueadoHasta'
]);

function depurar(payload) {
    if (Array.isArray(payload)) return payload.map(depurar);
    if (payload && typeof payload === 'object') {
        const limpio = {};
        for (const [clave, valor] of Object.entries(payload)) {
            if (CAMPOS_PROHIBIDOS.has(clave)) continue;
            limpio[clave] = depurar(valor);
        }
        return limpio;
    }
    return payload;
}

function nivelDeAcceso(event) {
    const sesion = getSession(event);
    if (!sesion) return 'publico';
    return sesion.rol === 'admin' ? 'admin' : 'usuario';
}

const JERARQUIA = { publico: 0, usuario: 1, admin: 2 };

exports.handler = async (event) => {
    const headers = corsHeaders(event);

    if (event.httpMethod === 'OPTIONS') {
        return { statusCode: 200, headers, body: '' };
    }

    const API_KEY = process.env.AIRTABLE_API_KEY;
    const BASE_ID = process.env.AIRTABLE_BASE_ID;

    if (!API_KEY || !BASE_ID) {
        console.error('AIRTABLE_API_KEY o AIRTABLE_BASE_ID no configuradas');
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({ error: 'Servicio no configurado' })
        };
    }

    // Ruta solicitada, sin el prefijo de la funcion
    const rutaCompleta = event.path.replace('/.netlify/functions/airtable-proxy/', '');
    const metodo = (event.httpMethod || 'GET').toUpperCase();
    const tabla = decodeURIComponent(rutaCompleta.split('?')[0].split('/')[0] || '');

    // Bloquea intentos de salir de la ruta permitida (../, rutas absolutas, meta endpoints)
    if (!tabla || rutaCompleta.includes('..') || tabla.startsWith('meta')) {
        return {
            statusCode: 400,
            headers,
            body: JSON.stringify({ error: 'Ruta no valida' })
        };
    }

    const reglasTabla = REGLAS[tabla];
    if (!reglasTabla) {
        console.warn(`Acceso rechazado a tabla no permitida: ${tabla}`);
        return {
            statusCode: 403,
            headers,
            body: JSON.stringify({ error: 'Tabla no disponible por este canal' })
        };
    }

    const requerido = reglasTabla[metodo];
    if (!requerido) {
        return {
            statusCode: 405,
            headers,
            body: JSON.stringify({ error: `Metodo ${metodo} no permitido sobre ${tabla}` })
        };
    }

    const nivel = nivelDeAcceso(event);
    if (JERARQUIA[nivel] < JERARQUIA[requerido]) {
        return {
            statusCode: nivel === 'publico' ? 401 : 403,
            headers,
            body: JSON.stringify({ error: 'No autorizado para esta operacion' })
        };
    }

    // Reconstruccion de la URL destino
    let url = `https://api.airtable.com/v0/${BASE_ID}/${rutaCompleta}`;
    const queryString = event.rawQuery || '';
    if (queryString) {
        url += `?${queryString}`;
    } else if (event.queryStringParameters) {
        url += `?${new URLSearchParams(event.queryStringParameters).toString()}`;
    }

    try {
        // Ningun cliente puede escribir campos sensibles aunque los mande en el cuerpo
        let cuerpo;
        if (metodo !== 'GET' && event.body) {
            const original = JSON.parse(event.body);
            cuerpo = JSON.stringify(depurar(original));
        }

        const respuesta = await fetch(url, {
            method: metodo,
            headers: {
                'Authorization': `Bearer ${API_KEY}`,
                'Content-Type': 'application/json'
            },
            body: cuerpo
        });

        const texto = await respuesta.text();
        let data;
        try {
            data = texto ? JSON.parse(texto) : {};
        } catch {
            data = { raw: texto.slice(0, 500) };
        }

        // fetch resuelve igual con 4xx/5xx: el estado se propaga explicitamente
        if (!respuesta.ok) {
            console.error(`Airtable respondio ${respuesta.status} para ${tabla}`);
            return {
                statusCode: respuesta.status,
                headers,
                body: JSON.stringify({
                    error: data?.error?.message || 'Error de Airtable',
                    status: respuesta.status
                })
            };
        }

        return {
            statusCode: 200,
            headers,
            body: JSON.stringify(depurar(data))
        };

    } catch (error) {
        console.error('Error en proxy:', error.message);
        return {
            statusCode: 500,
            headers,
            // No se devuelve error.message al cliente: puede filtrar la URL interna
            body: JSON.stringify({ error: 'Error procesando la solicitud' })
        };
    }
};
