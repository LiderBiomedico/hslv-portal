// 🛡️ Función Netlify Proxy para Airtable - VERSIÓN LIMPIA SIN DEPENDENCIAS
// netlify/functions/airtable-proxy.js

// ⚠️ IMPORTANTE: NO importar nada que use 'window' o código de navegador

const fetch = require('node-fetch');

exports.handler = async (event, context) => {
    console.log('🚀 === AIRTABLE PROXY LIMPIO ===');
    console.log('🔍 Method:', event.httpMethod);
    console.log('🔍 Path:', event.path);
    console.log('🔍 Query:', event.queryStringParameters);
    
    // 🛡️ Headers de respuesta
    const headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Allow-Methods': 'GET, POST, PATCH, DELETE, OPTIONS',
        'Content-Type': 'application/json'
    };

    // ✅ Manejar preflight OPTIONS
    if (event.httpMethod === 'OPTIONS') {
        console.log('✅ Respondiendo a preflight OPTIONS');
        return {
            statusCode: 200,
            headers,
            body: ''
        };
    }

    try {
        // 🔑 Obtener variables de entorno (SOLO en servidor)
        const AIRTABLE_API_KEY = process.env.AIRTABLE_API_KEY;
        const AIRTABLE_BASE_ID = process.env.AIRTABLE_BASE_ID;

        console.log('🔑 Variables de entorno:');
        console.log('📊 Base ID:', AIRTABLE_BASE_ID ? '✅ Presente' : '❌ Faltante');
        console.log('🔐 API Key:', AIRTABLE_API_KEY ? '✅ Presente' : '❌ Faltante');

        if (!AIRTABLE_API_KEY || !AIRTABLE_BASE_ID) {
            console.error('❌ Variables de entorno no configuradas');
            return {
                statusCode: 400,
                headers,
                body: JSON.stringify({ 
                    error: 'Variables de entorno no configuradas en Netlify',
                    details: {
                        hasApiKey: !!AIRTABLE_API_KEY,
                        hasBaseId: !!AIRTABLE_BASE_ID
                    }
                })
            };
        }

        // 🔗 Extraer tabla del path - MÉTODO SIMPLE Y DIRECTO
        const rawPath = event.path;
        console.log('🔗 Raw path completo:', rawPath);
        
        // Buscar la parte después de airtable-proxy/
        const proxyIndex = rawPath.indexOf('/airtable-proxy/');
        if (proxyIndex === -1) {
            return {
                statusCode: 400,
                headers,
                body: JSON.stringify({ 
                    error: 'Path inválido - debe contener /airtable-proxy/',
                    receivedPath: rawPath
                })
            };
        }
        
        const tablePath = rawPath.substring(proxyIndex + '/airtable-proxy/'.length);
        console.log('🔗 Tabla extraída:', tablePath);
        
        if (!tablePath) {
            return {
                statusCode: 400,
                headers,
                body: JSON.stringify({ 
                    error: 'Nombre de tabla requerido después de /airtable-proxy/',
                    receivedPath: rawPath,
                    help: 'Usar: /.netlify/functions/airtable-proxy/NombreTabla'
                })
            };
        }

        // 🎯 Construir URL final de Airtable - EXACTAMENTE como simple-debug
        let airtableUrl = `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${tablePath}`;
        
        // Agregar query parameters si existen
        if (event.queryStringParameters && Object.keys(event.queryStringParameters).length > 0) {
            const queryParams = new URLSearchParams(event.queryStringParameters);
            airtableUrl += '?' + queryParams.toString();
        }
        
        console.log('🎯 URL final de Airtable:', airtableUrl);

        // 🚀 Preparar request - EXACTAMENTE como simple-debug que funciona
        const requestOptions = {
            method: event.httpMethod,
            headers: {
                'Authorization': `Bearer ${AIRTABLE_API_KEY}`,
                'Content-Type': 'application/json'
            }
        };

        // ➕ Agregar body para POST/PATCH
        if (event.body && (event.httpMethod === 'POST' || event.httpMethod === 'PATCH')) {
            requestOptions.body = event.body;
            console.log('📝 Body agregado al request');
        }

        console.log('📡 Enviando request a Airtable...');
        console.log('🔧 Method:', requestOptions.method);

        // 🚀 Hacer request a Airtable
        const response = await fetch(airtableUrl, requestOptions);
        
        console.log('📨 Respuesta de Airtable:');
        console.log('📊 Status:', response.status);
        console.log('📊 StatusText:', response.statusText);

        // Leer respuesta
        const responseText = await response.text();
        console.log('📄 Response preview:', responseText.substring(0, 200));

        // ✅ Respuesta exitosa
        if (response.ok) {
            console.log('✅ Proxy exitoso');
            return {
                statusCode: response.status,
                headers,
                body: responseText
            };
        } else {
            // ❌ Error de Airtable
            console.error('❌ Error de Airtable:', response.status);
            
            let errorData;
            try {
                errorData = JSON.parse(responseText);
            } catch (e) {
                errorData = { error: responseText };
            }
            
            return {
                statusCode: response.status,
                headers,
                body: JSON.stringify({
                    error: `Error ${response.status} desde Airtable`,
                    airtableError: errorData,
                    requestDetails: {
                        url: airtableUrl,
                        method: event.httpMethod,
                        tablePath: tablePath
                    },
                    timestamp: new Date().toISOString()
                })
            };
        }

    } catch (error) {
        console.error('💥 Error fatal en proxy limpio:', error);
        console.error('💥 Stack trace:', error.stack);
        
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({ 
                error: 'Error interno del servidor',
                message: error.message,
                type: error.name,
                timestamp: new Date().toISOString(),
                note: 'Proxy limpio sin dependencias de navegador'
            })
        };
    }
};