// 👤 Función Netlify para gestión completa de usuarios
// netlify/functions/user-management.js

const { requireSession, hashCode, generateCode, corsHeaders } = require('./utils/session');

// Campos que jamás deben salir hacia el navegador
const CAMPOS_SENSIBLES = ['codigoAcceso', 'codigoAccesoHash', 'intentosFallidos', 'bloqueadoHasta'];

function sinCamposSensibles(objeto) {
    const limpio = { ...objeto };
    CAMPOS_SENSIBLES.forEach(campo => delete limpio[campo]);
    return limpio;
}

exports.handler = async (event, context) => {
    console.log('👤 === USER MANAGEMENT FUNCTION ===');
    console.log('🔍 Method:', event.httpMethod);
    console.log('🔍 Path:', event.path);
    // No se registra event.body: puede contener códigos de acceso
    
    // Headers de respuesta (origen restringido por ALLOWED_ORIGINS)
    const headers = corsHeaders(event);

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

        // 🔐 Toda operación de gestión de usuarios exige sesión con rol admin
        const control = requireSession(event, headers, { rol: 'admin' });
        if (control.error) return control.error;

        // Parsear operación del query string
        const operation = event.queryStringParameters?.operation || 'list';
        const table = event.queryStringParameters?.table || 'Usuarios';
        
        console.log('🎯 Operación:', operation);
        console.log('📋 Tabla:', table);

        // Procesar según la operación
        switch (operation) {
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
                
            case 'approve-request':
                const requestId = event.queryStringParameters?.requestId;
                return await approveAccessRequest(requestId, event.body, AIRTABLE_BASE_ID, AIRTABLE_API_KEY, headers);
                
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
            ...sinCamposSensibles(record.fields)
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

        // Código de 6 dígitos con aleatoriedad criptográfica.
        // Math.random() es predecible y 4 dígitos son 9.000 combinaciones.
        const accessCode = userData.codigoAcceso || generateCode(6);

        const url = `https://api.airtable.com/v0/${baseId}/Usuarios`;
        
        const requestData = {
            fields: {
                nombreCompleto: userData.nombreCompleto,
                email: userData.email,
                telefono: userData.telefono || '',
                servicioHospitalario: userData.servicioHospitalario,
                cargo: userData.cargo || '',
                // Solo se guarda el hash; el código en claro no queda en Airtable
                codigoAccesoHash: hashCode(accessCode),
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
                    ...sinCamposSensibles(result.fields)
                },
                // El código en claro se devuelve UNA sola vez, para que el
                // administrador lo entregue al usuario
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

// 🔄 Actualizar usuario
async function updateUser(userId, bodyData, baseId, apiKey, headers) {
    console.log('🔄 Actualizando usuario:', userId);
    
    try {
        if (!userId) {
            return {
                statusCode: 400,
                headers,
                body: JSON.stringify({ error: 'ID de usuario requerido' })
            };
        }

        const updateData = sinCamposSensibles(JSON.parse(bodyData || '{}'));
        
        const url = `https://api.airtable.com/v0/${baseId}/Usuarios/${userId}`;
        
        const requestData = {
            fields: updateData
        };

        const response = await fetch(url, {
            method: 'PATCH',
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
        
        console.log('✅ Usuario actualizado:', userId);

        return {
            statusCode: 200,
            headers,
            body: JSON.stringify({
                success: true,
                user: {
                    id: result.id,
                    ...sinCamposSensibles(result.fields)
                },
                timestamp: new Date().toISOString()
            })
        };

    } catch (error) {
        console.error('❌ Error actualizando usuario:', error);
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({ error: error.message })
        };
    }
}

// ⚠️ El login de usuarios se hace en netlify/functions/auth-login.js.
// Esta operación queda deshabilitada para no mantener dos caminos de autenticación.
async function validateUserAccess(bodyData, baseId, apiKey, headers) {
    return {
        statusCode: 410,
        headers,
        body: JSON.stringify({
            error: 'Operación movida',
            usar: '/.netlify/functions/auth-login'
        })
    };
}

// 🎲 Generar código de acceso
// Ya no se consulta la tabla para evitar repetidos: los códigos se guardan
// hasheados, no son comparables, y el login es por email + código, así que
// un código repetido entre dos usuarios distintos no da acceso cruzado.
async function generateAccessCode(baseId, apiKey, headers) {
    const code = generateCode(6);

    return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
            success: true,
            accessCode: code,
            timestamp: new Date().toISOString()
        })
    };
}

// ✅ Aprobar solicitud de acceso
async function approveAccessRequest(requestId, bodyData, baseId, apiKey, headers) {
    console.log('✅ Aprobando solicitud de acceso:', requestId);
    
    try {
        if (!requestId) {
            return {
                statusCode: 400,
                headers,
                body: JSON.stringify({ error: 'ID de solicitud requerido' })
            };
        }

        const approvalData = JSON.parse(bodyData || '{}');
        
        // 1. Obtener la solicitud de acceso
        const requestUrl = `https://api.airtable.com/v0/${baseId}/SolicitudesAcceso/${requestId}`;
        
        const requestResponse = await fetch(requestUrl, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json'
            }
        });

        if (!requestResponse.ok) {
            throw new Error('Solicitud de acceso no encontrada');
        }

        const requestData = await requestResponse.json();
        const request = requestData.fields;
        
        // 2. Generar código de acceso único
        const codeResponse = await generateAccessCode(baseId, apiKey, headers);
        const codeData = JSON.parse(codeResponse.body);
        
        if (!codeData.success) {
            throw new Error('No se pudo generar código de acceso');
        }

        const accessCode = codeData.accessCode;
        
        // 3. Crear usuario
        const userData = {
            nombreCompleto: request.nombreCompleto,
            email: request.email,
            telefono: request.telefono || '',
            servicioHospitalario: request.servicioHospitalario,
            cargo: request.cargo,
            codigoAcceso: accessCode, // createUser lo convierte en hash antes de guardarlo
            estado: 'ACTIVO',
            fechaCreacion: new Date().toISOString(),
            solicitudOrigenId: requestId
        };

        const userResponse = await createUser(JSON.stringify(userData), baseId, apiKey, headers);
        const userResult = JSON.parse(userResponse.body);
        
        if (!userResult.success) {
            throw new Error('No se pudo crear usuario');
        }

        // 4. Actualizar estado de la solicitud
        const updateRequestUrl = `https://api.airtable.com/v0/${baseId}/SolicitudesAcceso/${requestId}`;
        
        await fetch(updateRequestUrl, {
            method: 'PATCH',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                fields: {
                    estado: 'APROBADA',
                    fechaAprobacion: new Date().toISOString(),
                    usuarioCreado: userResult.user.id
                }
            })
        });

        console.log('✅ Solicitud aprobada y usuario creado exitosamente');

        return {
            statusCode: 200,
            headers,
            body: JSON.stringify({
                success: true,
                user: userResult.user,
                accessCode: accessCode,
                requestId: requestId,
                timestamp: new Date().toISOString()
            })
        };

    } catch (error) {
        console.error('❌ Error aprobando solicitud:', error);
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({ error: error.message })
        };
    }
}

// 📊 Estadísticas de usuarios
async function getUserStatistics(baseId, apiKey, headers) {
    console.log('📊 Obteniendo estadísticas de usuarios...');
    
    try {
        // Obtener usuarios y solicitudes en paralelo
        const [usersResponse, requestsResponse] = await Promise.all([
            fetch(`https://api.airtable.com/v0/${baseId}/Usuarios`, {
                headers: {
                    'Authorization': `Bearer ${apiKey}`,
                    'Content-Type': 'application/json'
                }
            }),
            fetch(`https://api.airtable.com/v0/${baseId}/SolicitudesAcceso`, {
                headers: {
                    'Authorization': `Bearer ${apiKey}`,
                    'Content-Type': 'application/json'
                }
            })
        ]);

        let users = [];
        let requests = [];

        if (usersResponse.ok) {
            const usersData = await usersResponse.json();
            users = usersData.records.map(r => sinCamposSensibles(r.fields));
        }

        if (requestsResponse.ok) {
            const requestsData = await requestsResponse.json();
            requests = requestsData.records.map(r => r.fields);
        }

        const stats = {
            users: {
                total: users.length,
                active: users.filter(u => u.estado === 'ACTIVO').length,
                inactive: users.filter(u => u.estado === 'INACTIVO').length,
                total_activos: users.filter(u => u.estado === 'ACTIVO').length
            },
            requests: {
                total: requests.length,
                pending: requests.filter(r => r.estado === 'PENDIENTE').length,
                approved: requests.filter(r => r.estado === 'APROBADA').length,
                rejected: requests.filter(r => r.estado === 'RECHAZADA').length
            },
            byService: {},
            byCargo: {},
            timestamp: new Date().toISOString()
        };

        // Estadísticas por servicio
        users.forEach(user => {
            if (user.servicioHospitalario) {
                stats.byService[user.servicioHospitalario] = (stats.byService[user.servicioHospitalario] || 0) + 1;
            }
        });

        // Estadísticas por cargo
        users.forEach(user => {
            if (user.cargo) {
                stats.byCargo[user.cargo] = (stats.byCargo[user.cargo] || 0) + 1;
            }
        });

        console.log('✅ Estadísticas calculadas');

        return {
            statusCode: 200,
            headers,
            body: JSON.stringify({
                success: true,
                statistics: stats
            })
        };

    } catch (error) {
        console.error('❌ Error obteniendo estadísticas:', error);
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({ error: error.message })
        };
    }
}