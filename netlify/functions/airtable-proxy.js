// 🔍 Función de debug específico para Airtable
// netlify/functions/debug-airtable.js

const fetch = require('node-fetch');

exports.handler = async (event, context) => {
    const headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Content-Type': 'application/json'
    };

    if (event.httpMethod === 'OPTIONS') {
        return { statusCode: 200, headers, body: '' };
    }

    try {
        const AIRTABLE_API_KEY = process.env.AIRTABLE_API_KEY;
        const AIRTABLE_BASE_ID = process.env.AIRTABLE_BASE_ID;

        console.log('🔍 === DEBUG AIRTABLE ===');
        console.log('API Key presente:', !!AIRTABLE_API_KEY);
        console.log('Base ID:', AIRTABLE_BASE_ID);

        if (!AIRTABLE_API_KEY || !AIRTABLE_BASE_ID) {
            return {
                statusCode: 400,
                headers,
                body: JSON.stringify({
                    error: 'Variables de entorno faltantes',
                    hasApiKey: !!AIRTABLE_API_KEY,
                    hasBaseId: !!AIRTABLE_BASE_ID
                })
            };
        }

        const tests = [];

        // Test 1: Información de la base
        console.log('🧪 Test 1: Información de la base...');
        try {
            const baseUrl = `https://api.airtable.com/v0/meta/bases/${AIRTABLE_BASE_ID}/tables`;
            const baseResponse = await fetch(baseUrl, {
                headers: {
                    'Authorization': `Bearer ${AIRTABLE_API_KEY}`,
                    'Content-Type': 'application/json'
                }
            });

            if (baseResponse.ok) {
                const baseData = await baseResponse.json();
                tests.push({
                    test: 'Base Info',
                    status: 'SUCCESS',
                    data: baseData
                });
            } else {
                const errorText = await baseResponse.text();
                tests.push({
                    test: 'Base Info',
                    status: 'FAILED',
                    error: {
                        status: baseResponse.status,
                        message: errorText
                    }
                });
            }
        } catch (error) {
            tests.push({
                test: 'Base Info',
                status: 'ERROR',
                error: error.message
            });
        }

        // Test 2: Listar tablas comunes
        const commonTableNames = ['Solicitudes', 'solicitudes', 'Requests', 'requests', 'Table 1', 'tblSolicitudes'];
        
        for (const tableName of commonTableNames) {
            console.log(`🧪 Test 2: Probando tabla "${tableName}"...`);
            try {
                const tableUrl = `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${encodeURIComponent(tableName)}?maxRecords=1`;
                const tableResponse = await fetch(tableUrl, {
                    headers: {
                        'Authorization': `Bearer ${AIRTABLE_API_KEY}`,
                        'Content-Type': 'application/json'
                    }
                });

                if (tableResponse.ok) {
                    const tableData = await tableResponse.json();
                    tests.push({
                        test: `Tabla "${tableName}"`,
                        status: 'SUCCESS',
                        data: {
                            recordCount: tableData.records.length,
                            hasRecords: tableData.records.length > 0,
                            firstRecord: tableData.records[0] || null
                        }
                    });
                } else {
                    const errorText = await tableResponse.text();
                    let errorObj;
                    try {
                        errorObj = JSON.parse(errorText);
                    } catch (e) {
                        errorObj = errorText;
                    }
                    
                    tests.push({
                        test: `Tabla "${tableName}"`,
                        status: 'FAILED',
                        error: {
                            status: tableResponse.status,
                            message: errorObj
                        }
                    });
                }
            } catch (error) {
                tests.push({
                    test: `Tabla "${tableName}"`,
                    status: 'ERROR',
                    error: error.message
                });
            }
        }

        // Test 3: Verificar permisos de API Key
        console.log('🧪 Test 3: Verificando permisos de API Key...');
        try {
            const whoamiUrl = 'https://api.airtable.com/v0/meta/whoami';
            const whoamiResponse = await fetch(whoamiUrl, {
                headers: {
                    'Authorization': `Bearer ${AIRTABLE_API_KEY}`,
                    'Content-Type': 'application/json'
                }
            });

            if (whoamiResponse.ok) {
                const whoamiData = await whoamiResponse.json();
                tests.push({
                    test: 'API Key Permissions',
                    status: 'SUCCESS',
                    data: whoamiData
                });
            } else {
                const errorText = await whoamiResponse.text();
                tests.push({
                    test: 'API Key Permissions',
                    status: 'FAILED',
                    error: {
                        status: whoamiResponse.status,
                        message: errorText
                    }
                });
            }
        } catch (error) {
            tests.push({
                test: 'API Key Permissions',
                status: 'ERROR',
                error: error.message
            });
        }

        const result = {
            success: true,
            timestamp: new Date().toISOString(),
            environment: {
                apiKeyPreview: AIRTABLE_API_KEY.substring(0, 10) + '...',
                baseId: AIRTABLE_BASE_ID
            },
            tests: tests,
            summary: {
                total: tests.length,
                passed: tests.filter(t => t.status === 'SUCCESS').length,
                failed: tests.filter(t => t.status === 'FAILED').length,
                errors: tests.filter(t => t.status === 'ERROR').length
            }
        };

        console.log('✅ Debug completado');

        return {
            statusCode: 200,
            headers,
            body: JSON.stringify(result, null, 2)
        };

    } catch (error) {
        console.error('❌ Error en debug:', error);

        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({
                success: false,
                error: error.message,
                stack: error.stack
            }, null, 2)
        };
    }
};