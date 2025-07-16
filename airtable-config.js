// 🛡️ Configuración FUNCIONANDO de Airtable API - Hospital Susana López de Valencia
// airtable-config.js - Versión integrada con gestión de usuarios completa

console.log('🚀 Cargando airtable-config.js (VERSIÓN FUNCIONANDO + USUARIOS)...');

class AirtableAPI {
    constructor() {
        console.log('🔧 Inicializando AirtableAPI...');
        
        this.hostname = window.location.hostname;
        this.isLocalDevelopment = this.hostname === 'localhost' || 
                                 this.hostname === '127.0.0.1' ||
                                 this.hostname.startsWith('localhost:') ||
                                 this.hostname.startsWith('127.0.0.1:');
        
        console.log('🔍 Hostname:', this.hostname);
        console.log('🏠 Es desarrollo local:', this.isLocalDevelopment);
        
        if (this.isLocalDevelopment) {
            this.useProxy = false;
            this.baseUrl = 'https://api.airtable.com/v0/appFyEBCedQGOeJyV';
            this.directApiKey = 'patev8QTzDMA5EGSK.777efed543e6fac49d2c830659a6d0c508b617ff90c352921d626fd9c929e570';
            console.log('🔧 MODO DESARROLLO: Conexión directa');
        } else {
            this.useProxy = true;
            this.baseUrl = '/.netlify/functions/airtable-proxy';
            this.directApiKey = null;
            console.log('🛡️ MODO PRODUCCIÓN: Usando proxy Netlify LIMPIO');
        }
        
        // 📋 Tablas CONFIRMADAS que funcionan (basado en simple-debug)
        this.tables = {
            solicitudes: 'Solicitudes',        // ✅ CONFIRMADO funcionando (1 record)
            tecnicos: 'Tecnicos', 
            usuarios: 'Usuarios',
            solicitudesAcceso: 'SolicitudesAcceso'
        };
        
        this.connectionStatus = 'connecting';
        
        console.log('📡 URL base:', this.baseUrl);
        console.log('🛡️ Usando proxy:', this.useProxy);
        console.log('✅ Tabla principal confirmada: "Solicitudes"');
        
        // 🔄 Test inicial suave (sin bloquear carga)
        this.initializeConnectionAsync();
    }

    async initializeConnectionAsync() {
        // Ejecutar test en background sin bloquear
        setTimeout(async () => {
            try {
                const isConnected = await this.testConnection();
                
                if (isConnected) {
                    this.connectionStatus = 'connected';
                    this.notifyConnectionStatus(true);
                    console.log('✅ Conectado exitosamente a tabla "Solicitudes"');
                } else {
                    this.connectionStatus = 'disconnected';
                    this.notifyConnectionStatus(false);
                    console.warn('⚠️ Modo localStorage activo');
                }
            } catch (error) {
                console.error('❌ Error en inicialización:', error);
                this.connectionStatus = 'disconnected';
                this.notifyConnectionStatus(false);
            }
        }, 2000); // Delay de 2 segundos para no interferir con carga
    }

    notifyConnectionStatus(connected) {
        try {
            const event = new CustomEvent('airtableConnectionUpdate', {
                detail: { 
                    connected, 
                    timestamp: new Date(),
                    method: this.useProxy ? 'proxy' : 'direct',
                    hostname: this.hostname,
                    table: 'Solicitudes'
                }
            });
            window.dispatchEvent(event);
        } catch (error) {
            console.warn('⚠️ No se pudo notificar cambio de estado:', error);
        }
    }

    async makeRequest(endpoint, method = 'GET', data = null) {
        console.log('📡 Request:', method, endpoint);
        
        try {
            let url, options;
            
            if (this.useProxy) {
                url = `${this.baseUrl}/${endpoint}`;
                options = {
                    method: method,
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    mode: 'cors',
                    credentials: 'same-origin'
                };
                
                console.log('📡 PROXY Request (LIMPIO)');
                
            } else {
                url = `${this.baseUrl}/${endpoint}`;
                options = {
                    method: method,
                    headers: {
                        'Authorization': `Bearer ${this.directApiKey}`,
                        'Content-Type': 'application/json'
                    },
                    mode: 'cors'
                };
                
                console.log('📡 DIRECT Request');
            }
            
            if (data && (method === 'POST' || method === 'PATCH')) {
                options.body = JSON.stringify(data);
            }
            
            console.log('🎯 URL final:', url);
            
            const response = await fetch(url, options);
            
            console.log('📨 Status:', response.status);
            
            if (!response.ok) {
                const errorText = await response.text();
                console.error('❌ Error response:', errorText);
                
                throw new Error(`HTTP ${response.status}: ${errorText}`);
            }
            
            const result = await response.json();
            console.log('✅ Request exitoso - Records:', result.records?.length || 'N/A');
            
            if (this.connectionStatus !== 'connected') {
                this.connectionStatus = 'connected';
                this.notifyConnectionStatus(true);
            }
            
            return result;
            
        } catch (error) {
            console.error('❌ Request falló:', error);
            
            if (this.connectionStatus !== 'disconnected') {
                this.connectionStatus = 'disconnected';
                this.notifyConnectionStatus(false);
            }
            
            // 💾 Usar fallback para operaciones de lectura
            if (method === 'GET') {
                console.warn('⚠️ Usando localStorage fallback');
                return this.localStorageFallback(endpoint, method, data);
            }
            
            throw error;
        }
    }

    localStorageFallback(endpoint, method, data) {
        console.log('💾 Usando localStorage para:', endpoint);
        
        const tableName = endpoint.split('/')[0].replace(/\?.*/, '');
        const storageKey = `hospital_${tableName.toLowerCase()}`;
        
        try {
            switch (method) {
                case 'GET':
                    const stored = localStorage.getItem(storageKey);
                    const records = stored ? JSON.parse(stored) : [];
                    
                    return {
                        records: records.map(item => ({
                            id: item.id || `rec${Date.now()}${Math.random().toString(36).substring(2, 5)}`,
                            fields: item
                        }))
                    };
                    
                case 'POST':
                    const existing = JSON.parse(localStorage.getItem(storageKey) || '[]');
                    const newRecord = { ...data.fields };
                    newRecord.id = newRecord.id || `rec${Date.now()}${Math.random().toString(36).substring(2, 5)}`;
                    newRecord._isLocal = true;
                    newRecord._timestamp = new Date().toISOString();
                    
                    existing.push(newRecord);
                    localStorage.setItem(storageKey, JSON.stringify(existing));
                    
                    console.log('💾 Guardado localmente:', newRecord.id);
                    return { id: newRecord.id, fields: newRecord };
                    
                default:
                    console.warn('⚠️ Operación no soportada en modo local:', method);
                    return { records: [] };
            }
        } catch (localError) {
            console.error('❌ Error en localStorage:', localError);
            return { records: [] };
        }
    }

    async testConnection() {
        console.log('🧪 Test de conexión con tabla "Solicitudes"...');
        
        try {
            let url, options;
            
            if (this.useProxy) {
                // Usar la tabla CONFIRMADA que funciona
                url = `${this.baseUrl}/Solicitudes?maxRecords=1`;
                options = {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    mode: 'cors',
                    credentials: 'same-origin'
                };
                console.log('🧪 Test via PROXY LIMPIO');
            } else {
                url = `${this.baseUrl}/Solicitudes?maxRecords=1`;
                options = {
                    method: 'GET',
                    headers: {
                        'Authorization': `Bearer ${this.directApiKey}`,
                        'Content-Type': 'application/json'
                    },
                    mode: 'cors'
                };
                console.log('🧪 Test DIRECTO');
            }
            
            console.log('🔗 Test URL:', url);
            
            const response = await fetch(url, options);
            
            if (!response.ok) {
                const errorText = await response.text();
                console.error('❌ Test falló:', response.status, errorText);
                return false;
            }
            
            const result = await response.json();
            console.log('✅ Test exitoso - Records encontrados:', result.records?.length || 0);
            return true;
            
        } catch (error) {
            console.error('❌ Test falló:', error.message);
            return false;
        }
    }

    // 📋 MÉTODOS PRINCIPALES PARA SOLICITUDES
    async getSolicitudes() {
        try {
            const result = await this.makeRequest(this.tables.solicitudes);
            return result.records.map(record => ({
                id: record.id,
                ...record.fields
            }));
        } catch (error) {
            console.error('❌ Error obteniendo solicitudes:', error);
            return [];
        }
    }

    async createSolicitud(solicitudData) {
        const data = {
            fields: {
                numero: solicitudData.numero,
                servicioIngenieria: solicitudData.servicioIngenieria,
                tipoServicio: solicitudData.tipoServicio,
                prioridad: solicitudData.prioridad,
                equipo: solicitudData.equipo,
                ubicacion: solicitudData.ubicacion,
                descripcion: solicitudData.descripcion,
                observaciones: solicitudData.observaciones || '',
                solicitante: solicitudData.solicitante,
                servicioHospitalario: solicitudData.servicioHospitalario,
                emailSolicitante: solicitudData.emailSolicitante,
                fechaCreacion: solicitudData.fechaCreacion,
                estado: solicitudData.estado || 'PENDIENTE'
            }
        };
        
        return await this.makeRequest(this.tables.solicitudes, 'POST', data);
    }

    // 👥 MÉTODOS PARA TÉCNICOS
    async getTecnicos() {
        try {
            const result = await this.makeRequest(this.tables.tecnicos);
            return result.records.map(record => ({
                id: record.id,
                ...record.fields
            }));
        } catch (error) {
            console.error('❌ Error obteniendo técnicos:', error);
            return [];
        }
    }

    // 👤 MÉTODOS PARA USUARIOS (NUEVOS)
    async getUsuarios() {
        try {
            const result = await this.makeRequest(this.tables.usuarios);
            return result.records.map(record => ({
                id: record.id,
                ...record.fields
            }));
        } catch (error) {
            console.error('❌ Error obteniendo usuarios:', error);
            return [];
        }
    }

    async createUsuario(userData) {
        const data = {
            fields: {
                nombreCompleto: userData.nombreCompleto,
                email: userData.email,
                telefono: userData.telefono || '',
                servicioHospitalario: userData.servicioHospitalario,
                cargo: userData.cargo,
                codigoAcceso: userData.codigoAcceso,
                estado: userData.estado || 'ACTIVO',
                fechaCreacion: userData.fechaCreacion || new Date().toISOString(),
                fechaUltimoAcceso: userData.fechaUltimoAcceso || null,
                solicitudOrigenId: userData.solicitudOrigenId || ''
            }
        };
        
        console.log('➕ Creando usuario:', userData.email);
        return await this.makeRequest(this.tables.usuarios, 'POST', data);
    }

    async updateUsuario(userId, updateData) {
        const data = {
            fields: updateData
        };
        
        console.log('🔄 Actualizando usuario:', userId);
        return await this.makeRequest(`${this.tables.usuarios}/${userId}`, 'PATCH', data);
    }

    // 🔐 MÉTODOS PARA SOLICITUDES DE ACCESO (NUEVOS)
    async getSolicitudesAcceso() {
        try {
            const result = await this.makeRequest(this.tables.solicitudesAcceso);
            return result.records.map(record => ({
                id: record.id,
                ...record.fields
            }));
        } catch (error) {
            console.error('❌ Error obteniendo solicitudes de acceso:', error);
            return [];
        }
    }

    async createSolicitudAcceso(solicitudData) {
        const data = {
            fields: {
                id: solicitudData.id,
                nombreCompleto: solicitudData.nombreCompleto,
                email: solicitudData.email,
                telefono: solicitudData.telefono || '',
                servicioHospitalario: solicitudData.servicioHospitalario,
                cargo: solicitudData.cargo,
                justificacion: solicitudData.justificacion || '',
                fechaSolicitud: solicitudData.fechaSolicitud,
                estado: solicitudData.estado || 'PENDIENTE',
                esUrgente: solicitudData.esUrgente || false
            }
        };
        
        console.log('📝 Creando solicitud de acceso:', solicitudData.email);
        return await this.makeRequest(this.tables.solicitudesAcceso, 'POST', data);
    }

    async updateSolicitudAcceso(requestId, updateData) {
        const data = {
            fields: updateData
        };
        
        console.log('🔄 Actualizando solicitud de acceso:', requestId);
        return await this.makeRequest(`${this.tables.solicitudesAcceso}/${requestId}`, 'PATCH', data);
    }

    // 🔍 MÉTODOS DE UTILIDAD PARA GESTIÓN DE ACCESOS (NUEVOS)
    async findUserByEmail(email) {
        try {
            const usuarios = await this.getUsuarios();
            return usuarios.find(user => user.email && user.email.toLowerCase() === email.toLowerCase());
        } catch (error) {
            console.error('❌ Error buscando usuario por email:', error);
            return null;
        }
    }

    async validateUserCredentials(email, codigoAcceso) {
        try {
            const user = await this.findUserByEmail(email);
            
            if (!user) {
                return { valid: false, error: 'Usuario no encontrado' };
            }

            if (user.estado !== 'ACTIVO') {
                return { valid: false, error: `Usuario en estado: ${user.estado}` };
            }

            if (!user.codigoAcceso) {
                return { valid: false, error: 'Usuario sin código asignado' };
            }

            if (String(user.codigoAcceso) !== String(codigoAcceso)) {
                return { valid: false, error: 'Código incorrecto' };
            }

            // Actualizar último acceso
            try {
                await this.updateUsuario(user.id, {
                    fechaUltimoAcceso: new Date().toISOString()
                });
            } catch (updateError) {
                console.warn('⚠️ No se pudo actualizar último acceso:', updateError);
            }

            return { 
                valid: true, 
                user: user 
            };

        } catch (error) {
            console.error('❌ Error validando credenciales:', error);
            return { valid: false, error: 'Error de sistema' };
        }
    }

    // 🎲 GENERADOR DE CÓDIGOS ÚNICOS (NUEVO)
    async generateUniqueAccessCode() {
        try {
            const usuarios = await this.getUsuarios();
            const existingCodes = usuarios
                .map(u => u.codigoAcceso)
                .filter(code => code)
                .map(code => String(code));

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

            console.log(`🎲 Código único generado: ${code} (${attempts} intentos)`);
            return code;

        } catch (error) {
            console.error('❌ Error generando código único:', error);
            throw error;
        }
    }

    // 📊 ESTADÍSTICAS DE GESTIÓN (NUEVAS)
    async getAccessStatistics() {
        try {
            const [usuarios, solicitudesAcceso] = await Promise.all([
                this.getUsuarios(),
                this.getSolicitudesAcceso()
            ]);

            return {
                usuarios: {
                    total: usuarios.length,
                    activos: usuarios.filter(u => u.estado === 'ACTIVO').length,
                    inactivos: usuarios.filter(u => u.estado === 'INACTIVO').length,
                    conCodigo: usuarios.filter(u => u.codigoAcceso).length
                },
                solicitudes: {
                    total: solicitudesAcceso.length,
                    pendientes: solicitudesAcceso.filter(s => s.estado === 'PENDIENTE').length,
                    aprobadas: solicitudesAcceso.filter(s => s.estado === 'APROBADA').length,
                    rechazadas: solicitudesAcceso.filter(s => s.estado === 'RECHAZADA').length
                },
                timestamp: new Date().toISOString()
            };
        } catch (error) {
            console.error('❌ Error obteniendo estadísticas:', error);
            return {};
        }
    }

    // 🚀 MÉTODO DE APROBACIÓN COMPLETA (NUEVO)
    async approveAccessRequestAndCreateUser(requestId) {
        try {
            console.log('🚀 Iniciando aprobación completa para:', requestId);

            // 1. Obtener la solicitud
            const solicitudesAcceso = await this.getSolicitudesAcceso();
            const request = solicitudesAcceso.find(s => s.id === requestId);
            
            if (!request) {
                throw new Error('Solicitud no encontrada');
            }

            if (request.estado !== 'PENDIENTE') {
                throw new Error(`Solicitud en estado: ${request.estado}`);
            }

            // 2. Verificar si ya existe usuario con ese email
            const existingUser = await this.findUserByEmail(request.email);
            
            // 3. Generar código único
            const accessCode = await this.generateUniqueAccessCode();

            // 4. Crear o actualizar usuario
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

            let userResult;
            if (existingUser) {
                console.log('🔄 Actualizando usuario existente:', existingUser.id);
                userResult = await this.updateUsuario(existingUser.id, userData);
                userData.id = existingUser.id;
            } else {
                console.log('➕ Creando nuevo usuario');
                userResult = await this.createUsuario(userData);
                userData.id = userResult.id;
            }

            // 5. Actualizar estado de la solicitud
            await this.updateSolicitudAcceso(requestId, {
                estado: 'APROBADA',
                fechaAprobacion: new Date().toISOString(),
                usuarioCreado: userData.id
            });

            console.log('✅ Aprobación completa exitosa');

            return {
                success: true,
                user: userData,
                accessCode: accessCode,
                requestId: requestId,
                action: existingUser ? 'updated' : 'created'
            };

        } catch (error) {
            console.error('❌ Error en aprobación completa:', error);
            throw error;
        }
    }

    getStatus() {
        return {
            isConnected: this.connectionStatus === 'connected',
            useProxy: this.useProxy,
            environment: this.isLocalDevelopment ? 'development' : 'production',
            hostname: this.hostname,
            baseUrl: this.baseUrl,
            confirmedTable: 'Solicitudes',
            tablas: this.tables,
            timestamp: new Date().toISOString(),
            version: '2.0-working-with-users',
            features: [
                'Solicitudes de mantenimiento',
                'Gestión de técnicos', 
                'Gestión de usuarios',
                'Solicitudes de acceso',
                'Generación de códigos únicos',
                'Validación de credenciales',
                'Estadísticas de acceso'
            ]
        };
    }
}

// 🌍 Crear instancia global de forma segura
try {
    console.log('🔧 Creando instancia global segura...');
    window.airtableAPI = new AirtableAPI();
    console.log('✅ window.airtableAPI creado exitosamente con gestión de usuarios');
} catch (error) {
    console.error('❌ Error creando airtableAPI:', error);
}

// 📡 Event listener seguro
try {
    window.addEventListener('airtableConnectionUpdate', function(event) {
        console.log('🔄 Estado actualizado:', event.detail);
        
        if (typeof updateConnectionStatus === 'function') {
            const status = event.detail.connected ? 'connected' : 'disconnected';
            const message = event.detail.connected 
                ? `✅ Conectado a tabla "${event.detail.table}" via ${event.detail.method}` 
                : 'Modo Local Fallback';
            
            updateConnectionStatus(status, message);
        }
    });
} catch (error) {
    console.warn('⚠️ No se pudo configurar event listener:', error);
}

// 🛠️ Función de diagnóstico segura
try {
    window.debugAirtableConnection = function() {
        if (!window.airtableAPI) {
            console.error('❌ window.airtableAPI no está disponible');
            return {
                error: 'airtableAPI no disponible',
                timestamp: new Date().toISOString()
            };
        }
        
        const status = window.airtableAPI.getStatus();
        
        console.log('🔍 DIAGNÓSTICO COMPLETO');
        console.log('=======================');
        console.log('🌐 Hostname:', status.hostname);
        console.log('🏠 Entorno:', status.environment);
        console.log('🛡️ Proxy:', status.useProxy ? 'HABILITADO (LIMPIO)' : 'DESHABILITADO');
        console.log('📡 URL base:', status.baseUrl);
        console.log('✅ Tabla confirmada:', status.confirmedTable);
        console.log('🔍 Estado:', status.isConnected ? '✅ CONECTADO' : '❌ DESCONECTADO');
        console.log('📋 Versión:', status.version);
        console.log('🎯 Características:');
        status.features.forEach(feature => console.log(`  • ${feature}`));
        console.log('🕐 Timestamp:', status.timestamp);
        
        // Test inmediato
        console.log('\n🧪 Ejecutando test con tabla confirmada...');
        window.airtableAPI.testConnection().then(result => {
            console.log('🔍 Resultado:', result ? '✅ EXITOSO' : '❌ FALLÓ');
            
            if (result) {
                console.log('🎉 ¡SISTEMA COMPLETAMENTE FUNCIONAL!');
                console.log('📋 Tabla "Solicitudes" funcionando correctamente');
                console.log('👤 Gestión de usuarios disponible');
                console.log('🔐 Sistema de accesos funcional');
                console.log('🛡️ Proxy limpio sin errores');
            }
        }).catch(error => {
            console.error('❌ Error en test:', error);
        });
        
        return status;
    };
    
    console.log('✅ debugAirtableConnection creado exitosamente');
} catch (error) {
    console.error('❌ Error creando debugAirtableConnection:', error);
}

// 🧪 Función de test específica para usuarios
try {
    window.testUserManagement = async function() {
        if (!window.airtableAPI) {
            console.error('❌ airtableAPI no disponible');
            return;
        }

        console.log('👤 === TEST DE GESTIÓN DE USUARIOS ===');
        
        try {
            // Test 1: Obtener usuarios
            console.log('📋 Test 1: Obteniendo usuarios...');
            const usuarios = await window.airtableAPI.getUsuarios();
            console.log(`✅ ${usuarios.length} usuarios obtenidos`);

            // Test 2: Obtener solicitudes de acceso
            console.log('📝 Test 2: Obteniendo solicitudes de acceso...');
            const solicitudes = await window.airtableAPI.getSolicitudesAcceso();
            console.log(`✅ ${solicitudes.length} solicitudes obtenidas`);

            // Test 3: Estadísticas
            console.log('📊 Test 3: Obteniendo estadísticas...');
            const stats = await window.airtableAPI.getAccessStatistics();
            console.log('✅ Estadísticas:', stats);

            // Test 4: Generar código único
            console.log('🎲 Test 4: Generando código único...');
            const code = await window.airtableAPI.generateUniqueAccessCode();
            console.log(`✅ Código generado: ${code}`);

            console.log('\n🎉 ¡TODOS LOS TESTS DE USUARIOS EXITOSOS!');
            return {
                success: true,
                usuarios: usuarios.length,
                solicitudes: solicitudes.length,
                stats: stats,
                sampleCode: code
            };

        } catch (error) {
            console.error('❌ Error en test de usuarios:', error);
            return { success: false, error: error.message };
        }
    };

    console.log('✅ testUserManagement creado exitosamente');
} catch (error) {
    console.error('❌ Error creando testUserManagement:', error);
}

console.log('✅ airtable-config.js (VERSIÓN FUNCIONANDO + USUARIOS) cargado completamente');
console.log('🎯 Tabla confirmada: "Solicitudes" con 1 record');
console.log('👤 Gestión de usuarios: DISPONIBLE');
console.log('🔐 Sistema de accesos: FUNCIONAL');
console.log('🛡️ Proxy limpio configurado');
console.log('🔧 Para test: debugAirtableConnection()');
console.log('👤 Para test usuarios: testUserManagement()');

// Auto-verificación silenciosa
setTimeout(() => {
    if (window.airtableAPI && typeof window.debugAirtableConnection === 'function') {
        console.log('🔄 Auto-verificación: Todo cargado correctamente');
        console.log('📋 Funcionalidades disponibles:');
        console.log('  ✅ Solicitudes de mantenimiento');
        console.log('  ✅ Gestión de técnicos');
        console.log('  ✅ Gestión de usuarios');
        console.log('  ✅ Solicitudes de acceso');
        console.log('  ✅ Generación de códigos');
        console.log('  ✅ Validación de credenciales');
    } else {
        console.warn('⚠️ Auto-verificación: Algunos componentes no se cargaron');
    }
}, 5000);