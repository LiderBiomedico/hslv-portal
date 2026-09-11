// ===============================================
// netlify/functions/utils/session.js
// Utilidades de sesion y verificacion de codigos de acceso.
// Sin dependencias externas: solo el modulo crypto de Node.
// ===============================================

const crypto = require('crypto');

const SESSION_TTL_SECONDS = Number(process.env.SESSION_TTL_SECONDS || 8 * 60 * 60); // 8 h

const LONGITUD_MINIMA_SECRETO = 32;

function getSecret() {
    const secret = process.env.SESSION_SECRET;
    if (!secret || secret.length < LONGITUD_MINIMA_SECRETO) {
        throw new Error('SESSION_SECRET no configurada (minimo 32 caracteres)');
    }
    return secret;
}

// Revisa la configuracion ANTES de usarla y devuelve los problemas concretos.
// Asi el fallo se ve en los registros de Netlify en vez de aparecer como un
// 500 generico a mitad del proceso de login.
function revisarConfiguracion({ requiereAdmin = false, requiereAirtable = true } = {}) {
    const problemas = [];
    const secreto = process.env.SESSION_SECRET;

    if (!secreto) {
        problemas.push('SESSION_SECRET no esta definida');
    } else if (secreto.length < LONGITUD_MINIMA_SECRETO) {
        problemas.push(
            `SESSION_SECRET tiene ${secreto.length} caracteres; se requieren al menos ` +
            `${LONGITUD_MINIMA_SECRETO}. Genere una con: ` +
            `node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"`
        );
    }

    if (requiereAirtable) {
        if (!process.env.AIRTABLE_API_KEY) problemas.push('AIRTABLE_API_KEY no esta definida');
        if (!process.env.AIRTABLE_BASE_ID) problemas.push('AIRTABLE_BASE_ID no esta definida');
    }

    if (requiereAdmin && !process.env.ADMIN_PASSWORD_HASH && !process.env.ADMIN_PASSWORD) {
        problemas.push('Falta ADMIN_PASSWORD_HASH (o ADMIN_PASSWORD)');
    }

    return problemas;
}

// Respuesta unica para configuracion incompleta: 503, no 500.
// 503 dice "el servicio no esta listo", que es lo que realmente pasa.
function respuestaConfiguracion(problemas, headers, etiqueta) {
    console.error(`[${etiqueta}] Configuracion incompleta:`);
    problemas.forEach(p => console.error(`  - ${p}`));

    return {
        statusCode: 503,
        headers,
        body: JSON.stringify({
            error: 'El servicio no esta configurado. Revise las variables de entorno en Netlify.',
            codigo: 'CONFIGURACION_INCOMPLETA'
        })
    };
}

function base64url(input) {
    return Buffer.from(input).toString('base64')
        .replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function fromBase64url(input) {
    const pad = input.length % 4 === 0 ? '' : '='.repeat(4 - (input.length % 4));
    return Buffer.from(input.replace(/-/g, '+').replace(/_/g, '/') + pad, 'base64').toString();
}

function hmac(data) {
    return crypto.createHmac('sha256', getSecret()).update(data).digest('base64')
        .replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

// Comparacion en tiempo constante: evita filtrar informacion por el tiempo de respuesta
function safeEqual(a, b) {
    const bufA = Buffer.from(String(a));
    const bufB = Buffer.from(String(b));
    if (bufA.length !== bufB.length) {
        // se compara igualmente contra si mismo para no acortar el tiempo
        crypto.timingSafeEqual(bufA, bufA);
        return false;
    }
    return crypto.timingSafeEqual(bufA, bufB);
}

// ---------- Tokens de sesion (HMAC-SHA256, formato tipo JWT) ----------

function signSession(payload) {
    const body = {
        ...payload,
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + SESSION_TTL_SECONDS
    };
    const encoded = base64url(JSON.stringify(body));
    return `${encoded}.${hmac(encoded)}`;
}

function verifySession(token) {
    if (!token || typeof token !== 'string' || !token.includes('.')) return null;
    const [encoded, firma] = token.split('.');
    if (!encoded || !firma) return null;
    if (!safeEqual(firma, hmac(encoded))) return null;

    let payload;
    try {
        payload = JSON.parse(fromBase64url(encoded));
    } catch {
        return null;
    }
    if (!payload.exp || payload.exp < Math.floor(Date.now() / 1000)) return null;
    return payload;
}

// Extrae y valida la sesion de la cabecera Authorization: Bearer <token>
function getSession(event) {
    const auth = event.headers?.authorization || event.headers?.Authorization || '';
    if (!auth.startsWith('Bearer ')) return null;
    return verifySession(auth.slice(7).trim());
}

// Devuelve null si hay sesion valida; si no, devuelve la respuesta HTTP de rechazo
function requireSession(event, headers, { rol } = {}) {
    const sesion = getSession(event);
    if (!sesion) {
        return {
            error: {
                statusCode: 401,
                headers,
                body: JSON.stringify({ error: 'Sesion requerida o expirada' })
            }
        };
    }
    if (rol && sesion.rol !== rol) {
        return {
            error: {
                statusCode: 403,
                headers,
                body: JSON.stringify({ error: 'Permisos insuficientes' })
            }
        };
    }
    return { sesion };
}

// ---------- Codigos de acceso ----------

// Formato almacenado: scrypt$<saltHex>$<hashHex>
function hashCode(code) {
    const salt = crypto.randomBytes(16);
    const hash = crypto.scryptSync(String(code), salt, 32);
    return `scrypt$${salt.toString('hex')}$${hash.toString('hex')}`;
}

function verifyCode(code, stored) {
    if (!stored) return false;
    if (String(stored).startsWith('scrypt$')) {
        const [, saltHex, hashHex] = String(stored).split('$');
        if (!saltHex || !hashHex) return false;
        const hash = crypto.scryptSync(String(code), Buffer.from(saltHex, 'hex'), 32);
        return safeEqual(hash.toString('hex'), hashHex);
    }
    // Compatibilidad con codigos aun en texto plano (migrar con migrar-codigos.js)
    return safeEqual(String(code), String(stored));
}

// Codigo de 6 digitos con aleatoriedad criptografica (Math.random es predecible)
function generateCode(digitos = 6) {
    const min = 10 ** (digitos - 1);
    const max = 10 ** digitos - 1;
    return String(crypto.randomInt(min, max + 1));
}

// ---------- CORS ----------

function corsHeaders(event) {
    const permitidos = (process.env.ALLOWED_ORIGINS || '')
        .split(',').map(o => o.trim()).filter(Boolean);
    const origin = event.headers?.origin || event.headers?.Origin || '';
    const allow = permitidos.length === 0
        ? origin || '*'                                  // sin configurar: no rompe nada
        : (permitidos.includes(origin) ? origin : permitidos[0]);

    return {
        'Access-Control-Allow-Origin': allow,
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Allow-Methods': 'GET, POST, PATCH, DELETE, OPTIONS',
        'Vary': 'Origin',
        'Content-Type': 'application/json'
    };
}

module.exports = {
    revisarConfiguracion,
    respuestaConfiguracion,
    signSession,
    verifySession,
    getSession,
    requireSession,
    hashCode,
    verifyCode,
    generateCode,
    safeEqual,
    corsHeaders,
    SESSION_TTL_SECONDS
};
