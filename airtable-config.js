// 🛡️ Configuración Segura de Airtable API
// Hospital Susana López de Valencia - Sistema de Gestión

console.log('🚀 Cargando airtable-config.js (Versión Segura)...');

class AirtableAPI {
    constructor() {
        console.log('🔧 Inicializando AirtableAPI...');
        
        // 🌐 Detección de entorno
        this.hostname = window.location.hostname;
        console.log('🔍 Hostname detectado:', this.hostname);
        
        // 🏠 Solo localhost permite conexión directa
        this.isLocalDevelopment = this.hostname === 'localhost' || 
                                 this.hostname === '127.0.0.1' ||
                                 this.hostname.startsWith('localhost:') ||
                                 this.hostname.startsWith('127.0.0.1:');
        
        console.log('🏠 Es desarrollo local:', this.isLocalDevelopment);
        
        // ⚙️ Configuración según entorno
        if (this.isLocalDevelopment) {
            // 🔧 DESARROLLO: Conexión directa (solo para testing)
            this.useProxy = false;
            this.baseUrl = 'https://api.airtable.com/v0/appFyEBCedQGOeJyV';
            this.directApiKey = 'patev8QTzDMA5EGSK.777efed543e6fac49d2c830659a6d0c508b617ff90c352921d626fd9c929e570';
            console.log('🔧 MODO DESARROLLO: Conexión directa');
        } else {
            // 🛡️ PRODUCCIÓN: SIEMPRE proxy por seguridad
            this.useProxy = true;
            this.baseUrl = '/.netlify/functions/airtable-proxy';
            this.directApiKey = null;
            console.log('🛡️ MODO PRODUCCIÓN: Usando proxy Netlify');
        }
        
        // 📋 Tablas de Airtable
        this.tables = {
            solicitudes: 'Solicitudes',
            tecnicos: 'Tecnicos', 
            usuarios: 'Usuarios',
            solicitudesAcceso: 'SolicitudesAcceso'
        };
        
        this.connectionStatus = 'connecting';
        this.retryAttempts = 3;
        this.retryDelay = 1000;
        
        console.log('🔗 AirtableAPI configurada');
        console.log('📡 URL base:', this.baseUrl);
        console.log('🛡️ Usando proxy:', this.useProxy);
        
        // 🔄 Test inicial con reintentos
        this.initializeConnection();
    }

    async initializeConnection() {
        console.log('🔄 Iniciando conexión con reintentos...');
        
        for (let attempt = 1; attempt <= this.retryAttempts; attempt++) {
            try {
                console.log(`🔄 Intento ${attempt}/${this.retryAttempts}`);
                
                const isConnected = await this.testConnection();
                
                if (isConnected) {
                    this.connectionStatus = 'connected';
                    this.notifyConnectionStatus(true);
                    console.log('✅ Conectado exitosamente');
                    return;
                }
                
                throw new Error(`Test de conexión falló en intento ${attempt}`);
                
            } catch (error) {
                console.error(`❌ Intento ${attempt} falló:`, error);
                
                if (attempt === this.retryAttempts) {
                    console.error('❌ Todos los intentos fallaron');
                    this.connectionStatus = 'disconnected';
                    this.notifyConnectionStatus(false);
                    console.warn('⚠️ Activando modo localStorage');
                    return;
                }
                
                // ⏳ Esperar antes del siguiente intento
                await this.delay(this.retryDelay * attempt);
            }
        }
    }

    notifyConnectionStatus(connected) {
        const event = new CustomEvent('airtableConnectionUpdate', {
            detail: { 
                connected, 
                timestamp: new Date(),
                method: this.useProxy ? 'proxy' : 'direct',
                hostname: this.hostname,
                environment: this.isLocalDevelopment ? 'development' : 'production'
            }
        });
        window.dispatchEvent(event);
    }

    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    async makeRequest(endpoint, method = 'GET', data = null) {
        console.log(`📡 Request: ${method} ${endpoint}`);
        
        try {
            let url, options;
            
            if (this.useProxy) {
                // 🛡️ MODO PROXY - Producción segura
                url = `${this.baseUrl}/${endpoint}`;
                options = {
                    method: method,
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    mode: 'cors',
                    credentials: 'same-origin'
                };
                
                console.log(`📡 PROXY request: ${method} ${url}`);
                
            } else {
                // 🔧 MODO DIRECTO - Solo desarrollo
                url = `${this.baseUrl}/${endpoint}`;
                options = {
                    method: method,
                    headers: {
                        'Authorization': `Bearer ${this.directApiKey}`,
                        'Content-Type': 'application/json'
                    },
                    mode: 'cors'
                };
                
                console.log(`📡 DIRECT request: ${method} ${url}`);
            }
            
            // ➕ Agregar body si es necesario
            if (data && (method === 'POST' || method === 'PATCH')) {
                options.body = JSON.stringify(data);
            }
            
            const response = await fetch(url, options);
            
            if (!response.ok) {
                const errorText = await response.text();
                console.error(`❌ Error ${response.status}:`, errorText);
                
                // 🚨 Errores específicos
                if (response.status === 404 && this.useProxy) {
                    throw new Error('❌ Función Netlify no encontrada. Verificar despliegue.');
                }
                
                if (response.status === 401) {
                    throw new Error('❌ Credenciales inválidas. Verificar API Key.');
                }
                
                if (response.status === 429) {
                    console.warn('⚠️ Rate limit alcanzado, reintentando...');
                    await this.delay(2000);
                    return this.makeRequest(endpoint, method, data);
                }
                
                throw new Error(`HTTP ${response.status}: ${errorText}`);
            }
            
            const result = await response.json();
            console.log('✅ Request exitoso');
            
            // 🔄 Actualizar estado si estaba desconectado
            if (this.connectionStatus !== 'connected') {
                this.connectionStatus = 'connected';
                this.notifyConnectionStatus(true);
            }
            
            return result;
            
        } catch (error) {
            console.error('❌ Request falló:', error);
            
            // 🔄 Si es error de red, marcar como desconectado
            if (error.name === 'TypeError' || error.message.includes('fetch')) {
                this.connectionStatus = 'disconnected';
                this.notifyConnectionStatus(false);
            }
            
            // 💾 Usar fallback para operaciones de lectura
            if (method === 'GET') {
                console.warn('⚠️ Usando localStorage fallback para lectura');
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

    // 🧪 Test de conexión mejorado
    async testConnection() {
        try {
            console.log('🧪 Probando conexión...');
            
            let url, options;
            
            if (this.useProxy) {
                // 🛡️ Test via proxy
                url = `${this.baseUrl}/Solicitudes?maxRecords=1`;
                options = {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    mode: 'cors',
                    credentials: 'same-origin'
                };
                console.log('🧪 Test via PROXY Netlify');
            } else {
                // 🔧 Test directo
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
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            
            const result = await response.json();
            console.log('✅ Test exitoso - Records encontrados:', result.records?.length || 0);
            return true;
            
        } catch (error) {
            console.error('❌ Test falló:', error);
            return false;
        }
    }

    // 📋 MÉTODOS DE AIRTABLE (Mismo código que antes pero con mejor manejo de errores)
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
        
        return await this.makeRequest(this.tables.solicitudesAcceso, 'POST', data);
    }

    // 🔧 Método de diagnóstico
    getStatus() {
        return {
            isConnected: this.connectionStatus === 'connected',
            useProxy: this.useProxy,
            environment: this.isLocalDevelopment ? 'development' : 'production',
            hostname: this.hostname,
            baseUrl: this.baseUrl,
            timestamp: new Date().toISOString()
        };
    }
}

// 🌍 Instancia global
console.log('🔧 Creando instancia global...');
window.airtableAPI = new AirtableAPI();

// 📡 Event listener para actualizaciones de conexión
window.addEventListener('airtableConnectionUpdate', function(event) {
    console.log('🔄 Estado de conexión actualizado:', event.detail);
    
    if (typeof updateConnectionStatus === 'function') {
        const status = event.detail.connected ? 'connected' : 'disconnected';
        const message = event.detail.connected 
            ? `Conectado via ${event.detail.method} (${event.detail.environment})` 
            : 'Modo Local Fallback';
        
        updateConnectionStatus(status, message);
    }
});

// 🛠️ Función de diagnóstico global
window.debugAirtableConnection = function() {
    const status = window.airtableAPI.getStatus();
    
    console.log('🔍 DIAGNÓSTICO COMPLETO');
    console.log('======================');
    console.log('🌐 Hostname:', status.hostname);
    console.log('🏠 Entorno:', status.environment);
    console.log('🛡️ Proxy:', status.useProxy ? 'HABILITADO' : 'DESHABILITADO');
    console.log('📡 URL base:', status.baseUrl);
    console.log('🔍 Estado:', status.isConnected ? '✅ CONECTADO' : '❌ DESCONECTADO');
    console.log('🕐 Timestamp:', status.timestamp);
    
    // Test inmediato
    console.log('\n🧪 Ejecutando test de conexión...');
    window.airtableAPI.testConnection().then(result => {
        console.log('🔍 Resultado:', result ? '✅ EXITOSO' : '❌ FALLÓ');
    });
    
    return status;
};

console.log('✅ airtable-config.js (Versión Segura) cargado completamente');
console.log('🔧 Para diagnóstico ejecutar: debugAirtableConnection()');