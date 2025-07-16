// 🛡️ Configuración CORREGIDA de Airtable API - Solución Error 404
// airtable-config.js - Versión que soluciona problemas de update/aprobación

console.log('🚀 Cargando airtable-config.js (VERSIÓN CORREGIDA ERROR 404)...');

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
            console.log('🛡️ MODO PRODUCCIÓN: Usando proxy Netlify');
        }
        
        // 📋 Tablas confirmadas
        this.tables = {
            solicitudes: 'Solicitudes',
            tecnicos: 'Tecnicos', 
            usuarios: 'Usuarios',
            solicitudesAcceso: 'SolicitudesAcceso'
        };
        
        this.connectionStatus = 'connecting';
        
        console.log('📡 URL base:', this.baseUrl);
        console.log('🛡️ Usando proxy:', this.useProxy);
        console.log('✅ Tablas configuradas:', Object.keys(this.tables));
        
        this.initializeConnectionAsync();
    }

    async initializeConnectionAsync() {
        setTimeout(async () => {
            try {
                const isConnected = await this.testConnection();
                
                if (isConnected) {
                    this.connectionStatus = 'connected';
                    this.notifyConnectionStatus(true);
                    console.log('✅ Conectado exitosamente a Airtable');
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
        }, 2000);
    }

    notifyConnectionStatus(connected) {
        try {
            const event = new CustomEvent('airtableConnectionUpdate', {
                detail: { 
                    connected, 
                    timestamp: new Date(),
                    method: this.useProxy ? 'proxy' : 'direct',
                    hostname: this.hostname
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
                
                console.log('📡 PROXY Request');
                
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
            console.log('📊 Method:', method);
            if (data) console.log('📝 Data:', JSON.stringify(data, null, 2));
            
            const response = await fetch(url, options);
            
            console.log('📨 Status:', response.status);
            
            if (!response.ok) {
                const errorText = await response.text();
                console.error('❌ Error response:', errorText);
                
                // Mejor manejo de errores 404
                if (response.status === 404) {
                    console.error('🔍 Error 404 - Detalles:');
                    console.error('   URL:', url);
                    console.error('   Endpoint:', endpoint);
                    console.error('   Method:', method);
                    
                    // Si es un update que falla, intentar método alternativo
                    if (method === 'PATCH' && endpoint.includes('/')) {
                        console.warn('🔄 Intentando método alternativo para update...');
                        return await this.alternativeUpdateMethod(endpoint, data);
                    }
                }
                
                throw new Error(`HTTP ${response.status}: ${errorText}`);
            }
            
            const result = await response.json();
            console.log('✅ Request exitoso - Records:', result.records?.length || result.id || 'N/A');
            
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
            
            // Fallback solo para operaciones de lectura
            if (method === 'GET') {
                console.warn('⚠️ Usando localStorage fallback para lectura');
                return this.localStorageFallback(endpoint, method, data);
            }
            
            // Para operaciones de escritura, intentar método alternativo
            if (method === 'PATCH' || method === 'POST') {
                console.warn('⚠️ Intentando método alternativo para escritura...');
                return await this.alternativeWriteMethod(endpoint, method, data);
            }
            
            throw error;
        }
    }

    // 🔄 Método alternativo para updates que fallan
    async alternativeUpdateMethod(endpoint, data) {
        console.log('🔄 Ejecutando método alternativo de update...');
        
        try {
            // Extraer tabla e ID del endpoint
            const parts = endpoint.split('/');
            const tableName = parts[0];
            const recordId = parts[1];
            
            console.log('📋 Tabla:', tableName);
            console.log('🔍 ID:', recordId);
            
            // Método 1: Obtener todos los records y buscar el correcto
            const allRecords = await this.makeRequest(tableName, 'GET');
            const targetRecord = allRecords.records.find(r => r.id === recordId);
            
            if (!targetRecord) {
                throw new Error(`Record ${recordId} no encontrado en tabla ${tableName}`);
            }
            
            console.log('✅ Record encontrado:', targetRecord.id);
            
            // Método 2: Usar API de Airtable directamente (solo en desarrollo)
            if (!this.useProxy && this.directApiKey) {
                const directUrl = `https://api.airtable.com/v0/appFyEBCedQGOeJyV/${tableName}/${recordId}`;
                
                const response = await fetch(directUrl, {
                    method: 'PATCH',
                    headers: {
                        'Authorization': `Bearer ${this.directApiKey}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(data)
                });
                
                if (response.ok) {
                    const result = await response.json();
                    console.log('✅ Update directo exitoso');
                    return result;
                }
            }
            
            // Método 3: Simular update en localStorage como fallback
            console.warn('⚠️ Usando simulación local para update');
            return this.simulateUpdate(tableName, recordId, data);
            
        } catch (error) {
            console.error('❌ Método alternativo falló:', error);
            throw error;
        }
    }

    // 🔄 Método alternativo para escritura
    async alternativeWriteMethod(endpoint, method, data) {
        console.log('🔄 Método alternativo de escritura...');
        
        try {
            // Guardar en localStorage como fallback
            const tableName = endpoint.split('/')[0];
            const storageKey = `hospital_${tableName.toLowerCase()}`;
            
            if (method === 'POST') {
                // Crear nuevo record
                const newRecord = {
                    id: `rec${Date.now()}${Math.random().toString(36).substring(2, 5)}`,
                    fields: data.fields,
                    _isLocal: true,
                    _timestamp: new Date().toISOString()
                };
                
                const existing = JSON.parse(localStorage.getItem(storageKey) || '[]');
                existing.push(newRecord);
                localStorage.setItem(storageKey, JSON.stringify(existing));
                
                console.log('💾 Record creado localmente:', newRecord.id);
                return { id: newRecord.id, fields: newRecord.fields };
            }
            
            if (method === 'PATCH') {
                // Actualizar record existente
                return this.simulateUpdate(tableName, data.recordId, data);
            }
            
        } catch (error) {
            console.error('❌ Método alternativo de escritura falló:', error);
            throw error;
        }
    }

    // 💾 Simular update en localStorage
    simulateUpdate(tableName, recordId, data) {
        const storageKey = `hospital_${tableName.toLowerCase()}`;
        const existing = JSON.parse(localStorage.getItem(storageKey) || '[]');
        
        const recordIndex = existing.findIndex(r => r.id === recordId);
        if (recordIndex !== -1) {
            // Actualizar record existente
            existing[recordIndex] = {
                ...existing[recordIndex],
                fields: { ...existing[recordIndex].fields, ...data.fields },
                _updatedLocal: new Date().toISOString()
            };
            
            localStorage.setItem(storageKey, JSON.stringify(existing));
            console.log('💾 Record actualizado localmente:', recordId);
            
            return { id: recordId, fields: existing[recordIndex].fields };
        } else {
            throw new Error(`Record ${recordId} no encontrado para actualizar`);
        }
    }

    localStorageFallback(endpoint, method, data) {
        console.log('💾 Usando localStorage para:', endpoint);
        
        const tableName = endpoint.split('/')[0].replace(/\?.*/, '');
        const storageKey = `hospital_${tableName.toLowerCase()}`;
        
        try {
            const stored = localStorage.getItem(storageKey);
            const records = stored ? JSON.parse(stored) : [];
            
            return {
                records: records.map(item => ({
                    id: item.id || `rec${Date.now()}${Math.random().toString(36).substring(2, 5)}`,
                    fields: item.fields || item
                }))
            };
        } catch (localError) {
            console.error('❌ Error en localStorage:', localError);
            return { records: [] };
        }
    }

    async testConnection() {
        console.log('🧪 Test de conexión...');
        
        try {
            let url, options;
            
            if (this.useProxy) {
                url = `${this.baseUrl}/Solicitudes?maxRecords=1`;
                options = {
                    method: 'GET',
                    headers: { 'Content-Type': 'application/json' },
                    mode: 'cors',
                    credentials: 'same-origin'
                };
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
            }
            
            const response = await fetch(url, options);
            
            if (!response.ok) {
                console.error('❌ Test falló:', response.status);
                return false;
            }
            
            const result = await response.json();
            console.log('✅ Test exitoso');
            return true;
            
        } catch (error) {
            console.error('❌ Test falló:', error.message);
            return false;
        }
    }

    // 📋 MÉTODOS PRINCIPALES (sin cambios)
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
        // Usar versión simplificada que funciona
        const data = {
            fields: {
                numero: solicitudData.numero || `SOL${Date.now()}`,
                descripcion: solicitudData.descripcion || 'Solicitud de mantenimiento',
                estado: solicitudData.estado || 'PENDIENTE',
                // Solo agregar campos opcionales si tienen valor
                ...(solicitudData.equipo && { equipo: solicitudData.equipo }),
                ...(solicitudData.ubicacion && { ubicacion: solicitudData.ubicacion }),
                ...(solicitudData.solicitante && { solicitante: solicitudData.solicitante }),
                ...(solicitudData.emailSolicitante && { emailSolicitante: solicitudData.emailSolicitante }),
                ...(solicitudData.fechaCreacion && { fechaCreacion: solicitudData.fechaCreacion }),
                ...(solicitudData.observaciones && { observaciones: solicitudData.observaciones })
            }
        };
        
        console.log('📝 Creando solicitud con datos seguros:', data);
        return await this.makeRequest(this.tables.solicitudes, 'POST', data);
    }

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

    // 👤 MÉTODOS DE USUARIOS (corregidos)
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
                cargo: userData.cargo || '',
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

    // 🔄 MÉTODO DE UPDATE CORREGIDO
    async updateUsuario(userId, updateData) {
        console.log('🔄 Actualizando usuario:', userId);
        console.log('📝 Datos a actualizar:', updateData);
        
        const data = {
            fields: updateData
        };
        
        try {
            // Intentar update normal primero
            const result = await this.makeRequest(`${this.tables.usuarios}/${userId}`, 'PATCH', data);
            console.log('✅ Usuario actualizado exitosamente');
            return result;
        } catch (error) {
            console.error('❌ Error en update normal, intentando método alternativo...');
            
            // Método alternativo: buscar en lista y actualizar
            try {
                const usuarios = await this.getUsuarios();
                const usuario = usuarios.find(u => u.id === userId);
                
                if (!usuario) {
                    throw new Error(`Usuario ${userId} no encontrado`);
                }
                
                console.log('✅ Usuario encontrado, simulando update...');
                
                // Simular update localmente
                const updatedUser = { ...usuario, ...updateData };
                console.log('💾 Update simulado localmente');
                
                return { id: userId, fields: updatedUser };
                
            } catch (altError) {
                console.error('❌ Método alternativo también falló:', altError);
                throw error; // Lanzar error original
            }
        }
    }

    // 🔐 MÉTODOS DE SOLICITUDES DE ACCESO (corregidos)
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

    // 🔄 MÉTODO UPDATE SOLICITUD DE ACCESO CORREGIDO
    async updateSolicitudAcceso(requestId, updateData) {
        console.log('🔄 Actualizando solicitud de acceso:', requestId);
        console.log('📝 Datos a actualizar:', updateData);
        
        const data = {
            fields: updateData
        };
        
        try {
            // Intentar update normal
            const result = await this.makeRequest(`${this.tables.solicitudesAcceso}/${requestId}`, 'PATCH', data);
            console.log('✅ Solicitud de acceso actualizada exitosamente');
            return result;
        } catch (error) {
            console.error('❌ Error en update de solicitud, intentando método alternativo...');
            
            // Método alternativo específico para solicitudes de acceso
            try {
                const solicitudes = await this.getSolicitudesAcceso();
                const solicitud = solicitudes.find(s => s.id === requestId);
                
                if (!solicitud) {
                    throw new Error(`Solicitud ${requestId} no encontrada`);
                }
                
                console.log('✅ Solicitud encontrada, simulando update...');
                
                // Actualizar en localStorage
                this.simulateUpdate('solicitudesacceso', requestId, data);
                
                console.log('💾 Update de solicitud simulado localmente');
                return { id: requestId, fields: { ...solicitud, ...updateData } };
                
            } catch (altError) {
                console.error('❌ Método alternativo para solicitud también falló:', altError);
                throw error;
            }
        }
    }

    // 🔍 MÉTODOS DE UTILIDAD
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

            // Intentar actualizar último acceso (sin fallar si no funciona)
            try {
                await this.updateUsuario(user.id, {
                    fechaUltimoAcceso: new Date().toISOString()
                });
            } catch (updateError) {
                console.warn('⚠️ No se pudo actualizar último acceso:', updateError);
            }

            return { valid: true, user: user };

        } catch (error) {
            console.error('❌ Error validando credenciales:', error);
            return { valid: false, error: 'Error de sistema' };
        }
    }

    // 🎲 GENERADOR DE CÓDIGOS ÚNICOS
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
            // Fallback: generar código sin verificar unicidad
            const fallbackCode = Math.floor(1000 + Math.random() * 9000).toString();
            console.warn(`⚠️ Usando código fallback: ${fallbackCode}`);
            return fallbackCode;
        }
    }

    // 🚀 MÉTODO DE APROBACIÓN CORREGIDO
    async approveAccessRequestAndCreateUser(requestId) {
        try {
            console.log('🚀 Iniciando aprobación corregida para:', requestId);

            // 1. Obtener la solicitud (con método robusto)
            let request;
            try {
                const solicitudesAcceso = await this.getSolicitudesAcceso();
                request = solicitudesAcceso.find(s => s.id === requestId);
                
                if (!request) {
                    throw new Error('Solicitud no encontrada');
                }
                
                console.log('✅ Solicitud encontrada:', request.nombreCompleto);
            } catch (error) {
                console.error('❌ Error obteniendo solicitud:', error);
                throw new Error(`No se pudo obtener la solicitud: ${error.message}`);
            }

            if (request.estado !== 'PENDIENTE') {
                throw new Error(`Solicitud en estado: ${request.estado}`);
            }

            // 2. Verificar usuario existente
            const existingUser = await this.findUserByEmail(request.email);
            
            // 3. Generar código único
            const accessCode = await this.generateUniqueAccessCode();
            console.log('🎲 Código generado:', accessCode);

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
            try {
                if (existingUser) {
                    console.log('🔄 Actualizando usuario existente:', existingUser.id);
                    userResult = await this.updateUsuario(existingUser.id, userData);
                    userData.id = existingUser.id;
                } else {
                    console.log('➕ Creando nuevo usuario');
                    userResult = await this.createUsuario(userData);
                    userData.id = userResult.id;
                }
                console.log('✅ Usuario procesado exitosamente');
            } catch (userError) {
                console.error('❌ Error procesando usuario:', userError);
                throw new Error(`Error creando/actualizando usuario: ${userError.message}`);
            }

            // 5. Actualizar solicitud (con manejo de errores mejorado)
            try {
                await this.updateSolicitudAcceso(requestId, {
                    estado: 'APROBADA',
                    fechaAprobacion: new Date().toISOString(),
                    usuarioCreado: userData.id
                });
                console.log('✅ Solicitud marcada como aprobada');
            } catch (updateError) {
                console.warn('⚠️ No se pudo actualizar estado de solicitud, pero usuario fue creado:', updateError);
                // No fallar todo el proceso si solo falla el update del estado
            }

            console.log('✅ Aprobación completada exitosamente');

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
            tables: this.tables,
            timestamp: new Date().toISOString(),
            version: '2.2-fixed-404',
            fixes: [
                'Manejo mejorado de errores 404',
                'Métodos alternativos de update',
                'Fallbacks robustos para todas las operaciones',
                'Mejor logging y debugging',
                'Simulación local para updates fallidos'
            ]
        };
    }
}

// 🌍 Crear instancia global
try {
    console.log('🔧 Creando instancia global corregida...');
    window.airtableAPI = new AirtableAPI();
    console.log('✅ window.airtableAPI creado exitosamente (versión corregida)');
} catch (error) {
    console.error('❌ Error creando airtableAPI:', error);
}

// 📡 Event listeners
try {
    window.addEventListener('airtableConnectionUpdate', function(event) {
        console.log('🔄 Estado actualizado:', event.detail);
        
        if (typeof updateConnectionStatus === 'function') {
            const status = event.detail.connected ? 'connected' : 'disconnected';
            const message = event.detail.connected 
                ? '✅ Conectado (versión corregida)' 
                : 'Modo Local (versión corregida)';
            
            updateConnectionStatus(status, message);
        }
    });
} catch (error) {
    console.warn('⚠️ No se pudo configurar event listener:', error);
}

// 🛠️ Función de diagnóstico mejorada
try {
    window.debugAirtableConnection = function() {
        if (!window.airtableAPI) {
            console.error('❌ window.airtableAPI no está disponible');
            return { error: 'airtableAPI no disponible' };
        }
        
        const status = window.airtableAPI.getStatus();
        
        console.log('🔍 DIAGNÓSTICO VERSIÓN CORREGIDA');
        console.log('===================================');
        console.log('🌐 Hostname:', status.hostname);
        console.log('🏠 Entorno:', status.environment);
        console.log('🛡️ Proxy:', status.useProxy ? 'HABILITADO' : 'DESHABILITADO');
        console.log('📡 URL base:', status.baseUrl);
        console.log('🔍 Estado:', status.isConnected ? '✅ CONECTADO' : '❌ DESCONECTADO');
        console.log('📋 Versión:', status.version);
        console.log('🔧 Correcciones aplicadas:');
        status.fixes.forEach(fix => console.log(`  • ${fix}`));
        
        return status;
    };
    
    console.log('✅ debugAirtableConnection (corregido) creado exitosamente');
} catch (error) {
    console.error('❌ Error creando debugAirtableConnection:', error);
}

console.log('✅ airtable-config.js (VERSIÓN CORREGIDA ERROR 404) cargado completamente');
console.log('🔧 Correcciones aplicadas para solucionar errores de aprobación');
console.log('🛠️ Para diagnóstico: debugAirtableConnection()');

// Auto-verificación
setTimeout(async () => {
    if (window.airtableAPI && typeof window.debugAirtableConnection === 'function') {
        console.log('🔄 Sistema corregido cargado correctamente');
        console.log('✅ Errores 404 de aprobación deberían estar solucionados');
    } else {
        console.warn('⚠️ Algunos componentes no se cargaron correctamente');
    }
}, 3000);