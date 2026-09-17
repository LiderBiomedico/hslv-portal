const Airtable = require('airtable');
const { requireSession, corsHeaders } = require('./utils/session');

exports.handler = async (event) => {
    const headers = corsHeaders(event);

    if (event.httpMethod === 'OPTIONS') {
        return { statusCode: 200, headers, body: '' };
    }

    // La app movil envia POST; se acepta GET por compatibilidad
    if (!['GET', 'POST'].includes(event.httpMethod)) {
        return { statusCode: 405, headers, body: JSON.stringify({ error: 'Method Not Allowed' }) };
    }

    // 🔐 Sesion obligatoria
    const control = requireSession(event, headers);
    if (control.error) return control.error;

    // El tecnico se toma del TOKEN, no del parametro que envia el cliente.
    // Antes bastaba cambiar el techId en la peticion para ver las
    // solicitudes de cualquier otro tecnico.
    const techId = control.sesion.sub;

    try {
        const base = new Airtable({
            apiKey: process.env.AIRTABLE_API_KEY
        }).base(process.env.AIRTABLE_BASE_ID);

        const records = await base('Solicitudes')
            .select({
                filterByFormula: `AND(
                    {tecnicoAsignadoId} = '${String(techId).replace(/'/g, "\\'")}',
                    OR(
                        {estado} = 'ASIGNADA',
                        {estado} = 'EN_PROCESO'
                    )
                )`,
                sort: [{ field: "prioridad", direction: "desc" }]
            })
            .all();

        return {
            statusCode: 200,
            headers,
            body: JSON.stringify({
                success: true,
                requests: records.map(r => ({ id: r.id, ...r.fields }))
            })
        };
    } catch (error) {
        console.error('Error:', error);
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({ success: false, error: 'Server error' })
        };
    }
};
