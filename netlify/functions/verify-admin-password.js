const crypto = require('crypto');
const { checkAndRecordAttempt, resetAttempts } = require('./utils/rateLimiter');
const { createSessionCookie } = require('./utils/session');

// Comparación en tiempo constante para no filtrar información por temporización.
// No es perfecta (JS no garantiza tiempos constantes a bajo nivel), pero evita
// la fuga más obvia: un early-return en cuanto difiere el primer carácter.
function timingSafeStringCompare(a, b) {
    const bufA = Buffer.from(String(a));
    const bufB = Buffer.from(String(b));
    if (bufA.length !== bufB.length) {
        return false;
    }
    return crypto.timingSafeEqual(bufA, bufB);
}

exports.handler = async (event, context) => {
    if (event.httpMethod !== 'POST') {
        return {
            statusCode: 405,
            body: JSON.stringify({ success: false, message: 'Method not allowed' })
        };
    }

    // Rate limiting por IP. Si el almacén de Netlify Blobs no está disponible
    // (p. ej. en un entorno local sin `netlify dev`), se deja pasar el intento
    // en vez de bloquear el acceso por completo (fail-open): la contraseña y
    // la sesión siguen siendo la barrera real de todos modos.
    let rateLimit = { allowed: true };
    try {
        rateLimit = await checkAndRecordAttempt(event);
    } catch (error) {
        console.error('Rate limiter no disponible, se permite el intento (fail-open):', error.message);
    }

    if (!rateLimit.allowed) {
        return {
            statusCode: 429,
            headers: {
                'Content-Type': 'application/json',
                'Retry-After': String(rateLimit.retryAfterSeconds)
            },
            body: JSON.stringify({ success: false, message: 'Demasiados intentos. Intente más tarde.' })
        };
    }

    try {
        const { password } = JSON.parse(event.body);

        if (!password) {
            return {
                statusCode: 400,
                body: JSON.stringify({ success: false, message: 'Contraseña requerida' })
            };
        }

        const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;

        if (!ADMIN_PASSWORD) {
            // No exponer el motivo exacto al cliente; solo queda en los logs del servidor.
            console.error('ADMIN_PASSWORD no configurada en variables de entorno de Netlify');
            return {
                statusCode: 500,
                body: JSON.stringify({ success: false, message: 'Servicio de verificación no disponible' })
            };
        }

        const valid = timingSafeStringCompare(password, ADMIN_PASSWORD);

        if (!valid) {
            return {
                statusCode: 200,
                body: JSON.stringify({ success: false })
            };
        }

        // Contraseña correcta: no seguir contando intentos fallidos de esta IP.
        try {
            await resetAttempts(event);
        } catch (error) {
            console.error('No se pudo reiniciar el contador de intentos:', error.message);
        }

        let sessionCookie;
        try {
            sessionCookie = createSessionCookie();
        } catch (error) {
            console.error('SESSION_SECRET no configurada en variables de entorno de Netlify:', error.message);
            return {
                statusCode: 500,
                body: JSON.stringify({ success: false, message: 'Servicio de verificación no disponible' })
            };
        }

        return {
            statusCode: 200,
            headers: {
                'Content-Type': 'application/json',
                'Set-Cookie': sessionCookie
            },
            body: JSON.stringify({ success: true })
        };

    } catch (error) {
        console.error('Verify admin password error:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({ success: false, message: 'Error interno del servidor' })
        };
    }
};
