// 🧪 Función simple de debug para Airtable
// netlify/functions/simple-debug.js

exports.handler = async (event, context) => {
    console.log('🧪 === SIMPLE DEBUG INICIADO ===');
    
    // Headers básicos
    const headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Content-Type': 'application/json'
    };

    // Manejar preflight
    if (event.httpMethod === 'OPTIONS') {
        return { statusCode: 200, headers, body: '' };
    }

    try {
        // Obtener variables
        const AIRTABLE_API_KEY = process.env.AIRTABLE_API_KEY;
        const AIRTABLE_BASE_ID = process.env.AIRTABLE_BASE_ID;

        console.log('Variables check:');
        console.log('- API Key presente:', !!AIRTABLE_API_KEY);
        console.log('- Base ID presente:', !!AIRTABLE_BASE_ID);

        if (!AIRTABLE_API_KEY || !AIRTABLE_BASE_ID) {
            return {
                statusCode: 400,
                headers,
                body: JSON.stringify({
                    success: false,
                    error: 'Variables de entorno faltantes',
                    details: {
                        hasApiKey: !!AIRTABLE_API_KEY,
                        hasBaseId: !!AIRTABLE_BASE_ID,
                        apiKeyPreview: AIRTABLE_API_KEY ? AIRTABLE_API_KEY.substring(0, 10) + '...' : 'NO CONFIGURADA',
                        baseId: AIRTABLE_BASE_ID || 'NO CONFIGURADA'
                    }
                }, null, 2)
            };
        }

        // Test básico: intentar acceder a diferentes tablas
        const fetch = require('node-fetch');
        
        console.log('🔗 Probando conexión con múltiples tablas...');
        
        // Lista de nombres comunes de tablas para probar
        const tablesToTry = [
            'Solicitudes',
            'solicitudes', 
            'Table 1',
            'Table1',
            'Requests',
            'requests',
            'Tecnicos',
            'tecnicos',
            'Usuarios',
            'usuarios',
            'SolicitudesAcceso'
        ];

        const results = [];

        for (const tableName of tablesToTry) {
            try {
                console.log(`🧪 Probando tabla: ${tableName}`);
                
                const url = `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${encodeURIComponent(tableName)}?maxRecords=3`;
                
                const response = await fetch(url, {
                    method: 'GET',
                    headers: {
                        'Authorization': `Bearer ${AIRTABLE_API_KEY}`,
                        'Content-Type': 'application/json'
                    }
                });

                const responseText = await response.text();
                
                if (response.ok) {
                    const data = JSON.parse(responseText);
                    results.push({
                        tableName: tableName,
                        status: 'SUCCESS ✅',
                        recordCount: data.records.length,
                        hasData: data.records.length > 0,
                        sampleFields: data.records[0] ? Object.keys(data.records[0].fields || {}) : []
                    });
                    console.log(`✅ ${tableName}: ${data.records.length} records`);
                } else {
                    let errorData;
                    try {
                        errorData = JSON.parse(responseText);
                    } catch (e) {
                        errorData = responseText;
                    }
                    
                    results.push({
                        tableName: tableName,
                        status: `FAILED ❌ (${response.status})`,
                        error: errorData,
                        errorType: errorData.error?.type || 'UNKNOWN'
                    });
                    console.log(`❌ ${tableName}: ${response.status}`);
                }
            } catch (error) {
                results.push({
                    tableName: tableName,
                    status: 'ERROR 💥',
                    error: error.message
                });
                console.log(`💥 ${tableName}: ${error.message}`);
            }

            // Pequeña pausa entre requests
            await new Promise(resolve => setTimeout(resolve, 200));
        }

        // Analizar resultados
        const successfulTables = results.filter(r => r.status.includes('SUCCESS'));
        const failedTables = results.filter(r => !r.status.includes('SUCCESS'));

        // Encontrar la mejor tabla para usar
        let recommendedTable = null;
        if (successfulTables.length > 0) {
            // Preferir tabla con datos
            recommendedTable = successfulTables.find(t => t.hasData) || successfulTables[0];
        }

        const result = {
            success: true,
            timestamp: new Date().toISOString(),
            configuration: {
                apiKeyConfigured: true,
                baseIdConfigured: true,
                apiKeyPreview: AIRTABLE_API_KEY.substring(0, 10) + '...',
                baseId: AIRTABLE_BASE_ID
            },
            tableTests: {
                total: results.length,
                successful: successfulTables.length,
                failed: failedTables.length
            },
            workingTables: successfulTables,
            failedTables: failedTables.slice(0, 5), // Solo primeros 5 errores
            recommendation: successfulTables.length > 0 
                ? `✅ ¡Conectado! Usa la tabla: "${recommendedTable.tableName}"`
                : '❌ No se encontraron tablas accesibles. Verificar Base ID y permisos.',
            bestTable: recommendedTable,
            summary: {
                totalTables: results.length,
                workingTables: successfulTables.length,
                tablesWithData: successfulTables.filter(t => t.hasData).length,
                mainRecommendation: recommendedTable ? recommendedTable.tableName : 'NINGUNA'
            }
        };

        console.log('🎉 Debug simple completado exitosamente');
        console.log(`📊 Resultado: ${successfulTables.length}/${results.length} tablas funcionando`);

        return {
            statusCode: 200,
            headers,
            body: JSON.stringify(result, null, 2)
        };

    } catch (error) {
        console.error('💥 Error en simple debug:', error);

        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({
                success: false,
                error: error.message,
                stack: error.stack,
                timestamp: new Date().toISOString()
            }, null, 2)
        };
    }
};