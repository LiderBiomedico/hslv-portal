// Sesión de administrador sin estado (stateless): un token firmado con HMAC
// viaja en una cookie HttpOnly. No se guarda nada en el servidor, así que no
// hace falta una base de datos de sesiones — basta con volver a calcular la
// firma y comprobar la fecha de expiración en cada request.
//
// Requiere la variable de entorno SESSION_SECRET (una cadena aleatoria larga,
// configurada manualmente en Netlify — nunca generada ni impresa por este código).

const crypto = require('crypto');

const SESSION_COOKIE_NAME = 'admin_session';
const SESSION_TTL_MS = 15 * 60 * 1000; // 15 minutos: vencimiento corto a propósito

function getSecret() {
    const secret = process.env.SESSION_SECRET;
    if (!secret) {
        throw new Error('SESSION_SECRET no configurada en variables de entorno');
    }
    return secret;
}

function sign(payload) {
    return crypto.createHmac('sha256', getSecret()).update(payload).digest('base64url');
}

function createSessionCookie() {
    const exp = Date.now() + SESSION_TTL_MS;
    const payload = Buffer.from(JSON.stringify({ exp })).toString('base64url');
    const signature = sign(payload);
    const token = `${payload}.${signature}`;
    const maxAgeSeconds = Math.floor(SESSION_TTL_MS / 1000);

    return `${SESSION_COOKIE_NAME}=${token}; HttpOnly; Secure; SameSite=Strict; Max-Age=${maxAgeSeconds}; Path=/`;
}

function parseCookies(cookieHeader) {
    const cookies = {};
    if (!cookieHeader) return cookies;
    cookieHeader.split(';').forEach((pair) => {
        const idx = pair.indexOf('=');
        if (idx === -1) return;
        const key = pair.slice(0, idx).trim();
        const value = pair.slice(idx + 1).trim();
        cookies[key] = value;
    });
    return cookies;
}

function isValidSession(event) {
    try {
        const cookieHeader = event.headers && (event.headers.cookie || event.headers.Cookie);
        const cookies = parseCookies(cookieHeader);
        const token = cookies[SESSION_COOKIE_NAME];
        if (!token) return false;

        const dotIndex = token.lastIndexOf('.');
        if (dotIndex === -1) return false;
        const payload = token.slice(0, dotIndex);
        const signature = token.slice(dotIndex + 1);
        if (!payload || !signature) return false;

        const expectedSignature = sign(payload);
        const sigBuf = Buffer.from(signature);
        const expectedBuf = Buffer.from(expectedSignature);
        if (sigBuf.length !== expectedBuf.length || !crypto.timingSafeEqual(sigBuf, expectedBuf)) {
            return false;
        }

        const data = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'));
        if (!data.exp || Date.now() > data.exp) return false;

        return true;
    } catch (error) {
        return false;
    }
}

// Sesión deslizante: si la request trae una sesión válida, devuelve una cookie
// nueva con la ventana de expiración reiniciada (misma TTL de 15 min). Devuelve
// null cuando no hay sesión válida, para no renovar cookies inexistentes ni
// revivir sesiones ya caducadas (así se conserva el cierre por inactividad).
function maybeRefreshSessionCookie(event) {
    try {
        return isValidSession(event) ? createSessionCookie() : null;
    } catch (error) {
        return null;
    }
}

function unauthorizedResponse() {
    return {
        statusCode: 401,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ success: false, message: 'No autorizado' })
    };
}

module.exports = {
    SESSION_COOKIE_NAME,
    SESSION_TTL_MS,
    createSessionCookie,
    isValidSession,
    maybeRefreshSessionCookie,
    unauthorizedResponse
};
