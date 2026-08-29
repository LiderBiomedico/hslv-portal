// Rate limiting por IP para el login de administrador, respaldado por Netlify
// Blobs (almacenamiento persistente propio de Netlify, sin servicios externos).
// El bloqueo de intentos en el navegador (index.html) es solo una ayuda visual;
// esta es la barrera real, porque vive en el servidor y sobrevive aunque el
// atacante ignore el JavaScript del cliente o llame a la función directamente.

const { getStore } = require('@netlify/blobs');

const WINDOW_MS = 10 * 60 * 1000; // ventana de 10 minutos
const MAX_ATTEMPTS = 5;           // intentos permitidos por IP dentro de la ventana
const STORE_NAME = 'login-rate-limits';

function getClientIp(event) {
    const headers = event.headers || {};
    // Netlify inyecta la IP real del cliente en este header; x-forwarded-for
    // queda como respaldo por si se ejecuta detrás de otro proxy.
    const forwarded = headers['x-forwarded-for'] || headers['X-Forwarded-For'];
    return (
        headers['x-nf-client-connection-ip'] ||
        headers['client-ip'] ||
        (forwarded ? forwarded.split(',')[0].trim() : null) ||
        'unknown'
    );
}

async function checkAndRecordAttempt(event) {
    const ip = getClientIp(event);
    const key = `attempts:${ip}`;
    const now = Date.now();
    const store = getStore(STORE_NAME);

    let record = await store.get(key, { type: 'json' });
    if (!record || now - record.windowStart > WINDOW_MS) {
        record = { count: 0, windowStart: now };
    }

    if (record.count >= MAX_ATTEMPTS) {
        const retryAfterSeconds = Math.max(1, Math.ceil((record.windowStart + WINDOW_MS - now) / 1000));
        return { allowed: false, retryAfterSeconds };
    }

    record.count += 1;
    await store.setJSON(key, record);

    return { allowed: true };
}

async function resetAttempts(event) {
    const ip = getClientIp(event);
    const store = getStore(STORE_NAME);
    await store.delete(`attempts:${ip}`);
}

module.exports = { checkAndRecordAttempt, resetAttempts, getClientIp, WINDOW_MS, MAX_ATTEMPTS };
