// ===============================================
// netlify/functions/auth-login.js
// Login de usuarios del portal. La validacion ocurre SOLO en el servidor:
// el codigo de acceso nunca viaja al navegador.
// Reemplaza a AirtableAPI.validateUserCredentials() del front.
// ===============================================

const { signSession, verifyCode, corsHeaders,
        revisarConfiguracion, respuestaConfiguracion } = require('./utils/session');

const BLOQUEO_INTENTOS = Number(process.env.LOGIN_MAX_INTENTOS || 5);
const BLOQUEO_MINUTOS = Number(process.env.LOGIN_BLOQUEO_MINUTOS || 15);

// Freno best-effort dentro de la misma instancia de la funcion.
// El freno real y persistente es el de Airtable (campos intentosFallidos / bloqueadoHasta).
const intentosMemoria = new Map();

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

    // fetch NO rechaza en 4xx/5xx: hay que revisar el estado antes de leer el cuerpo
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
        return { statusCode: 405, headers, body: JSON.stringify({ error: 'Metodo no permitido' }) };
    }

    const API_KEY = process.env.AIRTABLE_API_KEY;
    const BASE_ID = process.env.AIRTABLE_BASE_ID;

    const problemas = revisarConfiguracion();
    if (problemas.length > 0) {
        return respuestaConfiguracion(problemas, headers, 'auth-login');
    }

    try {
        const { email, codigoAcceso } = JSON.parse(event.body || '{}');

        if (!email || !codigoAcceso) {
            return {
                statusCode: 400,
                headers,
                body: JSON.stringify({ valid: false, error: 'Email y codigo son requeridos' })
            };
        }

        const clave = String(email).toLowerCase().trim();
        const enMemoria = intentosMemoria.get(clave);
        if (enMemoria && enMemoria.hasta > Date.now()) {
            return {
                statusCode: 429,
                headers,
                body: JSON.stringify({ valid: false, error: 'Demasiados intentos. Intente mas tarde.' })
            };
        }

        // Se consulta SOLO el usuario del email indicado (no se descarga la tabla completa)
        const filtro = encodeURIComponent(`LOWER({email}) = '${escaparFormula(clave)}'`);
        const data = await airtable(BASE_ID, API_KEY, `Usuarios?filterByFormula=${filtro}&maxRecords=1`);
        const registro = data.records?.[0];

        // Respuesta identica para usuario inexistente y codigo incorrecto:
        // evita que un atacante enumere que correos existen en el sistema
        const credencialInvalida = {
            statusCode: 401,
            headers,
            body: JSON.stringify({ valid: false, error: 'Credenciales invalidas' })
        };

        if (!registro) return credencialInvalida;

        const campos = registro.fields || {};

        const bloqueadoHasta = campos.bloqueadoHasta ? new Date(campos.bloqueadoHasta) : null;
        if (bloqueadoHasta && bloqueadoHasta > new Date()) {
            return {
                statusCode: 429,
                headers,
                body: JSON.stringify({ valid: false, error: 'Cuenta bloqueada temporalmente' })
            };
        }

        const estadoActivo = ['ACTIVO', 'Activo', 'activo'];
        if (!estadoActivo.includes(campos.estado)) {
            return {
                statusCode: 403,
                headers,
                body: JSON.stringify({ valid: false, error: 'Usuario inactivo' })
            };
        }

        // Prioriza el hash; cae a texto plano solo mientras se completa la migracion
        const almacenado = campos.codigoAccesoHash || campos.codigoAcceso;
        const codigoValido = verifyCode(codigoAcceso, almacenado);

        if (!codigoValido) {
            const fallidos = Number(campos.intentosFallidos || 0) + 1;
            const camposActualizar = { intentosFallidos: fallidos };

            if (fallidos >= BLOQUEO_INTENTOS) {
                camposActualizar.bloqueadoHasta =
                    new Date(Date.now() + BLOQUEO_MINUTOS * 60000).toISOString();
                intentosMemoria.set(clave, { hasta: Date.now() + BLOQUEO_MINUTOS * 60000 });
            }

            // Si los campos de control aun no existen en Airtable, no se interrumpe el login
            await airtable(BASE_ID, API_KEY, `Usuarios/${registro.id}`, {
                method: 'PATCH',
                body: JSON.stringify({ fields: camposActualizar })
            }).catch(err => console.warn('No se registro el intento fallido:', err.message));

            return credencialInvalida;
        }

        // Login correcto: se limpian los contadores
        await airtable(BASE_ID, API_KEY, `Usuarios/${registro.id}`, {
            method: 'PATCH',
            body: JSON.stringify({
                fields: {
                    intentosFallidos: 0,
                    bloqueadoHasta: '',
                    // Campo de tipo date en Usuarios: se envia solo YYYY-MM-DD
                    fechaUltimoAcceso: new Date().toISOString().slice(0, 10)
                }
            })
        }).catch(err => console.warn('No se actualizo el ultimo acceso:', err.message));

        intentosMemoria.delete(clave);

        const token = signSession({
            sub: registro.id,
            email: campos.email,
            rol: campos.rol || 'usuario'
        });

        // El objeto de usuario que se devuelve NO incluye codigoAcceso ni su hash
        return {
            statusCode: 200,
            headers,
            body: JSON.stringify({
                valid: true,
                token,
                user: {
                    id: registro.id,
                    nombreCompleto: campos.nombreCompleto,
                    email: campos.email,
                    servicioHospitalario: campos.servicioHospitalario,
                    cargo: campos.cargo,
                    rol: campos.rol || 'usuario',
                    estado: campos.estado
                }
            })
        };

    } catch (error) {
        console.error('Error en auth-login:', error);
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({ valid: false, error: 'Error interno del servidor' })
        };
    }
};
