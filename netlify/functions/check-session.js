// Endpoint mínimo de verificación de sesión.
//
// La cookie admin_session es HttpOnly, así que el JavaScript del portal no puede
// leerla directamente. Este endpoint la lee del lado servidor y responde si la
// sesión de administrador es válida, para que portal-gestion.html pueda exigir
// login al cargarse (y redirigir a index.html cuando no haya sesión).
//
// No emite ni renueva cookies: solo consulta. La renovación deslizante ocurre en
// airtable-proxy.js con el tráfico normal del portal.

const { isValidSession } = require('./utils/session');

exports.handler = async (event) => {
    const authenticated = isValidSession(event);

    return {
        statusCode: authenticated ? 200 : 401,
        headers: {
            'Content-Type': 'application/json',
            // Nunca cachear: la validez de la sesión cambia con el tiempo.
            'Cache-Control': 'no-store, no-cache, must-revalidate',
            'Access-Control-Allow-Origin': '*'
        },
        body: JSON.stringify({ authenticated })
    };
};
