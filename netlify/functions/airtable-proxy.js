// 🛡️ Función Netlify Proxy para Airtable
// netlify/functions/airtable-proxy.js

const fetch = require('node-fetch');

exports.handler = async (event, context) => {
    // 🛡️ Headers de seguridad
    const headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'GET, POST, PATCH, DELETE, OPTIONS',
        'Content-Type': 'application/json'
    };

    // ✅ Manejar preflight OPTIONS
    if (event.httpMethod === 'OPTIONS') {
        return {
            statusCode: 200,
            headers,
            body: ''
        };
    }

    try {
        // 🔑 Obtener credenciales desde variables de entorno
        const AIRTABLE_API_KEY = process.env.AIRTABLE_API_KEY;
        const AIRTABLE_BASE_ID = process.env.AIRTABLE_BASE_ID;

        if (!AIRTABLE_API_KEY || !AIRTABLE_BASE_ID) {
            console.error('❌ Credenciales de Airtable no configuradas');
            return {
                statusCode: 500,
                headers,
                body: JSON.stringify({ 
                    error: 'Credenciales de Airtable no configuradas' 
                })
            };
        }

        // 🔗 Construir URL de Airtable
        const path = event.path.replace('/.netlify/functions/airtable-proxy/', '');
        const airtableUrl = `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${path}${event.rawQuery ? '?' + event.rawQuery : ''}`;

        console.log(`📡 Proxy request: ${event.httpMethod} ${airtableUrl}`);

        // 🚀 Hacer request a Airtable
        const requestOptions = {
            method: event.httpMethod,
            headers: {
                'Authorization': `Bearer ${AIRTABLE_API_KEY}`,
                'Content-Type': 'application/json'
            }
        };

        // ➕ Agregar body si es POST/PATCH
        if (event.body && (event.httpMethod === 'POST' || event.httpMethod === 'PATCH')) {
            requestOptions.body = event.body;
        }

        const response = await fetch(airtableUrl, requestOptions);
        const data = await response.text();

        console.log(`✅ Airtable response: ${response.status}`);

        // ↩️ Retornar respuesta
        return {
            statusCode: response.status,
            headers,
            body: data
        };

    } catch (error) {
        console.error('❌ Error en proxy:', error);
        
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({ 
                error: 'Error interno del servidor',
                message: error.message 
            })
        };
    }
};