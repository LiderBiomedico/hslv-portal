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
        problemas.push({
            variable: 'SESSION_SECRET',
            causa: 'no esta definida',
            solucion: 'Cree la variable con al menos 32 caracteres'
        });
    } else if (secreto.length < LONGITUD_MINIMA_SECRETO) {
        problemas.push({
            variable: 'SESSION_SECRET',
            causa: `tiene ${secreto.length} caracteres; se requieren ${LONGITUD_MINIMA_SECRETO} o mas`,
            solucion: 'node -e "console.log(require(\'crypto\').randomBytes(48).toString(\'hex\'))"'
        });
    }

    if (requiereAirtable) {
        if (!process.env.AIRTABLE_API_KEY) {
            problemas.push({ variable: 'AIRTABLE_API_KEY', causa: 'no esta definida' });
        }
        if (!process.env.AIRTABLE_BASE_ID) {
            problemas.push({ variable: 'AIRTABLE_BASE_ID', causa: 'no esta definida' });
        }
    }

    if (requiereAdmin && !process.env.ADMIN_PASSWORD_HASH && !process.env.ADMIN_PASSWORD) {
        problemas.push({
            variable: 'ADMIN_PASSWORD_HASH',
            causa: 'no esta definida (tampoco ADMIN_PASSWORD)',
            solucion: 'Genere el hash con session.js hashCode() y peguelo completo'
        });
    }

    return problemas;
}

// Respuesta unica para configuracion incompleta: 503, no 500.
// 503 dice "el servicio no esta listo", que es lo que realmente pasa.
function respuestaConfiguracion(problemas, headers, etiqueta) {
    console.error(`[${etiqueta}] Configuracion incompleta:`);
    problemas.forEach(p => {
        console.error(`  - ${p.variable}: ${p.causa}`);
        if (p.solucion) console.error(`    Solucion: ${p.solucion}`);
    });

    // Se devuelven los NOMBRES de las variables que faltan, nunca sus valores.
    // Saber que falta "SESSION_SECRET" no le sirve de nada a un atacante, y le
    // ahorra a quien administra el sitio tener que rastrear el registro.
    return {
        statusCode: 503,
        headers,
        body: JSON.stringify({
            error: 'El servicio no esta configurado correctamente en Netlify.',
            codigo: 'CONFIGURACION_INCOMPLETA',
            faltantes: problemas.map(p => `${p.variable}: ${p.causa}`)
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
    // Sin ALLOWED_ORIGINS se permite SOLO el propio dominio del sitio.
    // Antes se reflejaba cualquier Origin, lo que abría la API a sitios externos.
    const host = event.headers?.host || '';
    const propio = host ? `https://${host}` : '';
    const lista = permitidos.length > 0 ? permitidos : [propio].filter(Boolean);
    const allow = lista.includes(origin) ? origin : (lista[0] || 'null');

    return {
        'Access-Control-Allow-Origin': allow,
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Allow-Methods': 'GET, POST, PATCH, DELETE, OPTIONS',
        'Vary': 'Origin',
        'Content-Type': 'application/json',
        // Las [[headers]] de netlify.toml NO se aplican a las respuestas de las
        // funciones (solo a archivos estáticos): hay que enviarlas desde aquí.
        'Cache-Control': 'no-store, no-cache, must-revalidate, private',
        'Pragma': 'no-cache',
        'X-Content-Type-Options': 'nosniff',
        'X-Frame-Options': 'DENY',
        'Referrer-Policy': 'no-referrer',
        'Content-Security-Policy': "default-src 'none'; frame-ancestors 'none'"
    };
}

// ---------- Freno de fuerza bruta por IP ----------
// Cuenta intentos FALLIDOS por IP, exista o no la cuenta. Así no se puede
// probar códigos sin límite contra correos inexistentes ni enumerar cuentas
// por la diferencia entre 401 y 429. Vive en memoria de la instancia: frena
// ataques rápidos; el bloqueo persistente por cuenta sigue en Airtable.
const intentosPorIp = new Map();
const IP_MAX_FALLOS = Number(process.env.IP_MAX_FALLOS || 10);
const IP_BLOQUEO_MINUTOS = Number(process.env.IP_BLOQUEO_MINUTOS || 15);

function ipCliente(event) {
    return event.headers?.['x-nf-client-connection-ip']
        || event.headers?.['client-ip']
        || (event.headers?.['x-forwarded-for'] || '').split(',')[0].trim()
        || 'desconocida';
}

function ipBloqueada(event) {
    const ahora = Date.now();
    for (const [ip, d] of intentosPorIp) {
        if (d.hasta < ahora && d.ultimo < ahora - 3600000) intentosPorIp.delete(ip);
    }
    const d = intentosPorIp.get(ipCliente(event));
    return d && d.hasta > ahora ? Math.ceil((d.hasta - ahora) / 60000) : 0;
}

function registrarFalloIp(event) {
    const ip = ipCliente(event);
    const d = intentosPorIp.get(ip) || { fallos: 0, hasta: 0, ultimo: 0 };
    d.fallos += 1;
    d.ultimo = Date.now();
    if (d.fallos >= IP_MAX_FALLOS) {
        d.hasta = Date.now() + IP_BLOQUEO_MINUTOS * 60000;
        d.fallos = 0;
    }
    intentosPorIp.set(ip, d);
}

function limpiarFallosIp(event) {
    intentosPorIp.delete(ipCliente(event));
}

module.exports = {
    ipBloqueada,
    registrarFalloIp,
    limpiarFallosIp,
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
