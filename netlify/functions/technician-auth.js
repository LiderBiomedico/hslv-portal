// ===============================================
// netlify/functions/technician-auth.js  (corregido)
//
// La version anterior aceptaba CUALQUIER codigo de 4 digitos:
//   if (code.length !== 4 || !/^\d{4}$/.test(code)) -> rechaza
//   ...y si tenia 4 digitos, entraba. Bastaba el correo de un tecnico
//   y cualquier numero para acceder a la app movil.
// Ahora el codigo se verifica contra el registro del tecnico en Airtable.
// ===============================================

const { signSession, verifyCode, corsHeaders,
        revisarConfiguracion, respuestaConfiguracion } = require('./utils/session');

const BLOQUEO_INTENTOS = Number(process.env.LOGIN_MAX_INTENTOS || 5);
const BLOQUEO_MINUTOS = Number(process.env.LOGIN_BLOQUEO_MINUTOS || 15);

function escaparFormula(valor) {
    return String(valor).replace(/\\/g, '\\\\').replace(/'/g, "\\'");
}

async function airtable(baseId, apiKey, path, options = {}) {
    const respuesta = await fetch(`https://api.airtable.com/v0/${baseId}/${path}`, {
        ...options,
        headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
            ...(options.headers || {})
        }
    });

    if (!respuesta.ok) {
        const detalle = await respuesta.text().catch(() => '');
        throw new Error(`Airtable ${respuesta.status}: ${detalle.slice(0, 300)}`);
    }
    return respuesta.json();
}

exports.handler = async (event) => {
    const headers = corsHeaders(event);

    if (event.httpMethod === 'OPTIONS') {
        return { statusCode: 200, headers, body: '' };
    }
    if (event.httpMethod !== 'POST') {
        return {
            statusCode: 405,
            headers,
            body: JSON.stringify({ success: false, message: 'Method not allowed' })
        };
    }

    const API_KEY = process.env.AIRTABLE_API_KEY;
    const BASE_ID = process.env.AIRTABLE_BASE_ID;

    const problemas = revisarConfiguracion();
    if (problemas.length > 0) {
        return respuestaConfiguracion(problemas, headers, 'technician-auth');
    }

    try {
        const { email, code } = JSON.parse(event.body || '{}');

        if (!email || !code) {
            return {
                statusCode: 400,
                headers,
                body: JSON.stringify({ success: false, message: 'Email y codigo son requeridos' })
            };
        }

        // Mismo mensaje para usuario inexistente y codigo incorrecto
        const credencialInvalida = {
            statusCode: 401,
            headers,
            body: JSON.stringify({ success: false, message: 'Credenciales invalidas' })
        };

        const filtro = encodeURIComponent(`LOWER({email}) = '${escaparFormula(String(email).toLowerCase().trim())}'`);
        const data = await airtable(BASE_ID, API_KEY, `Tecnicos?filterByFormula=${filtro}&maxRecords=1`);
        const tecnico = data.records?.[0];

        if (!tecnico) return credencialInvalida;

        const campos = tecnico.fields || {};

        const bloqueadoHasta = campos.bloqueadoHasta ? new Date(campos.bloqueadoHasta) : null;
        if (bloqueadoHasta && bloqueadoHasta > new Date()) {
            return {
                statusCode: 429,
                headers,
                body: JSON.stringify({ success: false, message: 'Cuenta bloqueada temporalmente' })
            };
        }

        // En esta base el PIN del tecnico vive en el campo 'pin'.
        // Tras la migracion se usa codigoAccesoHash y 'pin' queda vacio.
        const almacenado = campos.codigoAccesoHash || campos.pin || campos.codigoAcceso;

        // Sin codigo configurado no se entra: antes este caso pasaba de largo
        if (!almacenado) {
            console.warn(`Tecnico sin codigo de acceso configurado: ${tecnico.id}`);
            return credencialInvalida;
        }

        if (!verifyCode(code, almacenado)) {
            const fallidos = Number(campos.intentosFallidos || 0) + 1;
            const camposActualizar = { intentosFallidos: fallidos };

            if (fallidos >= BLOQUEO_INTENTOS) {
                camposActualizar.bloqueadoHasta =
                    new Date(Date.now() + BLOQUEO_MINUTOS * 60000).toISOString();
            }

            await airtable(BASE_ID, API_KEY, `Tecnicos/${tecnico.id}`, {
                method: 'PATCH',
                body: JSON.stringify({ fields: camposActualizar })
            }).catch(err => console.warn('No se registro el intento fallido:', err.message));

            return credencialInvalida;
        }

        await airtable(BASE_ID, API_KEY, `Tecnicos/${tecnico.id}`, {
            method: 'PATCH',
            body: JSON.stringify({
                fields: {
                    intentosFallidos: 0,
                    bloqueadoHasta: '',
                    fechaUltimoAcceso: new Date().toISOString()
                }
            })
        }).catch(err => console.warn('No se actualizo el ultimo acceso:', err.message));

        const token = signSession({
            sub: tecnico.id,
            email: campos.email,
            rol: 'tecnico'
        });

        return {
            statusCode: 200,
            headers,
            body: JSON.stringify({
                success: true,
                token,
                user: {
                    id: tecnico.id,
                    nombre: campos.nombre,
                    email: campos.email,
                    area: campos.area,
                    tipo: campos.tipo,
                    estado: campos.estado
                }
            })
        };

    } catch (error) {
        console.error('Auth error:', error);
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({ success: false, message: 'Error interno del servidor' })
        };
    }
};
