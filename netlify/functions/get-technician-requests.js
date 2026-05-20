const Airtable = require('airtable');

exports.handler = async (event) => {
    const headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Content-Type': 'application/json'
    };

    if (event.httpMethod !== 'GET') {
        return { statusCode: 405, headers, body: 'Method Not Allowed' };
    }

    const { techId } = event.queryStringParameters || {};
    
    if (!techId) {
        return { 
            statusCode: 400, 
            headers, 
            body: JSON.stringify({ error: 'Tech ID required' }) 
        };
    }

    try {
        const base = new Airtable({
            apiKey: process.env.AIRTABLE_API_KEY
        }).base(process.env.AIRTABLE_BASE_ID);

        const records = await base('Solicitudes')
            .select({
                filterByFormula: `AND(
                    {tecnicoAsignadoId} = '${techId}',
                    OR(
                        {estado} = 'ASIGNADA',
                        {estado} = 'EN_PROCESO'
                    )
                )`,
                sort: [{field: "prioridad", direction: "desc"}]
            })
            .all();

        return {
            statusCode: 200,
            headers,
            body: JSON.stringify({ records })
        };
    } catch (error) {
        console.error('Error:', error);
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({ error: 'Server error' })
        };
    }
};