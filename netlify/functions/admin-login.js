// ===============================================
// netlify/functions/admin-login.js
//
// Entrada al panel de gestion (portal-gestion.html).
// La contrasena vive en la variable de entorno de Netlify, nunca en el HTML.
// Devuelve un token de sesion con rol 'admin', que es lo que exigen
// user-management.js y el proxy para las operaciones administrativas.
// ===============================================

const { signSession, safeEqual, verifyCode, corsHeaders,
        revisarConfiguracion, respuestaConfiguracion } = require('./utils/session');

const MAX_INTENTOS = Number(process.env.ADMIN_MAX_INTENTOS || 5);
const BLOQUEO_MINUTOS = Number(process.env.ADMIN_BLOQUEO_MINUTOS || 15);

// Freno por IP dentro de la instancia. Serverless reinicia instancias, asi que
// esto frena el ataque rapido, no uno lento y distribuido.
const intentos = new Map();

function limpiarAntiguos() {
    const ahora = Date.now();
    for (const [ip, dato] of intentos) {
        if (dato.hasta < ahora && dato.ultimo < ahora - 3600000) intentos.delete(ip);
    }
}

exports.handler = async (event) => {
    const headers = corsHeaders(event);

    if (event.httpMethod === 'OPTIONS') {
        return { statusCode: 200, headers, body: '' };
    }
    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, headers, body: JSON.stringify({ error: 'Metodo no permitido' }) };
    }

    // Se acepta la contrasena hasheada (preferido) o en claro
    const ADMIN_HASH = process.env.ADMIN_PASSWORD_HASH;
    const ADMIN_PLANO = process.env.ADMIN_PASSWORD;

    // Se valida TODO antes de empezar: longitud del secreto incluida.
    // Antes solo se comprobaba que SESSION_SECRET existiera, y una clave
    // demasiado corta reventaba mas adelante como un 500 sin explicacion.
    const problemas = revisarConfiguracion({ requiereAdmin: true, requiereAirtable: false });
    if (problemas.length > 0) {
        return respuestaConfiguracion(problemas, headers, 'admin-login');
    }

    const ip = event.headers?.['x-nf-client-connection-ip']
        || event.headers?.['client-ip']
        || 'desconocida';

    limpiarAntiguos();

    const registro = intentos.get(ip);
    if (registro && registro.hasta > Date.now()) {
        const minutos = Math.ceil((registro.hasta - Date.now()) / 60000);
        return {
            statusCode: 429,
            headers,
            body: JSON.stringify({ error: `Demasiados intentos. Espere ${minutos} min.` })
        };
    }

    try {
        const { password } = JSON.parse(event.body || '{}');

        if (!password) {
            return {
                statusCode: 400,
                headers,
                body: JSON.stringify({ error: 'Contrasena requerida' })
            };
        }

        const correcta = ADMIN_HASH
            ? verifyCode(password, ADMIN_HASH)          // scrypt
            : safeEqual(password, ADMIN_PLANO);         // comparacion en tiempo constante

        if (!correcta) {
            const fallidos = (registro?.fallidos || 0) + 1;
            const nuevo = { fallidos, ultimo: Date.now(), hasta: 0 };

            if (fallidos >= MAX_INTENTOS) {
                nuevo.hasta = Date.now() + BLOQUEO_MINUTOS * 60000;
                nuevo.fallidos = 0;
            }
            intentos.set(ip, nuevo);

            console.warn(`Intento fallido de acceso al panel desde ${ip} (${fallidos})`);

            // Retardo fijo: encarece el ataque por fuerza bruta
            await new Promise(r => setTimeout(r, 600));

            return {
                statusCode: 401,
                headers,
                body: JSON.stringify({ error: 'Contrasena incorrecta' })
            };
        }

        intentos.delete(ip);
        console.log(`Acceso al panel de gestion concedido desde ${ip}`);

        const token = signSession({
            sub: 'panel-gestion',
            rol: 'admin'
        });

        return {
            statusCode: 200,
            headers,
            body: JSON.stringify({ success: true, token })
        };

    } catch (error) {
        console.error('Error en admin-login:', error);
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({ error: 'Error interno del servidor' })
        };
    }
};
