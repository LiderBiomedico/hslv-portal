// 👤 Función Netlify CORREGIDA para gestión completa de usuarios
// netlify/functions/user-management.js

const fetch = require('node-fetch');

exports.handler = async (event, context) => {
    console.log('👤 === USER MANAGEMENT FUNCTION (CORREGIDA) ===');
    console.log('🔍 Method:', event.httpMethod);
    console.log('🔍 Path:', event.path);
    console.log('🔍 Query:', event.queryStringParameters);
    console.log('🔍 Body:', event.body);
    
    // Headers de respuesta
    const headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Allow-Methods': 'GET, POST, PATCH, DELETE, OPTIONS',
        'Content-Type': 'application/json'
    };

    // Manejar preflight OPTIONS
    if (event.httpMethod === 'OPTIONS') {
        console.log('✅ Respondiendo a preflight OPTIONS');
        return {
            statusCode: 200,
            headers,
            body: ''
        };
    }

    try {
        // Obtener variables de entorno
        const AIRTABLE_API_KEY = process.env.AIRTABLE_API_KEY;
        const AIRTABLE_BASE_ID = process.env.AIRTABLE_BASE_ID;

        console.log('🔑 Variables de entorno:');
        console.log('📊 Base ID:', AIRTABLE_BASE_ID ? '✅ Presente' : '❌ Faltante');
        console.log('🔐 API Key:', AIRTABLE_API_KEY ? '✅ Presente' : '❌ Faltante');

        if (!AIRTABLE_API_KEY || !AIRTABLE_BASE_ID) {
            return {
                statusCode: 400,
                headers,
                body: JSON.stringify({ 
                    error: 'Variables de entorno no configuradas',
                    details: {
                        hasApiKey: !!AIRTABLE_API_KEY,
                        hasBaseId: !!AIRTABLE_BASE_ID
                    }
                })
            };
        }

        // Parsear operación del query string
        const operation = event.queryStringParameters?.operation || 'list';
        const requestId = event.queryStringParameters?.requestId;
        
        console.log('🎯 Operación:', operation);
        console.log('🆔 Request ID:', requestId);

        // Procesar según la operación
        switch (operation) {
            case 'approve-request':
                return await approveAccessRequestFixed(requestId, event.body, AIRTABLE_BASE_ID, AIRTABLE_API_KEY, headers);
                
            case 'list':
                return await listUsers(AIRTABLE_BASE_ID, AIRTABLE_API_KEY, headers);
                
            case 'create':
                return await createUser(event.body, AIRTABLE_BASE_ID, AIRTABLE_API_KEY, headers);
                
            case 'update':
                const userId = event.queryStringParameters?.id;
                return await updateUser(userId, event.body, AIRTABLE_BASE_ID, AIRTABLE_API_KEY, headers);
                
            case 'validate':
                return await validateUserAccess(event.body, AIRTABLE_BASE_ID, AIRTABLE_API_KEY, headers);
                
            case 'generate-code':
                return await generateAccessCode(AIRTABLE_BASE_ID, AIRTABLE_API_KEY, headers);
                
            case 'statistics':
                return await getUserStatistics(AIRTABLE_BASE_ID, AIRTABLE_API_KEY, headers);
                
            default:
                return {
                    statusCode: 400,
                    headers,
                    body: JSON.stringify({
                        error: 'Operación no válida',
                        validOperations: ['list', 'create', 'update', 'validate', 'generate-code', 'approve-request', 'statistics']
                    })
                };
        }

    } catch (error) {
        console.error('💥 Error en user management:', error);
        
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({ 
                error: 'Error interno del servidor',
                message: error.message,
                timestamp: new Date().toISOString()
            })
        };
    }
};

// ✅ APROBAR SOLICITUD DE ACCESO (CORREGIDA)
async function approveAccessRequestFixed(requestId, bodyData, baseId, apiKey, headers) {
    console.log('✅ === APROBANDO SOLICITUD CORREGIDA ===');
    console.log('🆔 Request ID recibido:', requestId);
    
    try {
        if (!requestId) {
            return {
                statusCode: 400,
                headers,
                body: JSON.stringify({ 
                    error: 'ID de solicitud requerido',
                    receivedId: requestId
                })
            };
        }

        const approvalData = JSON.parse(bodyData || '{}');
        console.log('📝 Datos de aprobación:', approvalData);
        
        // 1. PRIMERO: Intentar obtener TODAS las solicitudes para buscar la correcta
        console.log('🔍 Buscando solicitud en todas las solicitudes...');
        const allRequestsUrl = `https://api.airtable.com/v0/${baseId}/SolicitudesAcceso`;
        
        const allRequestsResponse = await fetch(allRequestsUrl, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json'
            }
        });

        if (!allRequestsResponse.ok) {
            const errorText = await allRequestsResponse.text();
            throw new Error(`Error buscando solicitudes: ${allRequestsResponse.status} - ${errorText}`);
        }

        const allRequestsData = await allRequestsResponse.json();
        console.log(`📋 Total solicitudes encontradas: ${allRequestsData.records.length}`);
        
        // Buscar la solicitud por ID
        const requestRecord = allRequestsData.records.find(record => record.id === requestId);
        
        if (!requestRecord) {
            // Log de debug
            console.log('❌ Solicitud no encontrada. IDs disponibles:');
            allRequestsData.records.forEach(record => {
                console.log(`  - ID: ${record.id}, Nombre: ${record.fields.nombreCompleto}`);
            });
            
            return {
                statusCode: 404,
                headers,
                body: JSON.stringify({
                    error: 'Solicitud de acceso no encontrada',
                    requestId: requestId,
                    availableIds: allRequestsData.records.map(r => ({
                        id: r.id,
                        nombre: r.fields.nombreCompleto,
                        estado: r.fields.estado
                    })),
                    totalRecords: allRequestsData.records.length,
                    debugInfo: 'Verifique que el ID es correcto y que la solicitud existe en Airtable'
                })
            };
        }

        const request = requestRecord.fields;
        console.log('✅ Solicitud encontrada:', {
            id: requestRecord.id,
            nombre: request.nombreCompleto,
            email: request.email,
            estado: request.estado
        });

        // 2. Verificar estado
        if (request.estado !== 'PENDIENTE') {
            return {
                statusCode: 400,
                headers,
                body: JSON.stringify({
                    error: `La solicitud ya fue procesada. Estado actual: ${request.estado}`,
                    currentState: request.estado,
                    requestId: requestId
                })
            };
        }

        // 3. Generar código de acceso único
        console.log('🎲 Generando código de acceso único...');
        const codeResponse = await generateAccessCode(baseId, apiKey, headers);
        const codeData = JSON.parse(codeResponse.body);
        
        if (!codeData.success) {
            throw new Error('No se pudo generar código de acceso: ' + codeData.error);
        }

        const accessCode = codeData.accessCode;
        console.log('✅ Código generado:', accessCode);
        
        // 4. Crear usuario
        console.log('👤 Creando usuario...');
        const userData = {
            nombreCompleto: request.nombreCompleto,
            email: request.email,
            telefono: request.telefono || '',
            servicioHospitalario: request.servicioHospitalario,
            cargo: request.cargo,
            codigoAcceso: accessCode,
            estado: 'ACTIVO',
            fechaCreacion: new Date().toISOString(),
            solicitudOrigenId: requestId
        };

        const userResponse = await createUser(JSON.stringify(userData), baseId, apiKey, headers);
        const userResult = JSON.parse(userResponse.body);
        
        if (!userResult.success) {
            throw new Error('No se pudo crear usuario: ' + userResult.error);
        }

        console.log('✅ Usuario creado:', userResult.user.id);

        // 5. Actualizar estado de la solicitud
        console.log('🔄 Actualizando solicitud...');
        const updateRequestUrl = `https://api.airtable.com/v0/${baseId}/SolicitudesAcceso/${requestId}`;
        
        const updateResponse = await fetch(updateRequestUrl, {
            method: 'PATCH',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                fields: {
                    estado: 'APROBADA',
                    fechaAprobacion: new Date().toISOString(),
                    usuarioCreado: userResult.user.id,
                    aprobadoPor: approvalData.approvedBy || 'Portal de Gestión'
                }
            })
        });

        if (!updateResponse.ok) {
            const errorText = await updateResponse.text();
            console.warn('⚠️ Error actualizando solicitud pero usuario ya creado:', errorText);
            // No fallar completamente si el usuario ya fue creado
        }

        console.log('🎉 Aprobación completada exitosamente');

        return {
            statusCode: 200,
            headers,
            body: JSON.stringify({
                success: true,
                user: userResult.user,
                accessCode: accessCode,
                requestId: requestId,
                message: 'Solicitud aprobada y usuario creado exitosamente',
                timestamp: new Date().toISOString()
            })
        };

    } catch (error) {
        console.error('❌ Error en aprobación:', error);
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({ 
                error: 'Error aprobando solicitud de acceso',
                message: error.message,
                requestId: requestId,
                timestamp: new Date().toISOString()
            })
        };
    }
}

// Las demás funciones permanecen igual...
// (Aquí van todas las otras funciones como listUsers, createUser, etc.)

// 📋 Listar usuarios
async function listUsers(baseId, apiKey, headers) {
    console.log('📋 Listando usuarios...');
    
    try {
        const url = `https://api.airtable.com/v0/${baseId}/Usuarios`;
        
        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Error ${response.status}: ${errorText}`);
        }

        const data = await response.json();
        
        const users = data.records.map(record => ({
            id: record.id,
            ...record.fields
        }));

        console.log(`✅ ${users.length} usuarios listados`);

        return {
            statusCode: 200,
            headers,
            body: JSON.stringify({
                success: true,
                users: users,
                count: users.length,
                timestamp: new Date().toISOString()
            })
        };

    } catch (error) {
        console.error('❌ Error listando usuarios:', error);
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({ error: error.message })
        };
    }
}

// ➕ Crear usuario
async function createUser(bodyData, baseId, apiKey, headers) {
    console.log('➕ Creando usuario...');
    
    try {
        const userData = JSON.parse(bodyData || '{}');
        
        // Validar datos requeridos
        if (!userData.nombreCompleto || !userData.email || !userData.servicioHospitalario) {
            return {
                statusCode: 400,
                headers,
                body: JSON.stringify({
                    error: 'Datos requeridos faltantes',
                    required: ['nombreCompleto', 'email', 'servicioHospitalario']
                })
            };
        }

        // Generar código de acceso si no se proporciona
        let accessCode = userData.codigoAcceso;
        if (!accessCode) {
            accessCode = Math.floor(1000 + Math.random() * 9000).toString();
        }

        const url = `https://api.airtable.com/v0/${baseId}/Usuarios`;
        
        const requestData = {
            fields: {
                nombreCompleto: userData.nombreCompleto,
                email: userData.email,
                telefono: userData.telefono || '',
                servicioHospitalario: userData.servicioHospitalario,
                cargo: userData.cargo || '',
                codigoAcceso: accessCode,
                estado: userData.estado || 'ACTIVO',
                fechaCreacion: userData.fechaCreacion || new Date().toISOString(),
                solicitudOrigenId: userData.solicitudOrigenId || ''
            }
        };

        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(requestData)
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Error ${response.status}: ${errorText}`);
        }

        const result = await response.json();
        
        console.log('✅ Usuario creado:', result.id);

        return {
            statusCode: 200,
            headers,
            body: JSON.stringify({
                success: true,
                user: {
                    id: result.id,
                    ...result.fields
                },
                accessCode: accessCode,
                timestamp: new Date().toISOString()
            })
        };

    } catch (error) {
        console.error('❌ Error creando usuario:', error);
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({ error: error.message })
        };
    }
}

// 🎲 Generar código de acceso único
async function generateAccessCode(baseId, apiKey, headers) {
    console.log('🎲 Generando código de acceso único...');
    
    try {
        // Obtener todos los códigos existentes
        const url = `https://api.airtable.com/v0/${baseId}/Usuarios`;
        
        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json'
            }
        });

        const existingCodes = [];
        
        if (response.ok) {
            const data = await response.json();
            data.records.forEach(record => {
                if (record.fields.codigoAcceso) {
                    existingCodes.push(record.fields.codigoAcceso);
                }
            });
        }

        // Generar código único
        let code;
        let attempts = 0;
        const maxAttempts = 100;

        do {
            code = Math.floor(1000 + Math.random() * 9000).toString();
            attempts++;
            
            if (attempts > maxAttempts) {
                throw new Error('No se pudo generar código único después de 100 intentos');
            }
        } while (existingCodes.includes(code));

        console.log('✅ Código único generado:', code);

        return {
            statusCode: 200,
            headers,
            body: JSON.stringify({
                success: true,
                accessCode: code,
                attempts: attempts,
                timestamp: new Date().toISOString()
            })
        };

    } catch (error) {
        console.error('❌ Error generando código:', error);
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({ error: error.message })
        };
    }
}

// Resto de funciones permanecen igual...